import express from "express";
import { handleAction } from "../controllers/actionHandler.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// AI-ready marks action
router.post("/action", authMiddleware, handleAction);

// Optional: GET marks by student
router.get("/", authMiddleware, async (req, res) => {
  const Marks = (await import("../models/Marks.js")).default;
  const marks = await Marks.find().populate("studentId");
  res.json(marks);
});

export default router;