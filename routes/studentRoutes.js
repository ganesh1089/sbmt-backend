import express from "express";
import authMiddleware from "../middleware/auth.js";
import Student from "../models/Student.js";
import upload from "../middleware/upload.js";
import TeacherRole from "../models/TeacherRole.js";

const router = express.Router();

/* ================= ADD STUDENT (FINAL FIXED) ================= */
router.post(
  "/add",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {

      // ================= ROLE CHECK =================
  const teacherId = req.teacher?.teacherId;

if (!teacherId) {
  return res.status(401).json({ msg: "Invalid token data" });
}

const roleData = await TeacherRole.findOne({
  teacherId,
  role: "class_teacher"
});

console.log("REQ TEACHER:", req.teacher);
console.log("ROLE DATA:", roleData);

if (!roleData) {
  console.log("ROLE NOT FOUND FOR TEACHER:", teacherId);

  return res.status(403).json({
    msg: "Teacher role not assigned as class teacher"
  });
}

const teacherClass = roleData.classId;

      // ================= VALIDATION =================
      const { name, fatherName, mobile, gender, dob, address } = req.body;

      if (!name || !fatherName || !mobile || !dob) {
        return res.status(400).json({ msg: "Required fields missing" });
      }

      const cleanMobile = String(mobile).trim();

      // ================= GENDER FIX =================
      const fixedGender = (gender || "").trim().toLowerCase() === "male"
        ? "Male"
        : (gender || "").trim().toLowerCase() === "female"
        ? "Female"
        : gender;

      // ================= ROLL NO =================
      const lastStudent = await Student.findOne({ className: teacherClass })
        .sort({ rollNo: -1 })
        .lean();

      const rollNo = (lastStudent?.rollNo || 0) + 1;

     // ================= ADMISSION YEAR =================
let admissionYear = new Date().getFullYear();

if (teacherClass.includes("2nd-Year")) {
  admissionYear -= 1;
} else if (teacherClass.includes("3rd-Year")) {
  admissionYear -= 2;
}

// ================= LAST STUDENT =================
const lastStudent = await Student.findOne()
  .sort({ createdAt: -1 })
  .lean();

let nextNumber = 1;

if (lastStudent?.admissionNo) {
  const lastNum = parseInt(lastStudent.admissionNo.split("-")[2]);
  nextNumber = lastNum + 1;
}

// ================= FINAL ADMISSION NO =================
const admissionNo = `SBMT-${admissionYear}-${String(nextNumber).padStart(3, "0")}`;

      // ================= QR TOKEN =================
      const qrToken =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

      const photo = req.file ? req.file.filename : "";

      // ================= USERNAME =================
      const firstName = name.split(" ")[0].toLowerCase();
      const last2Digits = cleanMobile.slice(-2);

      const username = `${firstName}${year}${last2Digits}`;

      // ================= PASSWORD =================
      const capName =
        firstName.charAt(0).toUpperCase() + firstName.slice(1);

      const dobYear = new Date(dob).getFullYear();

      const password = `${capName}@${dobYear}`;

      // ================= CREATE STUDENT =================
      const newStudent = await Student.create({
        name,
        fatherName,
        mobile: cleanMobile,
        gender: fixedGender,
        dob,
        address,
        photo,
        className: teacherClass,
        rollNo,
        admissionNo,
        qrToken,
        username,
        password,
        addedBy: req.teacher.teacherId,
      });

      return res.json({
        message: "Student added successfully ✅",
        student: newStudent,
        credentials: { username, password },
      });

    } catch (err) {
  console.error("ADD STUDENT ERROR FULL:", err);

  return res.status(500).json({
    msg: "Server error",
    error: err.message,
    stack: err.stack
  });
}
  }
);

/* ================= GET STUDENTS ================= */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const roleData = await TeacherRole.findOne({
      teacherId: req.teacher.teacherId
    });

    const isHod = req.teacher?.role === "hod";

    const filter = isHod
      ? {}
      : { className: roleData?.classId };

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

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    let { username, password } = req.body;

    username = username.trim().toLowerCase();
    password = password.trim();

    const student = await Student.findOne({ username });

    if (!student) {
      return res.status(400).json({ message: "Student not found" });
    }

    if (student.password !== password) {
      return res.status(400).json({ message: "Invalid password" });
    }

    return res.json({
      message: "Login success",
      student: {
        id: student._id,
        name: student.name,
        className: student.className,
        rollNo: student.rollNo,
        admissionNo: student.admissionNo,
        photo: student.photo,
        qrToken: student.qrToken,
      },
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ================= ID CARD ================= */
router.get("/id-card/:id", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    return res.json(student);

  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
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
    return res.status(500).json({ msg: "Server error" });
  }
});

export default router;