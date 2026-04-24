import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  sender_type: { type: String, default: "HOD" },

  // ❌ remove class_id
  className: { type: String, default: "ALL" }, // ✅ ADD THIS

  message: { type: String, required: true },
  file_path: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model("Notification", notificationSchema);