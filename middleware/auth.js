import jwt from "jsonwebtoken";
import Teacher from "../models/Teacher.js";

const authMiddleware = async (req, res, next) => {
  try {
    // ================= GET TOKEN =================
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing or invalid format",
      });
    }

    const token = authHeader.split(" ")[1];

    // ================= VERIFY TOKEN =================
    let decoded;
    try {
      decoded = jwt.verify(token, "secretkey");
    } catch (err) {
      return res.status(401).json({
        message: "Token expired or invalid",
      });
    }

    // ================= FIND TEACHER =================
    const teacher = await Teacher.findById(decoded.teacherId);

    if (!teacher) {
      return res.status(401).json({
        message: "Teacher not found",
      });
    }

    // ================= SAFE ATTACH (IMPORTANT FIX) =================
    req.teacher = {
      _id: teacher._id,
      name: teacher.name || "",
      role: teacher.role || "teacher",
      className: teacher.className || "",
    };

    // 🔥 extra safety log (temporary debug)
    console.log("AUTH OK 👉", req.teacher);

    next();
  } catch (err) {
    console.log("AUTH ERROR:", err.message);

    return res.status(500).json({
      message: "Server auth error",
    });
  }
};

export default authMiddleware;