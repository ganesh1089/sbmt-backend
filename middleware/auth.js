import jwt from "jsonwebtoken";
import Teacher from "../models/Teacher.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token missing" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, "secretkey");

    const teacher = await Teacher.findById(decoded.teacherId);

    if (!teacher) {
      return res.status(401).json({ message: "Teacher not found" });
    }

    // 🔥 FIXED STRUCTURE (IMPORTANT)
    req.teacher = {
      teacherId: teacher._id,
      name: teacher.name,
      role: teacher.role,
      className: teacher.className || ""
    };

    console.log("AUTH OK 👉", req.teacher);

    next();

  } catch (err) {
    console.log("AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;