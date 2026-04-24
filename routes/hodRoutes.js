
import Marks from "../models/Marks.js"; // ✅ add this at top
import express from "express";
import Notification from "../models/Notification.js";
import multer from "multer";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";



const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });


// pdf header--------------------------
function addPDFHeader(doc, title, className) {
  // ================= LOGO =================
  doc.image("assets/logo.png", 250, 10, {
    fit: [80, 80],
    align: "center"
  });

  // 👉 IMPORTANT: space create karo logo ke baad
  doc.moveDown(6);

  // ================= TITLE =================
  doc
    .fontSize(18)
    .fillColor("#1565c0")
    .font("Helvetica-Bold")
    .text(title, { align: "center" });

  doc.moveDown(0.5);

  // ================= CLASS =================
  doc
    .fontSize(12)
    .fillColor("#424242")
    .text(`DEPARTMENT: ${className}`, {
      align: "center"
    });

  doc.moveDown(2);
}
// POST /api/hod/notification - HOD sends notification
router.post("/notification", upload.single("file"), async (req, res) => {
  try {
    const { message, className } = req.body;

    const file_path = req.file ? req.file.path : null;

    const notif = new Notification({
      sender_type: "HOD",
      message,
      className: className || "ALL", // 🔥 IMPORTANT CHANGE
      file_path
    });

    await notif.save();

    res.json({
      success: true,
      message: "Notification sent ✅",
      notif
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/hod/notifications - Students fetch notifications
router.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find({}).sort({ created_at: -1 });
    res.status(200).json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// ================= MARKS VIEW (HOD) =================


router.get("/marks", async (req, res) => {
  try {
    const { className, exam } = req.query;

    let query = {};
    if (className) query.classId = className;
    if (exam) query.examType = exam;

    const marksData = await Marks.find(query);

    // 🔥 join with student
    const finalData = await Promise.all(
      marksData.map(async (m) => {
        const student = await Student.findById(m.studentId);

        return {
          studentName: student ? student.name : "Unknown",
          marks: m.marksObtained,
          suggestion: m.suggestion
        };
      })
    );

    res.json(finalData);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GET ATTENDANCE =================
router.get("/attendance", async (req, res) => {
  try {
    const { className, date } = req.query;

    if (!className || !date) {
      return res.status(400).json({ message: "Class and Date required" });
    }

    const data = await Attendance.findOne({
      class: className,
      date
    });

    if (!data) {
      return res.json({
        class: className,
        date,
        records: []
      });
    }

    // 🔥 SORT ALWAYS (IMPORTANT)
    data.records.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================== get update ==========================
router.post("/attendance/bulk-update", async (req, res) => {
  try {
    const { className, date, records } = req.body;

    const attendance = await Attendance.findOne({ class: className, date });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    // 🔥 update safely by studentId
    attendance.records = attendance.records.map(oldRec => {
      const updated = records.find(r => r.studentId === String(oldRec.studentId));

      if (updated) {
        return {
          ...oldRec.toObject(),
          status: updated.status
        };
      }

      return oldRec;
    });

    await attendance.save();

    const fresh = await Attendance.findOne({ class: className, date });

    res.json({
      message: "Updated successfully",
      attendance: fresh
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/attendance/summary", async (req, res) => {
  try {
    const { className, date } = req.query;

    const data = await Attendance.findOne({ class: className, date });

    if (!data) {
      return res.json({
        total: 0,
        present: 0,
        absent: 0
      });
    }

    const present = data.records.filter(r => r.status === "P").length;
    const absent = data.records.filter(r => r.status === "A").length;
    const holiday = data.records.filter(r => r.status === "H").length;

    res.json({
      total: data.records.length,
      present,
      absent,
      holiday
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= DOWNLOAD STUDENTS PDF =================
router.get("/download/students/pdf", async (req, res) => {
  try {
    const { className } = req.query;

    let filter = {};
    if (className) filter.className = className;

    const studentsRaw = await Student.find(filter);

// 🔥 PROPER ALPHABETICAL SORT (CASE INSENSITIVE)
const students = studentsRaw.sort((a, b) =>
  (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase())
);

    const doc = new PDFDocument({ margin: 30 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=students-report.pdf");

    doc.pipe(res);

    // ================= TITLE =================
   addPDFHeader(doc, "STUDENTS REPORT", className);

    // ================= TABLE SETTINGS =================
    const startX = 50;
    const startY = doc.y;
    const rowHeight = 22;

    const col = {
      sr: 50,
      name: 90,
      father: 220,
      mobile: 360,
      dob: 450
    };

    const tableWidth = 500;

    // ================= HEADER ROW =================
    doc
      .rect(startX, startY, tableWidth, rowHeight)
      .fill("#1976d2");

    doc.fillColor("white").fontSize(11).font("Helvetica-Bold");

    doc.text("ROLL", col.sr, startY + 6);
    doc.text("NAME", col.name, startY + 6);
    doc.text("FATHER NAME", col.father, startY + 6);
    doc.text("MOBILE", col.mobile, startY + 6);
    doc.text("DOB", col.dob, startY + 6);

    // reset color
    doc.fillColor("black");

    let y = startY + rowHeight;

    // ================= DATA ROWS =================
    students.forEach((s, i) => {
      // alternate row bg
      if (i % 2 === 0) {
        doc.rect(startX, y, tableWidth, rowHeight).fill("#f5f5f5");
      }

      doc.fillColor("black").fontSize(10).font("Helvetica");

      doc.text(`${i + 1}`, col.sr, y + 6);
      doc.text(s.name || "-", col.name, y + 6);
      doc.text(s.fatherName || "-", col.father, y + 6);
      doc.text(s.mobile || "-", col.mobile, y + 6);
      doc.text(s.dob || "-", col.dob, y + 6);

      y += rowHeight;

      // page break handling
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    // ================= FOOTER =================
    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Total Students: ${students.length}`, 50, y + 20);

    doc.end();

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= DOWNLOAD ATTENDANCE PDF =================
router.get("/download/attendance/pdf", async (req, res) => {
  try {
    const { className, date } = req.query;

    if (!className || !date) {
      return res.status(400).json({ message: "className & date required" });
    }

    const record = await Attendance.findOne({ class: className, date });

    const doc = new PDFDocument({ margin: 30 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance-report.pdf"
    );

    doc.pipe(res);


    addPDFHeader(doc, "ATTENDANCE REPORT", className);
    // ================= HEADER =================
    doc
      .fontSize(20)
      .fillColor("#1565c0")
      .font("Helvetica-Bold")
      .text("ATTENDANCE REPORT", { align: "center" });

    doc.moveDown(1);

    doc
      .fontSize(12)
      .fillColor("#424242")
      .text(`Class: ${className}`, { align: "left" });

    doc.text(`Date: ${date}`, { align: "left" });

    doc.moveDown(2);

    // ================= TABLE SETTINGS =================
    const startX = 50;
    let y = doc.y;
    const rowHeight = 22;
    const tableWidth = 500;

    const col = {
      sr: 50,
      name: 100,
      status: 350
    };

    // ================= HEADER ROW =================
    doc.rect(startX, y, tableWidth, rowHeight).fill("#1976d2");

    doc.fillColor("white").fontSize(11).font("Helvetica-Bold");

    doc.text("SR", col.sr, y + 6);
    doc.text("NAME", col.name, y + 6);
    doc.text("STATUS", col.status, y + 6);

    doc.fillColor("black");

    y += rowHeight;

    // ================= DATA =================
    if (!record || !record.records?.length) {
      doc
        .fontSize(12)
        .fillColor("red")
        .text("No Attendance Data Found", 50, y + 20);
    } else {
      record.records.forEach((r, i) => {
        // alternate row bg
        if (i % 2 === 0) {
          doc.rect(startX, y, tableWidth, rowHeight).fill("#f5f5f5");
        }

        doc.fillColor("black").fontSize(10).font("Helvetica");

        doc.text(`${i + 1}`, col.sr, y + 6);
        doc.text(r.name || "-", col.name, y + 6);
        doc.text(r.status || "-", col.status, y + 6);

        y += rowHeight;

        // page break
        if (y > 750) {
          doc.addPage();
          y = 50;
        }
      });
    }

    // ================= FOOTER =================
    doc
      .fontSize(10)
      .fillColor("gray")
      .text(
        `Generated: ${new Date().toLocaleString()}`,
        50,
        780,
        { align: "right" }
      );

    doc.end();

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});
// =============================== Download Marks PDF =============================
router.get("/download/marks/pdf", async (req, res) => {
  try {
    const { className, exam } = req.query;

    if (!className || !exam) {
      return res.status(400).json({ message: "className & exam required" });
    }

    const marksData = await Marks.find({
      classId: className,
      examType: exam
    });

    const doc = new PDFDocument({ margin: 30 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=marks-report.pdf"
    );

    doc.pipe(res);

    // 🔥 HEADER FIX
    addPDFHeader(doc, "MARKS REPORT", className);

    doc
      .fontSize(20)
      .fillColor("#1565c0")
      .font("Helvetica-Bold")
      .text("MARKS REPORT", { align: "center" });

    doc.moveDown();

    doc
      .fontSize(12)
      .fillColor("#333")
      .text(`Class: ${className}`)
      .text(`Exam: ${exam}`);

    doc.moveDown();

    // ================= TOTAL =================
    doc
      .fillColor("#2e7d32")
      .text(`Total Students: ${marksData.length}`);

    doc.moveDown(2);

    // ================= TABLE =================
    const startX = 50;
    let y = doc.y;
    const rowHeight = 25;

    const col = {
      sr: 50,
      name: 90,
      marks: 300,
      suggestion: 400
    };

    // HEADER ROW
    doc.rect(startX, y, 500, rowHeight).fill("#1976d2");

    doc.fillColor("white").font("Helvetica-Bold");

    doc.text("SR", col.sr, y + 7);
    doc.text("NAME", col.name, y + 7);
    doc.text("MARKS", col.marks, y + 7);
    doc.text("SUGGESTION", col.suggestion, y + 7);

    y += rowHeight;

    // ================= DATA =================
    if (!marksData.length) {
      doc.fillColor("red").text("No Data Found", 50, y + 20);
    } else {

      for (let i = 0; i < marksData.length; i++) {
        const m = marksData[i];

        // 🔥 PAGE BREAK + HEADER
        if (y > 750) {
          doc.addPage();
          addPDFHeader(doc, "MARKS REPORT", className);
          y = doc.y;
        }

        // 🔥 STUDENT NAME JOIN
        const student = await Student.findById(m.studentId);
        const studentName = student ? student.name : "Unknown Student";

        const marks = m.marksObtained ?? 0;

        // COLOR LOGIC
        let color = "#000";
        if (m.suggestion?.toLowerCase().includes("good")) color = "green";
        else if (m.suggestion?.toLowerCase().includes("poor")) color = "red";
        else color = "orange";

        // ALT ROW BG
        if (i % 2 === 0) {
          doc.rect(startX, y, 500, rowHeight).fill("#f5f5f5");
        }

        doc.fillColor("#000").font("Helvetica");

        doc.text(i + 1, col.sr, y + 7);
        doc.text(studentName, col.name, y + 7);
        doc.text(marks, col.marks, y + 7);

        doc.fillColor(color);
        doc.text(m.suggestion || "-", col.suggestion, y + 7);

        y += rowHeight;
      }
    }

    // ================= FOOTER =================
    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Generated: ${new Date().toLocaleString()}`, 50, 780);

    doc.end();

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= DOWNLOAD MARKS EXCEL =================
router.get("/download/marks/excel", async (req, res) => {
  try {
    const { className, exam } = req.query;

    if (!className || !exam) {
      return res.status(400).json({ message: "className & exam required" });
    }

    const marksData = await Marks.find({
      classId: className,
      examType: exam
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Marks Report");

    // ================= HEADER ROW =================
    sheet.columns = [
      { header: "SR", key: "sr", width: 6 },
      { header: "Student Name", key: "name", width: 25 },
      { header: "Marks Obtained", key: "marks", width: 18 },
      { header: "Suggestion", key: "suggestion", width: 25 }
    ];

    // ================= TOP INFO =================
    sheet.addRow([]);
    sheet.addRow(["CLASS:", className]);
    sheet.addRow(["EXAM:", exam]);
    sheet.addRow(["TOTAL STUDENTS:", marksData.length]);
    sheet.addRow(["--------------------------------------"]);

    // ================= DATA =================
    for (let i = 0; i < marksData.length; i++) {
      const m = marksData[i];

      // 🔥 STUDENT NAME JOIN
      const student = await Student.findById(m.studentId);
      const studentName = student ? student.name : "Unknown";

      sheet.addRow({
        sr: i + 1,
        name: studentName,
        marks: m.marksObtained || 0,
        suggestion: m.suggestion || "-"
      });
    }

    // ================= STYLE =================
    sheet.getRow(6).font = { bold: true }; // header row bold

    // ================= RESPONSE =================
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=marks-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/notifications/student/:className", async (req, res) => {
  try {
    const { className } = req.params;

    const notifications = await Notification.find({
      $or: [
        { className: className },   // specific class
        { className: "ALL" }        // global
      ]
    }).sort({ created_at: -1 });

    res.json(notifications);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ created_at: -1 });

    res.json(notifications);

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/notifications/public", async (req, res) => {
  try {
    const count = await Notification.countDocuments();

    const latest = await Notification.findOne()
      .sort({ created_at: -1 });

    res.json({
      count,
      latest: latest ? latest.message : null
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/dashboard/attendance-summary", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) return res.json({});

    const records = await Attendance.find({ date });

    const summary = {};

    records.forEach(r => {
      const cls = r.className || r.class; // dono check

      if (!summary[cls]) {
        summary[cls] = { present: 0, total: 0 };
      }

      // 🔥 actual students loop
      r.records.forEach(stu => {
        summary[cls].total++;

        if (stu.status === "P") {
          summary[cls].present++;
        }
      });
    });

    res.json(summary);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;