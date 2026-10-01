const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const authRoutes = require("./routes/auth");
const leadsRoutes = require("./routes/leads");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "SaaSify CRM API is running"
    });
});

// Database test
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await db.query("SELECT NOW() AS current_time");

        res.json({
            success: true,
            message: "Database connected successfully",
            currentTime: result.rows[0].current_time
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// Authentication routes
app.use("/api/auth", authRoutes);
// Leads routes
app.use("/api/leads", leadsRoutes);

// Protected profile route
app.get("/api/profile", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "You accessed a protected route",
        user: req.user
    });
});

// Admin-only route
app.get(
    "/api/admin-test",
    authMiddleware,
    roleMiddleware("admin"),
    (req, res) => {
        res.json({
            success: true,
            message: "Admin access granted"
        });
    }
);
// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SaaSify CRM Backend is running",
    status: "online"
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SaaSify CRM backend running on port ${PORT}`);
});