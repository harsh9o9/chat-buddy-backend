import nodemailer from 'nodemailer';

// Pull in Environments variables
const EMAIL_OPTIONS = Object.freeze({
    password: process.env.EMAIL_PASSWORD,
    emailFrom: process.env.EMAIL_FROM,
});

async function main(mailOptions) {
    // Create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: 'gmail', // Use your email provider
        auth: {
            user: EMAIL_OPTIONS.emailFrom,
            pass: EMAIL_OPTIONS.password
        }
    });

    // Send mail with defined transport object
    const info = await transporter.sendMail({
        from: mailOptions.from,
        to: mailOptions?.to,
        subject: mailOptions?.subject,
        text: mailOptions?.text,
        html: mailOptions?.html
    });

    return info;
}

export default main;
