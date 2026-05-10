import { Inngest } from "inngest";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import sendEmail from "../config/nodemailer.js";

export const inngest = new Inngest({ id: "ems" });

// ─── Auto checkout ────────────────────────────────────────────────────────────

const autoCheckOut = inngest.createFunction(
  { id: "auto-check-out", triggers: [{ event: "employee/check-out" }] },
  async ({ event, step }) => {
    const { employeeId, attendanceId } = event.data;

    await step.sleep("wait-for-9-hours", "9h");

    const attendance = await step.run("check-attendance", async () => {
      const a = await Attendance.findById(attendanceId).lean();
      return a ? { checkOut: a.checkOut, checkIn: a.checkIn } : null;
    });

    if (!attendance?.checkOut) {
      const employee = await step.run("get-employee", async () => {
        const e = await Employee.findById(employeeId).lean();
        return { email: e.email, firstName: e.firstName, department: e.department };
      });

      await step.run("send-reminder-email", async () => {
        await sendEmail({
          to: employee.email,
          subject: "Attendance Check-Out Reminder",
          body: `
            <div style="max-width: 600px;">
              <h2>Hi ${employee.firstName}, 👋</h2>
              <p style="font-size: 16px;">You checked in at ${employee.department} today:</p>
              <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">
                ${new Date(attendance.checkIn).toLocaleTimeString()}
              </p>
              <p style="font-size: 16px;">Please make sure to check out within the next hour.</p>
              <p style="font-size: 16px;">If you have any questions, please contact your admin.</p>
              <br />
              <p style="font-size: 16px;">Best Regards,</p>
              <p style="font-size: 16px;">EMS</p>
            </div>
          `,
        });
      });

      await step.sleep("wait-for-1-hour", "1h");

      const stillNotCheckedOut = await step.run("check-again", async () => {
        const a = await Attendance.findById(attendanceId).lean();
        return !a?.checkOut;
      });

      if (stillNotCheckedOut) {
        await step.run("auto-checkout", async () => {
          const a = await Attendance.findById(attendanceId);
          a.checkOut     = new Date(new Date(a.checkIn).getTime() + 4 * 60 * 60 * 1000);
          a.workingHours = 4;
          a.dayType      = "Half Day";
          a.status       = "LATE";
          await a.save();
        });
      }
    }
  },
);

// ─── Leave application reminder ───────────────────────────────────────────────

const leaveApplicationReminder = inngest.createFunction(
  { id: "leave-application-reminder", triggers: [{ event: "leave/pending" }] },
  async ({ event, step }) => {
    const { leaveApplicationId } = event.data;

    await step.sleep("wait-for-24-hours", "24h");

    const isPending = await step.run("check-leave-status", async () => {
      const leave = await LeaveApplication.findById(leaveApplicationId).lean();
      return leave?.status === "PENDING";
    });

    if (isPending) {
      const data = await step.run("get-leave-data", async () => {
        const leave    = await LeaveApplication.findById(leaveApplicationId).lean();
        const employee = await Employee.findById(leave.employeeId).lean();
        return { department: employee.department, startDate: leave.startDate };
      });

      await step.run("send-admin-email", async () => {
        await sendEmail({
          to:      process.env.ADMIN_EMAIL,
          subject: "Leave Application Reminder",
          body: `
            <div style="max-width: 600px;">
              <h2>Hi Admin, 👋</h2>
              <p style="font-size: 16px;">A leave application from ${data.department} is still pending:</p>
              <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">
                ${new Date(data.startDate).toLocaleDateString()}
              </p>
              <p style="font-size: 16px;">Please make sure to take action on this leave application.</p>
              <br />
              <p style="font-size: 16px;">Best Regards,</p>
              <p style="font-size: 16px;">EMS</p>
            </div>
          `,
        });
      });
    }
  },
);

// ─── Attendance reminder cron (runs at 11:30 AM IST daily) ───────────────────

const attendanceReminderCron = inngest.createFunction(
  { id: "attendance-reminder-cron", triggers: [{ cron: "TZ=Asia/Kolkata 30 11 * * *" }] },
  async ({ step }) => {

    const today = await step.run("get-today-date", () => {
      const istDate = new Intl.DateTimeFormat("en-CA", {
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

      return employees.map((e) => ({
        _id:        e._id.toString(),
        firstName:  e.firstName,
        email:      e.email,
        department: e.department,
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
      const attendances = await Attendance.find({
        date: { $gte: new Date(today.startUTC), $lt: new Date(today.endUTC) },
      }).lean();
      return attendances.map((a) => a.employeeId.toString());
    });

    const absentEmployees = activeEmployees.filter(
      (emp) => !onLeaveIds.includes(emp._id) && !checkedInIds.includes(emp._id)
    );

    if (absentEmployees.length > 0) {
      await step.run("send-reminder-emails", async () => {
        await Promise.all(
          absentEmployees.map((emp) =>
            sendEmail({
              to:      emp.email,
              subject: "Attendance Reminder - Please Mark Your Attendance",
              body: `
                <div style="max-width: 600px; font-family: Arial, sans-serif;">
                  <h2>Hi ${emp.firstName}, 👋</h2>
                  <p style="font-size: 16px;">We noticed you haven't marked your attendance yet today.</p>
                  <p style="font-size: 16px;">The deadline was <strong>11:30 AM</strong> and your attendance is still missing.</p>
                  <p style="font-size: 16px;">Please check in as soon as possible or contact your admin if you're facing any issues.</p>
                  <br />
                  <p style="font-size: 14px; color: #666;">Department: ${emp.department}</p>
                  <br />
                  <p style="font-size: 16px;">Best Regards,</p>
                  <p style="font-size: 16px;"><strong>QuickEMS</strong></p>
                </div>
              `,
            })
          )
        );
        return { emailSent: absentEmployees.length };
      });
    }

    return {
      totalActive: activeEmployees.length,
      onLeave:     onLeaveIds.length,
      checkedIn:   checkedInIds.length,
      absent:      absentEmployees.length,
    };
  },
);

export const functions = [autoCheckOut, leaveApplicationReminder, attendanceReminderCron];