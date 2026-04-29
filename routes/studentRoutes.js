import express from "express";
import authMiddleware from "../middleware/auth.js";
import Student from "../models/Student.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/* ================= ADD STUDENT (FINAL FIX) ================= */
router.post(
  "/add",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      const teacherClass = req.teacher?.className?.trim();

      if (!teacherClass) {
        return res.status(403).json({ msg: "Teacher class not assigned" });
      }

      const { name, fatherName, mobile, gender, dob, address } = req.body;

      if (!name || !fatherName || !mobile || !dob) {
        return res.status(400).json({ msg: "Required fields missing" });
      }

      const cleanMobile = String(mobile).trim();

      // ================= ROLL NO =================
      const lastStudent = await Student.findOne({ className: teacherClass })
        .sort({ rollNo: -1 })
        .lean();

      const rollNo = (lastStudent?.rollNo || 0) + 1;

      // ================= ADMISSION NO =================
      const year = new Date().getFullYear();
      const count = await Student.countDocuments({ className: teacherClass });

      const admissionNo = `SBMT-${year}-${String(count + 1).padStart(3, "0")}`;

      // ================= QR TOKEN =================
      const qrToken =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

      const photo = req.file ? req.file.filename : "";

      // ================= NAME PROCESS =================
      const firstName = name.split(" ")[0].toLowerCase(); // ganesh
      const last2Digits = cleanMobile.slice(-2); // 89

      // ================= USERNAME =================
      const username = `${firstName}${year}${last2Digits}`;
      // example: ganesh202689

      // ================= PASSWORD =================
      const capName =
        firstName.charAt(0).toUpperCase() + firstName.slice(1);

      const dobYear = new Date(dob).getFullYear();

      const password = `${capName}@${dobYear}`;
      // example: Ganesh@2004

      // ================= CREATE STUDENT =================
      const newStudent = await Student.create({
        name,
        fatherName,
        mobile: cleanMobile,
        gender,
        dob,
        address,
        photo,
        className: teacherClass,
        rollNo,
        admissionNo,
        qrToken,
        username, // ✅ ADDED
        password,
        addedBy: req.teacher._id,
      });

      return res.json({
        message: "Student added successfully ✅",
        student: newStudent,
        credentials: {
          username,
          password,
        },
      });

    } catch (err) {
      console.error("ADD STUDENT ERROR:", err);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);
/* ================= GET STUDENTS ================= */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const isHod = req.teacher?.role === "hod";

    const filter = isHod ? {} : { className: req.teacher?.className };

    const students = await Student.find(filter).sort({ name: 1 });

    return res.json(
      students.map((s, i) => ({
        sr: i + 1,
        _id: s._id,
        name: s.name,
        fatherName: s.fatherName,
        dob: s.dob,
        className: s.className,
        rollNo: s.rollNo,
        admissionNo: s.admissionNo,
        photo: s.photo,
        qrToken: s.qrToken,
      }))
    );
  } catch (err) {
    console.error("GET STUDENTS ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

/* ================= LOGIN (FIXED) ================= */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ username = mobile now
    const student = await Student.findOne({ mobile: username });

    if (!student) {
      return res.status(400).json({ message: "Student not found" });
    }

    if (student.password !== password) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const students = await Student.find({
      className: student.className,
    }).sort({ name: 1 });

    const index = students.findIndex(
      (s) => String(s._id) === String(student._id)
    );

    return res.json({
      message: "Login success",
      student: {
        id: student._id,
        name: student.name,
        className: student.className,
        rollNo: index + 1,
        admissionNo: student.admissionNo,
        photo: student.photo,
        qrToken: student.qrToken,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* ================= ID CARD ROUTE (IMPORTANT ORDER FIX) ================= */
router.get("/id-card/:id", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    return res.json({
      _id: student._id,
      name: student.name,
      fatherName: student.fatherName,
      className: student.className,
      rollNo: student.rollNo,
      admissionNo: student.admissionNo,
      photo: student.photo,
      qrToken: student.qrToken,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* ================= GET BY ID ================= */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;