import express from "express";
import Teacher from "../models/Teacher.js";
import TeacherRole from "../models/TeacherRole.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/* =========================
   ADD TEACHER (UPDATED ✅)
========================= */
router.post("/add", async (req, res) => {
  try {
    let { name, email, mobile } = req.body;

    name = name?.trim();
    email = email?.trim();

    if (!name || !email) {
      return res.status(400).json({ message: "Name & Email required" });
    }

    const existing = await Teacher.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Teacher already exists" });
    }

    // 🔥 FIX: generate credentials at creation time
    const username = email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
    const password = name + "@123";

    const teacher = new Teacher({
      name,
      email,
      mobile: mobile || "",
      subject: "",
      className: "",
      username,
      password,   // ⚠️ now NOT null
    });

    await teacher.save();

    res.json({
      message: "Teacher added successfully",
      teacher
    });

  } catch (error) {
    console.log("ADD TEACHER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});
/* =========================
   GET ALL TEACHERS (UPDATED ✅)
========================= */
router.get("/all", async (req, res) => {
  try {
    const teachers = await Teacher.find({});
    const roles = await TeacherRole.find({});

    let result = [];

    // ✅ Assigned teachers
    roles.forEach(r => {
      const teacher = teachers.find(
        t => t._id.toString() === r.teacherId.toString()
      );

      if (teacher) {
        result.push({
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          mobile: teacher.mobile || "-",
          role: r.role === "class_teacher" ? "Class Teacher" : "Subject Teacher",
          className: r.classId || "-",
          subject: r.subjectId || "-"
        });
      }
    });

    // ✅ Unassigned teachers bhi add karo
    teachers.forEach(t => {
      const hasRole = roles.some(
        r => r.teacherId.toString() === t._id.toString()
      );

      if (!hasRole) {
        result.push({
          _id: t._id,
          name: t.name,
          email: t.email,
          mobile: t.mobile || "-",
          role: "Not Assigned",
          className: "-",
          subject: "-"
        });
      }
    });

    res.json(result);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ASSIGN TEACHER (NO CHANGE ✅)
========================= */
router.post("/assign", async (req, res) => {
  try {
    let { teacherId, className, subject, roleType } = req.body;

    if (!teacherId || !className) {
      return res.status(400).json({ message: "Missing data" });
    }

    className = className.trim();

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(400).json({ message: "Teacher not found" });
    }

    // ================= CLASS TEACHER =================
    if (roleType === "classTeacher") {

      // ❌ only one class teacher per class
      const existing = await TeacherRole.findOne({
        role: "class_teacher",
        classId: className
      });

      if (existing) {
        return res.status(400).json({
          message: "This class already has a Class Teacher"
        });
      }

      const username =
        teacher.name.replace(/\s/g, "").slice(0, 4).toLowerCase() +
        "_" +
        className.replace(/\s/g, "").toLowerCase();

      const password = teacher.name + "@687";

      await new TeacherRole({
        teacherId,
        role: "class_teacher",
        classId: className,
        subjectId: subject
      }).save();

      teacher.className = className;
      teacher.subject = subject || "";
      teacher.username = username;
      teacher.password = password;

      await teacher.save();

      return res.json({
        message: "Class Teacher Assigned",
        username,
        password
      });
    }

    // ================= SUBJECT TEACHER =================

    // 🔥 duplicate check (only for subject teacher)
    const alreadyAssigned = await TeacherRole.findOne({
      teacherId,
      classId: className,
      subjectId: subject,
      role: "subject_teacher"
    });

    if (alreadyAssigned) {
      return res.status(400).json({
        message: "Teacher already assigned to this subject in this class"
      });
    }

    await new TeacherRole({
      teacherId,
      role: "subject_teacher",
      classId: className,
      subjectId: subject
    }).save();

    teacher.className = className;
    teacher.subject = subject;

    await teacher.save();

    return res.json({
      message: "Subject Teacher Assigned"
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
});


/* =========================
   🔐 TEACHER LOGIN (NO CHANGE)
========================= */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const teacher = await Teacher.findOne({ username });

    if (!teacher || teacher.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const role = await TeacherRole.findOne({ teacherId: teacher._id });

    const token = jwt.sign(
      {
        teacherId: teacher._id,
        role: role?.role || "subject_teacher",
        className: teacher.className
      },
      "secretkey",
      { expiresIn: "365d" }
    );

    res.json({
      message: "Login success",
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        username: teacher.username,
        className: teacher.className,
        subject: teacher.subject,
        role: role?.role || "subject_teacher"
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});


/* =========================
   📚 CLASS - TEACHER MAPPING
========================= */
router.get("/class-teachers", async (req, res) => {
  try {
    const roles = await TeacherRole.find({});
    const teachers = await Teacher.find({});

    const grouped = {};

    for (let r of roles) {
      const teacher = teachers.find(
        t => t._id.toString() === r.teacherId.toString()
      );

      if (!teacher) continue;

      const className = r.classId || "Unknown";

      if (!grouped[className]) {
        grouped[className] = [];
      }

      grouped[className].push({
        subject: r.subjectId || "-",
        teacherName: teacher.name
      });
    }

    // 🔥 convert object → array (frontend ke liye)
    const result = Object.keys(grouped).map(cls => ({
      className: cls,
      teachers: grouped[cls]
    }));

    res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;