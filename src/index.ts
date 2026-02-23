import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import userRoutes from "./routes/users";
import bookingRoutes from "./routes/bookings";
import reviewRoutes from "./routes/reviews";
import agreementRoutes from "./routes/agreements";

// Import MongoDB connection
import { connectDB } from "./db/mongodb";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  console.log("Health check endpoint hit");
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/agreements", agreementRoutes);

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
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    Rent Backend Server                         ║
║                                                               ║
║   Server running on http://localhost:${PORT}                     ║
║   MongoDB: Connected                                          ║
║                                                               ║
║   Available API Endpoints:                                    ║
║   - GET  /health                      Health check            ║
║   - POST /api/auth/register           Register user          ║
║   - POST /api/auth/login              Login                  ║
║   - POST /api/auth/logout            Logout                 ║
║   - GET  /api/auth/me                Get current user       ║
║   - GET  /api/properties              Get all properties    ║
║   - GET  /api/properties/:id          Get property by ID    ║
║   - POST /api/properties              Create property       ║
║   - PUT  /api/properties/:id          Update property       ║
║   - DELETE /api/properties/:id        Delete property       ║
║   - GET  /api/users                   Get all users         ║
║   - GET  /api/users/:id               Get user by ID        ║
║   - PUT  /api/users/:id               Update user           ║
║   - GET  /api/users/student/:id       Get student profile  ║
║   - PUT  /api/users/student/:id       Update student profile║
║   - GET  /api/users/owner/:id         Get owner profile    ║
║   - PUT  /api/users/owner/:id         Update owner profile ║
║   - GET  /api/bookings                Get all bookings      ║
║   - GET  /api/bookings/:id            Get booking by ID     ║
║   - POST /api/bookings                Create booking        ║
║   - PUT  /api/bookings/:id            Update booking        ║
║   - DELETE /api/bookings/:id          Delete booking        ║
║   - GET  /api/reviews                 Get all reviews       ║
║   - GET  /api/reviews/:id             Get review by ID     ║
║   - POST /api/reviews                 Create review         ║
║   - PUT  /api/reviews/:id             Update review        ║
║   - DELETE /api/reviews/:id           Delete review        ║
║   - GET  /api/agreements              Get all agreements   ║
║   - GET  /api/agreements/:id          Get agreement by ID  ║
║   - POST /api/agreements              Create agreement      ║
║   - PUT  /api/agreements/:id          Update agreement     ║
║   - PUT  /api/agreements/:id/sign     Sign agreement       ║
║   - DELETE /api/agreements/:id        Delete agreement     ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
