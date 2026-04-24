import express from "express";
import authMiddleware from "../middleware/auth.js";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";

const router = express.Router();

// 🔥 helper (ONLY TODAY ALLOWED)
function isToday(date) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  const today = d.toISOString().split("T")[0];

  return date === today;
}

// =========================
// 📌 OPEN ATTENDANCE
// =========================
router.post("/open", authMiddleware, async (req, res) => {
  try {
    const teacherClass = req.teacher?.className;

    if (!teacherClass) {
      return res.status(403).json({ msg: "Class not assigned" });
    }

    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ msg: "Date is required" });
    }

    // 🔒 DATE RESTRICTION
    if (!isToday(date)) {
      return res.status(400).json({ msg: "Only today's attendance allowed" });
    }

    let att = await Attendance.findOne({
      class: teacherClass,
      date,
    });

    if (!att) {
      const students = await Student.find({ className: teacherClass }).sort({ rollNo: 1 });

      const records = students.map((s) => ({
        studentId: s._id,
        name: s.name,
        rollNo: Number(s.rollNo) || 0,
        status: "A",
      }));

      att = await Attendance.create({
        class: teacherClass,
        date,
        status: "PENDING",
        records,
        isLocked: false,
      });
    }

    res.json(att);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});


// =========================
// 💾 SAVE ATTENDANCE
// =========================
router.post("/save", authMiddleware, async (req, res) => {
  try {
    const teacherClass = req.teacher?.className;

    if (!teacherClass) {
      return res.status(403).json({ msg: "Class not assigned" });
    }

    const { date, records } = req.body;

    if (!date) {
      return res.status(400).json({ msg: "Date is required" });
    }

    // 🔒 DATE RESTRICTION
    if (!isToday(date)) {
      return res.status(400).json({ msg: "Cannot save past/future attendance" });
    }

    const existing = await Attendance.findOne({
      class: teacherClass,
      date,
    });

    // 🔒 LOCK CHECK
    if (existing && existing.isLocked) {
      return res.status(400).json({ msg: "Attendance already locked" });
    }

    const att = await Attendance.findOneAndUpdate(
      { class: teacherClass, date },
      {
        class: teacherClass,
        date,
        records,
        status: "MARKED",
        isLocked: true, // 🔥 SAVE = LOCK
        lockedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({ msg: "Attendance saved ✅", att });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});


// =========================
// 🎉 HOLIDAY
// =========================
router.post("/holiday", authMiddleware, async (req, res) => {
  try {
    const teacherClass = req.teacher?.className;

    if (!teacherClass) {
      return res.status(403).json({ msg: "Class not assigned" });
    }

    const { date, reason } = req.body;

    // 🔒 DATE RESTRICTION
    if (!isToday(date)) {
      return res.status(400).json({ msg: "Holiday only for today allowed" });
    }

    const existing = await Attendance.findOne({
      class: teacherClass,
      date,
    });

    if (existing && existing.isLocked) {
      return res.status(400).json({ msg: "Already locked attendance" });
    }

    const students = await Student.find({ className: teacherClass }).sort({ rollNo: 1 });

    const records = students.map((s) => ({
      studentId: s._id,
      name: s.name,
      rollNo: Number(s.rollNo) || 0,
      status: "H",
    }));

    const att = await Attendance.findOneAndUpdate(
      { class: teacherClass, date },
      {
        class: teacherClass,
        date,
        status: "HOLIDAY",
        holidayReason: reason,
        records,
        isLocked: true,
        lockedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      msg: "Holiday marked 🎉",
      attendance: att,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});


// =========================
// 📋 VIEW ATTENDANCE
// =========================
router.get("/view/:date", authMiddleware, async (req, res) => {
  try {
    const teacherClass = req.teacher?.className;
    const { date } = req.params;

    const data = await Attendance.findOne({
      class: teacherClass,
      date,
    });

    if (!data) {
      return res.json({ records: [] });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});





router.get("/student/list/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const attendanceDocs = await Attendance.find({
      "records.studentId": id
    }).sort({ date: -1 });

    // 🔥 extract only that student records
    const result = [];

    attendanceDocs.forEach(doc => {
      const rec = doc.records.find(
        r => r.studentId.toString() === id
      );

      if (rec) {
        result.push({
          date: doc.date,
          status: rec.status
        });
      }
    });

    res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;