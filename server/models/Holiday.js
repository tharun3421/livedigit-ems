// models/Holiday.js
import mongoose from "mongoose"

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model("Holiday", holidaySchema)