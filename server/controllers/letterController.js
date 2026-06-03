// server/controllers/letterController.js

import Letter   from "../models/Letter.js";
import Employee from "../models/Employee.js";

// ─── Template renderer ────────────────────────────────────────────────────────
// Takes employee data + custom text and builds a full letter body.

const TEMPLATES = {
  OFFER_LETTER: (emp, customText) => ({
    subject: `Offer Letter – ${emp.firstName} ${emp.lastName}`,
    body: `Dear ${emp.firstName} ${emp.lastName},

We are pleased to offer you the position of ${emp.position || "the role discussed"} in the ${emp.department || "organisation"}.

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

We expect an immediate improvement. Failure to comply may result in further disciplinary action. Please acknowledge receipt of this letter.

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
};

// ─── Admin: Send a letter ─────────────────────────────────────────────────────
export const sendLetter = async (req, res) => {
  try {
    const { templateType, customText, recipientEmployeeId } = req.body;

    if (!templateType || !recipientEmployeeId)
      return res.status(400).json({ error: "templateType and recipientEmployeeId are required" });

    if (!TEMPLATES[templateType])
      return res.status(400).json({ error: "Invalid template type" });

    const employee = await Employee.findById(recipientEmployeeId);
    if (!employee)
      return res.status(404).json({ error: "Employee not found" });

    const { subject, body } = TEMPLATES[templateType](employee, customText || "");

    const letter = await Letter.create({
      templateType,
      customText:          customText || "",
      renderedBody:        body,
      subject,
      sentBy:              req.session.userId,
      recipientEmployeeId: employee._id,
    });

    return res.status(201).json({ success: true, data: letter });
  } catch (err) {
    console.error("sendLetter error:", err);
    return res.status(500).json({ error: "Failed to send letter" });
  }
};

// ─── Admin: Get all sent letters ──────────────────────────────────────────────
export const getAllLetters = async (req, res) => {
  try {
    const letters = await Letter.find()
      .populate("recipientEmployeeId", "firstName lastName department position")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ data: letters });
  } catch (err) {
    console.error("getAllLetters error:", err);
    return res.status(500).json({ error: "Failed to fetch letters" });
  }
};

// ─── Employee: Get my letters (inbox) ────────────────────────────────────────
export const getMyLetters = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId });
    if (!employee)
      return res.status(404).json({ error: "Employee not found" });

    const letters = await Letter.find({ recipientEmployeeId: employee._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ data: letters });
  } catch (err) {
    console.error("getMyLetters error:", err);
    return res.status(500).json({ error: "Failed to fetch letters" });
  }
};

// ─── Employee: Get unread letter count (for bell polling) ────────────────────
export const getUnreadLetterCount = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId });
    if (!employee) return res.json({ count: 0 });

    const count = await Letter.countDocuments({
      recipientEmployeeId: employee._id,
      readAt: null,
    });

    return res.json({ count });
  } catch (err) {
    console.error("getUnreadLetterCount error:", err);
    return res.json({ count: 0 });
  }
};

// ─── Employee: Mark a letter as read ─────────────────────────────────────────
export const markLetterRead = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId });
    if (!employee)
      return res.status(404).json({ error: "Employee not found" });

    const letter = await Letter.findOne({
      _id:                 req.params.id,
      recipientEmployeeId: employee._id,
    });

    if (!letter) return res.status(404).json({ error: "Letter not found" });

    if (!letter.readAt) {
      letter.readAt = new Date();
      await letter.save();
    }

    return res.json({ success: true, data: letter });
  } catch (err) {
    console.error("markLetterRead error:", err);
    return res.status(500).json({ error: "Failed to mark letter as read" });
  }
};

// ─── Admin: Delete a letter ───────────────────────────────────────────────────
export const deleteLetter = async (req, res) => {
  try {
    await Letter.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error("deleteLetter error:", err);
    return res.status(500).json({ error: "Failed to delete letter" });
  }
};