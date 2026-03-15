/**
 * Authentication Service
 * JWT-based authentication with MongoDB
 */

import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User, IUser } from "../models/User";
import { StudentProfile } from "../models/StudentProfile";
import { OwnerProfile } from "../models/OwnerProfile";
import { log } from "node:console";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface AuthUser {
  uid: string;
  email: string;
  role: string;
}

// Store current user in memory for the request (will be set by middleware)
let currentUser: AuthUser | null = null;

export const auth = {
  // Create a new user with email and password
  createUserWithEmailAndPassword: async (
    email: string,
    password: string,
    name: string,
    phone: string,
    role: string = "tenant",
    gender: string = "other",
  ) => {
    console.log(
      "Creating user with email:",
      email,
      "role:",
      role,
      "name:",
      name,
      "phone:",
      phone,
      "password:",
      password,
    );
    // Validate input
    if (!email || typeof email !== "string" || email.trim() === "") {
      throw new Error("Email is required");
    }
    if (!password || typeof password !== "string" || password.trim() === "") {
      throw new Error("Password is required");
    }
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new Error("Name is required");
    }
    if (!role || typeof role !== "string" || role.trim() === "") {
      throw new Error("Role is required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      phone: phone ? phone.trim() : "",
      role: role.trim(),
      gender: gender.trim(),
      verified: false,
    });

    await user.save();

    return {
      user: {
        uid: user._id.toString(),
        email: user.email,
      },
    };
  },

  // Sign in with email and password
  signInWithEmailAndPassword: async (email: string, password: string) => {
    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const options: SignOptions = { expiresIn: "7d" };
    const token = jwt.sign(
      { uid: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      options,
    );

    // Store current user
    currentUser = {
      uid: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      user: {
        uid: user._id.toString(),
        email: user.email,
      },
      token,
    };
  },

  // Sign out
  signOut: async () => {
    currentUser = null;
  },

  // Get current user
  getCurrentUser: () => {
    return currentUser;
  },

  // Set current user (for testing or manual auth)
  setCurrentUser: (user: AuthUser | null) => {
    currentUser = user;
  },

  // Get current user from token
  getCurrentUserFromToken: (token: string): AuthUser | null => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      return decoded;
    } catch (error) {
      return null;
    }
  },

  // Verify JWT token
  verifyToken: (token: string): AuthUser | null => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      return decoded;
    } catch (error) {
      return null;
    }
  },

  // Generate JWT token
  generateToken: (user: IUser): string => {
    const options: SignOptions = { expiresIn: "7d" };
    return jwt.sign(
      { uid: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      options,
    );
  },

  // Get all users (for debugging)
  getAllUsers: async () => {
    return await User.find();
  },

  // Change password
  changePassword: async (
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new Error("Current password is incorrect");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return true;
  },
};

export default auth;
