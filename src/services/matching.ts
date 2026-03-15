/**
 * Matching Algorithm Service
 * Implements weighted compatibility scoring for roommate matching
 */

import MatchProfile, {
  IMatchProfile,
  ILifestylePreferences,
  InterestType,
} from "../models/MatchProfile";
import StudentProfile, { IStudentProfile } from "../models/StudentProfile";
import User, { IUser } from "../models/User";

export interface IMatchScore {
  profileId: string;
  matchedUserId: string;
  userName: string;
  bio: string;
  profileImage: string;
  isVerified: boolean;
  verificationStatus: string;
  sharedInterests: string[];
  lifestyleSummary: {
    sleepTime: string;
    cleanliness: string;
    smoking: string;
    drinking: string;
    personality: string;
  };
  highlights: string[];
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

interface IProfileUpdateInput {
  lifestyle?: Partial<ILifestylePreferences> & Record<string, unknown>;
  interests?: string[];
  budgetRange?: {
    min?: number;
    max?: number;
  };
  bio?: string;
}

export class MatchingService {
  private static readonly allowedInterests = new Set<InterestType>([
    "gym",
    "coding",
    "music",
    "gaming",
    "reading",
    "travel",
    "sports",
    "entrepreneurship",
    "movies",
  ]);

  private static readonly sharedUsersPromiseCache = new Map<
    string,
    Promise<IMatchProfile>
  >();

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
      bio: profile2.bio || "",
      profileImage: profile2.profileImage || "",
      isVerified: Boolean(
        (profile2 as unknown as { isVerified?: boolean }).isVerified,
      ),
      verificationStatus:
        (profile2 as unknown as { verificationStatus?: string })
          .verificationStatus || "pending",
      sharedInterests: this.getSharedInterests(profile1, profile2),
      lifestyleSummary: {
        sleepTime: profile2.lifestyle.sleepTime,
        cleanliness: profile2.lifestyle.cleanliness,
        smoking: profile2.lifestyle.smoking,
        drinking: profile2.lifestyle.drinking,
        personality: profile2.lifestyle.personality,
      },
      highlights: this.buildHighlights(scores, profile1, profile2),
      matchPercentage,
      category,
      scoreBreakdown: {
        budgetMatch: Math.round(scores.budgetMatch * 100),
        sleepScheduleMatch: Math.round(scores.sleepScheduleMatch * 100),
        cleanlinessMatch: Math.round(scores.cleanlinessMatch * 100),
        habitsMatch: Math.round(scores.habitsMatch * 100),
        interestSimilarity: Math.round(scores.interestSimilarity * 100),
        personalityMatch: Math.round(scores.personalityMatch * 100),
      },
    };
  }

  static async createOrUpdateProfile(
    userId: string,
    input: IProfileUpdateInput,
  ): Promise<IMatchProfile> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const studentProfile = await StudentProfile.findOne({ userId: user._id });
    const existingProfile = await MatchProfile.findOne({ userId: user._id });

    const baseProfile = this.buildProfilePayload(
      user,
      studentProfile,
      existingProfile,
    );

    const lifestyle = {
      ...baseProfile.lifestyle,
      ...this.normalizeLifestyle(input.lifestyle || {}),
    };

    const budgetRange = this.normalizeBudgetRange(
      input.budgetRange,
      baseProfile.budgetRange,
    );

    const matchProfile = await MatchProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        userName: user.name,
        email: user.email,
        profileImage: user.profileImage || existingProfile?.profileImage || "",
        lifestyle,
        interests: this.normalizeInterests(
          input.interests ?? baseProfile.interests,
        ),
        budgetRange,
        bio: (input.bio ?? baseProfile.bio).trim(),
        updatedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return matchProfile;
  }

  static async ensureProfile(userId: string): Promise<IMatchProfile> {
    const cacheKey = userId.toString();
    const cached = this.sharedUsersPromiseCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const promise = this.ensureProfileInternal(userId);
    this.sharedUsersPromiseCache.set(cacheKey, promise);

    try {
      return await promise;
    } finally {
      this.sharedUsersPromiseCache.delete(cacheKey);
    }
  }

  private static async ensureProfileInternal(
    userId: string,
  ): Promise<IMatchProfile> {
    const existingProfile = await MatchProfile.findOne({ userId });
    if (existingProfile) {
      return existingProfile;
    }

    return this.createOrUpdateProfile(userId, {});
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
      const userProfile = await this.ensureProfile(userId);
      await this.ensureProfilesForTenantUsers(userId);

      const currentUser = await User.findById(userId)
        .select("gender role")
        .lean();
      const genderFilter = currentUser?.gender
        ? { gender: currentUser.gender }
        : {};

      const eligibleUsers = await User.find({
        _id: { $ne: userId },
        role: "tenant",
        isActive: { $ne: false },
        isBlocked: { $ne: true },
        ...genderFilter,
      })
        .select("_id")
        .lean();

      const eligibleUserIds = eligibleUsers.map((u) => u._id.toString());
      if (eligibleUserIds.length === 0) {
        return [];
      }

      // Get all other profiles with compatible budget range
      const potentialMatches = await MatchProfile.find({
        userId: { $in: eligibleUserIds },
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

  private static async ensureProfilesForTenantUsers(currentUserId: string) {
    const users = await User.find({
      role: "tenant",
      isActive: { $ne: false },
      isBlocked: { $ne: true },
      _id: { $ne: currentUserId },
    });

    if (users.length === 0) {
      return;
    }

    const userIds = users.map((user) => user._id);
    const existingProfiles = await MatchProfile.find({
      userId: { $in: userIds },
    })
      .select("userId")
      .lean();

    const existingUserIds = new Set(
      existingProfiles.map((profile) => profile.userId.toString()),
    );

    const missingUsers = users.filter(
      (user) => !existingUserIds.has(user._id.toString()),
    );

    if (missingUsers.length === 0) {
      return;
    }

    const studentProfiles = await StudentProfile.find({
      userId: { $in: missingUsers.map((user) => user._id) },
    }).exec();

    const studentByUserId = new Map(
      studentProfiles.map((profile) => [profile.userId.toString(), profile]),
    );

    const docs = missingUsers.map((user) => {
      const payload = this.buildProfilePayload(
        user,
        studentByUserId.get(user._id.toString()),
      );

      return {
        ...payload,
        userId: user._id,
        userName: user.name,
        email: user.email,
      };
    });

    if (docs.length > 0) {
      await MatchProfile.insertMany(docs, { ordered: false }).catch(
        () => undefined,
      );
    }
  }

  private static buildProfilePayload(
    user: IUser,
    studentProfile?: IStudentProfile | null,
    existingProfile?: IMatchProfile | null,
  ) {
    const fallbackBudget = studentProfile?.preferences?.budget || {
      min: 6000,
      max: 12000,
    };

    return {
      userName: user.name,
      email: user.email,
      profileImage: user.profileImage || existingProfile?.profileImage || "",
      lifestyle: {
        sleepTime: this.normalizeSleepTime(
          existingProfile?.lifestyle?.sleepTime ||
            studentProfile?.habits?.sleepSchedule,
        ),
        cleanliness: this.normalizeCleanliness(
          existingProfile?.lifestyle?.cleanliness ||
            studentProfile?.habits?.cleanliness,
        ),
        smoking: this.normalizeOccasionalValue(
          existingProfile?.lifestyle?.smoking,
        ),
        drinking: this.normalizeOccasionalValue(
          existingProfile?.lifestyle?.drinking,
        ),
        guestFrequency:
          existingProfile?.lifestyle?.guestFrequency || "occasional",
        workType: existingProfile?.lifestyle?.workType || "student",
        personality:
          existingProfile?.lifestyle?.personality ||
          this.normalizePersonality(studentProfile?.habits?.socialLevel),
      } as ILifestylePreferences,
      interests: this.normalizeInterests(
        existingProfile?.interests || studentProfile?.interests || [],
      ),
      budgetRange: this.normalizeBudgetRange(
        existingProfile?.budgetRange,
        fallbackBudget,
      ),
      bio:
        existingProfile?.bio || user.bio || studentProfile?.branch
          ? `${studentProfile?.branch || "Tenant"} looking for a compatible roommate.`
          : "Looking for a compatible roommate.",
    };
  }

  private static normalizeLifestyle(
    lifestyle: Partial<ILifestylePreferences> & Record<string, unknown>,
  ): ILifestylePreferences {
    return {
      sleepTime: this.normalizeSleepTime(lifestyle.sleepTime),
      cleanliness: this.normalizeCleanliness(lifestyle.cleanliness),
      smoking: this.normalizeOccasionalValue(lifestyle.smoking),
      drinking: this.normalizeOccasionalValue(lifestyle.drinking),
      guestFrequency:
        lifestyle.guestFrequency === "frequent" ||
        lifestyle.guestFrequency === "rare" ||
        lifestyle.guestFrequency === "occasional"
          ? lifestyle.guestFrequency
          : "occasional",
      workType:
        lifestyle.workType === "professional" ||
        lifestyle.workType === "remote" ||
        lifestyle.workType === "student"
          ? lifestyle.workType
          : "student",
      personality: this.normalizePersonality(lifestyle.personality),
    };
  }

  private static normalizeBudgetRange(
    budgetRange: { min?: number; max?: number } | undefined,
    fallback: { min?: number; max?: number },
  ) {
    const rawMin = Number(budgetRange?.min ?? fallback.min ?? 6000);
    const rawMax = Number(budgetRange?.max ?? fallback.max ?? 12000);
    const min = Number.isFinite(rawMin) ? Math.max(0, rawMin) : 6000;
    const maxCandidate = Number.isFinite(rawMax) ? Math.max(0, rawMax) : 12000;

    return {
      min,
      max: Math.max(min, maxCandidate),
    };
  }

  private static normalizeInterests(interests: string[]) {
    const normalized = interests
      .map((interest) => interest.trim().toLowerCase())
      .map((interest) => (interest === "traveling" ? "travel" : interest))
      .filter((interest): interest is InterestType =>
        this.allowedInterests.has(interest as InterestType),
      );

    return [...new Set(normalized)];
  }

  private static normalizeSleepTime(
    value: unknown,
  ): ILifestylePreferences["sleepTime"] {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    if (normalized === "early" || normalized === "early-bird") return "early";
    if (normalized === "late" || normalized === "night-owl") return "late";
    return "flexible";
  }

  private static normalizeCleanliness(
    value: unknown,
  ): ILifestylePreferences["cleanliness"] {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    if (normalized === "high") return "high";
    if (normalized === "low" || normalized === "chill") return "chill";
    return "medium";
  }

  private static normalizeOccasionalValue(
    value: unknown,
  ): ILifestylePreferences["smoking"] {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    if (normalized === "yes") return "yes";
    if (
      normalized === "occasionally" ||
      normalized === "sometimes" ||
      normalized === "social"
    ) {
      return "occasionally";
    }
    return "no";
  }

  private static normalizePersonality(
    value: unknown,
  ): ILifestylePreferences["personality"] {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    if (normalized === "introvert") return "introvert";
    if (normalized === "extrovert") return "extrovert";
    if (normalized === "high" || normalized === "social") return "extrovert";
    if (normalized === "low" || normalized === "quiet") return "introvert";
    return "ambivert";
  }

  private static getSharedInterests(
    profile1: IMatchProfile,
    profile2: IMatchProfile,
  ) {
    const interests2 = new Set(profile2.interests);
    return profile1.interests.filter((interest) => interests2.has(interest));
  }

  private static buildHighlights(
    scores: {
      budgetMatch: number;
      sleepScheduleMatch: number;
      cleanlinessMatch: number;
      habitsMatch: number;
      interestSimilarity: number;
      personalityMatch: number;
    },
    profile1: IMatchProfile,
    profile2: IMatchProfile,
  ) {
    const highlights: string[] = [];

    if (scores.budgetMatch >= 0.8) {
      highlights.push("Budget expectations are strongly aligned");
    }
    if (scores.sleepScheduleMatch >= 0.8) {
      highlights.push("Sleep schedules fit well");
    }
    if (scores.cleanlinessMatch >= 0.8) {
      highlights.push("Cleanliness preferences are compatible");
    }
    if (scores.habitsMatch >= 0.8) {
      highlights.push("Daily habits are highly compatible");
    }

    const sharedInterests = this.getSharedInterests(profile1, profile2);
    if (sharedInterests.length > 0) {
      highlights.push(
        `Shared interests: ${sharedInterests.slice(0, 3).join(", ")}`,
      );
    }

    return highlights.slice(0, 3);
  }
}

export default MatchingService;
