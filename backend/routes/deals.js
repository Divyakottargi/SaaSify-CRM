const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// CREATE DEAL
router.post(
    "/",
    authMiddleware,
    [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Deal title is required")
            .isLength({ max: 150 })
            .withMessage("Deal title must not exceed 150 characters"),

        body("stageId")
            .notEmpty()
            .withMessage("Stage ID is required"),

        body("contactId")
            .optional({ values: "falsy" }),

        body("value")
            .optional({ values: "falsy" })
            .isFloat({ min: 0 })
            .withMessage("Deal value must be a valid positive number"),

        body("expectedCloseDate")
            .optional({ values: "falsy" })
            .isISO8601()
            .withMessage("Expected close date must be a valid date")
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
                contactId,
                stageId,
                title,
                value,
                expectedCloseDate
            } = req.body;

            const stageResult = await db.query(
                `SELECT probability
                 FROM deal_stages
                 WHERE id = $1
                 AND workspace_id = $2`,
                [stageId, workspaceId]
            );

            if (stageResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Deal stage not found"
                });
            }

            const probability = stageResult.rows[0].probability;

            const result = await db.query(
                `INSERT INTO deals
                (
                    workspace_id,
                    contact_id,
                    stage_id,
                    title,
                    value,
                    probability,
                    expected_close_date
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING
                    id,
                    workspace_id,
                    contact_id,
                    stage_id,
                    title,
                    value,
                    probability,
                    expected_close_date,
                    created_at,
                    updated_at`,
                [
                    workspaceId,
                    contactId || null,
                    stageId,
                    title,
                    value || 0,
                    probability,
                    expectedCloseDate || null
                ]
            );

            res.status(201).json({
                success: true,
                message: "Deal created successfully",
                deal: result.rows[0]
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to create deal"
            });
        }
    }
);


// GET ALL DEALS
router.get("/", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const result = await db.query(
            `SELECT
                d.id,
                d.title,
                d.value,
                d.probability,
                d.expected_close_date,
                d.created_at,
                d.updated_at,

                c.id AS contact_id,
                c.name AS contact_name,

                s.id AS stage_id,
                s.name AS stage_name

             FROM deals d

             LEFT JOIN contacts c
                ON d.contact_id = c.id

             INNER JOIN deal_stages s
                ON d.stage_id = s.id

             WHERE d.workspace_id = $1
             AND d.deleted_at IS NULL

             ORDER BY d.created_at DESC`,
            [workspaceId]
        );

        res.json({
            success: true,
            deals: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch deals"
        });
    }
});


// GET ONE DEAL
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const dealId = req.params.id;

        const result = await db.query(
            `SELECT
                d.id,
                d.title,
                d.value,
                d.probability,
                d.expected_close_date,
                d.created_at,
                d.updated_at,

                c.id AS contact_id,
                c.name AS contact_name,

                s.id AS stage_id,
                s.name AS stage_name

             FROM deals d

             LEFT JOIN contacts c
                ON d.contact_id = c.id

             INNER JOIN deal_stages s
                ON d.stage_id = s.id

             WHERE d.id = $1
             AND d.workspace_id = $2
             AND d.deleted_at IS NULL`,
            [dealId, workspaceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Deal not found"
            });
        }

        res.json({
            success: true,
            deal: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch deal"
        });
    }
});


// UPDATE DEAL
router.put(
    "/:id",
    authMiddleware,
    [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Deal title is required")
            .isLength({ max: 150 })
            .withMessage("Deal title must not exceed 150 characters"),

        body("stageId")
            .notEmpty()
            .withMessage("Stage ID is required"),

        body("contactId")
            .optional({ values: "falsy" }),

        body("value")
            .optional({ values: "falsy" })
            .isFloat({ min: 0 })
            .withMessage("Deal value must be a valid positive number"),

        body("expectedCloseDate")
            .optional({ values: "falsy" })
            .isISO8601()
            .withMessage("Expected close date must be a valid date")
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
            const dealId = req.params.id;

            const {
                contactId,
                stageId,
                title,
                value,
                expectedCloseDate
            } = req.body;

            const stageResult = await db.query(
                `SELECT probability
                 FROM deal_stages
                 WHERE id = $1
                 AND workspace_id = $2`,
                [stageId, workspaceId]
            );

            if (stageResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Deal stage not found"
                });
            }

            const probability = stageResult.rows[0].probability;

            const result = await db.query(
                `UPDATE deals
                 SET
                    contact_id = $1,
                    stage_id = $2,
                    title = $3,
                    value = $4,
                    probability = $5,
                    expected_close_date = $6,
                    updated_at = CURRENT_TIMESTAMP

                 WHERE id = $7
                 AND workspace_id = $8
                 AND deleted_at IS NULL

                 RETURNING
                    id,
                    contact_id,
                    stage_id,
                    title,
                    value,
                    probability,
                    expected_close_date,
                    created_at,
                    updated_at`,
                [
                    contactId || null,
                    stageId,
                    title,
                    value || 0,
                    probability,
                    expectedCloseDate || null,
                    dealId,
                    workspaceId
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Deal not found"
                });
            }

            res.json({
                success: true,
                message: "Deal updated successfully",
                deal: result.rows[0]
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to update deal"
            });
        }
    }
);


// DELETE DEAL
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const dealId = req.params.id;

        const result = await db.query(
            `UPDATE deals
             SET
                deleted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP

             WHERE id = $1
             AND workspace_id = $2
             AND deleted_at IS NULL

             RETURNING id`,
            [dealId, workspaceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Deal not found"
            });
        }

        res.json({
            success: true,
            message: "Deal deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to delete deal"
        });
    }
});


// UPDATE DEAL STAGE - KANBAN
router.put(
    "/:id/stage",
    authMiddleware,
    [
        body("stageId")
            .notEmpty()
            .withMessage("Stage ID is required")
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
            const dealId = req.params.id;
            const { stageId } = req.body;

            const stageResult = await db.query(
                `SELECT id, name, probability
                 FROM deal_stages
                 WHERE id = $1
                 AND workspace_id = $2`,
                [stageId, workspaceId]
            );

            if (stageResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Deal stage not found"
                });
            }

            const stage = stageResult.rows[0];

            const result = await db.query(
                `UPDATE deals
                 SET
                    stage_id = $1,
                    probability = $2,
                    updated_at = CURRENT_TIMESTAMP

                 WHERE id = $3
                 AND workspace_id = $4
                 AND deleted_at IS NULL

                 RETURNING
                    id,
                    title,
                    value,
                    stage_id,
                    probability,
                    updated_at`,
                [
                    stage.id,
                    stage.probability,
                    dealId,
                    workspaceId
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Deal not found"
                });
            }

            res.json({
                success: true,
                message: "Deal stage updated successfully",
                deal: result.rows[0]
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to update deal stage"
            });
        }
    }
);

module.exports = router;