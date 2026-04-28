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

    // 🔥 UNIQUE IDENTIFIERS
    admissionNo: {
      type: String,
      unique: true,
      index: true,
    },

    qrToken: {
      type: String,
      unique: true,
      index: true,
    },

    // 📞 CONTACT
    mobile: {
      type: String,
      trim: true,
      index: true, // 🔥 better search + safety
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

// 🔥 UNIQUE CLASS + ROLL NO (IMPORTANT)
studentSchema.index({ className: 1, rollNo: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema);