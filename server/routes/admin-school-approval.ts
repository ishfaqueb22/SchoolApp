import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth, requireAdminRole } from "../middlewares/auth";

export const schoolApprovalRouter = Router();

// Get all schools by approval status for platform admin
schoolApprovalRouter.get(
  "/schools/status/:status",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      
      // Validate status parameter
      const validStatus = z.enum(["pending", "approved", "rejected"]).safeParse(status);
      
      if (!validStatus.success) {
        return res.status(400).json({ 
          error: "Invalid status parameter. Must be one of: pending, approved, rejected" 
        });
      }
      
      // Get schools by approval status
      const schools = await storage.getSchoolsByApprovalStatus(validStatus.data);
      
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools by approval status:", error);
      res.status(500).json({ error: "Failed to fetch schools" });
    }
  }
);

// Get school change requests by status for platform admin
schoolApprovalRouter.get(
  "/change-requests/status/:status",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      
      // Validate status parameter
      const validStatus = z.enum(["pending", "approved", "rejected"]).safeParse(status);
      
      if (!validStatus.success) {
        return res.status(400).json({ 
          error: "Invalid status parameter. Must be one of: pending, approved, rejected" 
        });
      }
      
      // Get school change requests by status
      const requests = await storage.getSchoolChangeRequestsByStatus(validStatus.data);
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching school change requests by status:", error);
      res.status(500).json({ error: "Failed to fetch change requests" });
    }
  }
);

// Get all school change requests
schoolApprovalRouter.get(
  "/change-requests",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      // Get all school change requests
      const requests = await storage.getAllSchoolChangeRequests();
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching all school change requests:", error);
      res.status(500).json({ error: "Failed to fetch change requests" });
    }
  }
);

// Approve/reject school change request
schoolApprovalRouter.patch(
  "/change-requests/:requestId/review",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.requestId);
      
      if (isNaN(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }
      
      // Validate request body
      const reviewSchema = z.object({
        status: z.enum(["approved", "rejected"]),
        notes: z.string().optional(),
      });
      
      const validatedData = reviewSchema.parse(req.body);
      
      // Update the change request status
      const request = await storage.reviewSchoolChangeRequest(
        requestId,
        validatedData.status,
        req.session.userId!,
        validatedData.notes
      );
      
      // Create notification for the user who requested the change
      if (request.requestedById) {
        try {
          let notificationTitle = "";
          let notificationMessage = "";
          let notificationType = "";
          
          if (validatedData.status === "approved") {
            notificationTitle = "Change Request Approved";
            notificationMessage = `Your school change request (${request.requestType}) has been approved!`;
            notificationType = "approval";
          } else if (validatedData.status === "rejected") {
            notificationTitle = "Change Request Rejected";
            notificationMessage = `Your school change request (${request.requestType}) has been rejected. ${validatedData.notes ? `Notes: ${validatedData.notes}` : ''}`;
            notificationType = "rejection";
          }
          
          await storage.createUserNotification({
            userId: request.requestedById,
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            entityType: "change_request",
            entityId: request.id
          });
          
          console.log(`Notification created for user (${request.requestedById}) about change request status`);
        } catch (notifError) {
          console.error("Failed to create change request notification:", notifError);
          // Continue despite error
        }
      }
      
      // If the change request was approved and it's a new school request, 
      // create the school in approved status
      if (validatedData.status === "approved" && request.requestType === "create") {
        try {
          const schoolData = request.requestData;
          
          // Create the school with approved status and set admin_id if not present
          // Use the user who submitted the request as admin if not specified
          const newSchool = await storage.createSchool({
            ...schoolData,
            approvalStatus: "approved",
            admin_id: schoolData.admin_id || request.requestedById
          });
          
          console.log("Created approved school with admin_id:", schoolData.admin_id || request.requestedById);
          
          res.json({ 
            message: "School request approved and new school created",
            request,
            school: newSchool
          });
        } catch (error) {
          console.error("Error creating approved school:", error);
          res.status(500).json({ error: "Failed to create school after approval" });
        }
      } else if (validatedData.status === "approved" && request.requestType === "update" && request.schoolId) {
        try {
          // Update the existing school
          const updatedSchool = await storage.updateSchool(
            request.schoolId,
            {
              ...request.requestData,
              approvalStatus: "approved"
            }
          );
          
          res.json({
            message: "School update request approved and school updated",
            request,
            school: updatedSchool
          });
        } catch (error) {
          console.error("Error updating school after approval:", error);
          res.status(500).json({ error: "Failed to update school after approval" });
        }
      } else {
        res.json({ 
          message: `Request ${validatedData.status === "approved" ? "approved" : "rejected"}`,
          request
        });
      }
    } catch (error) {
      console.error("Error reviewing change request:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      
      res.status(500).json({ error: "Failed to process request" });
    }
  }
);

// Directly update school approval status
schoolApprovalRouter.patch(
  "/schools/:schoolId/status",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      
      // Validate request body
      const statusSchema = z.object({
        status: z.enum(["pending", "approved", "rejected"]),
        rejectionReason: z.string().optional(),
        verificationStatus: z.boolean().optional(),
      });
      
      const validatedData = statusSchema.parse(req.body);
      
      // Get the current school
      const currentSchool = await storage.getSchool(schoolId);
      
      if (!currentSchool) {
        return res.status(404).json({ error: "School not found" });
      }
      
      // Prepare update data
      let updateData: any = {
        approvalStatus: validatedData.status,
        rejectionReason: validatedData.status === "rejected" ? validatedData.rejectionReason : null,
        approvedAt: validatedData.status === "approved" ? new Date() : null,
        approvedById: validatedData.status === "approved" ? req.session.userId! : null
      };
      
      // Add verification status if it's included in the request
      if (validatedData.verificationStatus !== undefined) {
        updateData.verificationStatus = validatedData.verificationStatus;
        
        // If verifying, add verification timestamp and admin ID
        if (validatedData.verificationStatus === true) {
          updateData.verifiedAt = new Date();
          updateData.verifiedById = req.session.userId!;
        } else {
          // If unverifying, remove verification data
          updateData.verifiedAt = null;
          updateData.verifiedById = null;
        }
      }
      
      // Update the school
      const updatedSchool = await storage.updateSchool(schoolId, updateData);
      
      // Create an activity log
      let action = `school_${validatedData.status}`;
      let metadata: any = {
        previousStatus: currentSchool.approvalStatus,
        newStatus: validatedData.status,
        rejectionReason: validatedData.rejectionReason,
      };
      
      // If verification status changed, log that as well
      if (validatedData.verificationStatus !== undefined) {
        action = validatedData.verificationStatus ? 'school_verified' : 'school_unverified';
        metadata = {
          ...metadata,
          previousVerificationStatus: currentSchool.verificationStatus,
          newVerificationStatus: validatedData.verificationStatus
        };
      }
      
      await storage.createActivityLog({
        userId: req.session.userId!,
        action: action,
        entityType: "school",
        entityId: schoolId,
        metadata: metadata
      });
      
      // Create notification for the school admin
      if (currentSchool.admin_id) {
        // Define notification message based on status
        let notificationTitle = "";
        let notificationMessage = "";
        let notificationType = "";
        
        if (validatedData.status === "approved") {
          notificationTitle = "School Approved";
          notificationMessage = `Your school "${currentSchool.name}" has been approved!`;
          notificationType = "approval";
        } else if (validatedData.status === "rejected") {
          notificationTitle = "School Rejected";
          notificationMessage = `Your school "${currentSchool.name}" has been rejected. Reason: ${validatedData.rejectionReason || "Not specified"}`;
          notificationType = "rejection";
        } else if (validatedData.status === "pending") {
          notificationTitle = "School Status Updated";
          notificationMessage = `Your school "${currentSchool.name}" has been set to pending review.`;
          notificationType = "pending";
        }
        
        // If status has changed, create notification
        if (currentSchool.approvalStatus !== validatedData.status) {
          try {
            await storage.createUserNotification({
              userId: currentSchool.admin_id,
              title: notificationTitle,
              message: notificationMessage,
              type: notificationType,
              entityType: "school",
              entityId: schoolId
            });
            console.log(`Notification created for school admin (${currentSchool.admin_id}) about school status change`);
          } catch (notifError) {
            console.error("Failed to create notification:", notifError);
            // Continue despite error
          }
        }
        
        // If verification status changed, create notification
        if (validatedData.verificationStatus !== undefined && 
            currentSchool.verificationStatus !== validatedData.verificationStatus) {
          try {
            const verificationTitle = validatedData.verificationStatus 
              ? "School Verified" 
              : "School Verification Removed";
            const verificationMessage = validatedData.verificationStatus 
              ? `Your school "${currentSchool.name}" has been verified!` 
              : `Verification for "${currentSchool.name}" has been removed.`;
              
            await storage.createUserNotification({
              userId: currentSchool.admin_id,
              title: verificationTitle,
              message: verificationMessage,
              type: validatedData.verificationStatus ? "approval" : "system",
              entityType: "school",
              entityId: schoolId
            });
            console.log(`Notification created for school admin (${currentSchool.admin_id}) about verification status change`);
          } catch (notifError) {
            console.error("Failed to create verification notification:", notifError);
            // Continue despite error
          }
        }
      }
      
      // Create appropriate success message
      let message = `School ${validatedData.status === "approved" ? "approved" : 
                        validatedData.status === "rejected" ? "rejected" : "set to pending"}`;
                        
      // If verification status was changed, include that in the message
      if (validatedData.verificationStatus !== undefined) {
        message = validatedData.verificationStatus 
          ? "School has been verified" 
          : "School verification has been removed";
      }
      
      res.json({ 
        message: message,
        school: updatedSchool
      });
    } catch (error) {
      console.error("Error updating school approval status:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data", details: error.errors });
      }
      
      res.status(500).json({ error: "Failed to update school status" });
    }
  }
);

// Get statistics on school approval
schoolApprovalRouter.get(
  "/stats",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      // Get counts for each approval status
      const pendingCount = await storage.getSchoolCountByStatus("pending");
      const approvedCount = await storage.getSchoolCountByStatus("approved");
      const rejectedCount = await storage.getSchoolCountByStatus("rejected");
      
      // Get counts for change requests
      const pendingRequestCount = await storage.getSchoolChangeRequestCountByStatus("pending");
      const approvedRequestCount = await storage.getSchoolChangeRequestCountByStatus("approved");
      const rejectedRequestCount = await storage.getSchoolChangeRequestCountByStatus("rejected");
      
      res.json({
        schools: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total: pendingCount + approvedCount + rejectedCount
        },
        changeRequests: {
          pending: pendingRequestCount,
          approved: approvedRequestCount,
          rejected: rejectedRequestCount,
          total: pendingRequestCount + approvedRequestCount + rejectedRequestCount
        }
      });
    } catch (error) {
      console.error("Error fetching approval statistics:", error);
      res.status(500).json({ error: "Failed to fetch approval statistics" });
    }
  }
);