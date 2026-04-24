import express from "express";
import auth from "../middleware/auth.js";
import { downloadClass, downloadStudent } from "../controllers/downloadController.js";

const router = express.Router();

/* ================= CLASS PDF ================= */
router.get("/class", auth, downloadClass);

/* ================= SINGLE STUDENT PDF ================= */
router.get("/student/:id", auth, downloadStudent);

export default router;