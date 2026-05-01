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

    // ================= ROLE FETCH (FIXED LOGIC) =================
    const roleData = await TeacherRole.findOne({
      teacherId: teacher._id
    });

    let role = "teacher";
    let className = "";

    if (roleData) {
      role = roleData.role;        // class_teacher / subject_teacher
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
      { expiresIn: "7d" }
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