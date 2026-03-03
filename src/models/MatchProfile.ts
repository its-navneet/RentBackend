/**
 * Match Profile Model
 * MongoDB schema for roommate matching profiles with lifestyle preferences
 */

import mongoose, { Document, Schema } from "mongoose";

export type SleepTime = "early" | "late" | "flexible";
export type Cleanliness = "high" | "medium" | "chill";
export type YesNoOccasionally = "yes" | "no" | "occasionally";
export type WorkType = "student" | "professional" | "remote";
export type Personality = "introvert" | "ambivert" | "extrovert";
export type InterestType =
  | "gym"
  | "coding"
  | "music"
  | "gaming"
  | "reading"
  | "travel"
  | "sports"
  | "entrepreneurship"
  | "movies";

export interface IBudgetRange {
  min: number;
  max: number;
}

export interface ILifestylePreferences {
  sleepTime: SleepTime;
  cleanliness: Cleanliness;
  smoking: YesNoOccasionally;
  drinking: YesNoOccasionally;
  guestFrequency: "frequent" | "occasional" | "rare";
  workType: WorkType;
  personality: Personality;
}

export interface IMatchProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  email: string;
  profileImage?: string;
  lifestyle: ILifestylePreferences;
  interests: InterestType[];
  budgetRange: IBudgetRange;
  bio?: string;
  preferredProperties?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const LifestylePreferencesSchema = new Schema<ILifestylePreferences>({
  sleepTime: {
    type: String,
    enum: ["early", "late", "flexible"],
    default: "flexible",
  },
  cleanliness: {
    type: String,
    enum: ["high", "medium", "chill"],
    default: "medium",
  },
  smoking: {
    type: String,
    enum: ["yes", "no", "occasionally"],
    default: "no",
  },
  drinking: {
    type: String,
    enum: ["yes", "no", "occasionally"],
    default: "no",
  },
  guestFrequency: {
    type: String,
    enum: ["frequent", "occasional", "rare"],
    default: "occasional",
  },
  workType: {
    type: String,
    enum: ["student", "professional", "remote"],
    default: "student",
  },
  personality: {
    type: String,
    enum: ["introvert", "ambivert", "extrovert"],
    default: "ambivert",
  },
});

const MatchProfileSchema = new Schema<IMatchProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: "",
  },
  lifestyle: {
    type: LifestylePreferencesSchema,
    required: true,
  },
  interests: [
    {
      type: String,
      enum: [
        "gym",
        "coding",
        "music",
        "gaming",
        "reading",
        "travel",
        "sports",
        "entrepreneurship",
        "movies",
      ],
    },
  ],
  budgetRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  bio: {
    type: String,
    default: "",
  },
  preferredProperties: [
    {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
MatchProfileSchema.index({ userId: 1 });
MatchProfileSchema.index({ interests: 1 });
MatchProfileSchema.index({ "budgetRange.min": 1, "budgetRange.max": 1 });

export const MatchProfile = mongoose.model<IMatchProfile>(
  "MatchProfile",
  MatchProfileSchema,
);

export default MatchProfile;
