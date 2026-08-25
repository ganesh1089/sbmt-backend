import express from "express";
import authMiddleware from "../middleware/auth.js";
import Student from "../models/Student.js";
import upload from "../middleware/upload.js";
import TeacherRole from "../models/TeacherRole.js";

const router = express.Router();

/* =========================================================
   ADD STUDENT
========================================================= */

router.post(
  "/add",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      // ================= ROLE CHECK =================

      const teacherId = req.teacher?.teacherId;

      if (!teacherId) {
        return res.status(401).json({
          msg: "Invalid token data",
        });
      }

      const roleData = await TeacherRole.findOne({
        teacherId,
        role: "class_teacher",
      });

      if (!roleData) {
        return res.status(403).json({
          msg: "Teacher role not assigned as class teacher",
        });
      }

      const teacherClass = roleData.classId;

      // ================= VALIDATION =================

      const { name, fatherName, mobile, gender } = req.body;

      if (!name || !fatherName || !mobile || !gender) {
        return res.status(400).json({
          msg: "Required fields missing",
        });
      }

      const cleanMobile = String(mobile).trim();

      // ================= GENDER FIX =================

      const fixedGender =
        gender?.toLowerCase() === "male"
          ? "Male"
          : gender?.toLowerCase() === "female"
          ? "Female"
          : gender;

      // ================= ROLL NO =================

      const lastStudentInClass = await Student.findOne({
        className: teacherClass,
      })
        .sort({ rollNo: -1 })
        .lean();

      const rollNo = (lastStudentInClass?.rollNo || 0) + 1;

      // ================= ADMISSION YEAR =================

      let admissionYear = new Date().getFullYear();

      if (teacherClass.includes("2nd-Year")) {
        admissionYear -= 1;
      } else if (teacherClass.includes("3rd-Year")) {
        admissionYear -= 2;
      }

      // ================= GLOBAL LAST STUDENT =================

      const lastStudentGlobal = await Student.findOne()
        .sort({ createdAt: -1 })
        .lean();

      let nextNumber = 1;

      if (lastStudentGlobal?.admissionNo) {
        const parts = lastStudentGlobal.admissionNo.split("-");
        const lastNum = parseInt(parts[2]);

        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }

      const admissionNo = `SBMT-${admissionYear}-${String(
        nextNumber
      ).padStart(3, "0")}`;

      // ================= QR TOKEN =================

      const qrToken =
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 8);

      // ================= PHOTO =================

      const photo = req.file ? req.file.filename : "";

      // ================= USERNAME =================

      const usernameFirstName = name
        .trim()
        .split(/\s+/)[0]
        .toLowerCase();

      const username = `${usernameFirstName}${admissionYear}${cleanMobile.slice(-2)}`;

      // ================= PASSWORD =================

      const passwordNameParts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      const titles = ["mr", "mrs", "ms", "miss", "master"];

      const cleanPasswordNameParts = passwordNameParts.filter(
        (part) => !titles.includes(part.replace(".", "").toLowerCase())
      );

      const passwordFirstName =
        cleanPasswordNameParts[0].charAt(0).toUpperCase() +
        cleanPasswordNameParts[0].slice(1).toLowerCase();

      let password;

      if (cleanPasswordNameParts.length >= 2) {
        const surname = cleanPasswordNameParts
          .slice(1)
          .join("")
          .toLowerCase();

        password = `${passwordFirstName}@${surname}`;
      } else {
        password = `${passwordFirstName}@sbmt`;
      }

      // ================= CREATE STUDENT =================

      const newStudent = await Student.create({
        name,
        fatherName,
        mobile: cleanMobile,
        gender: fixedGender,
        className: teacherClass,
        rollNo,
        admissionNo,
        qrToken,
        username,
        password,
        photo,
        addedBy: teacherId,
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
      console.error("ADD STUDENT ERROR FULL:", err);

      return res.status(500).json({
        msg: "Server error",
        error: err.message,
      });
    }
  }
);

/* =========================================================
   GET STUDENTS
========================================================= */

router.get("/", authMiddleware, async (req, res) => {
  try {
    const isHod = req.teacher?.role === "hod";

    let filter = {};

    if (!isHod) {
      const roleData = await TeacherRole.findOne({
        teacherId: req.teacher.teacherId,
        role: "class_teacher",
      });

      if (!roleData) {
        return res.status(403).json({
          msg: "No class assigned",
        });
      }

      filter = {
        className: roleData.classId,
      };
    }

    const students = await Student.find(filter).sort({
      name: 1,
    });

    return res.json(
      students.map((s, i) => ({
        sr: i + 1,
        _id: s._id,
        name: s.name,
        fatherName: s.fatherName,
        mobile: s.mobile,
        gender: s.gender,
        className: s.className,
        rollNo: s.rollNo,
        admissionNo: s.admissionNo,
        photo: s.photo,
        qrToken: s.qrToken,
        username: s.username,
      }))
    );
  } catch (err) {
    console.error("GET STUDENTS ERROR:", err);

    return res.status(500).json({
      msg: "Server error",
    });
  }
});

/* =========================================================
   STUDENT LOGIN
========================================================= */

router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    let { username, password } = req.body;

    username = username.trim().toLowerCase();
    password = password.trim();

    console.log("USERNAME:", username);
    console.log("PASSWORD:", password);

    const student = await Student.findOne({ username });

    console.log("FOUND STUDENT:", student);

    if (!student) {
      return res.status(400).json({
        message: "Student not found",
      });
    }

    if (student.password !== password) {
      return res.status(400).json({
        message: "Invalid password",
      });
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

    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

/* =========================================================
   ID CARD
========================================================= */

router.get("/id-card/:id", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        msg: "Student not found",
      });
    }

    return res.json(student);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      msg: "Server error",
    });
  }
});

/* =========================================================
   GET STUDENT BY ID
========================================================= */

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        msg: "Student not found",
      });
    }

    res.json(student);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      msg: "Server error",
    });
  }
});

/* =========================================================
   UPDATE STUDENT
========================================================= */

router.put(
  "/:id",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({
          msg: "Student not found",
        });
      }

      const {
        name,
        fatherName,
        mobile,
        gender,
        dob,
        address,
      } = req.body;

      if (!name || !fatherName || !mobile || !dob) {
        return res.status(400).json({
          msg: "All required fields required",
        });
      }

      if (!/^[A-Za-z ]+$/.test(name)) {
        return res.status(400).json({
          msg: "Name only letters allowed",
        });
      }

      if (!/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json({
          msg: "Mobile must be 10 digits",
        });
      }

      student.name = name;
      student.fatherName = fatherName;
      student.mobile = mobile;
      student.gender = gender;
      student.dob = dob;
      student.address = address;

      if (req.file) {
        student.photo = req.file.filename;
      }

      await student.save();

      res.json({
        msg: "Student updated successfully ✅",
      });
    } catch (err) {
      console.log("UPDATE ERROR:", err);

      res.status(500).json({
        msg: "Server error",
      });
    }
  }
);

/* =========================================================
   DELETE STUDENT
========================================================= */

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        msg: "Student not found",
      });
    }

    await Student.findByIdAndDelete(req.params.id);

    res.json({
      msg: "Student deleted successfully ✅",
    });
  } catch (err) {
    console.log("DELETE ERROR:", err);

    res.status(500).json({
      msg: "Server error",
    });
  }
});

export default router;