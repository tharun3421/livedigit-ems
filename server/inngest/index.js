import { Inngest } from "inngest";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import sendEmail from "../config/nodemailer.js";

export const inngest = new Inngest({ id: "ems" });

const EXPECTED_HOURS = 9;

const getDayType = (workingHours) => {
  if (workingHours >= EXPECTED_HOURS)        return "Full Day";
  if (workingHours >= EXPECTED_HOURS * 0.75) return "Three Quarter Day";
  if (workingHours >= EXPECTED_HOURS * 0.5)  return "Half Day";
  return "Short Day";
};

// ─── Auto Checkout ────────────────────────────────────────────────────────────

const autoCheckOut = inngest.createFunction(
  { id: "auto-check-out", triggers: [{ event: "employee/check-out" }] },
  async ({ event, step }) => {
    const { employeeId, attendanceId } = event.data;

    await step.sleep("wait-for-9-hours", "9h");

    const attendance = await step.run("check-attendance", async () => {
      const a = await Attendance.findById(attendanceId).lean();
      return a ? { checkOut: a.checkOut, checkIn: a.checkIn } : null;
    });

    if (attendance?.checkOut) return;

    const employee = await step.run("get-employee", async () => {
      const e = await Employee.findById(employeeId).lean();
      return { email: e.email, firstName: e.firstName, department: e.department };
    });

    await step.run("send-reminder-email", () =>
      sendEmail({
        to:      employee.email,
        subject: "Attendance Check-Out Reminder",
        body: `
          <div style="max-width:600px;font-family:Arial,sans-serif;">
            <h2>Hi ${employee.firstName}, 👋</h2>
            <p>You checked in at <strong>${employee.department}</strong> today at
               <strong style="color:#007bff;">${new Date(attendance.checkIn).toLocaleTimeString()}</strong>.
            </p>
            <p>Please check out within the next hour.</p>
            <p>If you have any questions, contact your admin.</p>
            <br/>
            <p>Best Regards,<br/><strong>EMS</strong></p>
          </div>
        `,
      })
    );

    await step.sleep("wait-for-1-hour", "1h");

    const stillOut = await step.run("check-still-not-checked-out", async () => {
      const a = await Attendance.findById(attendanceId).lean();
      return !a?.checkOut;
    });

    if (!stillOut) return;

    await step.run("auto-checkout", async () => {
      const a            = await Attendance.findById(attendanceId);
      const now          = new Date();
      const diffMs       = now.getTime() - new Date(a.checkIn).getTime();
      const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

      a.checkOut     = now;
      a.workingHours = workingHours;
      a.dayType      = getDayType(workingHours);
      a.status       = "LATE";
      await a.save();
    });
  }
);

// ─── Leave Application Reminder ───────────────────────────────────────────────

const leaveApplicationReminder = inngest.createFunction(
  { id: "leave-application-reminder", triggers: [{ event: "leave/pending" }] },
  async ({ event, step }) => {
    const { leaveApplicationId } = event.data;

    await step.sleep("wait-for-24-hours", "24h");

    const isPending = await step.run("check-leave-status", async () => {
      const leave = await LeaveApplication.findById(leaveApplicationId).lean();
      return leave?.status === "PENDING";
    });

    if (!isPending) return;

    const data = await step.run("get-leave-data", async () => {
      const leave    = await LeaveApplication.findById(leaveApplicationId).lean();
      const employee = await Employee.findById(leave.employeeId).lean();
      return { department: employee.department, startDate: leave.startDate };
    });

    await step.run("send-admin-email", () =>
      sendEmail({
        to:      process.env.ADMIN_EMAIL,
        subject: "Leave Application Reminder",
        body: `
          <div style="max-width:600px;font-family:Arial,sans-serif;">
            <h2>Hi Admin, 👋</h2>
            <p>A leave application from <strong>${data.department}</strong> is still pending
               for <strong style="color:#007bff;">${new Date(data.startDate).toLocaleDateString()}</strong>.
            </p>
            <p>Please take action on this leave application.</p>
            <br/>
            <p>Best Regards,<br/><strong>EMS</strong></p>
          </div>
        `,
      })
    );
  }
);

// ─── Attendance Reminder Cron (11:30 AM IST daily) ───────────────────────────

const attendanceReminderCron = inngest.createFunction(
  { id: "attendance-reminder-cron", triggers: [{ cron: "TZ=Asia/Kolkata 30 11 * * *" }] },
  async ({ step }) => {
    const today = await step.run("get-today-date", () => {
      const istDate  = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year:     "numeric",
        month:    "2-digit",
        day:      "2-digit",
      }).format(new Date());

      const startUTC = new Date(istDate + "T00:00:00+05:30");
      const endUTC   = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);
      return { startUTC: startUTC.toISOString(), endUTC: endUTC.toISOString() };
    });

    const activeEmployees = await step.run("get-active-employees", async () => {
      const employees = await Employee.find({
        isDeleted:        false,
        employmentStatus: "ACTIVE",
      }).lean();

      return employees.map(({ _id, firstName, email, department }) => ({
        _id: _id.toString(),
        firstName,
        email,
        department,
      }));
    });

    const onLeaveIds = await step.run("get-on-leave-ids", async () => {
      const leaves = await LeaveApplication.find({
        status:    "APPROVED",
        startDate: { $lte: new Date(today.endUTC) },
        endDate:   { $gte: new Date(today.startUTC) },
      }).lean();
      return leaves.map((l) => l.employeeId.toString());
    });

    const checkedInIds = await step.run("get-checked-in-ids", async () => {
      const records = await Attendance.find({
        date: { $gte: new Date(today.startUTC), $lt: new Date(today.endUTC) },
      }).lean();
      return records.map((a) => a.employeeId.toString());
    });

    const absentEmployees = activeEmployees.filter(
      ({ _id }) => !onLeaveIds.includes(_id) && !checkedInIds.includes(_id)
    );

    if (absentEmployees.length === 0) {
      return { totalActive: activeEmployees.length, onLeave: onLeaveIds.length, checkedIn: checkedInIds.length, absent: 0 };
    }

    await step.run("send-reminder-emails", async () => {
      await Promise.all(
        absentEmployees.map(({ email, firstName, department }) =>
          sendEmail({
            to:      email,
            subject: "Attendance Reminder — Please Mark Your Attendance",
            body: `
              <div style="max-width:600px;font-family:Arial,sans-serif;">
                <h2>Hi ${firstName}, 👋</h2>
                <p>We noticed you haven't marked your attendance yet today.</p>
                <p>The deadline was <strong>11:30 AM</strong> and your attendance is still missing.</p>
                <p>Please check in as soon as possible or contact your admin if you're facing any issues.</p>
                <br/>
                <p style="color:#666;font-size:14px;">Department: ${department}</p>
                <br/>
                <p>Best Regards,<br/><strong>QuickEMS</strong></p>
              </div>
            `,
          })
        )
      );
      return { emailsSent: absentEmployees.length };
    });

    return {
      totalActive: activeEmployees.length,
      onLeave:     onLeaveIds.length,
      checkedIn:   checkedInIds.length,
      absent:      absentEmployees.length,
    };
  }
);

export const functions = [autoCheckOut, leaveApplicationReminder, attendanceReminderCron];