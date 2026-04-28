import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    // 👤 BASIC INFO
    name: {
      type: String,
      required: true,
      trim: true,
    },

    fatherName: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    dob: {
      type: Date,
      required: true,
    },

    // 🏫 ACADEMIC INFO
    className: {
      type: String,
      required: true,
      index: true,
    },

    rollNo: {
      type: Number,
      required: true,
    },

    // 🔥 UNIQUE IDENTIFIERS (SYSTEM CORE)
    admissionNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // 📞 CONTACT (NOT UNIQUE - ALLOWED MULTIPLE)
    mobile: {
      type: String,
      trim: true,
      index: true,
    },

    // 🔐 LOGIN SYSTEM
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      trim: true,
    },

    // 🖼️ PHOTO
    photo: {
      type: String,
    },

    // 🔐 SYSTEM INFO
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
  },
  {
    timestamps: true,
  }
);

/* 🔥 IMPORTANT RULE: CLASS + ROLL UNIQUE */
studentSchema.index({ className: 1, rollNo: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema);