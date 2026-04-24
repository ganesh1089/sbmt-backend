import express from "express";
import Teacher from "../models/Teacher.js";
import TeacherRole from "../models/TeacherRole.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const teacher = await Teacher.findOne({ username, password });

    if (!teacher) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const roleData = await TeacherRole.findOne({
      teacherId: teacher._id,
      role: "class_teacher"
    });

    // 🔥 TOKEN FIX
    const token = jwt.sign(
      {
        teacherId: teacher._id,
        role: roleData ? "class_teacher" : "subject_teacher",
        className: teacher.className || ""
      },
      "secretkey",
      { expiresIn: "365d" }
    );

    res.json({
      message: "Login success",
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        className: teacher.className,
        role: roleData ? "class_teacher" : "subject_teacher"
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;