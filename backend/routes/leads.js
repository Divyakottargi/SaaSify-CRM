const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// CREATE LEAD
router.post(
    "/",
    authMiddleware,
    [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Lead name is required")
            .isLength({ max: 100 })
            .withMessage("Lead name must not exceed 100 characters"),

        body("email")
            .optional({ values: "falsy" })
            .trim()
            .isEmail()
            .withMessage("Please provide a valid email address")
            .normalizeEmail(),

        body("phone")
            .optional({ values: "falsy" })
            .trim()
            .isLength({ max: 20 })
            .withMessage("Phone number is too long"),

        body("company")
            .optional({ values: "falsy" })
            .trim()
            .isLength({ max: 150 })
            .withMessage("Company name is too long"),

        body("status")
            .optional({ values: "falsy" })
            .trim()
            .isLength({ max: 50 })
            .withMessage("Status is too long")
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

            const {
                name,
                email,
                phone,
                company,
                status
            } = req.body;

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
    }
);


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


// GET ONE LEAD
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const leadId = req.params.id;

        const result = await db.query(
            `SELECT
                id,
                name,
                email,
                phone,
                company,
                status,
                created_at,
                updated_at
             FROM leads
             WHERE id = $1
             AND workspace_id = $2
             AND deleted_at IS NULL`,
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
            lead: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch lead"
        });
    }
});


// UPDATE LEAD
router.put(
    "/:id",
    authMiddleware,
    [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Lead name is required")
            .isLength({ max: 100 })
            .withMessage("Lead name must not exceed 100 characters"),

        body("email")
            .optional({ values: "falsy" })
            .trim()
            .isEmail()
            .withMessage("Please provide a valid email address")
            .normalizeEmail(),

        body("phone")
            .optional({ values: "falsy" })
            .trim()
            .isLength({ max: 20 })
            .withMessage("Phone number is too long"),

        body("company")
            .optional({ values: "falsy" })
            .trim()
            .isLength({ max: 150 })
            .withMessage("Company name is too long"),

        body("status")
            .optional({ values: "falsy" })
            .trim()
            .isLength({ max: 50 })
            .withMessage("Status is too long")
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
            const leadId = req.params.id;

            const {
                name,
                email,
                phone,
                company,
                status
            } = req.body;

            const result = await db.query(
                `UPDATE leads
                 SET
                    name = $1,
                    email = $2,
                    phone = $3,
                    company = $4,
                    status = $5,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $6
                 AND workspace_id = $7
                 AND deleted_at IS NULL
                 RETURNING
                    id,
                    name,
                    email,
                    phone,
                    company,
                    status,
                    created_at,
                    updated_at`,
                [
                    name,
                    email || null,
                    phone || null,
                    company || null,
                    status || "new",
                    leadId,
                    workspaceId
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Lead not found"
                });
            }

            res.json({
                success: true,
                message: "Lead updated successfully",
                lead: result.rows[0]
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to update lead"
            });
        }
    }
);


// DELETE LEAD - SOFT DELETE
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const leadId = req.params.id;

        const result = await db.query(
            `UPDATE leads
             SET
                deleted_at = CURRENT_TIMESTAMP,
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