import express from "express";
import Student from "../models/Student.js";

const router = express.Router();

// ================= QR SCAN =================
router.get("/student/:token", async (req, res) => {
  try {
    const student = await Student.findOne({
      qrToken: req.params.token
    });

    if (!student) {
      return res.status(404).json({
        message: "Invalid QR ❌"
      });
    }

    res.json({
      student
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error"
    });
  }
});

export default router;