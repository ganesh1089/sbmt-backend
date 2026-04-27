import express from "express";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Marks from "../models/Marks.js";

const router = express.Router();

// ================= QR STUDENT DATA =================
router.get("/student/qr/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // 🔍 student find
    const student = await Student.findOne({ qrToken: token });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 📅 today date
    const today = new Date().toISOString().split("T")[0];

    // 📅 attendance today
    const attendanceDoc = await Attendance.findOne({ date: today });

    let todayStatus = "N/A";

    if (attendanceDoc) {
      const record = attendanceDoc.records.find(
        r => String(r.studentId) === String(student._id)
      );
      todayStatus = record?.status || "N/A";
    }

    // 📊 marks
    const marks = await Marks.find({ studentId: student._id });

    // 📆 monthly attendance (simple calc)
    const allAttendance = await Attendance.find();

    let total = 0;
    let present = 0;

    allAttendance.forEach(day => {
      const rec = day.records.find(
        r => String(r.studentId) === String(student._id)
      );
      if (rec) {
        total++;
        if (rec.status === "P") present++;
      }
    });

    const percentage = total ? Math.round((present / total) * 100) : 0;

    // ✅ final response
    res.json({
      name: student.name,
      className: student.className,
      photo: student.photo,
      admissionNo: student.admissionNo,
      todayAttendance: todayStatus,
      monthlyAttendance: percentage,
      marks
    });

  } catch (err) {
    console.log("QR ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;