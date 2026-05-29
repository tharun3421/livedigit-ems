import mongoose from "mongoose"

const holidaySchema = new mongoose.Schema(
  {
    mmdd: {
      type: String,
      required: true,
      match: /^\d{2}-\d{2}$/,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
)

const Holiday = mongoose.model("Holiday", holidaySchema)

export default Holiday