import mongoose from "mongoose"

const connectDB = async () => {
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  if (mongoose.connection.readyState >= 1) return

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS:          45000,
    maxPoolSize:              10,
    bufferCommands:           false,   // fail fast instead of buffering forever
  })

  console.log("MongoDB connected:", mongoose.connection.host)
}

export default connectDB