// emails/functionRejectedTemplate.js
// Returns the plain-text and HTML bodies for the "Function Rejected" email.

export function functionRejectedTemplate({ clubName, functionName, bookingNumber, rejectedBy, reason, schoolName }) {
  const subject = 'Function Rejected';

  const text = `Dear ${clubName || 'Club Patron'},

Your function was not approved.

Function: ${functionName}
Booking Number: ${bookingNumber}
Stage: ${rejectedBy}
${reason ? `Reason: ${reason}` : ''}

You are welcome to make the necessary changes and submit a new booking.

Regards,
Student Welfare Office
${schoolName}`;

  const html = `
  <div style="font-family: Arial, sans-serif; color: #1c2530; max-width: 520px; margin: 0 auto;">
    <div style="background: #1f3a63; padding: 24px; border-radius: 10px 10px 0 0;">
      <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0;">${schoolName}</p>
      <p style="color: #d4dce8; font-size: 12px; margin: 4px 0 0;">Student Welfare Office</p>
    </div>
    <div style="border: 1px solid #e2e6ec; border-top: none; padding: 24px; border-radius: 0 0 10px 10px;">
      <p>Dear ${clubName || 'Club Patron'},</p>
      <p>Your function was <strong style="color:#b3261e;">not approved</strong>.</p>
      <table style="width: 100%; margin: 16px 0; font-size: 14px;">
        <tr><td style="color:#5b6472; padding: 4px 0;">Function</td><td style="font-weight:600;">${functionName}</td></tr>
        <tr><td style="color:#5b6472; padding: 4px 0;">Booking Number</td><td style="font-weight:600; font-family: monospace;">${bookingNumber}</td></tr>
        <tr><td style="color:#5b6472; padding: 4px 0;">Rejected At</td><td style="font-weight:600;">${rejectedBy}</td></tr>
        ${reason ? `<tr><td style="color:#5b6472; padding: 4px 0;">Reason</td><td>${reason}</td></tr>` : ''}
      </table>
      <p>You are welcome to make the necessary changes and submit a new booking.</p>
      <p style="margin-top: 24px;">Regards,<br/>Student Welfare Office</p>
    </div>
  </div>`;

  return { subject, text, html };
}