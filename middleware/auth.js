import jwt from "jsonwebtoken";
import Teacher from "../models/Teacher.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, "secretkey");

    const teacher = await Teacher.findById(decoded.teacherId);

    if (!teacher) {
      return res.status(401).json({ message: "Invalid user" });
    }

    // 🔥 IMPORTANT
    req.teacher = {
      _id: teacher._id,
      name: teacher.name,
      role: decoded.role,
      className: decoded.className
    };

    console.log("AUTH TEACHER 👉", req.teacher);

    next();

  } catch (err) {
    console.log("AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;