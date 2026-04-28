import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Marks from "../models/Marks.js";

router.get("/student/:token", async (req, res) => {
  try {
    const student = await Student.findOne({ qrToken: req.params.token });

    if (!student) {
      return res.status(404).json({ message: "Student not found ❌" });
    }

    // ================= TODAY DATE =================
    const today = new Date().toISOString().split("T")[0];

    // ================= ATTENDANCE =================
    const attendance = await Attendance.findOne({
      date: today,
      "records.studentId": student._id,
    });

    let todayStatus = "N/A";

    if (attendance) {
      const record = attendance.records.find(
        (r) => String(r.studentId) === String(student._id)
      );
      todayStatus = record?.status || "N/A";
    }

    // ================= MONTHLY % =================
    const monthlyAttendance = await Attendance.find({
      "records.studentId": student._id,
    });

    let total = 0;
    let present = 0;

    monthlyAttendance.forEach((a) => {
      const rec = a.records.find(
        (r) => String(r.studentId) === String(student._id)
      );

      if (rec) {
        total++;
        if (rec.status === "P") present++;
      }
    });

    const percentage =
      total === 0 ? 0 : Math.round((present / total) * 100);

    // ================= MARKS =================
    const marks = await Marks.find({ studentId: student._id });

    res.json({
      student,
      todayAttendance: todayStatus,
      attendancePercentage: percentage,
      marks: marks || [],
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error ❌" });
  }
});