import Student from "../models/Student.js";

/* ================== ADD STUDENT ================== */
export const addStudent = async (req, res) => {
  try {
    const { name, fatherName, mobile, className, gender, dob, rollNo } = req.body;

    // 🔥 password generator
    const generatePassword = (name, dob) => {
      const firstName = name?.trim().split(" ")[0] || "User";

      const formattedName =
        firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

      const year = dob ? new Date(dob).getFullYear() : "0000";

      return `${formattedName}@${year}`;
    };

    const username = mobile; // 🔥 login id
    const password = generatePassword(name, dob);

    const student = new Student({
      name,
      fatherName,
      mobile,
      className,
      gender,
      dob,
      rollNo,
      username,
      password,
      addedBy: req.teacher?._id
    });

    await student.save();

    res.json({
      message: "Student added successfully",
      student,
      login: {
        username,
        password
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================== GET STUDENTS ================== */
export const getStudents = async (req, res) => {
  try {
    const className = req.user?.className;

    const students = await Student.find({ className }).sort({ rollNo: 1 });

    res.json(students);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};