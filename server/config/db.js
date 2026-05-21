import mongoose from "mongoose"

let isConnected = false

const connectDB = async () => {
  if (isConnected) return

  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })

  isConnected = conn.connections[0].readyState === 1
  console.log("MongoDB connected")
}

export default connectDB