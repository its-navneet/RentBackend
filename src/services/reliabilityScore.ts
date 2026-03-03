/**
 * Tenant Reliability Score Calculator
 * Calculates reliability score based on payment history and ratings
 */

import TenantReliabilityScore from "../models/TenantReliabilityScore";
import Review from "../models/Review";
import Payment from "../models/Payment";
import StayRecord from "../models/StayRecord";
import LedgerEntry from "../models/LedgerEntry";

export class ReliabilityScoreService {
  /**
   * Calculate overall reliability score (0-100)
   * Score = (Payment Punctuality × 0.4) + (Owner Rating × 0.4) + (Stay Duration × 0.2)
   */
  static calculateScore(
    paymentScore: number,
    ownerRatingAverage: number,
    stayDurationMonths: number,
  ): number {
    // Normalize owner rating (out of 5) to percentage
    const ownerRatingPercentage = (ownerRatingAverage / 5) * 100;

    // Normalize stay duration (max 60 months = 5 years = 100%)
    const stayDurationScore = Math.min(100, (stayDurationMonths / 60) * 100);

    return Math.round(
      paymentScore * 0.4 +
        ownerRatingPercentage * 0.4 +
        stayDurationScore * 0.2,
    );
  }

  /**
   * Calculate payment punctuality score based on on-time payments
   */
  static async calculatePaymentPunctualityScore(
    tenantId: string,
  ): Promise<number> {
    try {
      const ledgers = await LedgerEntry.find({ tenantId });

      if (ledgers.length === 0) return 50; // Default for new tenants

      let onTimeCount = 0;
      let totalCount = 0;

      for (const ledger of ledgers) {
        totalCount++;
        if (ledger.status === "paid" || ledger.status === "partial") {
          // Check if paid on time or reasonably close
          if (ledger.paidDate && ledger.paidDate <= ledger.dueDate) {
            onTimeCount++;
          } else if (ledger.paidDate) {
            const daysLate = Math.floor(
              (ledger.paidDate.getTime() - ledger.dueDate.getTime()) /
                (1000 * 60 * 60 * 24),
            );
            // Grace period of 5 days
            if (daysLate <= 5) {
              onTimeCount += 0.5;
            }
          }
        }
      }

      return Math.round((onTimeCount / totalCount) * 100);
    } catch (error) {
      console.error("Error calculating payment punctuality:", error);
      return 50;
    }
  }

  /**
   * Calculate average rating from owners
   */
  static async calculateOwnerRatingAverage(tenantId: string): Promise<number> {
    try {
      const ratings = await Review.find({
        toUserId: tenantId,
        ratingType: "owner_to_tenant",
      });

      if (ratings.length === 0) return 3; // Default for new tenants

      const sum = ratings.reduce(
        (acc, rating) => acc + rating.overallRating,
        0,
      );
      return sum / ratings.length;
    } catch (error) {
      console.error("Error calculating owner rating average:", error);
      return 3;
    }
  }

  /**
   * Get badge based on score
   */
  static getBadge(
    score: number,
  ): "trusted_tenant" | "good_tenant" | "needs_review" {
    if (score >= 80) return "trusted_tenant";
    if (score >= 60) return "good_tenant";
    return "needs_review";
  }

  /**
   * Update tenant reliability score (call after each relevant event)
   */
  static async updateReliabilityScore(tenantId: string): Promise<void> {
    try {
      const paymentScore =
        await this.calculatePaymentPunctualityScore(tenantId);
      const ownerRatingAverage =
        await this.calculateOwnerRatingAverage(tenantId);

      const stayRecords = await StayRecord.find({
        tenantId,
        status: "completed",
      });

      const totalStayDuration = stayRecords.reduce((acc, stay) => {
        if (stay.checkOutDate) {
          const months = Math.floor(
            (stay.checkOutDate.getTime() - stay.checkInDate.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          );
          return acc + months;
        }
        return acc;
      }, 0);

      const score = this.calculateScore(
        paymentScore,
        ownerRatingAverage,
        totalStayDuration,
      );
      const badge = this.getBadge(score);

      const complaintCount = 0; // TODO: Implement complaint tracking

      await TenantReliabilityScore.findOneAndUpdate(
        { tenantId },
        {
          score,
          badge,
          paymentPunctualityScore: paymentScore,
          ownerRatingAverage,
          complaintCount,
          totalStayDuration,
          completedStays: stayRecords.length,
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      console.error("Error updating reliability score:", error);
    }
  }

  /**
   * Get reliability score and badge for a tenant
   */
  static async getReliabilityScore(tenantId: string) {
    try {
      let scoreDoc = await TenantReliabilityScore.findOne({ tenantId });

      if (!scoreDoc) {
        // Create new score document
        await this.updateReliabilityScore(tenantId);
        scoreDoc = await TenantReliabilityScore.findOne({ tenantId });
      }

      return scoreDoc;
    } catch (error) {
      console.error("Error getting reliability score:", error);
      return null;
    }
  }
}

export default ReliabilityScoreService;
