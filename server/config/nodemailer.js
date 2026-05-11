
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const sendEmail = async ({ to, subject, body }) => {
  const { data, error } = await resend.emails.send({
    from:    `QuickEMS <${process.env.SENDER_EMAIL}>`,
    to,
    subject,
    html:    body,
  })

  if (error) {
    console.error("❌ Email error:", error.message)
    throw new Error(error.message)
  }

  console.log("✅ Email sent to:", to)
  return data
}

export default sendEmail