import Teacher from "../models/Teacher.js";
import bcrypt from "bcryptjs";

export const createTeacher = async (req, res) => {
  try {
    console.log("🔥 CREATE TEACHER HIT");

    const { name, email, password, subject, className } = req.body;

    // validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, Email, Password required" });
    }

    // check duplicate
    const existing = await Teacher.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Teacher already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create teacher
    const teacher = await Teacher.create({
      name,
      email,
      password: hashedPassword,
      subject: subject || "",
      className: className || "",
    });

    // ⚠️ NEVER return password
    const safeTeacher = {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      subject: teacher.subject,
      className: teacher.className,
      createdAt: teacher.createdAt,
    };

    return res.status(201).json({
      message: "Teacher added successfully",
      teacher: safeTeacher,
    });

  } catch (error) {
    console.log("❌ ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};