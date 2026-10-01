const express = require("express");

const router = express.Router();

router.post("/logout", (req, res) => {
    res.json({
        success: true,
        message: "Logout successful. Remove the JWT token from the client."
    });
});

module.exports = router;