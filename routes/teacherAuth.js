import express from "express";
import Teacher from "../models/Teacher.js";
import TeacherRole from "../models/TeacherRole.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const teacher = await Teacher.findOne({ username, password });

    if (!teacher) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ================= ROLE FETCH (PRIORITY: class_teacher) =================
    let role = "teacher";
    let className = "";

    // 🔥 pehle class_teacher check karo
    let roleData = await TeacherRole.findOne({
      teacherId: teacher._id,
      role: "class_teacher"
    });

    // 🔁 agar class_teacher nahi mila to koi bhi role le lo
    if (!roleData) {
      roleData = await TeacherRole.findOne({
        teacherId: teacher._id
      });
    }

    if (roleData) {
      role = roleData.role;
      className = roleData.classId;
    }

    // ================= TOKEN =================
    const token = jwt.sign(
      {
        teacherId: teacher._id,
        role,
        className
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "365d" } // ✅ 1 YEAR
    );

    // ================= RESPONSE =================
    return res.json({
      message: "Login success",
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        username: teacher.username,
        className,
        role
      }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;