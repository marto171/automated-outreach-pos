const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // For development with self-signed certs, if needed (not recommended for prod)
    // tls: {
    //   rejectUnauthorized: false
    // }
});

const sendEmail = async (to, subject, htmlContent, textContent) => {
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: to, // recipient
        subject: subject,
        text: textContent || htmlContent.replace(/<[^>]*>?/gm, ''), // simple text version
        html: htmlContent,
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

const generateOutreachEmailContent = (manufacturerName, companyTerms) => {
    const subject = `Partnership Opportunity with ${process.env.EMAIL_FROM_NAME}`;
    const htmlContent = `
    <p>Dear ${manufacturerName},</p>
    <p>We are impressed with your products and see a great potential for collaboration. 
    Our company, ${process.env.EMAIL_FROM_NAME}, specializes in helping manufacturers like yours expand their reach and increase sales without relying on traditional distributors.</p>
    <p>We offer a partnership under the following general terms:</p>
    <pre>${companyTerms}</pre>
    <p>We believe this partnership could significantly boost your product visibility and sales. If you are interested in learning more, please reply to this email, and we can schedule a brief call.</p>
    <p>Optionally, you can include your phone number in your reply if you'd prefer us to call you directly.</p>
    <p>Sincerely,</p>
    <p>The Team at ${process.env.EMAIL_FROM_NAME}</p>
  `;
    return { subject, htmlContent };
};

module.exports = {
    sendEmail,
    generateOutreachEmailContent,
};