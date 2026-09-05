import nodemailer from "nodemailer";

interface SendInviteEmailParams {
  to: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  inviteLink: string;
}

export async function sendInviteEmail({
  to,
  inviterName,
  inviterEmail,
  role,
  inviteLink,
}: SendInviteEmailParams): Promise<{ success: boolean; error?: string; provider?: string }> {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>You've been invited to ContextCrafter</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1326; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #dae2fd;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b1326; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background: #131b2e; border: 1px solid rgba(195, 192, 255, 0.15); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; background: linear-gradient(180deg, rgba(79, 70, 229, 0.15) 0%, rgba(19, 27, 46, 0) 100%);">
              <div style="display: inline-block; padding: 10px 14px; background: rgba(79, 70, 229, 0.2); border: 1px solid rgba(195, 192, 255, 0.3); border-radius: 12px; margin-bottom: 16px;">
                <span style="font-size: 20px; font-weight: 700; color: #c3c0ff; letter-spacing: -0.5px;">ContextCrafter</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                Workspace Invitation
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <p style="font-size: 15px; line-height: 24px; color: #c7c4d8; margin: 0 0 20px 0;">
                Hello,
              </p>
              <p style="font-size: 15px; line-height: 24px; color: #c7c4d8; margin: 0 0 24px 0;">
                <strong style="color: #ffffff;">${inviterName || inviterEmail}</strong> has invited you to collaborate on their codebase intelligence workspace as a <strong style="color: #4cd7f6;">${role}</strong>.
              </p>

              <!-- Role & Details Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #918fa1; letter-spacing: 0.5px;">Invited By</td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: #dae2fd;">${inviterName} (${inviterEmail})</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #918fa1; letter-spacing: 0.5px; padding-top: 8px;">Assigned Role</td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: #4cd7f6; padding-top: 8px;">${role}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                      Accept Invitation & Join Workspace
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 18px; color: #918fa1; margin: 28px 0 0 0; text-align: center;">
                Or copy and paste this link into your browser:<br/>
                <a href="${inviteLink}" style="color: #4cd7f6; word-break: break-all;">${inviteLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="font-size: 12px; color: #918fa1; margin: 0;">
                If you were not expecting this invitation, you can ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // 1. Try SMTP / Nodemailer first if SMTP credentials exist (works great with Gmail app password)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    try {
      const port = Number(process.env.SMTP_PORT) || 587;
      const isGmail = process.env.SMTP_HOST.includes("gmail");

      const transporter = nodemailer.createTransport(
        isGmail
          ? {
              service: "gmail",
              auth: {
                user: process.env.SMTP_USER.trim(),
                pass: process.env.SMTP_PASSWORD.trim().replace(/\s+/g, ""), // handle spaces in Google App Passwords
              },
            }
          : {
              host: process.env.SMTP_HOST.trim(),
              port: port,
              secure: port === 465,
              auth: {
                user: process.env.SMTP_USER.trim(),
                pass: process.env.SMTP_PASSWORD.trim(),
              },
            }
      );

      const fromAddress = process.env.EMAIL_FROM || `"ContextCrafter" <${process.env.SMTP_USER.trim()}>`;

      await transporter.sendMail({
        from: fromAddress,
        to,
        subject: `${inviterName || "A team member"} invited you to ContextCrafter`,
        html: htmlContent,
      });

      console.log(`[EMAIL_SUCCESS] Sent invitation via SMTP (${process.env.SMTP_HOST}) to ${to}`);
      return { success: true, provider: "Gmail/SMTP" };
    } catch (e: any) {
      console.warn("[EMAIL_SMTP_FAILED, FALLING_BACK_IF_POSSIBLE]", e?.message || e);
      // Fall through to try Resend if available
    }
  }

  // 2. Try Resend if RESEND_API_KEY is defined
  if (process.env.RESEND_API_KEY) {
    try {
      // Resend free tier requires onboarding@resend.dev unless a custom domain is verified
      let fromAddress = process.env.EMAIL_FROM || "ContextCrafter <onboarding@resend.dev>";
      
      // If the email_from has an unverified public domain like @gmail.com or @yahoo.com, force onboarding@resend.dev
      if (
        fromAddress.includes("@gmail.com") ||
        fromAddress.includes("@yahoo.com") ||
        fromAddress.includes("@hotmail.com") ||
        fromAddress.includes("@outlook.com")
      ) {
        fromAddress = "ContextCrafter <onboarding@resend.dev>";
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          reply_to: inviterEmail || undefined,
          subject: `${inviterName || "A team member"} invited you to ContextCrafter`,
          html: htmlContent,
        }),
      });

      const data = await res.json();

      if (res.ok && data.id) {
        console.log(`[EMAIL_SUCCESS] Sent invitation via Resend to ${to}, ID: ${data.id}`);
        return { success: true, provider: "Resend" };
      }
      
      console.warn("[EMAIL_RESEND_FAILED]", data);
      return {
        success: false,
        error: data.message || "Resend rejected delivery",
        provider: "Resend",
      };
    } catch (e: any) {
      console.warn("[EMAIL_RESEND_ERROR]", e);
      return {
        success: false,
        error: e?.message || "Failed to reach Resend API",
        provider: "Resend",
      };
    }
  }

  // 3. Fallback: Log email details for local dev
  console.log(`\n========================================\n[EMAIL DISPATCH SIMULATION]\nTo: ${to}\nFrom: ${inviterEmail}\nLink: ${inviteLink}\n========================================\n`);

  return {
    success: true,
    provider: "Simulated/Dev",
  };
}

