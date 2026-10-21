import { Resend } from 'resend'

/**
 * Server-side email delivery for CivicTrack Gambia confirmation emails.
 *
 * All configuration is read from server-side environment variables only
 * (`RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`). Nothing in this file is
 * imported by the Vite frontend, so API keys and sender addresses never reach
 * the browser.
 */

/**
 * Minimal email-provider interface. Keeps the rest of the service decoupled
 * from the Resend SDK so delivery can be faked in tests without sending real
 * emails and without creating duplicate reports.
 */
export interface EmailProvider {
  send(params: {
    to: string
    subject: string
    html: string
    text: string
  }): Promise<{ accepted: boolean; error?: unknown }>
}

/**
 * Resend implementation of EmailProvider.
 * Resend's SDK resolves `{ data, error }` for API errors and throws for
 * transport failures; both are treated as non-acceptance here.
 */
class ResendProvider implements EmailProvider {
  private client: InstanceType<typeof Resend>['emails']

  constructor(apiKey: string) {
    this.client = new Resend(apiKey).emails
  }

  async send(params: {
    to: string
    subject: string
    html: string
    text: string
  }): Promise<{ accepted: boolean; error?: unknown }> {
    try {
      const result = (await this.client.send({
        from: process.env.EMAIL_FROM ?? 'CivicTrack Gambia <onboarding@resend.dev>',
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      })) as { data?: { id?: string }; error?: unknown }

      if (result.error) {
        return { accepted: false, error: result.error }
      }
      return { accepted: true }
    } catch (error) {
      return { accepted: false, error }
    }
  }
}

/**
 * Build the email provider from server-side environment variables.
 * Returns null when delivery is not configured (e.g. local dev without a
 * Resend key). Callers must degrade gracefully: the report is still saved.
 */
export function getEmailProvider(): EmailProvider | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.startsWith('re_your_')) {
    return null
  }
  return new ResendProvider(apiKey)
}

const MAX_ATTEMPTS = 3
const BASE_BACKOFF_MS = 1000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Escape user-supplied text before inserting it into HTML. Prevents HTML
 * injection from report titles, locations, or categories supplied by citizens.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface ConfirmationEmailParams {
  to: string
  referenceCode: string
  title: string
  categoryLabel: string
  location: string
  trackingUrl: string
}

/**
 * HTML body of the confirmation email. Responsive (mobile-first), accessible,
 * and contains only non-sensitive complaint details.
 * Exported for unit testing of email content.
 */
export function buildConfirmationHtml(params: ConfirmationEmailParams): string {
  const { referenceCode, title, categoryLabel, location, trackingUrl } = params
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your CivicTrack Gambia report has been received</title>
  </head>
  <body style="margin:0; padding:0; background:#f0f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; line-height:1.6; color:#1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f0f5f9; padding:20px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">
            <!-- Header -->
            <tr>
              <td align="center" style="background:#0f172a; padding:24px 20px; color:#ffffff;">
                <h1 style="margin:0; font-size:20px; font-weight:800; letter-spacing:-0.02em;">CivicTrack Gambia</h1>
                <p style="margin:4px 0 0; font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em;">Community Infrastructure Registry</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:30px 24px;">
                <h2 style="margin:0 0 12px; font-size:20px; font-weight:800; color:#0f172a;">Your report has been received</h2>
                <p style="margin:0 0 20px; font-size:15px; color:#475569;">
                  Thank you for reporting this issue in your community. Your complaint has been logged in the
                  municipal tracking queue and a unique reference code has been assigned.
                </p>

                <!-- Reference code panel -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px; margin:0 0 24px; text-align:center;">
                  <tr>
                    <td style="padding:18px 12px;">
                      <p style="margin:0 0 8px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:#64748b;">Official tracking code &mdash; save this</p>
                      <p style="margin:0; font-size:22px; font-weight:900; letter-spacing:0.08em; color:#0f172b; font-family:'Courier New',Courier,monospace;">
                        ${escapeHtml(referenceCode)}
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Complaint summary -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="font-size:13px; font-weight:700; color:#0f172a; text-transform:uppercase; letter-spacing:0.08em; padding:0 0 8px;">Complaint summary</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px; background:#f1f5f9; border-radius:8px; border-left:4px solid #2563eb;">
                      <p style="margin:4px 0; font-size:14px; color:#334155;"><strong>Issue:</strong> ${escapeHtml(title)}</p>
                      <p style="margin:4px 0; font-size:14px; color:#334155;"><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
                      <p style="margin:4px 0 0; font-size:14px; color:#334155;"><strong>Location:</strong> ${escapeHtml(location)}</p>
                    </td>
                  </tr>
                </table>

                <!-- Tracking link -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" style="padding:0 0 24px;">
                      <a href="${escapeHtml(trackingUrl)}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; border-radius:8px; padding:14px 24px; font-size:15px; font-weight:700; border:2px solid #2563eb;">Track your report</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 10px; font-size:14px; color:#475569;">
                  You can check the status, inspection notes, and resolution of your report at any time using the
                  reference code above.
                </p>
                <p style="margin:0; font-size:14px; color:#475569;">
                  Please <strong>retain this email</strong> for future reference. It contains your tracking code,
                  which anyone can use to view public progress on your report. Your email address is never shown on
                  the public tracking page.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="padding:20px 24px; color:#64748b; font-size:12px; border-top:1px solid #e2e8f0;">
                CivicTrack Gambia &mdash; an independent civic technology prototype.<br/>
                Not an official government filing. Keep this email for your records.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim()
}

/**
 * Plain-text fallback for the confirmation email.
 * Exported for unit testing of email content.
 */
export function buildConfirmationText(params: ConfirmationEmailParams): string {
  const { referenceCode, title, categoryLabel, location, trackingUrl } = params
  return [
    'CivicTrack Gambia — Your report has been received',
    '',
    'Thank you for reporting this issue in your community. Your complaint has been logged in the',
    'municipal tracking queue and a unique reference code has been assigned.',
    '',
    'Official tracking code (save this): ' + referenceCode,
    '',
    'Complaint summary:',
    '  Issue: ' + title,
    '  Category: ' + categoryLabel,
    '  Location: ' + location,
    '',
    'Track your report: ' + trackingUrl,
    '',
    'You can check the status, inspection notes, and resolution of your report at any time',
    'using the reference code above.',
    '',
    'Please retain this email for future reference. Your email address is never shown on',
    'the public tracking page.',
    '',
    'CivicTrack Gambia — an independent civic technology prototype.',
    'Not an official government filing. Keep this email for your records.',
  ].join('\n')
}

/**
 * Parameters for {@link sendConfirmationEmail}.
 */
export interface SendConfirmationEmailInput {
  to: string
  referenceCode: string
  title: string
  categoryLabel: string
  location: string
  trackingUrl: string
}

/**
 * Send the report confirmation email to the citizen.
 *
 * The report must already be persisted before this is called. Delivery
 * failures are captured and returned as `accepted: false` — they never throw,
 * so a failed email never makes a successfully saved report appear to have
 * failed and never creates a duplicate report.
 *
 * Retries delivery up to {@link MAX_ATTEMPTS} times with a short backoff on
 * transient provider failures.
 */
export async function sendConfirmationEmail(
  input: SendConfirmationEmailInput,
  provider: EmailProvider | null = getEmailProvider()
): Promise<{ accepted: boolean; error?: unknown }> {
  if (!provider) {
    return { accepted: false, error: 'Email provider is not configured' }
  }

  const html = buildConfirmationHtml(input)
  const text = buildConfirmationText(input)

  let lastError: unknown = null
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = await provider.send({
      to: input.to,
      subject: `CivicTrack Gambia — Report received (${input.referenceCode})`,
      html,
      text,
    })
    if (result.accepted) {
      return { accepted: true }
    }
    lastError = result.error
    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(BASE_BACKOFF_MS * (attempt + 1))
    }
  }
  return { accepted: false, error: lastError }
}
