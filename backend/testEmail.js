require("dotenv").config();

const {
    verifyEmailConnection
} = require("./services/emailService");

const testConnection = async () => {
    const success = await verifyEmailConnection();

    if (success) {
        console.log("SMTP TEST PASSED");
    } else {
        console.log("SMTP TEST FAILED");
    }

    process.exit();
};

testConnection();