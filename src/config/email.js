const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail.vaatcobd.com",
  port: 587, // or 465 for SSL
  secure: false, // true for 465, false for other ports
  auth: {
    user: "info@vaatcobd.com",
    pass: process.env.EMAIL_PASSWORD, // Store password in environment variable
  },
});

module.exports = transporter;
