const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const { sendEmail } = require("../services/emailService");
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.post(
    "/send",
    authMiddleware,
    [
        body("to")
            .trim()
            .isEmail()
            .withMessage("Please provide a valid recipient email")
            .normalizeEmail(),

        body("subject")
            .trim()
            .notEmpty()
            .withMessage("Email subject is required")
            .isLength({ max: 200 })
            .withMessage("Email subject is too long"),

        body("text")
            .trim()
            .notEmpty()
            .withMessage("Email message is required")
            .isLength({ max: 5000 })
            .withMessage("Email message is too long")
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

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

            const emailInfo = await sendEmail({
                to,
                subject,
                text
            });

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
                    to,
                    subject
                },
                activity: activityResult.rows[0]
            });

        } catch (error) {
            console.error("Send email error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to send email"
            });
        }
    }
);

module.exports = router;