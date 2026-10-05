const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// CREATE CONTACT
router.post(
    "/",
    authMiddleware,
    [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Contact name is required")
            .isLength({ max: 100 })
            .withMessage("Contact name must not exceed 100 characters"),

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
            .withMessage("Company name is too long")
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
                company
            } = req.body;

            const result = await db.query(
                `INSERT INTO contacts
                (workspace_id, name, email, phone, company)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    id,
                    name,
                    email,
                    phone,
                    company,
                    created_at,
                    updated_at`,
                [
                    workspaceId,
                    name,
                    email || null,
                    phone || null,
                    company || null
                ]
            );

            res.status(201).json({
                success: true,
                message: "Contact created successfully",
                contact: result.rows[0]
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to create contact"
            });
        }
    }
);


// GET ALL CONTACTS
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
                created_at,
                updated_at
             FROM contacts
             WHERE workspace_id = $1
             AND deleted_at IS NULL
             ORDER BY created_at DESC`,
            [workspaceId]
        );

        res.json({
            success: true,
            contacts: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch contacts"
        });
    }
});


// GET ONE CONTACT
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const contactId = req.params.id;

        const result = await db.query(
            `SELECT
                id,
                name,
                email,
                phone,
                company,
                created_at,
                updated_at
             FROM contacts
             WHERE id = $1
             AND workspace_id = $2
             AND deleted_at IS NULL`,
            [contactId, workspaceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Contact not found"
            });
        }

        res.json({
            success: true,
            contact: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch contact"
        });
    }
});


// UPDATE CONTACT
router.put(
    "/:id",
    authMiddleware,
    [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Contact name is required")
            .isLength({ max: 100 })
            .withMessage("Contact name must not exceed 100 characters"),

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
            .withMessage("Company name is too long")
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
            const contactId = req.params.id;

            const {
                name,
                email,
                phone,
                company
            } = req.body;

            const result = await db.query(
                `UPDATE contacts
                 SET
                    name = $1,
                    email = $2,
                    phone = $3,
                    company = $4,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5
                 AND workspace_id = $6
                 AND deleted_at IS NULL
                 RETURNING
                    id,
                    name,
                    email,
                    phone,
                    company,
                    created_at,
                    updated_at`,
                [
                    name,
                    email || null,
                    phone || null,
                    company || null,
                    contactId,
                    workspaceId
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Contact not found"
                });
            }

            res.json({
                success: true,
                message: "Contact updated successfully",
                contact: result.rows[0]
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to update contact"
            });
        }
    }
);


// DELETE CONTACT - SOFT DELETE
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const contactId = req.params.id;

        const result = await db.query(
            `UPDATE contacts
             SET
                deleted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             AND workspace_id = $2
             AND deleted_at IS NULL
             RETURNING id`,
            [contactId, workspaceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Contact not found"
            });
        }

        res.json({
            success: true,
            message: "Contact deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to delete contact"
        });
    }
});

 
module.exports = router;