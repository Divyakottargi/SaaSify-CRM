const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const authRoutes = require("./routes/auth");
const leadsRoutes = require("./routes/leads");
const contactsRoutes = require("./routes/contacts");
const dealsRoutes = require("./routes/deals");
const dealStagesRoutes = require("./routes/dealStages");
const activitiesRoutes = require("./routes/activities");
const emailsRoutes = require("./routes/emails");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const app = express();
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

app.use("/api", apiLimiter);
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
//contact routes
app.use("/api/contacts", contactsRoutes);
//deals routes
app.use("/api/deals", dealsRoutes);
//dealstages
app.use("/api/deal-stages", dealStagesRoutes);
//activitesroutes
app.use("/api/activities", activitiesRoutes);
//email routes
app.use("/api/emails", emailsRoutes);
//helmet
app.use(helmet());
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
const PORT = process.env.PORT || 10000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;