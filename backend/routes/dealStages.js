const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// GET ALL DEAL STAGES
router.get("/", authMiddleware, async (req, res) => {
    try {
        const workspaceId = req.user.workspaceId;

        const result = await db.query(
            `SELECT
                id,
                name,
                probability,
                order_index
             FROM deal_stages
             WHERE workspace_id = $1
             ORDER BY order_index ASC`,
            [workspaceId]
        );

        res.json({
            success: true,
            stages: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch deal stages"
        });
    }
});


module.exports = router;