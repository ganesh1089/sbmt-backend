import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    // 👤 BASIC INFO
    name: {
      type: String,
      required: true,
      trim: true
    },

    fatherName: {
      type: String,
      trim: true
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"]
    },

    dob: {
      type: Date,
      required: true
    },

    // 🏫 ACADEMIC INFO
    className: {
      type: String,
      required: true,
      index: true
    },

    rollNo: {
      type: Number,
      required: true
    },

    // 🔥 UNIQUE IDENTIFIER (FOR QR + SYSTEM)
    admissionNo: {
      type: String,
      unique: true,
      index: true
    },

    qrToken: {
      type: String,
      unique: true,
      index: true
    },

    // 📞 CONTACT
    mobile: {
      type: String,
      trim: true
    },

    address: {
      type: String,
      trim: true
    },

    // 🖼️ PHOTO
    photo: {
      type: String // filename or URL
    },

    // 🔐 SYSTEM INFO
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher"
    }
  },
  {
    timestamps: true
  }
);

/**
 * 🔥 IMPORTANT INDEX
 * same class me duplicate rollNo allow nahi hoga
 */
studentSchema.index({ className: 1, rollNo: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema);