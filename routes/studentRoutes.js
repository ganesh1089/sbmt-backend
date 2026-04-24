import express from "express";
import authMiddleware from "../middleware/auth.js";
import Student from "../models/Student.js";


const router = express.Router();
/* ================= ADD STUDENT ================= */
router.post("/add", authMiddleware, async (req, res) => {
  try {
    console.log("REQ TEACHER 👉", req.teacher);

    const teacherClass = req.teacher?.className?.trim();

    if (!teacherClass) {
      return res.status(403).json({
        msg: "Teacher class not assigned or token invalid"
      });
    }

    const { name, fatherName, mobile, gender, dob } = req.body;

    if (!name || !fatherName || !mobile || !dob) {
      return res.status(400).json({
        msg: "Name, Father Name, Mobile, DOB required"
      });
    }

    // roll no
    const lastStudent = await Student.findOne({
      className: teacherClass
    }).sort({ rollNo: -1 });

    const rollNo = lastStudent?.rollNo ? lastStudent.rollNo + 1 : 1;

    // ✅ LOGIN CREDENTIALS GENERATION
    const username = mobile; // mobile as username

    const capName =
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    const year = new Date(dob).getFullYear();
    const password = `${capName}@${year}`;

    // 🔥 SAVE STUDENT
    const newStudent = new Student({
      name,
      fatherName,
      mobile,
      gender,
      dob,
      className: teacherClass,
      rollNo,
      username,
      password,
      addedBy: req.teacher._id
    });

    await newStudent.save();

    return res.json({
      message: "Student added + login created ✅",
      username,
      password,
      student: newStudent
    });

  } catch (err) {
    console.error("ADD STUDENT ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

/* ================= GET STUDENTS ================= */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const isHod = req.teacher?.role === "hod";

    const filter = isHod
      ? {}
      : { className: req.teacher?.className };

    const students = await Student.find(filter);

    students.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );

    return res.json(
      students.map((s, i) => ({
        sr: i + 1,
        _id: s._id,
        name: s.name,
        fatherName: s.fatherName,
        dob: s.dob,
        className: s.className,
        rollNo: s.rollNo
      }))
    );

  } catch (err) {
    console.error("GET STUDENTS ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});



/* =========================
   STUDENT LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const student = await Student.findOne({ username });

    if (!student) {
      return res.status(400).json({ message: "Student not found" });
    }

    if (student.password !== password) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 🔥 SR NO CALCULATE (IMPORTANT)
    const students = await Student.find({ className: student.className })
      .sort({ name: 1 });

    const index = students.findIndex(
      s => String(s._id) === String(student._id)
    );

    const srNo = index + 1;

    // ✅ FINAL RESPONSE
    return res.json({
      message: "Login success",
      student: {
        id: student._id,
        name: student.name,
        className: student.className,
        rollNo: srNo   // 🔥 yahi change hai
      }
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


export default router;