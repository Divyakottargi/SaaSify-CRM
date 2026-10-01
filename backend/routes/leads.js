const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE LEAD
router.post("/", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const {
            name,
            email,
            phone,
            company,
            status
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Lead name is required"
            });
        }

        const result = await db.query(
            `INSERT INTO leads
            (workspace_id, name, email, phone, company, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                name,
                email,
                phone,
                company,
                status,
                created_at`,
            [
                workspaceId,
                name,
                email || null,
                phone || null,
                company || null,
                status || "new"
            ]
        );

        res.status(201).json({
            success: true,
            message: "Lead created successfully",
            lead: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to create lead"
        });
    }
});

// GET ALL LEADS
router.get("/", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const result = await db.query(
            `SELECT
                id,
                name,
                email,
                phone,
                company,
                status,
                created_at
             FROM leads
             WHERE workspace_id = $1
             AND deleted_at IS NULL
             ORDER BY created_at DESC`,
            [workspaceId]
        );

        res.json({
            success: true,
            leads: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch leads"
        });
    }
});

// GET TOTAL LEADS
router.get("/count", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const result = await db.query(
            `SELECT COUNT(*) AS total
             FROM leads
             WHERE workspace_id = $1
             AND deleted_at IS NULL`,
            [workspaceId]
        );

        res.json({
            success: true,
            totalLeads: Number(result.rows[0].total)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch lead count"
        });
    }
});
// DELETE LEAD - SOFT DELETE
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const leadId = req.params.id;

        const result = await db.query(
            `UPDATE leads
             SET deleted_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             AND workspace_id = $2
             AND deleted_at IS NULL
             RETURNING id`,
            [leadId, workspaceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        res.json({
            success: true,
            message: "Lead deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to delete lead"
        });
    }
});

module.exports = router;
