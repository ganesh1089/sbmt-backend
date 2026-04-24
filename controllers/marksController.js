import Marks from "../models/Marks.js";
import Student from "../models/Student.js";

/* =========================
   💾 SAVE MARKS
========================= */
export const saveMarks = async (req, res) => {
  try {
    const { classId, examType, subject, totalMarks, marks } = req.body;

    if (!classId || !examType || !subject || !Array.isArray(marks)) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const bulkOps = marks.map((item) => ({
      updateOne: {
        filter: {
          studentId: item.studentId,
          classId,
          examType,
          subject,
        },
        update: {
          $set: {
            studentId: item.studentId,
            classId,
            examType,
            subject,
            totalMarks,
            marksObtained: Number(item.marksObtained) || 0,
            suggestion: item.suggestion || "",
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await Marks.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "Marks saved successfully ✅",
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   👁 VIEW MARKS (FIXED NAME)
========================= */
export const getViewMarks = async (req, res) => {
  try {
    const { className, examType } = req.params;

    const marks = await Marks.find({ classId: className, examType })
      .populate("studentId", "name rollNo");

    res.json(marks);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};



/* HOD VIEW MARKS */
export const getMarksByExam = async (req, res) => {
  try {
    const { className, examType } = req.params;

    const marks = await Marks.find({ classId: className, examType });

    const students = await Student.find({ className }); 

    const result = students.map((s) => {
      const studentMarks = marks.filter(m => m.studentId == s._id);

      return {
        studentId: s._id,
        name: s.name,
        rollNo: s.rollNo,
        marks: studentMarks
      };
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   🎓 STUDENT MARKS (NEW)
========================= */
export const getStudentMarks = async (req, res) => {
  try {
    const studentId = req.params.id;

    const marks = await Marks.find({ studentId });

    const result = marks.map(m => ({
      subject: m.subject,
      examType: m.examType,

      // ✅ obtained
      marks: m.marksObtained,

      // ✅ total
      totalMarks: m.totalMarks,

      // ✅ teacher suggestion
      suggestion: m.suggestion
    }));

    res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};