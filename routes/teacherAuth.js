import express from "express";
import Teacher from "../models/Teacher.js";
import TeacherRole from "../models/TeacherRole.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    let { username, password } = req.body;

    // ✅ clean input
    username = username.trim().toLowerCase();
    password = password.trim();

    // ✅ find teacher
    const teacher = await Teacher.findOne({ username });

    if (!teacher || teacher.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ get class teacher role
    const roleData = await TeacherRole.findOne({
      teacherId: teacher._id,
      role: "class_teacher"
    });

    // ✅ class ALWAYS from role (FINAL FIX)
    const className = roleData ? roleData.classId : "";

    // ✅ token
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
        className,
        role: roleData ? "class_teacher" : "subject_teacher"
      }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;