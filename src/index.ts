// Load environment variables FIRST before any imports
import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import http from "http";

// Import routes
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import userRoutes from "./routes/users";
import bookingRoutes from "./routes/bookings";
import reviewRoutes from "./routes/reviews";
import agreementRoutes from "./routes/agreements";
import uploadRoutes from "./routes/upload";
import messagesRoutes from "./routes/messages";
import matchingRoutes from "./routes/matching";
import bookingLifecycleRoutes from "./routes/bookingLifecycle";
import ledgerRoutes from "./routes/ledger";
import ratingRoutes from "./routes/ratings";
import adminRoutes from "./routes/admin";

// Import MongoDB connection
import { connectDB } from "./db/mongodb";
import { WebSocketService } from "./services/websocket";

const app: Express = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize WebSocket
const wsService = new WebSocketService(httpServer);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (for local storage fallback)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  console.log("Health check endpoint hit");
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes - Original
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/agreements", agreementRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/messages", messagesRoutes);

// API Routes - PG Ecosystem Features
app.use("/api/matching", matchingRoutes);
app.use("/api/booking-lifecycle", bookingLifecycleRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Start server with MongoDB connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server with WebSocket
    httpServer.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
      console.log(`WebSocket server ready`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};
startServer();

export default app;
