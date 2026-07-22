// emails/functionApprovedTemplate.js
// Returns the plain-text and HTML bodies for the "Function Approved" email.

export function functionApprovedTemplate({ clubName, functionName, bookingNumber, schoolName }) {
  const subject = 'Function Approved';

  const text = `Dear ${clubName || 'Club Patron'},

Your function has been approved.

Function: ${functionName}
Booking Number: ${bookingNumber}

Attached are your approved Master List and Requisition Form.

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
      <p>Your function has been <strong style="color:#1a7a4c;">approved</strong>.</p>
      <table style="width: 100%; margin: 16px 0; font-size: 14px;">
        <tr><td style="color:#5b6472; padding: 4px 0;">Function</td><td style="font-weight:600;">${functionName}</td></tr>
        <tr><td style="color:#5b6472; padding: 4px 0;">Booking Number</td><td style="font-weight:600; font-family: monospace;">${bookingNumber}</td></tr>
      </table>
      <p>Attached are your approved Master List and Requisition Form.</p>
      <p style="margin-top: 24px;">Regards,<br/>Student Welfare Office</p>
    </div>
  </div>`;

  return { subject, text, html };
}