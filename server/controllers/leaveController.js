// import { inngest } from "../inngest/index.js";
// import Employee from "../models/Employee.js";
// import LeaveApplication from "../models/LeaveApplication.js";


// export const createLeave = async (req, res) => {
//     try {
//         const session = req.session;
//         const employee = await Employee.findOne({ userId: session.userId })
//         if (!employee) return res.status(404).json({ error: "Employee not found" })
//         if (employee.isDeleted) {
//             return res.status(403).json({ error: "Your account is deactivated. You cannot apply for leave." })
//         }

//         const { type, startDate, endDate, reason } = req.body;

//         if (!type || !startDate || !endDate || !reason) {
//             return res.status(400).json({ error: "Missing fields" });
//         }

//         const today = new Date();
//         const todayStr = today.toISOString().split('T')[0];

//         if (startDate <= todayStr || endDate <= todayStr) {
//             return res.status(400).json({ error: "Leave dates must be in the future" })
//         }
//         if (endDate < startDate) {
//             return res.status(400).json({ error: "End date cannot be before start date" })
//         }

//         const leave = await LeaveApplication.create({
//             employeeId: employee._id,
//             type,
//             startDate: new Date(startDate),
//             endDate: new Date(endDate),
//             reason,
//             status: "PENDING"
//         })

//         try {
//             await inngest.send({
//                 name: "leave/pending",
//                 data: { LeaveApplicationId: leave._id }
//             })
//         } catch (inngestError) {
//             console.error("Inngest send failed:", inngestError.message)
//         }

//         return res.json({ success: true, data: leave })

//     } catch (error) {
//         console.error("createLeave error:", error.message)
//         return res.status(500).json({ error: error.message })
//     }
// }


// export const getLeaves = async (req,res)=>{
//     try {
//         const session = req.session;
//         const isAdmin= session.role === "ADMIN";
//         if(isAdmin){
//             const status = req.query.status;
//             const where = status? {status}:{};
//             const leaves = await LeaveApplication.find(where)
//             .populate("employeeId")
//             .sort({ createdAt: -1 });

//             const data = leaves
//         .filter((l) => l.employeeId && !l.employeeId.isDeleted)
//         .map((l) => {
//         const obj = l.toObject();
//         return {
//             ...obj,
//             id: obj._id.toString(),
//             employee: obj.employeeId,
//             employeeId: obj.employeeId?._id?.toString(),
//         }
//     })
//             return res.json({data})
//         }else{
//             const employee = await Employee.findOne({
//                 userId:session.userId,
//             }).lean()
//             if(!employee) return res.status(404).json({error:"Not found"})
            
//             const leaves = await LeaveApplication.find({
//                 employeeId:employee._id
//             }).sort({createdAt:-1})
//             return res.json({
//                 data:leaves,
//                 employee:{...employee,id:employee._id.toString()}
//             })
//         }

//     } catch (error) {
//         return res.status(500).json({error:"Failed"})
//     }
// }




// export const updateLeaveStatus = async (req,res)=>{
//     try {
//         const {status} = req.body
//         if(!["APPROVED","REJECTED","PENDING"].includes(status)){
//             return res.status(400).json({error:"Invalid status" })
//         }
//         const leave = await LeaveApplication.findByIdAndUpdate(req.params.id,{status},{returnDocument:"after"})
//         return res.json({success:true,data:leave})
//     } catch (error) {
//         return res.status(500).json({error:"Failed"})
//     }
// }



import { inngest } from "../inngest/index.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";

export const createLeave = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.session.userId });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        if (employee.isDeleted) {
            return res.status(403).json({ error: "Your account is deactivated. You cannot apply for leave." });
        }

        const { type, startDate, endDate, reason } = req.body;

        if (!type || !startDate || !endDate || !reason) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDateObj = new Date(startDate);
        const endDateObj   = new Date(endDate);

        if (startDateObj < today || endDateObj < today) {
            return res.status(400).json({ error: "Leave dates must be in the future" });
        }
        if (endDateObj < startDateObj) {
            return res.status(400).json({ error: "End date cannot be before start date" });
        }

        const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type,
            startDate:  startDateObj,
            endDate:    endDateObj,
            reason,
            status:     "PENDING",
        });

        try {
            await inngest.send({
                name: "leave/pending",
                data: { leaveApplicationId: leave._id.toString() },
            });
        } catch (inngestError) {
            console.error("Inngest send failed:", inngestError.message);
        }

        return res.json({ success: true, data: leave });

    } catch (error) {
        console.error("createLeave error:", error.message);
        return res.status(500).json({ error: error.message });
    }
};

export const getLeaves = async (req, res) => {
    try {
        const isAdmin = req.session.role === "ADMIN";

        if (isAdmin) {
            const where = req.query.status ? { status: req.query.status } : {};

            const leaves = await LeaveApplication.find(where)
                .populate("employeeId")
                .sort({ createdAt: -1 });

            const data = leaves
                .filter((l) => l.employeeId && !l.employeeId.isDeleted)
                .map((l) => {
                    const obj = l.toObject();
                    return {
                        ...obj,
                        id:         obj._id.toString(),
                        employee:   obj.employeeId,
                        employeeId: obj.employeeId?._id?.toString(),
                    };
                });

            return res.json({ data });
        }

        const employee = await Employee.findOne({ userId: req.session.userId }).lean();

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const leaves = await LeaveApplication.find({ employeeId: employee._id })
            .sort({ createdAt: -1 });

        return res.json({
            data:     leaves,
            employee: { ...employee, id: employee._id.toString() },
        });

    } catch (error) {
        console.error("getLeaves error:", error);
        return res.status(500).json({ error: "Failed to fetch leaves" });
    }
};

export const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const leave = await LeaveApplication.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }          // ← was returnDocument:"after" (MongoDB driver option, not Mongoose)
        );

        if (!leave) {
            return res.status(404).json({ error: "Leave application not found" });
        }

        return res.json({ success: true, data: leave });

    } catch (error) {
        console.error("updateLeaveStatus error:", error);
        return res.status(500).json({ error: "Failed to update leave status" });
    }
};