import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // ✅ Support both formats:
    // 1. Bearer <token>
    // 2. direct token
    let token;

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = authHeader;
    }

    const decoded = jwt.verify(token, "secretkey");

    // 🔥 attach to request
    req.teacher = decoded;

    console.log("AUTH OK 👉", decoded); // debug

    next();
  } catch (error) {
    console.log("AUTH ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

export default authMiddleware;