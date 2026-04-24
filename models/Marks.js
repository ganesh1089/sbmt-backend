import mongoose from "mongoose";

const marksSchema = new mongoose.Schema({
  classId: String,
  examType: String,     // test1, test2, etc
  subject: String,

  // ✅ total marks (teacher defined)
  totalMarks: {
    type: Number,
    required: true
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },

  // ✅ obtained marks
  marksObtained: {
    type: Number,
    required: true
  },

  // ✅ teacher remark
  suggestion: {
    type: String,
    default: ""
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Marks", marksSchema);