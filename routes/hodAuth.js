import express from "express";
const router = express.Router();

// 🔐 Dummy HOD user
const hodUser = {
  id: 1,
  name: "Yukti Gupta",
  username: "yuktigupta687",   // username
  email: "hod@example.com",    // email
  password: "Yuktigupta@687",  // current password
  role: "hod",
  firstLogin: false             // firstLogin flag
};

// POST /api/hod/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // ✅ Accept either email or username
  if ((email === hodUser.email || email === hodUser.username) && password === hodUser.password) {
    return res.json({
  message: "Login success",
  user: {
    userId: hodUser.id,
    email: hodUser.email,
    role: hodUser.role
  }
});
  }

  return res.status(400).json({ message: "Invalid credentials" });
});

// POST /api/hod/change-password
router.post("/change-password", (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // validation
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "All fields required" });
  }

  // check old password
  if (oldPassword !== hodUser.password) {
    return res.status(400).json({ message: "Old password incorrect ❌" });
  }

  // update password
  hodUser.password = newPassword;
  hodUser.firstLogin = false;

  return res.json({
    message: "Password updated successfully ✅"
  });
});

export default router;