import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import fs from "fs";
import { fileURLToPath } from "url";

// ================= APP =================
const app = express();

// ================= FIX __dirname =================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= BODY PARSER =================
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// ================= CORS =================
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://sbmt-frontend.vercel.app"
      ];

      // allow server-to-server / postman requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked:", origin);
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ================= UPLOADS FIX =================
const uploadPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("📁 uploads folder created");
}

// STATIC FILES (IMPORTANT FIX)
app.use("/uploads", express.static(uploadPath));

// ================= ROUTES =================
import authRoutes from "./routes/auth.js";
import protectedRoutes from "./routes/protected.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import teacherAuth from "./routes/teacherAuth.js";
import studentRoutes from "./routes/studentRoutes.js";
import attendanceRoutes from "./routes/attendance.js";
import marksRoutes from "./routes/marksRoutes.js";
import hodAuthRoutes from "./routes/hodAuth.js";
import hodRoutes from "./routes/hodRoutes.js";
import downloadRoutes from "./routes/downloadRoutes.js";
import dashboardRoutes from "./routes/dashboard.js";
import qrRoutes from "./routes/qrRoutes.js";

app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/teacher", teacherAuth);
app.use("/api/dashboard", dashboardRoutes);

app.use("/api/hod", hodAuthRoutes);
app.use("/api/hod", hodRoutes);

app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/qr", qrRoutes);

// ================= TEST =================
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