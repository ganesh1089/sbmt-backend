import mongoose from "mongoose";

const teacherRoleSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },

    role: {
      type: String,
      enum: ["class_teacher", "subject_teacher"],
      required: true
    },

    classId: {
      type: String,
      required: true
    },

    subjectId: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("TeacherRole", teacherRoleSchema);