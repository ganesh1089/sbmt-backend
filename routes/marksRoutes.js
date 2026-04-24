import express from "express";
import authMiddleware from "../middleware/auth.js";
import { saveMarks, getViewMarks, getStudentMarks } from "../controllers/marksController.js";

const router = express.Router();

// save marks
router.post("/save", authMiddleware, saveMarks);

// view marks
router.get("/view/:className/:examType", authMiddleware, getViewMarks);
// 🎓 student marks
router.get("/student/:id", getStudentMarks);

export default router;