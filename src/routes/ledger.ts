/**
 * Ledger & Payment Routes
 * Endpoints for PG ledger management and payment tracking
 */

import express, { Request, Response } from "express";
import LedgerEntry from "../models/LedgerEntry";
import Payment from "../models/Payment";
import LedgerService from "../services/ledger";

const router = express.Router();

// ==================== LEDGER ENDPOINTS ====================

/**
 * GET /api/ledger/entries/:tenantId
 * Get all ledger entries for a tenant
 */
router.get("/entries/:tenantId", async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const months = parseInt(req.query.months as string) || 12;

    const entries = await LedgerService.getPaymentHistory(tenantId, months);

    res.json({
      total: entries.length,
      entries,
    });
  } catch (error) {
    console.error("Error fetching ledger entries:", error);
    res.status(500).json({ error: "Failed to fetch ledger entries" });
  }
});

/**
 * GET /api/ledger/entries-by-property/:propertyId
 * Get all ledger entries for a property
 */
router.get(
  "/entries-by-property/:propertyId",
  async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const status = req.query.status as string;

      const query: any = { propertyId };
      if (status) {
        query.status = status;
      }

      const entries = await LedgerEntry.find(query)
        .populate("tenantId", "name email phone")
        .populate("stayRecordId", "checkInDate checkOutDate")
        .sort({ month: -1 });

      res.json({
        total: entries.length,
        entries,
      });
    } catch (error) {
      console.error("Error fetching property ledger entries:", error);
      res.status(500).json({ error: "Failed to fetch ledger entries" });
    }
  },
);

/**
 * GET /api/ledger/entry/:ledgerId
 * Get a specific ledger entry with details
 */
router.get("/entry/:ledgerId", async (req: Request, res: Response) => {
  try {
    const { ledgerId } = req.params;

    const entry = await LedgerEntry.findById(ledgerId)
      .populate("tenantId", "name email phone")
      .populate("propertyId", "title address")
      .populate("ownerId", "name email");

    if (!entry) {
      return res.status(404).json({ error: "Ledger entry not found" });
    }

    res.json(entry);
  } catch (error) {
    console.error("Error fetching ledger entry:", error);
    res.status(500).json({ error: "Failed to fetch ledger entry" });
  }
});

/**
 * POST /api/ledger/add-charge/:ledgerId
 * Add a custom charge to a ledger entry
 */
router.post("/add-charge/:ledgerId", async (req: Request, res: Response) => {
  try {
    const { ledgerId } = req.params;
    const { type, name, amount, description } = req.body;

    if (!type || !name || amount === undefined) {
      return res.status(400).json({
        error: "Missing required fields: type, name, amount",
      });
    }

    const chargeItem = {
      type: type as any,
      name,
      amount,
      description: description || "",
    };

    const updatedEntry = await LedgerService.addCharge(ledgerId, chargeItem);

    res.json({
      message: "Charge added successfully",
      entry: updatedEntry,
    });
  } catch (error: any) {
    console.error("Error adding charge:", error);
    res.status(500).json({
      error: error.message || "Failed to add charge",
    });
  }
});

/**
 * GET /api/ledger/summary/:tenantId
 * Get ledger summary for tenant
 */
router.get("/summary/:tenantId", async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const summary = await LedgerService.getTenantLedgerSummary(tenantId);

    res.json(summary);
  } catch (error) {
    console.error("Error fetching ledger summary:", error);
    res.status(500).json({ error: "Failed to fetch ledger summary" });
  }
});

/**
 * GET /api/ledger/owner-summary/:ownerId
 * Get payment summary for owner dashboard
 */
router.get("/owner-summary/:ownerId", async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

    const summary = await LedgerService.getOwnerPaymentSummary(ownerId);

    res.json(summary);
  } catch (error) {
    console.error("Error fetching owner payment summary:", error);
    res.status(500).json({ error: "Failed to fetch payment summary" });
  }
});

// ==================== PAYMENT ENDPOINTS ====================

/**
 * POST /api/ledger/record-payment/:ledgerId
 * Record a payment against a ledger entry
 */
router.post(
  "/record-payment/:ledgerId",
  async (req: Request, res: Response) => {
    try {
      const { ledgerId } = req.params;
      const { tenantId, amount, transactionId, paymentMethod } = req.body;

      if (!tenantId || !amount || !transactionId) {
        return res.status(400).json({
          error: "Missing required fields: tenantId, amount, transactionId",
        });
      }

      const result = await LedgerService.recordPayment(
        ledgerId,
        tenantId,
        amount,
        transactionId,
        paymentMethod || "bank_transfer",
      );

      res.json({
        message: "Payment recorded successfully",
        ...result,
      });
    } catch (error: any) {
      console.error("Error recording payment:", error);
      res.status(500).json({
        error: error.message || "Failed to record payment",
      });
    }
  },
);

/**
 * GET /api/ledger/payments/:tenantId
 * Get payment history for a tenant
 */
router.get("/payments/:tenantId", async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const status = req.query.status as string;

    const query: any = { tenantId };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });

    res.json({
      total: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

/**
 * GET /api/ledger/payments-for-owner/:ownerId
 * Get all payments received by owner
 */
router.get(
  "/payments-for-owner/:ownerId",
  async (req: Request, res: Response) => {
    try {
      const { ownerId } = req.params;
      const status = req.query.status as string;

      const query: any = { ownerId };
      if (status) {
        query.status = status;
      }

      const payments = await Payment.find(query)
        .populate("tenantId", "name email")
        .sort({ createdAt: -1 });

      res.json({
        total: payments.length,
        payments,
      });
    } catch (error) {
      console.error("Error fetching owner payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  },
);

/**
 * GET /api/ledger/payment/:paymentId
 * Get payment details
 */
router.get("/payment/:paymentId", async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("tenantId", "name email phone")
      .populate("ownerId", "name email")
      .populate("ledgerEntryId");

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

/**
 * POST /api/ledger/initiate-payment
 * Initiate payment for a ledger entry
 */
router.post("/initiate-payment", async (req: Request, res: Response) => {
  try {
    const { ledgerId, tenantId, amount } = req.body;

    if (!ledgerId || !tenantId || !amount) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record with 'pending' status
    const payment = new Payment({
      tenantId,
      ownerId: null, // Will be set when ledger details are retrieved
      ledgerEntryId: ledgerId,
      amount,
      type: "rent",
      status: "pending",
      transactionId,
      paymentMethod: "pending",
    });

    const savedPayment = await payment.save();

    // In a real app, integrate with Razorpay/Stripe here
    // For now, return payment intent

    res.json({
      message: "Payment initiated",
      transactionId,
      paymentId: savedPayment._id,
      amount,
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

export default router;
