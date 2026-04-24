import PDFDocument from "pdfkit";
import path from "path";
import Student from "../models/Student.js";
import Marks from "../models/Marks.js";

// ================= CLASS PDF =================
export const downloadClass = async (req, res) => {
  try {
    const className = req.teacher.className;

    // 🔥 FETCH STUDENTS
    const students = await Student.find({ className });

    // 🔥 ALPHABETICAL SORT (A → Z)
    students.sort((a, b) =>
      (a.name || "").trim().toLowerCase()
        .localeCompare((b.name || "").trim().toLowerCase())
    );

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=class-report.pdf"
    );

    doc.pipe(res);
     const logoPath = path.resolve("assets/logo.png"); 
     try { doc.image(logoPath, 40, 30, { width: 50 }); } 
     catch (e) {}
    // HEADER
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#1f4e79")
      .text("STUDENT CLASS REPORT", { align: "center", underline: true });

    doc.moveDown(2);

    doc
      .fontSize(12)
      .fillColor("#000")
      .text(`Class: ${className}`, { align: "center" });

    doc.text(`Total Students: ${students.length}`, { align: "center" });

    doc.moveDown(2);

    // TABLE HEADER
    const startY = doc.y;

    doc.font("Helvetica-Bold").fontSize(11);

    doc.text("Roll", 40, startY);
    doc.text("Name", 70, startY, { width: 130 });
    doc.text("DOB", 200, startY, { width: 100 });
    doc.text("Father", 300, startY, { width: 120 });
    doc.text("Mobile", 420, startY, { width: 120 });

    doc.moveTo(40, startY + 15).lineTo(550, startY + 15).stroke();

    doc.moveDown();

    // DATA ROWS
    doc.font("Helvetica").fontSize(10);

    students.forEach((s, i) => {
      const y = doc.y + 10;

      doc.text(i + 1, 40, y);
      doc.text(s.name, 70, y, { width: 130 });
      doc.text(
        s.dob ? new Date(s.dob).toLocaleDateString() : "-",
        200,
        y
      );
      doc.text(s.fatherName, 300, y, { width: 120 });
      doc.text(s.mobile || "-", 420, y, { width: 120 });

      doc.moveTo(40, y + 15).lineTo(550, y + 15).strokeColor("#eee").stroke();

      doc.y = y + 20;
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ================= SINGLE STUDENT REPORT CARD =================
export const downloadStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    const marks = await Marks.find({ studentId: student._id });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=student-report.pdf"
    );

    doc.pipe(res);

    const logoPath = path.resolve("assets/logo.png");

    /* ================= LOGO (CENTER TOP) ================= */
    try {
      doc.image(logoPath, doc.page.width / 2 - 30, 20, { width: 60 });
    } catch (e) {}

    doc.moveDown(4);

    /* ================= TITLE ================= */
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#1f4e79")
      .text("STUDENT REPORT CARD", { align: "center", underline: true });

    doc.moveDown(2);

    /* ================= STUDENT DETAILS (LEFT SIDE) ================= */
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#000");

    doc.text(`Name        : ${student.name}`);
    doc.text(`Father Name : ${student.fatherName}`);
    doc.text(`Class       : ${student.className}`);
    doc.text(
      `DOB         : ${
        student.dob ? new Date(student.dob).toLocaleDateString() : "-"
      }`
    );

    doc.moveDown(2);

    /* ================= MARKS TITLE ================= */
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#000")
      .text("MARKS REPORT", { underline: true });

    doc.moveDown(1);

    /* ================= TABLE HEADER ================= */
    const tableY = doc.y;

    doc.font("Helvetica-Bold").fontSize(10);

    doc.text("No", 40, tableY);
    doc.text("Subject", 80, tableY, { width: 120 });
    doc.text("Marks", 200, tableY);
    doc.text("Total", 260, tableY);
    doc.text("Suggestion", 320, tableY, { width: 140 });
    doc.text("%", 480, tableY);

    doc.moveTo(40, tableY + 15).lineTo(550, tableY + 15).stroke();

    doc.moveDown();

    /* ================= DATA ================= */
    doc.font("Helvetica").fontSize(10);

    if (!marks.length) {
      doc.text("No marks available", { align: "center" });
    } else {
      marks.forEach((m, i) => {
        const y = doc.y + 10;

        const percent = m.totalMarks
          ? Math.round((m.marksObtained / m.totalMarks) * 100)
          : 0;

        doc.text(i + 1, 40, y);
        doc.text(m.subject || "-", 80, y, { width: 120 });
        doc.text(m.marksObtained || 0, 200, y);
        doc.text(m.totalMarks || 0, 260, y);
        doc.text(m.suggestion || "-", 320, y, { width: 140 });

        doc.fillColor(percent >= 60 ? "green" : "red");
        doc.text(`${percent}%`, 480, y);

        doc.fillColor("#000");

        doc
          .moveTo(40, y + 15)
          .lineTo(550, y + 15)
          .strokeColor("#eee")
          .stroke();

        doc.y = y + 20;
      });
    }

    /* ================= FOOTER ================= */
    doc
      .fontSize(10)
      .fillColor("gray")
      .text("Generated by SBMT ERP System", { align: "center" });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};