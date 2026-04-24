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

export default router;