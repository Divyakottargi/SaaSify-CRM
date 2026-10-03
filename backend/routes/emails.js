const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const { sendEmail } = require("../services/emailService");

const router = express.Router();

/*
    POST /api/emails/send

    Sends an email through Mailtrap
    and saves it as an activity.
*/
router.post("/send", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const userId = req.user.userId;

        const {
            to,
            subject,
            text,
            contactId,
            dealId
        } = req.body;

        // Basic validation
        if (!to || !subject || !text) {
            return res.status(400).json({
                success: false,
                message: "To, subject and message are required"
            });
        }

        // Check contact belongs to workspace
        if (contactId) {
            const contactCheck = await db.query(
                `SELECT id
                 FROM contacts
                 WHERE id = $1
                 AND workspace_id = $2
                 AND deleted_at IS NULL`,
                [contactId, workspaceId]
            );

            if (contactCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Contact not found"
                });
            }
        }

        // Check deal belongs to workspace
        if (dealId) {
            const dealCheck = await db.query(
                `SELECT id
                 FROM deals
                 WHERE id = $1
                 AND workspace_id = $2
                 AND deleted_at IS NULL`,
                [dealId, workspaceId]
            );

            if (dealCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Deal not found"
                });
            }
        }

        // Send email through Mailtrap
        const emailInfo = await sendEmail({
            to,
            subject,
            text
        });

        // Save email as an activity
        const activityResult = await db.query(
            `INSERT INTO activities
                (
                    workspace_id,
                    user_id,
                    contact_id,
                    deal_id,
                    type,
                    subject,
                    description
                )
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                workspaceId,
                userId,
                contactId || null,
                dealId || null,
                "email",
                subject,
                `Email sent to ${to}. Message: ${text}`
            ]
        );

        res.status(201).json({
            success: true,
            message: "Email sent and activity recorded successfully",
            email: {
                messageId: emailInfo.messageId,
                to: to,
                subject: subject
            },
            activity: activityResult.rows[0]
        });

    } catch (error) {
        console.error("Send email error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to send email",
            error: error.message
        });
    }
});

module.exports = router;