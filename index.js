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

// 🔥 SAFE CORS (FIXED FOR FRONTEND + RENDER)
app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "https://graceful-muffin-061d75.netlify.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  })
);

// important preflight support
app.options("*", cors());

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 🔥 HOD ROUTES (CLEAN & SAFE)
app.use("/api/hod", hodAuthRoutes);
app.use("/api/hod", hodRoutes);

app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/download", downloadRoutes);

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.send("SBMT API Running 🚀");
});

// ================= DB =================
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI missing");
  process.exit(1);
}

mongoose.set("bufferCommands", false);

// ================= START SERVER =================
const startServer = async () => {
  try {
    await mongoose.connect(uri);

    console.log("🔥 MongoDB connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });

  } catch (err) {
    console.log("❌ DB error:", err);
    process.exit(1);
  }
};

startServer();