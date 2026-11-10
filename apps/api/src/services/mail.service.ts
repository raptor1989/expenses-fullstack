import { createTransport } from 'nodemailer';

// Mail goes out only when SMTP_HOST is set; otherwise the reset link is logged instead (local
// development). The API tests and the e2e suite set SMTP_HOST to an empty string on purpose.
export function isMailConfigured(): boolean {
    return Boolean(process.env.SMTP_HOST);
}

export function sendPasswordResetEmail(to: string, resetLink: string) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const transporter = createTransport({
        host: process.env.SMTP_HOST,
        port,
        // 465 speaks TLS from the first byte; 587 upgrades the connection with STARTTLS.
        secure: port === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
    });

    return transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject: 'Reset your Expense Manager password',
        text: [
            'Someone asked to reset the password of your Expense Manager account.',
            '',
            'Open this link to choose a new password. It is valid for 1 hour and works only once:',
            resetLink,
            '',
            'Setting a new password signs you out on every device.',
            "If you didn't ask for this, ignore this email - your password stays the same."
        ].join('\n'),
        html: [
            '<p>Someone asked to reset the password of your Expense Manager account.</p>',
            `<p><a href="${resetLink}">Choose a new password</a></p>`,
            '<p>The link is valid for 1 hour and works only once. Setting a new password signs you out on every device.</p>',
            "<p>If you didn't ask for this, ignore this email - your password stays the same.</p>"
        ].join('\n')
    });
}
