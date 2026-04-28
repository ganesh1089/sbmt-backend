import express from "express";
import authMiddleware from "../middleware/auth.js";
import Student from "../models/Student.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/* ================= ADD STUDENT ================= */
// ================= ADD STUDENT (FIXED) =================
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

      // 🔥 CLEAN MOBILE (IMPORTANT FIX)
      const cleanMobile = String(mobile).trim();

      // ❌ REMOVE strict findOne (causing fake conflicts sometimes)
      const mobileExists = await Student.exists({
        mobile: cleanMobile,
        className: teacherClass,
      });

      if (mobileExists) {
        return res.status(409).json({
          msg: "Mobile already exists in this class ❌",
        });
      }

      // rollNo safe
      const lastStudent = await Student.findOne({ className: teacherClass })
        .sort({ rollNo: -1 })
        .lean();

      const rollNo = (lastStudent?.rollNo || 0) + 1;

      const year = new Date().getFullYear();
      const count = await Student.countDocuments({ className: teacherClass });

      const admissionNo = `SBMT-${year}-${String(count + 1).padStart(3, "0")}`;

      const qrToken =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

      const photo = req.file ? req.file.filename : "";

      const capName =
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

      const password = `${capName}@${new Date(dob).getFullYear()}`;

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
        username: cleanMobile,
        password,
        addedBy: req.teacher._id,
      });

      return res.json({
        message: "Student added successfully ✅",
        student: newStudent,
      });

    } catch (err) {
      console.error("ADD STUDENT ERROR:", err);

      // 🔥 SAFE DUPLICATE HANDLING
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0];

        return res.status(409).json({
          msg: `${field} already exists ❌ (duplicate detected)`,
        });
      }

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

/* ================= STUDENT LOGIN ================= */
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
      qrToken: student.qrToken
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});
export default router;