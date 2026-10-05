const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    [
        body("type")
            .trim()
            .notEmpty()
            .withMessage("Activity type is required")
            .isLength({ max: 50 })
            .withMessage("Activity type is too long"),

        body("subject")
            .optional({ values: "falsy" })
            .trim()
            .isLength({ max: 200 })
            .withMessage("Subject is too long"),

        body("description")
            .optional({ values: "falsy" })
            .trim()
            .isLength({ max: 2000 })
            .withMessage("Description is too long")
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
                contactId,
                dealId,
                type,
                subject,
                description
            } = req.body;

            if (contactId) {
                const contactCheck = await db.query(
                    `SELECT id FROM contacts
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
                    `SELECT id FROM deals
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

            const result = await db.query(
                `INSERT INTO activities
                    (workspace_id, user_id, contact_id, deal_id, type, subject, description)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [
                    workspaceId,
                    userId,
                    contactId || null,
                    dealId || null,
                    type,
                    subject || null,
                    description || null
                ]
            );

            res.status(201).json({
                success: true,
                message: "Activity created successfully",
                activity: result.rows[0]
            });

        } catch (error) {
            console.error("Create activity error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to create activity"
            });
        }
    }
);

router.get("/", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const result = await db.query(
            `SELECT
                a.id,
                a.type,
                a.subject,
                a.description,
                a.created_at,
                a.contact_id,
                c.name AS contact_name,
                a.deal_id,
                d.title AS deal_title,
                a.user_id,
                u.name AS user_name
             FROM activities a
             LEFT JOIN contacts c ON a.contact_id = c.id
             LEFT JOIN deals d ON a.deal_id = d.id
             LEFT JOIN users u ON a.user_id = u.id
             WHERE a.workspace_id = $1
             ORDER BY a.created_at DESC`,
            [workspaceId]
        );

        res.json({
            success: true,
            activities: result.rows
        });

    } catch (error) {
        console.error("Get activities error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch activities"
        });
    }
});

module.exports = router;