import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const sendEmail = async ({ to, subject, body }) => {
  const isProd     = process.env.NODE_ENV === "production"
  const fromEmail  = isProd
    ? `QuickEMS <${process.env.SENDER_EMAIL}>`
    : "QuickEMS <onboarding@resend.dev>"

  // In test/dev mode, Resend only allows sending to your own verified email
  const recipient  = isProd ? to : process.env.ADMIN_EMAIL

  const { data, error } = await resend.emails.send({
    from:    fromEmail,
    to:      recipient,
    subject: isProd ? subject : `[TEST → ${to}] ${subject}`,
    html:    body,
  })

  if (error) {
    console.error("❌ Email error:", error.message)
    throw new Error(error.message)
  }

  console.log("✅ Email sent to:", recipient)
  return data
}

export default sendEmail