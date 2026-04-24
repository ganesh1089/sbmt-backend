import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  fatherName: {
    type: String,
    trim: true
  },

  mobile: {
    type: String,
    required: true,
    unique: true, // 🔥 login username banega
    index: true
  },

  gender: String,

  dob: {
    type: String,
    required: true
  },

  className: {
    type: String,
    required: true,
    index: true
  },

  rollNo: {
    type: Number,
    required: true
  },

  // 🔥 LOGIN FIELDS (NEW)
  username: {
    type: String,
    unique: true
  },

  password: {
    type: String
  },

  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher"
  }
}, {
  timestamps: true
});

// 🔥 UNIQUE CLASS + ROLL NO
studentSchema.index({ className: 1, rollNo: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema);