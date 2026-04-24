import express from "express";
const router = express.Router();

// Dummy dashboard route
router.get("/teacher", (req,res) => {
    res.json({
        totalStudents: 30,
        classesToday: 3,
        pendingTasks: 2,
        notifications: 5,
        attendanceData: [
            { name: "Rohit", attendance: 90 },
            { name: "Priya", attendance: 85 },
            { name: "Aman", attendance: 80 }
        ],
        recentActivity: [
            { student: "Rohit", action: "Marked Attendance", date: "08-04-2026" },
            { student: "Priya", action: "Submitted Assignment", date: "08-04-2026" }
        ]
    });
});

export default router; // ✅ ye missing tha