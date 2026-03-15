/**
 * Messaging Routes
 * REST endpoints for messaging functionality
 */

import express, { Router, Request, Response, NextFunction } from "express";
import Message from "../models/Message";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const router: Router = express.Router();

// Authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    );
    (req as any).userId = (decoded as any).userId || (decoded as any).uid;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Apply authentication middleware
router.use(authenticate);

/**
 * GET /messages/unread/count
 * Get count of unread messages for current user
 */
router.get("/unread/count", async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;

    const unreadCount = await Message.countDocuments({
      receiverId: currentUserId,
      read: false,
    });

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

/**
 * GET /messages/:userId
 * Get all messages between current user and specified user
 */
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;
    const otherUserId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email")
      .populate("receiverId", "name email");

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/**
 * GET /conversations
 * Get list of all conversations for current user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;

    // Get unique users the current user has messaged
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(currentUserId) },
            { receiverId: new mongoose.Types.ObjectId(currentUserId) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              {
                $eq: ["$senderId", new mongoose.Types.ObjectId(currentUserId)],
              },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          "user.name": 1,
          "user.email": 1,
          "lastMessage.content": 1,
          "lastMessage.createdAt": 1,
          "lastMessage.read": 1,
          "lastMessage.senderId": 1,
        },
      },
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
    ]);

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

/**
 * PATCH /messages/read/:senderId
 * Mark all unread messages from a specific sender to current user as read
 */
router.patch("/read/:senderId", async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;
    const { senderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ error: "Invalid sender ID" });
    }

    const result = await Message.updateMany(
      { senderId, receiverId: currentUserId, read: false },
      { $set: { read: true } },
    );

    res.json({ success: true, updated: result.modifiedCount });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

/**
 * POST /messages
 * Send a message to another user
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;
    const { receiverId, content } = req.body;

    if (
      !receiverId ||
      !content ||
      typeof content !== "string" ||
      content.trim() === ""
    ) {
      return res
        .status(400)
        .json({ error: "receiverId and non-empty content are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ error: "Invalid receiver ID" });
    }

    const message = await Message.create({
      senderId: currentUserId,
      receiverId,
      content: content.trim(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "name email")
      .populate("receiverId", "name email");

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * DELETE /messages/:messageId
 * Delete a specific message
 */
router.delete("/:messageId", async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;
    const messageId = req.params.messageId;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only sender can delete their message
    if (message.senderId.toString() !== currentUserId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Message.deleteOne({ _id: messageId });

    res.json({
      success: true,
      message: "Message deleted",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
