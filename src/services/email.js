import nodemailer from 'nodemailer';

// Pull in Environments variables
const EMAIL_OPTIONS = Object.freeze({
    authUser: process.env.AUTH_EMAIL_USERNAME,
    authPass: process.env.AUTH_EMAIL_PASSWORD,
    host: process.env.MAIL_TRAP_HOST,
    post: process.env.MAIL_TRAP_PORT
});

async function main(mailOptions) {
    // Create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: EMAIL_OPTIONS.host,
        port: EMAIL_OPTIONS.port,
        auth: {
            user: EMAIL_OPTIONS.authUser,
            pass: EMAIL_OPTIONS.authPass
        }
    });

    // Send mail with defined transport object
    const info = await transporter.sendMail({
        from: mailOptions?.from,
        to: mailOptions?.to,
        subject: mailOptions?.subject,
        text: mailOptions?.text,
        html: mailOptions?.html
    });

    return info;
}

export default main;
