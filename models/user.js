import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  className: {
  type: String,
  default: null
},
  role: {
    type: String,
    enum: ["admin", "teacher", "student"],
    default: "teacher",
  },
  
}, { timestamps: true });

export default mongoose.model("User", userSchema);