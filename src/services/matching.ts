/**
 * Matching Algorithm Service
 * Implements weighted compatibility scoring for roommate matching
 */

import MatchProfile, { IMatchProfile } from "../models/MatchProfile";

export interface IMatchScore {
  profileId: string;
  matchedUserId: string;
  userName: string;
  matchPercentage: number;
  category: "excellent" | "good" | "moderate" | "not_recommended";
  scoreBreakdown: {
    budgetMatch: number;
    sleepScheduleMatch: number;
    cleanlinessMatch: number;
    habitsMatch: number;
    interestSimilarity: number;
    personalityMatch: number;
  };
}

export class MatchingService {
  /**
   * Calculate compatibility score between two profiles
   * Weight distribution:
   * - Budget match: 35%
   * - Sleep schedule: 20%
   * - Cleanliness: 15%
   * - Smoking/Drinking: 15%
   * - Interests similarity: 10%
   * - Personality: 5%
   */
  static calculateCompatibility(
    profile1: IMatchProfile,
    profile2: IMatchProfile,
  ): IMatchScore {
    const scores = {
      budgetMatch: this.calculateBudgetMatch(profile1, profile2),
      sleepScheduleMatch: this.calculateSleepScheduleMatch(profile1, profile2),
      cleanlinessMatch: this.calculateCleanlinessMatch(profile1, profile2),
      habitsMatch: this.calculateHabitsMatch(profile1, profile2),
      interestSimilarity: this.calculateInterestSimilarity(profile1, profile2),
      personalityMatch: this.calculatePersonalityMatch(profile1, profile2),
    };

    const weights = {
      budgetMatch: 0.35,
      sleepScheduleMatch: 0.2,
      cleanlinessMatch: 0.15,
      habitsMatch: 0.15,
      interestSimilarity: 0.1,
      personalityMatch: 0.05,
    };

    const matchPercentage = Math.round(
      (scores.budgetMatch * weights.budgetMatch +
        scores.sleepScheduleMatch * weights.sleepScheduleMatch +
        scores.cleanlinessMatch * weights.cleanlinessMatch +
        scores.habitsMatch * weights.habitsMatch +
        scores.interestSimilarity * weights.interestSimilarity +
        scores.personalityMatch * weights.personalityMatch) *
        100,
    );

    const category = this.getMatchCategory(matchPercentage);

    return {
      profileId: profile2._id.toString(),
      matchedUserId: profile2.userId.toString(),
      userName: profile2.userName,
      matchPercentage,
      category,
      scoreBreakdown: scores,
    };
  }

  private static calculateBudgetMatch(
    profile1: IMatchProfile,
    profile2: IMatchProfile,
  ): number {
    const p1Min = profile1.budgetRange.min;
    const p1Max = profile1.budgetRange.max;
    const p2Min = profile2.budgetRange.min;
    const p2Max = profile2.budgetRange.max;

    // Check if ranges overlap
    const overlapStart = Math.max(p1Min, p2Min);
    const overlapEnd = Math.min(p1Max, p2Max);

    if (overlapStart > overlapEnd) {
      return 0; // No overlap
    }

    // Calculate overlap percentage
    const overlapRange = overlapEnd - overlapStart;
    const avgRange = (p1Max - p1Min + (p2Max - p2Min)) / 2;

    return Math.min(1, overlapRange / (avgRange * 0.5));
  }

  private static calculateSleepScheduleMatch(
    profile1: IMatchProfile,
    profile2: IMatchProfile,
  ): number {
    const schedule1 = profile1.lifestyle.sleepTime;
    const schedule2 = profile2.lifestyle.sleepTime;

    if (schedule1 === schedule2) return 1; // Perfect match
    if (schedule1 === "flexible" || schedule2 === "flexible") return 0.7; // Flexible is compatible
    return 0.2; // Early and late birds don't match well
  }

  private static calculateCleanlinessMatch(
    profile1: IMatchProfile,
    profile2: IMatchProfile,
  ): number {
    const clean1 = profile1.lifestyle.cleanliness;
    const clean2 = profile2.lifestyle.cleanliness;

    if (clean1 === clean2) return 1;

    // Chill can tolerate medium, medium can tolerate high
    const compatibility: { [key: string]: { [key: string]: number } } = {
      high: { high: 1, medium: 0.6, chill: 0.2 },
      medium: { high: 0.6, medium: 1, chill: 0.6 },
      chill: { high: 0.2, medium: 0.6, chill: 1 },
    };

    return compatibility[clean1]?.[clean2] || 0.5;
  }

  private static calculateHabitsMatch(
    profile1: IMatchProfile,
    profile2: IMatchProfile,
  ): number {
    let smokeScore = 1;
    let drinkScore = 1;

    // Smoking match
    const smoke1 = profile1.lifestyle.smoking;
    const smoke2 = profile2.lifestyle.smoking;
    if (smoke1 === smoke2) {
      smokeScore = 1;
    } else if (smoke1 === "occasionally" || smoke2 === "occasionally") {
      smokeScore = 0.7;
    } else {
      smokeScore = 0.2;
    }

    // Drinking match
    const drink1 = profile1.lifestyle.drinking;
    const drink2 = profile2.lifestyle.drinking;
    if (drink1 === drink2) {
      drinkScore = 1;
    } else if (drink1 === "occasionally" || drink2 === "occasionally") {
      drinkScore = 0.7;
    } else {
      drinkScore = 0.2;
    }

    return (smokeScore + drinkScore) / 2;
  }

  private static calculateInterestSimilarity(
    profile1: IMatchProfile,
    profile2: IMatchProfile,
  ): number {
    if (!profile1.interests || !profile2.interests) return 0;

    const interests1 = new Set(profile1.interests);
    const interests2 = new Set(profile2.interests);

    const commonInterests = [...interests1].filter((i) =>
      interests2.has(i),
    ).length;
    const totalUnique = new Set([...interests1, ...interests2]).size;

    if (totalUnique === 0) return 0.5; // No interests defined, neutral
    return commonInterests / totalUnique;
  }

  private static calculatePersonalityMatch(
    profile1: IMatchProfile,
    profile2: IMatchProfile,
  ): number {
    const pers1 = profile1.lifestyle.personality;
    const pers2 = profile2.lifestyle.personality;

    if (pers1 === pers2) return 1; // Same personality = compatible
    if (pers1 === "ambivert" || pers2 === "ambivert") return 0.8; // Ambivert is compatible with both
    return 0.5; // Introvert and extrovert are somewhat incompatible
  }

  private static getMatchCategory(
    percentage: number,
  ): "excellent" | "good" | "moderate" | "not_recommended" {
    if (percentage >= 85) return "excellent";
    if (percentage >= 70) return "good";
    if (percentage >= 50) return "moderate";
    return "not_recommended";
  }

  /**
   * Find all matching profiles for a given user
   */
  static async findMatches(
    userId: string,
    limit: number = 20,
  ): Promise<IMatchScore[]> {
    try {
      const userProfile = await MatchProfile.findOne({ userId });
      if (!userProfile) {
        throw new Error("User profile not found");
      }

      // Get all other profiles with compatible budget range
      const potentialMatches = await MatchProfile.find({
        userId: { $ne: userId },
        "budgetRange.min": { $lte: userProfile.budgetRange.max },
        "budgetRange.max": { $gte: userProfile.budgetRange.min },
      }).limit(limit * 2); // Get more to sort and filter

      const matches = potentialMatches
        .map((profile) => this.calculateCompatibility(userProfile, profile))
        .filter((match) => match.category !== "not_recommended")
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, limit);

      return matches;
    } catch (error) {
      console.error("Error finding matches:", error);
      throw error;
    }
  }

  /**
   * Calculate mutual interest between two users
   * Both users must show interest for chat to unlock
   */
  static async checkMutualInterest(
    userId1: string,
    userId2: string,
    interestMapping: Map<string, Set<string>>,
  ): Promise<boolean> {
    // Check if userId1 is interested in userId2
    const user1Interests = interestMapping.get(userId1) || new Set();
    // Check if userId2 is interested in userId1
    const user2Interests = interestMapping.get(userId2) || new Set();

    return user1Interests.has(userId2) && user2Interests.has(userId1);
  }
}

export default MatchingService;
