import express from "express";
import Teacher from "../models/Teacher.js";
import TeacherRole from "../models/TeacherRole.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    let { username, password } = req.body;

    // ✅ clean input
    username = username.trim();
    password = password.trim();

    // ✅ find teacher
    const teacher = await Teacher.findOne({ username });

    if (!teacher || teacher.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("LOGIN TEACHER:", teacher._id);

    // ✅ get ALL roles of teacher
    const roles = await TeacherRole.find({
      teacherId: teacher._id
    });

    console.log("ALL ROLES:", roles);

    // ✅ find class teacher role
    const classRole = roles.find(r => r.role === "class_teacher");

    const isClassTeacher = !!classRole;
    const className = isClassTeacher ? classRole.classId : "";

    // ✅ token
    const token = jwt.sign(
      {
        teacherId: teacher._id,
        role: isClassTeacher ? "class_teacher" : "subject_teacher",
        className
      },
      "secretkey",
      { expiresIn: "365d" }
    );

    console.log("FINAL TOKEN:", {
      role: isClassTeacher ? "class_teacher" : "subject_teacher",
      className
    });

    // ✅ response
    res.json({
      message: "Login success",
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        username: teacher.username,
        className,
        role: isClassTeacher ? "class_teacher" : "subject_teacher"
      }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;