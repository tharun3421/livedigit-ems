import Holiday from "../models/Holiday.js"

// GET /api/holidays — all users
export const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ mmdd: 1 })
    res.json(holidays)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch holidays", error: error.message })
  }
}

// POST /api/holidays — admin only
export const createHoliday = async (req, res) => {
  try {
    const { mmdd, name } = req.body
    if (!mmdd || !name) {
      return res.status(400).json({ message: "mmdd and name are required" })
    }
    const holiday = await Holiday.create({ mmdd, name })
    res.status(201).json(holiday)
  } catch (error) {
    res.status(500).json({ message: "Failed to create holiday", error: error.message })
  }
}

// PUT /api/holidays/:id — admin only
export const updateHoliday = async (req, res) => {
  try {
    const { mmdd, name } = req.body
    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      { mmdd, name },
      { new: true, runValidators: true }
    )
    if (!holiday) return res.status(404).json({ message: "Holiday not found" })
    res.json(holiday)
  } catch (error) {
    res.status(500).json({ message: "Failed to update holiday", error: error.message })
  }
}

// DELETE /api/holidays/:id — admin only
export const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id)
    if (!holiday) return res.status(404).json({ message: "Holiday not found" })
    res.json({ message: "Holiday deleted" })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete holiday", error: error.message })
  }
}