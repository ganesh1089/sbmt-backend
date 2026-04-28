import express from "express";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Marks from "../models/Marks.js";

const router = express.Router();

// ================= QR STUDENT REPORT =================
router.get("/student/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // 🔥 FIND STUDENT BY QR TOKEN
    const student = await Student.findOne({ qrToken: token });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const today = new Date().toISOString().split("T")[0];

    // 🔥 TODAY ATTENDANCE ONLY (optimized)
    const todayAttendance = await Attendance.findOne({
      date: today
    });

    let todayStatus = "N/A";

    if (todayAttendance) {
      const record = todayAttendance.records.find(
        r => String(r.studentId) === String(student._id)
      );

      todayStatus = record?.status || "N/A";
    }

    // 🔥 MARKS
    const marks = await Marks.find({ studentId: student._id });

    // 🔥 ATTENDANCE PERCENTAGE (optimized idea)
    const attendanceDocs = await Attendance.find({
      "records.studentId": student._id
    });

    let total = 0;
    let present = 0;

    attendanceDocs.forEach(doc => {
      const rec = doc.records.find(
        r => String(r.studentId) === String(student._id)
      );

      if (rec) {
        total++;
        if (rec.status === "P") present++;
      }
    });

    const percentage = total
      ? Math.round((present / total) * 100)
      : 0;

    // 🔥 FINAL RESPONSE
    return res.json({
      student: {
        _id: student._id,
        name: student.name,
        fatherName: student.fatherName,
        className: student.className,
        mobile: student.mobile,
        photo: student.photo,
        admissionNo: student.admissionNo
      },
      todayAttendance: todayStatus,
      attendancePercentage: percentage,
      marks
    });

  } catch (err) {
    console.log("QR REPORT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;