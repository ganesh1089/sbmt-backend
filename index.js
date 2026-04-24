import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";

// ================= ROUTES =================
import authRoutes from "./routes/auth.js";
import protectedRoutes from "./routes/protected.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import attendanceRoutes from "./routes/attendance.js";
import marksRoutes from "./routes/marksRoutes.js";
import hodAuthRoutes from "./routes/hodAuth.js";
import hodRoutes from "./routes/hodRoutes.js";
import downloadRoutes from "./routes/downloadRoutes.js";
import dashboardRoutes from "./routes/dashboard.js";

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());

// 🔥 CORS (production safe)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/hod", hodAuthRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/hod", hodRoutes);
app.use("/api/download", downloadRoutes);

console.log("✅ All routes loaded");

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.send("SBMT API Running 🚀");
});

// ================= DB CONNECT + SERVER START =================
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI missing in .env file");
  process.exit(1);
}

mongoose.set("bufferCommands", false);

const startServer = async () => {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("🔥 MongoDB Atlas connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.log("❌ DB connection failed:", err);
    process.exit(1);
  }
};

startServer();