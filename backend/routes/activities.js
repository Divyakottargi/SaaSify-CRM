const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
    POST /api/activities
    Create a new activity
*/
router.post("/", authMiddleware, async (req, res) => {
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

        // Basic validation
        if (!type) {
            return res.status(400).json({
                success: false,
                message: "Activity type is required"
            });
        }

        // Check contact belongs to current workspace
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

        // Check deal belongs to current workspace
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

        const result = await db.query(
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
});


/*
    GET /api/activities
    Get activities for current workspace
*/
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

             LEFT JOIN contacts c
                ON a.contact_id = c.id

             LEFT JOIN deals d
                ON a.deal_id = d.id

             LEFT JOIN users u
                ON a.user_id = u.id

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