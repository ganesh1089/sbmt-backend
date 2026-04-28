import express from "express";
import authMiddleware from "../middleware/auth.js";
import Student from "../models/Student.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/* ================= ADD STUDENT ================= */
router.post(
  "/add",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      const teacherClass = req.teacher?.className?.trim();

      if (!teacherClass) {
        return res.status(403).json({
          msg: "Teacher class not assigned or token invalid",
        });
      }

      const { name, fatherName, mobile, gender, dob, address } = req.body;

      if (!name || !fatherName || !mobile || !dob) {
        return res.status(400).json({
          msg: "Name, Father Name, Mobile, DOB required",
        });
      }

      // ================= MOBILE DUPLICATE CHECK =================
      const existing = await Student.findOne({ mobile });
      if (existing) {
        return res.status(409).json({
          msg: "This mobile number already exists ❌",
        });
      }

      // ================= SAFE ADMISSION NUMBER GENERATION =================
      const year = new Date().getFullYear();

      const lastStudent = await Student.findOne({ className: teacherClass })
        .sort({ createdAt: -1 })
        .lean();

      let nextNumber = 1;

      if (lastStudent?.admissionNo) {
        const match = lastStudent.admissionNo.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const admissionNo = `SBMT-0687-${year}-${String(nextNumber).padStart(3, "0")}`;

      // ================= QR TOKEN =================
      const qrToken =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

      // ================= PHOTO =================
      const photo = req.file ? req.file.filename : "";

      const username = mobile;

      const capName =
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

      const yearOfBirth = new Date(dob).getFullYear();
      const password = `${capName}@${yearOfBirth}`;

      const newStudent = new Student({
        name,
        fatherName,
        mobile,
        gender,
        dob,
        address,
        photo,
        className: teacherClass,
        rollNo: 1, // (optional: tu later fix kar sakta hai proper sequencing)
        admissionNo,
        qrToken,
        username,
        password,
        addedBy: req.teacher._id,
      });

      await newStudent.save();

      return res.json({
        message: "Student added successfully ✅",
        student: newStudent,
        username,
        password,
        admissionNo,
      });

    } catch (err) {
      console.error("ADD STUDENT ERROR:", err);

      // ================= SAFER ERROR HANDLING =================
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";

        return res.status(409).json({
          msg: `${field} already exists ❌`,
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