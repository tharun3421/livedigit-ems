import Letter   from "../models/Letter.js"
import Employee from "../models/Employee.js"
import { createNotification } from "./notificationController.js"

const TEMPLATES = {
  OFFER_LETTER: (emp, customText) => ({
    subject: `Offer Letter – ${emp.firstName} ${emp.lastName}`,
    body: `Dear ${emp.firstName} ${emp.lastName},

We are pleased to offer you the position of ${emp.position || "the role discussed"} (${emp.department || "organisation"}) with ${emp.assignedLocation?.label || "our office"}.

${customText}

We look forward to welcoming you to the team. Please sign and return this letter to confirm your acceptance.

Warm regards,
HR Department`,
  }),

  WARNING_LETTER: (emp, customText) => ({
    subject: `Warning Letter – ${emp.firstName} ${emp.lastName}`,
    body: `Dear ${emp.firstName} ${emp.lastName},

This letter serves as an official warning regarding the matter described below.

${customText}

We expect an immediate improvement. Failure to comply may result in further disciplinary action. Please acknowledge receipt of this letter by signing and returning a copy within 48 hours.

Regards,
HR Department`,
  }),

  APPRECIATION_LETTER: (emp, customText) => ({
    subject: `Appreciation Letter – ${emp.firstName} ${emp.lastName}`,
    body: `Dear ${emp.firstName} ${emp.lastName},

On behalf of the entire organisation, we would like to express our sincere appreciation for your outstanding contribution.

${customText}

Your dedication and hard work are an inspiration to the entire team. Keep up the excellent work!

With appreciation,
HR Department`,
  }),

  TERMINATION_LETTER: (emp, customText) => ({
    subject: `Termination Letter – ${emp.firstName} ${emp.lastName}`,
    body: `Dear ${emp.firstName} ${emp.lastName},

We regret to inform you that your employment with ${emp.department ? emp.department + " department of " : ""}our organisation is being terminated, effective from the date mentioned below.

${customText}

Please ensure all company property, access cards, and confidential materials are returned on or before your last working day. Your final settlement will be processed as per company policy.

We wish you the best in your future endeavours.

Regards,
HR Department`,
  }),

  EXPERIENCE_LETTER: (emp, customText) => ({
    subject: `Experience Letter – ${emp.firstName} ${emp.lastName}`,
    body: `To Whomsoever It May Concern,

This is to certify that ${emp.firstName} ${emp.lastName} has been employed with our organisation as ${emp.position || "a team member"} in the ${emp.department || "respective"} department.

${customText}

During their tenure, they demonstrated professionalism, dedication, and commitment. We wish them success in all future endeavours.

Yours faithfully,
HR Department`,
  }),
}

const LETTER_LABELS = {
  OFFER_LETTER:         "Offer Letter",
  WARNING_LETTER:       "Warning Letter",
  APPRECIATION_LETTER:  "Appreciation Letter",
  TERMINATION_LETTER:   "Termination Letter",
  EXPERIENCE_LETTER:    "Experience Letter",
}

export const sendLetter = async (req, res) => {
  try {
    const { templateType, customText, recipientEmployeeId } = req.body
    if (!templateType || !recipientEmployeeId)
      return res.status(400).json({ error: "templateType and recipientEmployeeId are required" })
    if (!TEMPLATES[templateType])
      return res.status(400).json({ error: "Invalid template type" })
    const employee = await Employee.findById(recipientEmployeeId)
    if (!employee) return res.status(404).json({ error: "Employee not found" })
    const { subject, body } = TEMPLATES[templateType](employee, customText || "")
    const letter = await Letter.create({
      templateType, customText: customText || "", renderedBody: body,
      subject, sentBy: req.session.userId, recipientEmployeeId: employee._id,
    })

    // Notify the specific employee this letter was sent to
    if (employee.userId) {
      await createNotification({
        recipientId:   employee.userId,
        recipientRole: "EMPLOYEE",
        type:          "LETTER_RECEIVED",
        title:         "New Letter Received",
        message:       `You have received a ${LETTER_LABELS[templateType] || "letter"}`,
        refId:         letter._id,
        refType:       "Letter",
      })
    }

    return res.status(201).json({ success: true, data: letter })
  } catch (err) {
    console.error("sendLetter error:", err)
    return res.status(500).json({ error: "Failed to send letter" })
  }
}

export const getAllLetters = async (req, res) => {
  try {
    const letters = await Letter.find()
      .populate("recipientEmployeeId", "firstName lastName department position")
      .sort({ createdAt: -1 }).lean()
    return res.json({ data: letters })
  } catch (err) {
    console.error("getAllLetters error:", err)
    return res.status(500).json({ error: "Failed to fetch letters" })
  }
}

export const getMyLetters = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId })
    if (!employee) return res.status(404).json({ error: "Employee not found" })
    const letters = await Letter.find({ recipientEmployeeId: employee._id })
      .sort({ createdAt: -1 }).lean()
    return res.json({ data: letters })
  } catch (err) {
    console.error("getMyLetters error:", err)
    return res.status(500).json({ error: "Failed to fetch letters" })
  }
}

export const getUnreadLetterCount = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId })
    if (!employee) return res.json({ count: 0 })
    const count = await Letter.countDocuments({ recipientEmployeeId: employee._id, readAt: null })
    return res.json({ count })
  } catch (err) {
    console.error("getUnreadLetterCount error:", err)
    return res.json({ count: 0 })
  }
}

export const markLetterRead = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId })
    if (!employee) return res.status(404).json({ error: "Employee not found" })
    const letter = await Letter.findOne({ _id: req.params.id, recipientEmployeeId: employee._id })
    if (!letter) return res.status(404).json({ error: "Letter not found" })
    if (!letter.readAt) { letter.readAt = new Date(); await letter.save() }
    return res.json({ success: true, data: letter })
  } catch (err) {
    console.error("markLetterRead error:", err)
    return res.status(500).json({ error: "Failed to mark letter as read" })
  }
}

export const deleteLetter = async (req, res) => {
  try {
    await Letter.findByIdAndDelete(req.params.id)
    return res.json({ success: true })
  } catch (err) {
    console.error("deleteLetter error:", err)
    return res.status(500).json({ error: "Failed to delete letter" })
  }
}