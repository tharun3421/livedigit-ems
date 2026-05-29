// controllers/holidayController.js
import Holiday from "../models/Holiday.js"

export const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 })
    res.json(holidays)
  } catch (error) {
    console.error("getHolidays error:", error)
    res.status(500).json({ message: "Failed to fetch holidays", error: error.message })
  }
}

export const createHoliday = async (req, res) => {
  try {
    const { date, name } = req.body
    if (!date || !name)
      return res.status(400).json({ message: "date and name are required" })
    const holiday = await Holiday.create({ date: new Date(date), name })
    res.status(201).json(holiday)
  } catch (error) {
    console.error("createHoliday error:", error)
    res.status(500).json({ message: "Failed to create holiday", error: error.message })
  }
}

export const updateHoliday = async (req, res) => {
  try {
    const { date, name } = req.body
    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      { date: new Date(date), name },
      { new: true, runValidators: true }
    )
    if (!holiday) return res.status(404).json({ message: "Holiday not found" })
    res.json(holiday)
  } catch (error) {
    console.error("updateHoliday error:", error)
    res.status(500).json({ message: "Failed to update holiday", error: error.message })
  }
}

export const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id)
    if (!holiday) return res.status(404).json({ message: "Holiday not found" })
    res.json({ message: "Holiday deleted" })
  } catch (error) {
    console.error("deleteHoliday error:", error)
    res.status(500).json({ message: "Failed to delete holiday", error: error.message })
  }
}