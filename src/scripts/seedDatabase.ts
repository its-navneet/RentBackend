/**
 * Database Seeding Script (minimal)
 * Creates exactly 3 users for the current API/model setup:
 * 1 admin, 1 tenant, 1 owner
 *
 * Run with: npx ts-node src/scripts/seedDatabase.ts
 */

import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { User } from "../models/User";
import { StudentProfile } from "../models/StudentProfile";
import { OwnerProfile } from "../models/OwnerProfile";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rentbackend";

async function connectDB(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
}

async function clearCollections(): Promise<void> {
  await Promise.all([
    User.deleteMany({}),
    StudentProfile.deleteMany({}),
    OwnerProfile.deleteMany({}),
  ]);
}

async function createUsersAndProfiles(): Promise<void> {
  const now = new Date();

  const [adminPasswordHash, tenantPasswordHash, ownerPasswordHash] =
    await Promise.all([
      bcrypt.hash("admin", 10),
      bcrypt.hash("tenant", 10),
      bcrypt.hash("owner", 10),
    ]);

  const adminId = new mongoose.Types.ObjectId();
  const tenantId = new mongoose.Types.ObjectId();
  const ownerId = new mongoose.Types.ObjectId();

  await User.insertMany([
    {
      _id: adminId,
      email: "admin@gmail.com",
      password: adminPasswordHash,
      phone: "",
      name: "Admin",
      role: "admin",
      gender: "other",
      verified: true,
      verificationStatus: "verified",
      backgroundCheckStatus: "approved",
      isActive: true,
      isBlocked: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: tenantId,
      email: "tenant@gmail.com",
      password: tenantPasswordHash,
      phone: "",
      name: "Tenant",
      role: "tenant",
      gender: "male",
      verified: true,
      verificationStatus: "verified",
      backgroundCheckStatus: "pending",
      isActive: true,
      isBlocked: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: ownerId,
      email: "owner@gmail.com",
      password: ownerPasswordHash,
      phone: "",
      name: "Owner",
      role: "owner",
      gender: "male",
      verified: true,
      verificationStatus: "verified",
      backgroundCheckStatus: "approved",
      isActive: true,
      isBlocked: false,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await StudentProfile.create({
    _id: tenantId,
    userId: tenantId,
    email: "tenant@gmail.com",
    phone: "",
    name: "Tenant",
    role: "student",
    createdAt: now,
    verified: true,
    branch: "",
    college: "",
    habits: {
      diet: "",
      sleepSchedule: "",
      cleanliness: "",
      socialLevel: "",
    },
    interests: [],
    preferences: {
      budget: { min: 0, max: 0 },
      roomType: "single",
      amenities: [],
      safetyRating: 0,
    },
  });

  await OwnerProfile.create({
    _id: ownerId,
    userId: ownerId,
    email: "owner@gmail.com",
    phone: "",
    name: "Owner",
    role: "owner",
    createdAt: now,
    verified: true,
    businessName: "",
    properties: [],
    backgroundCheckComplete: true,
    previousTenantReferences: [],
    backgroundCheckStatus: "approved",
  });

  console.log("✅ Seed complete: created 3 users (admin, tenant, owner)");
  console.log("\n📧 Login credentials:");
  console.log("Admin  -> admin@gmail.com / admin");
  console.log("Tenant -> tenant@gmail.com / tenant");
  console.log("Owner  -> owner@gmail.com / owner");
}

async function main(): Promise<void> {
  try {
    console.log("🌱 Seeding MongoDB with minimal users...");
    console.log(`📍 URI: ${MONGODB_URI}`);

    await connectDB();
    await clearCollections();
    await createUsersAndProfiles();
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((error: unknown) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
