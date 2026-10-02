const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE CONTACT
router.post("/", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const {
            name,
            email,
            phone,
            company
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Contact name is required"
            });
        }

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
});


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
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;
        const contactId = req.params.id;

        const {
            name,
            email,
            phone,
            company
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Contact name is required"
            });
        }

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
});


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