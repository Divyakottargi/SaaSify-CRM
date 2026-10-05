const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// REGISTER
router.post(
    "/register",
    [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Name is required")
            .isLength({ min: 2, max: 100 })
            .withMessage("Name must be between 2 and 100 characters"),

        body("email")
            .trim()
            .isEmail()
            .withMessage("Please provide a valid email address")
            .normalizeEmail(),

        body("password")
            .isLength({ min: 6, max: 100 })
            .withMessage("Password must be between 6 and 100 characters"),

        body("workspaceId")
            .notEmpty()
            .withMessage("Workspace ID is required")
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
            const { name, email, password, workspaceId } = req.body;

            const existingUser = await db.query(
                "SELECT id FROM users WHERE email = $1",
                [email]
            );

            if (existingUser.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Email already registered"
                });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const result = await db.query(
                `INSERT INTO users
                (name, email, password_hash, workspace_id)
                VALUES ($1, $2, $3, $4)
                RETURNING id, name, email, role, workspace_id, created_at`,
                [name, email, passwordHash, workspaceId]
            );

            res.status(201).json({
                success: true,
                message: "User registered successfully",
                user: result.rows[0]
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// LOGIN
router.post(
    "/login",
    [
        body("email")
            .trim()
            .isEmail()
            .withMessage("Please provide a valid email address")
            .normalizeEmail(),

        body("password")
            .notEmpty()
            .withMessage("Password is required")
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
            const { email, password } = req.body;

            const result = await db.query(
                "SELECT * FROM users WHERE email = $1",
                [email]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            const user = result.rows[0];

            const passwordMatch = await bcrypt.compare(
                password,
                user.password_hash
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            const token = jwt.sign(
                {
                    userId: user.id,
                    role: user.role,
                    workspaceId: user.workspace_id
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1h"
                }
            );

            res.json({
                success: true,
                message: "Login successful",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    workspaceId: user.workspace_id
                }
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// LOGOUT
router.post("/logout", (req, res) => {
    res.json({
        success: true,
        message: "Logout successful. Remove the JWT token from the client."
    });
});

module.exports = router;