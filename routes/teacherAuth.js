import express from "express";
import Teacher from "../models/Teacher.js";
import TeacherRole from "../models/TeacherRole.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ find teacher
    const teacher = await Teacher.findOne({ username, password });

    if (!teacher) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ ONLY class teacher role check
    const roleData = await TeacherRole.findOne({
      teacherId: teacher._id,
      role: "class_teacher"
    });

    // ✅ class always from role (FIXED)
    const className = roleData ? roleData.classId : "";

    // ✅ create token
    const token = jwt.sign(
      {
        teacherId: teacher._id,
        role: roleData ? "class_teacher" : "subject_teacher",
        className
      },
      "secretkey",
      { expiresIn: "365d" }
    );

    // ✅ response
    res.json({
      message: "Login success",
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        username: teacher.username,
        className, // 🔥 FIXED
        role: roleData ? "class_teacher" : "subject_teacher"
      }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;