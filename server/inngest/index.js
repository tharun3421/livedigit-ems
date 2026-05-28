// import { Inngest } from "inngest";
// import Attendance from "../models/Attendance.js";
// import Employee from "../models/Employee.js";
// import LeaveApplication from "../models/LeaveApplication.js";
// import sendEmail from "../config/nodemailer.js";

// export const inngest = new Inngest({ id: "ems" });

// // ─── Constants ────────────────────────────────────────────────────────────────

// const EXPECTED_HOURS      = 9;
// const REMINDER_AFTER_H    = 11; // reminder email at 11h mark
// const AUTO_CHECKOUT_AFTER = "1h"; // auto-checkout 1h after reminder = 12h total

// const getDayType = (workingHours) => {
//   if (workingHours >= EXPECTED_HOURS)              return "Full Day";
//   if (workingHours >= EXPECTED_HOURS * 0.75)       return "Three Quarter Day";
//   if (workingHours >= EXPECTED_HOURS * 0.5)        return "Half Day";
//   return "Short Day";
// };

// // ─── Auto Checkout ────────────────────────────────────────────────────────────
// // Timeline: check-in → +11h reminder email → +1h auto-checkout (12h total)

// const autoCheckOut = inngest.createFunction(
//   {
//     id: "auto-check-out",
//     triggers: [{ event: "employee/check-out" }],
//   },
//   async ({ event, step }) => {
//     const { employeeId, attendanceId } = event.data;

//     // ── Wait 11h then send reminder ───────────────────────────────────────────
//     await step.sleep("wait-before-reminder", `${REMINDER_AFTER_H}h`);

//     const reminderSent = await step.run("send-reminder-if-needed", async () => {
//       const record = await Attendance.findById(attendanceId).lean();
//       if (!record || record.checkOut) return false;

//       const employee = await Employee.findById(employeeId)
//         .select("email firstName department")
//         .lean();
//       if (!employee) return false;

//       await sendEmail({
//         to:      employee.email,
//         subject: "⏰ Reminder: Please Clock Out",
//         body: `
//           <div style="max-width:600px;font-family:Arial,sans-serif;">
//             <h2>Hi ${employee.firstName} 👋</h2>
//             <p>You checked in at <strong>${employee.department}</strong> today but haven't clocked out yet.</p>
//             <p>You will be <strong>automatically checked out in 1 hour</strong> if no action is taken.</p>
//             <p>Please clock out as soon as possible.</p>
//             <br/>
//             <p>Best Regards,<br/><strong>EMS</strong></p>
//           </div>
//         `,
//       });

//       return true;
//     });

//     if (!reminderSent) return { skipped: true, reason: "already_checked_out" };

//     // ── Wait 1 more hour (12h total) then auto-checkout ───────────────────────
//     await step.sleep("wait-before-auto-checkout", AUTO_CHECKOUT_AFTER);

//     await step.run("auto-checkout", async () => {
//       const record = await Attendance.findById(attendanceId);
//       if (!record || record.checkOut) return { skipped: true };

//       const now          = new Date();
//       const diffMs       = now.getTime() - new Date(record.checkIn).getTime();
//       const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

//       record.checkOut       = now;
//       record.workingHours   = workingHours;
//       record.dayType        = getDayType(workingHours);
//       record.autoCheckedOut = true;

//       // Preserve existing LATE; otherwise resolve by hours worked
//       if (record.status !== "LATE") {
//         record.status = workingHours >= EXPECTED_HOURS * 0.5 ? "PRESENT" : "LATE";
//       }

//       await record.save();
//       return { success: true, workingHours, dayType: record.dayType };
//     });
//   }
// );

// // ─── Leave Application Reminder ───────────────────────────────────────────────

// const leaveApplicationReminder = inngest.createFunction(
//   {
//     id: "leave-application-reminder",
//     triggers: [{ event: "leave/pending" }],
//   },
//   async ({ event, step }) => {
//     const { leaveApplicationId } = event.data;

//     await step.sleep("wait-24-hours", "24h");

//     const leaveData = await step.run("check-and-get-leave-data", async () => {
//       const leave = await LeaveApplication.findById(leaveApplicationId).lean();
//       if (!leave || leave.status !== "PENDING") return null;

//       const employee = await Employee.findById(leave.employeeId)
//         .select("department")
//         .lean();

//       return {
//         department: employee?.department ?? "Unknown",
//         startDate:  leave.startDate,
//       };
//     });

//     if (!leaveData) return { skipped: true, reason: "not_pending" };

//     await step.run("send-admin-reminder", () =>
//       sendEmail({
//         to:      process.env.ADMIN_EMAIL,
//         subject: "📋 Leave Application Pending Action",
//         body: `
//           <div style="max-width:600px;font-family:Arial,sans-serif;">
//             <h2>Hi Admin 👋</h2>
//             <p>A leave application from <strong>${leaveData.department}</strong> has been
//                pending for over 24 hours.</p>
//             <p>Leave start date: <strong style="color:#007bff;">
//               ${new Date(leaveData.startDate).toLocaleDateString()}
//             </strong></p>
//             <p>Please review and take action as soon as possible.</p>
//             <br/>
//             <p>Best Regards,<br/><strong>EMS</strong></p>
//           </div>
//         `,
//       })
//     );
//   }
// );

// // ─── Attendance Reminder Cron (11:30 AM IST daily) ───────────────────────────

// const attendanceReminderCron = inngest.createFunction(
//   {
//     id: "attendance-reminder-cron",
//     triggers: [{ cron: "TZ=Asia/Kolkata 30 11 * * *" }],
//   },
//   async ({ step }) => {
//     const { startUTC, endUTC } = await step.run("get-today-ist-window", () => {
//       const istDate = new Intl.DateTimeFormat("en-CA", {
//         timeZone: "Asia/Kolkata",
//         year:     "numeric",
//         month:    "2-digit",
//         day:      "2-digit",
//       }).format(new Date());

//       const start = new Date(`${istDate}T00:00:00+05:30`);
//       const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000);
//       return { startUTC: start.toISOString(), endUTC: end.toISOString() };
//     });

//     const activeEmployees = await step.run("get-active-employees", async () => {
//       const employees = await Employee.find({
//         isDeleted:        false,
//         employmentStatus: "ACTIVE",
//       })
//         .select("_id firstName email department")
//         .lean();

//       return employees.map(({ _id, firstName, email, department }) => ({
//         _id: _id.toString(),
//         firstName,
//         email,
//         department,
//       }));
//     });

//     const onLeaveIds = await step.run("get-on-leave-ids", async () => {
//       const leaves = await LeaveApplication.find({
//         status:    "APPROVED",
//         startDate: { $lte: new Date(endUTC) },
//         endDate:   { $gte: new Date(startUTC) },
//       })
//         .select("employeeId")
//         .lean();

//       return leaves.map((l) => l.employeeId.toString());
//     });

//     const checkedInIds = await step.run("get-checked-in-ids", async () => {
//       const records = await Attendance.find({
//         date: { $gte: new Date(startUTC), $lt: new Date(endUTC) },
//       })
//         .select("employeeId")
//         .lean();

//       return records.map((a) => a.employeeId.toString());
//     });

//     const absentEmployees = activeEmployees.filter(
//       ({ _id }) => !onLeaveIds.includes(_id) && !checkedInIds.includes(_id)
//     );

//     if (absentEmployees.length === 0) {
//       return {
//         totalActive: activeEmployees.length,
//         onLeave:     onLeaveIds.length,
//         checkedIn:   checkedInIds.length,
//         absent:      0,
//       };
//     }

//     await step.run("send-reminder-emails", async () => {
//       await Promise.all(
//         absentEmployees.map(({ email, firstName, department }) =>
//           sendEmail({
//             to:      email,
//             subject: "📌 Attendance Reminder — Please Mark Your Attendance",
//             body: `
//               <div style="max-width:600px;font-family:Arial,sans-serif;">
//                 <h2>Hi ${firstName} 👋</h2>
//                 <p>We noticed you haven't marked your attendance yet today.</p>
//                 <p>The check-in deadline was <strong>11:30 AM IST</strong>.</p>
//                 <p>Please check in as soon as possible or contact your admin if you have any issues.</p>
//                 <br/>
//                 <p style="color:#666;font-size:13px;">Department: ${department}</p>
//                 <br/>
//                 <p>Best Regards,<br/><strong>EMS</strong></p>
//               </div>
//             `,
//           })
//         )
//       );
//       return { emailsSent: absentEmployees.length };
//     });

//     return {
//       totalActive: activeEmployees.length,
//       onLeave:     onLeaveIds.length,
//       checkedIn:   checkedInIds.length,
//       absent:      absentEmployees.length,
//     };
//   }
// );

// // ─── Exports ──────────────────────────────────────────────────────────────────

// export const functions = [autoCheckOut, leaveApplicationReminder, attendanceReminderCron];