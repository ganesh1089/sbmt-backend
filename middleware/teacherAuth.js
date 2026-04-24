import jwt from "jsonwebtoken";
import Teacher from "../models/Teacher.js";

export default async function teacherAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, "secretkey");

    const teacher = await Teacher.findById(decoded.userId);

    if (!teacher) {
      return res.status(401).json({ message: "Invalid teacher" });
    }

    req.teacher = teacher; // 🔥 ATTACH FULL TEACHER
    next();

  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}