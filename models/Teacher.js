import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    mobile: {               // ✅ NEW FIELD
      type: String,
      default: ""
    },

    // ⚠️ Ye fields ab assignment ke time use hongi
    subject: {
      type: String,
      default: ""
    },

    className: {
      type: String,
      default: ""
    },

    // 🔐 LOGIN (auto generate hoga assign ke time)
    username: {
      type: String,
      default: null
    },

    password: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Teacher", teacherSchema);