import express from "express";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// Signup (for future users, not HOD)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      username: null,
      firstLogin: role === "hod" ? true : false, // HOD firstLogin flag
    });

    await user.save();

    res.json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔐 LOGIN API with First Login Check
router.post("/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Find user by username OR email
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    });

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // First login check
    if (user.firstLogin) {
      return res.json({
        firstLogin: true,
        userId: user._id,
        message: "First login, please set your username and new password"
      });
    }

    // Normal login
  const token = jwt.sign(
  {
    userId: user._id,
    role: user.role
  },
  "secretkey",
  { expiresIn: "365d" }
);

return res.json({
  message: "Login success",
  token,
  user: {
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  className: user.className || ""   // 🔥 ADD THIS
}
});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🛠 First Login API – set username + password
router.post("/first-login", async (req, res) => {
  try {
    const { userId, username, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    user.username = username;
    user.password = await bcrypt.hash(newPassword, 10);
    user.firstLogin = false;

    await user.save();
    res.json({ message: "Username & password set successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;