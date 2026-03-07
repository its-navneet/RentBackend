/**
 * Create Admin User Script
 * Run with: npx ts-node src/scripts/createAdmin.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rentbackend";

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@rentpg.com" });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists with email: admin@rentpg.com");
      console.log("Email: admin@rentpg.com");
      console.log("Password: admin123 (if not changed)");
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await User.create({
      email: "admin@rentpg.com",
      password: hashedPassword,
      phone: "+919999999999",
      name: "Admin User",
      role: "admin",
      verified: true,
      verificationStatus: "verified",
      isActive: true,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("\n✅ Admin user created successfully!");
    console.log("\n📧 Login Credentials:");
    console.log("   Email: admin@rentpg.com");
    console.log("   Password: admin123");
    console.log("\n⚠️  Please change the password after first login!\n");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  }
}

createAdmin();
