// controllers/actionHandler.js
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Marks from "../models/Marks.js";
import Teacher from "../models/Teacher.js"; // Teacher model import
import bcrypt from "bcryptjs";

export const handleAction = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch(action) {

      // ---------------- Students ----------------
      case "add_student":
        const student = new Student(data);
        await student.save();
        return res.json({ message: "Student added", student });

      // ---------------- Attendance ----------------
      // case "mark_attendance":
      //   const attendance = new Attendance(data);
      //   await attendance.save();
      //   return res.json({ message: "Attendance marked", attendance });

      // ---------------- Marks ----------------
      case "add_marks":
        const marks = new Marks(data);
        await marks.save();
        return res.json({ message: "Marks added", marks });

      // ---------------- Teachers ----------------
      case "add_teacher":
        const { name, email, password, roles } = data;

        // Check if teacher already exists
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
          return res.status(400).json({ message: "Teacher already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new teacher
        const teacher = new Teacher({
          name,
          email,
          password: hashedPassword,
          roles
        });

        await teacher.save();
        return res.json({ message: "Teacher created successfully", teacher });

      // ---------------- Default ----------------
      default:
        return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};