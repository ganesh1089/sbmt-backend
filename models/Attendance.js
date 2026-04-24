import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },

  name: {
    type: String,
    required: true,
  },

  rollNo: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ["P", "A", "H"],
    default: "A",
  },
});

const attendanceSchema = new mongoose.Schema(
  {
    class: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "MARKED", "HOLIDAY"],
      default: "PENDING",
    },

    holidayReason: {
      type: String,
      default: "",
    },

    records: [attendanceRecordSchema],

    isLocked: {
      type: Boolean,
      default: false,
    },

    lockedAt: {
      type: Date,
      default: null,
    },

    editedByHOD: {
      type: Boolean,
      default: false,
    },

    hodEditedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// 🔥 IMPORTANT UNIQUE INDEX
attendanceSchema.index({ class: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);