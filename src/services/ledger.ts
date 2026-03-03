/**
 * Ledger Management Service
 * Handles monthly ledger creation, updates, and payment tracking
 */

import LedgerEntry, { IChargeItem } from "../models/LedgerEntry";
import Payment from "../models/Payment";
import StayRecord from "../models/StayRecord";

export class LedgerService {
  /**
   * Create monthly ledger entry for an active stay
   */
  static async createMonthlyLedger(
    stayRecordId: string,
    monthDate: Date,
    monthlyRent: number,
    additionalCharges: IChargeItem[] = [],
  ): Promise<any> {
    try {
      const stayRecord = await StayRecord.findById(stayRecordId);
      if (!stayRecord) {
        throw new Error("Stay record not found");
      }

      // Build charges array
      const charges: IChargeItem[] = [
        {
          type: "rent",
          name: "Monthly Rent",
          amount: monthlyRent,
          description: `Rent for ${monthDate.toLocaleString("default", { month: "long", year: "numeric" })}`,
        },
        ...additionalCharges,
      ];

      const totalAmount = charges.reduce(
        (sum, charge) => sum + charge.amount,
        0,
      );

      // Due date: 5th of next month
      const dueDate = new Date(monthDate);
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(5);

      const ledgerEntry = new LedgerEntry({
        stayRecordId,
        tenantId: stayRecord.tenantId,
        propertyId: stayRecord.propertyId,
        ownerId: stayRecord.ownerId,
        month: monthDate,
        charges,
        totalAmount,
        paidAmount: 0,
        balance: totalAmount,
        status: "overdue",
        dueDate,
      });

      return await ledgerEntry.save();
    } catch (error) {
      console.error("Error creating monthly ledger:", error);
      throw error;
    }
  }

  /**
   * Auto-create ledgers for active stays at month start
   * Should be run as a cron job on 1st of every month
   */
  static async createMonthlyLedgersForAllStays(
    currentDate: Date = new Date(),
  ): Promise<void> {
    try {
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );

      const activeStays = await StayRecord.find({
        status: "active",
        checkInDate: { $lte: monthStart },
      }).populate("bookingRequestId");

      for (const stay of activeStays) {
        // Check if ledger already exists for this month
        const existingLedger = await LedgerEntry.findOne({
          stayRecordId: stay._id,
          month: monthStart,
        });

        if (!existingLedger) {
          // Get booking details for rent amount
          const bookingRequest = await StayRecord.findById(stay._id).select(
            "monthlyRent",
          );

          await this.createMonthlyLedger(
            stay._id.toString(),
            monthStart,
            stay.monthlyRent,
          );
        }
      }

      console.log("Monthly ledgers created successfully");
    } catch (error) {
      console.error("Error in auto-create monthly ledgers:", error);
    }
  }

  /**
   * Record a payment against a ledger entry
   */
  static async recordPayment(
    ledgerId: string,
    tenantId: string,
    amount: number,
    transactionId: string,
    paymentMethod: "upi" | "card" | "bank_transfer" | "cash" = "bank_transfer",
  ): Promise<any> {
    try {
      const ledger = await LedgerEntry.findById(ledgerId);
      if (!ledger) {
        throw new Error("Ledger entry not found");
      }

      // Update ledger
      const newPaidAmount = ledger.paidAmount + amount;
      const newBalance = Math.max(0, ledger.totalAmount - newPaidAmount);
      let status = ledger.status;

      if (newBalance === 0) {
        status = "paid";
      } else if (newPaidAmount > 0) {
        status = "partial";
      }

      const updatedLedger = await LedgerEntry.findByIdAndUpdate(
        ledgerId,
        {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status,
          paidDate: status === "paid" ? new Date() : ledger.paidDate,
        },
        { new: true },
      );

      // Create payment record
      const payment = new Payment({
        tenantId,
        ownerId: ledger.ownerId,
        stayRecordId: ledger.stayRecordId,
        ledgerEntryId: ledgerId,
        amount,
        type: "rent",
        status: "completed",
        transactionId,
        paymentMethod,
      });

      await payment.save();

      return {
        ledger: updatedLedger,
        payment,
      };
    } catch (error) {
      console.error("Error recording payment:", error);
      throw error;
    }
  }

  /**
   * Add custom charge to a ledger (penalty, utilities, etc.)
   */
  static async addCharge(
    ledgerId: string,
    chargeItem: IChargeItem,
  ): Promise<any> {
    try {
      const ledger = await LedgerEntry.findById(ledgerId);
      if (!ledger) {
        throw new Error("Ledger entry not found");
      }

      if (ledger.status === "paid") {
        throw new Error("Cannot add charges to paid ledger");
      }

      ledger.charges.push(chargeItem);
      const newTotal = ledger.charges.reduce((sum, c) => sum + c.amount, 0);
      ledger.totalAmount = newTotal;
      ledger.balance = newTotal - ledger.paidAmount;

      // Update status if needed
      if (ledger.balance === 0) {
        ledger.status = "paid";
      } else if (ledger.paidAmount > 0) {
        ledger.status = "partial";
      }

      return await ledger.save();
    } catch (error) {
      console.error("Error adding charge:", error);
      throw error;
    }
  }

  /**
   * Get payment history for a tenant
   */
  static async getPaymentHistory(
    tenantId: string,
    months: number = 12,
  ): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const ledgers = await LedgerEntry.find({
        tenantId,
        month: { $gte: startDate },
      }).sort({ month: -1 });

      return ledgers;
    } catch (error) {
      console.error("Error getting payment history:", error);
      throw error;
    }
  }

  /**
   * Get payment summary for owner dashboard
   */
  static async getOwnerPaymentSummary(ownerId: string): Promise<any> {
    try {
      const ledgers = await LedgerEntry.find({ ownerId });

      const summary = {
        totalOutstanding: 0,
        totalPaid: 0,
        totalOverdue: 0,
        byStatus: {
          paid: 0,
          partial: 0,
          overdue: 0,
        },
      };

      for (const ledger of ledgers) {
        summary.totalPaid += ledger.paidAmount;
        summary.totalOutstanding += ledger.balance;

        if (ledger.status === "overdue" && new Date() > ledger.dueDate) {
          summary.totalOverdue += ledger.balance;
        }

        summary.byStatus[ledger.status] += 1;
      }

      return summary;
    } catch (error) {
      console.error("Error getting payment summary:", error);
      throw error;
    }
  }

  /**
   * Generate ledger summary for tenant
   */
  static async getTenantLedgerSummary(tenantId: string): Promise<any> {
    try {
      const ledgers = await LedgerEntry.find({ tenantId }).sort({
        month: -1,
      });

      const summary: {
        totalPaid: number;
        totalOutstanding: number;
        recentPayments: Array<{ month: Date; amount: number; status: string }>;
        upcomingDue: Array<{ month: Date; amount: number; dueDate: Date }>;
      } = {
        totalPaid: 0,
        totalOutstanding: 0,
        recentPayments: [],
        upcomingDue: [],
      };

      for (const ledger of ledgers) {
        summary.totalPaid += ledger.paidAmount;
        summary.totalOutstanding += ledger.balance;

        if (ledger.status === "paid" || ledger.status === "partial") {
          summary.recentPayments.push({
            month: ledger.month,
            amount: ledger.paidAmount,
            status: ledger.status,
          });
        }

        if (ledger.status !== "paid" && ledger.dueDate > new Date()) {
          summary.upcomingDue.push({
            month: ledger.month,
            amount: ledger.balance,
            dueDate: ledger.dueDate,
          });
        }
      }

      return summary;
    } catch (error) {
      console.error("Error getting tenant ledger summary:", error);
      throw error;
    }
  }
}

export default LedgerService;
