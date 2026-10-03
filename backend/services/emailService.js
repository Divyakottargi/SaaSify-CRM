const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const verifyEmailConnection = async () => {
    try {
        await transporter.verify();

        console.log("=================================");
        console.log("Mailtrap SMTP connection successful");
        console.log("=================================");

        return true;
    } catch (error) {
        console.error("=================================");
        console.error("Mailtrap SMTP connection failed");
        console.error(error.message);
        console.error("=================================");

        return false;
    }
};

const sendEmail = async ({ to, subject, text }) => {
    const mail = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: to,
        subject: subject,
        text: text
    });

    return mail;
};

module.exports = {
    transporter,
    verifyEmailConnection,
    sendEmail
};