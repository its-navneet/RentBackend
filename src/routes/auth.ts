import express, { Request, Response } from "express";
import auth from "../services/auth";
import db from "../services/db";
import mongoose from "mongoose";
import { log } from "console";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, role, name, phone, preferences } = req.body;

    // More robust validation - check for empty strings and invalid values
    if (
      !email ||
      typeof email !== "string" ||
      email.trim() === "" ||
      !password ||
      typeof password !== "string" ||
      password.trim() === "" ||
      !role ||
      typeof role !== "string" ||
      role.trim() === "" ||
      !name ||
      typeof name !== "string" ||
      name.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        error: "Email, password, role, and name are required",
      });
    }

    if (!["student", "owner"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Role must be either student or owner",
      });
    }

    const result = await auth.createUserWithEmailAndPassword(
      email,
      password,
      name,
      phone,
      role,
    );

    const userId = result.user.uid;

    // Create user profile in MongoDB
    const userData = {
      _id: new mongoose.Types.ObjectId(userId),
      id: userId,
      email,
      name,
      phone: phone || "",
      role,
      createdAt: new Date(),
      verified: false,
    };

    // Don't override the user document - it's already created by auth service with hashed password
    // await db.collection('users').doc(userId).set({ ...userData, password: '' });

    // Create role-specific profile
    if (role === "student") {
      await db
        .collection("studentProfiles")
        .doc(userId)
        .set({
          ...userData,
          userId: userId,
          branch: "",
          college: "",
          habits: {
            diet: preferences?.diet || "",
            sleepSchedule: preferences?.sleepSchedule || "",
            cleanliness: preferences?.cleanliness || "",
            socialLevel: preferences?.socialLevel || "",
          },
          interests: preferences?.interests || [],
          preferences: {
            budget: { min: 0, max: 0 },
            roomType: "single",
            amenities: [],
            safetyRating: 0,
          },
        });
    } else if (role === "owner") {
      await db
        .collection("ownerProfiles")
        .doc(userId)
        .set({
          ...userData,
          userId: userId,
          businessName: "",
          properties: [],
          backgroundCheckComplete: false,
          previousTenantReferences: [],
        });
    }

    res.status(201).json({
      success: true,
      data: {
        uid: result.user.uid,
        email: result.user.email,
        role,
      },
      message: "User registered successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Registration failed",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  log("Login request received with body:", req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const result = await auth.signInWithEmailAndPassword(email, password);

    // Get user profile
    const userDoc = await db.collection("users").doc(result.user.uid).get();
    const userData = userDoc.data();

    const response = {
      success: true,
      data: {
        uid: result.user.uid,
        email: result.user.email,
        role: userData?.role,
        name: userData?.name,
        token: result.token,
      },
      message: "Login successful",
    };
    res.json(response);
    log("Login response:", response);
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || "Invalid credentials",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    await auth.signOut();
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Logout failed",
    });
  }
});

// GET /api/auth/me
router.get("/me", async (req: Request, res: Response) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const token = authHeader.split(" ")[1];
    const currentUser = auth.verifyToken(token);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    const userDoc = await db.collection("users").doc(currentUser.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get user",
    });
  }
});

// PUT /api/auth/set-user - Helper endpoint to set current user (for testing)
router.put("/set-user", async (req: Request, res: Response) => {
  try {
    const { uid, email } = req.body;

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        error: "uid and email are required",
      });
    }

    auth.setCurrentUser({ uid, email, role: "student" });

    res.json({
      success: true,
      message: "User set successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to set user",
    });
  }
});

export default router;
