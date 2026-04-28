import express from "express";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Marks from "../models/Marks.js";

const router = express.Router();

// ================= STUDENT REPORT BY ID =================
router.get("/student/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const student = await Student.findOne({ qrToken: token });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const today = new Date().toISOString().split("T")[0];

    const attendanceDoc = await Attendance.findOne({ date: today });

    let todayStatus = "N/A";

    if (attendanceDoc) {
      const record = attendanceDoc.records.find(
        r => String(r.studentId) === String(student._id)
      );
      todayStatus = record?.status || "N/A";
    }

    const marks = await Marks.find({ studentId: student._id });

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

    return res.json({
      _id: student._id,
      name: student.name,
      fatherName: student.fatherName,
      className: student.className,
      mobile: student.mobile,
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