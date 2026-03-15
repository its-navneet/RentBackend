import express, { Request, Response } from "express";
import db from "../services/db";
import { User } from "../models/User";
import { StudentProfile } from "../models/StudentProfile";
import { OwnerProfile } from "../models/OwnerProfile";
import mongoose from "mongoose";

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    const users: any[] = [];

    const snapshot = await db.collection("users").get();
    snapshot.forEach((doc: any) => {
      users.push(doc.data());
    });

    if (role) {
      const filteredUsers = users.filter((u) => u.role === role);
      return res.json({
        success: true,
        data: filteredUsers,
      });
    }

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch users",
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const userData = doc.data();

    // If user is a student, fetch and merge student profile data
    if (userData?.role === "student") {
      const studentDoc = await db.collection("studentProfiles").doc(id).get();
      console.log(
        `Fetching student profile for user ${id}, exists:`,
        studentDoc.exists,
      );
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        console.log("Student data:", JSON.stringify(studentData, null, 2));

        // Check if habits exist and have values
        const habits = studentData?.habits;
        const hasHabitsData =
          habits &&
          Object.keys(habits).length > 0 &&
          Object.values(habits).some(
            (v) => v !== "" && v !== null && v !== undefined,
          );

        userData.habits = hasHabitsData ? habits : studentData?.preferences;
        userData.interests = studentData?.interests;
        userData.preferences = studentData?.preferences;

        console.log("Merged habits:", userData.habits);
        console.log("Merged interests:", userData.interests);
        console.log("Merged preferences:", userData.preferences);
      }
    }

    console.log(
      "Final user data being sent:",
      JSON.stringify(userData, null, 2),
    );
    res.json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch user",
    });
  }
});

// PUT /api/users/:id - Update user
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Verification and moderation flags are admin-controlled via /api/admin routes
    const restrictedFields = [
      "verified",
      "verificationStatus",
      "backgroundCheckStatus",
      "isActive",
      "isBlocked",
      "role",
      "verificationMeta",
    ];
    restrictedFields.forEach((field) => delete (updates as any)[field]);

    const doc = await db.collection("users").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    await db.collection("users").doc(id).update(updates);

    const updatedDoc = await db.collection("users").doc(id).get();

    res.json({
      success: true,
      data: updatedDoc.data(),
      message: "User updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update user",
    });
  }
});

// GET /api/users/student/:id - Get student profile
router.get("/student/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("studentProfiles").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Student profile not found",
      });
    }

    const data = doc.data();
    console.log(
      "Student profile data for",
      id,
      ":",
      JSON.stringify(data, null, 2),
    );

    res.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch student profile",
    });
  }
});

// PUT /api/users/student/:id - Update student profile
router.put("/student/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doc = await db.collection("studentProfiles").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Student profile not found",
      });
    }

    await db.collection("studentProfiles").doc(id).update(updates);

    const updatedDoc = await db.collection("studentProfiles").doc(id).get();

    res.json({
      success: true,
      data: updatedDoc.data(),
      message: "Student profile updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update student profile",
    });
  }
});

// GET /api/users/owner/:id - Get owner profile
router.get("/owner/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("ownerProfiles").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Owner profile not found",
      });
    }

    res.json({
      success: true,
      data: doc.data(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch owner profile",
    });
  }
});

// PUT /api/users/owner/:id - Update owner profile
router.put("/owner/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doc = await db.collection("ownerProfiles").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Owner profile not found",
      });
    }

    await db.collection("ownerProfiles").doc(id).update(updates);

    const updatedDoc = await db.collection("ownerProfiles").doc(id).get();

    res.json({
      success: true,
      data: updatedDoc.data(),
      message: "Owner profile updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update owner profile",
    });
  }
});

// GET /api/users/roommates - Get all roommate profiles
router.get("/roommates/all", async (req: Request, res: Response) => {
  try {
    const profiles: any[] = [];

    const snapshot = await db.collection("roommateProfiles").get();
    snapshot.forEach((doc: any) => {
      profiles.push(doc.data());
    });

    res.json({
      success: true,
      data: profiles,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch roommate profiles",
    });
  }
});

export default router;
