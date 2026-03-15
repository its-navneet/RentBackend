import mongoose, { Document, Schema } from "mongoose";

export interface IMatchInterest extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  message?: string;
  isMutual: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MatchInterestSchema = new Schema<IMatchInterest>({
  fromUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  toUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    default: "",
    trim: true,
  },
  isMutual: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

MatchInterestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
MatchInterestSchema.index({ toUserId: 1, isMutual: 1 });

export const MatchInterest = mongoose.model<IMatchInterest>(
  "MatchInterest",
  MatchInterestSchema,
);

export default MatchInterest;
