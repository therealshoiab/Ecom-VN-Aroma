// Edge-compatible Resend Email Integration using Native Fetch API
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'VN Aroma <onboarding@resend.dev>';

  // Mock Mode: If API key is placeholder or empty, log to console instead of crashing
  if (!apiKey || apiKey === 're_placeholder' || apiKey.includes('your_')) {
    console.log('==================================================');
    console.log('📢 [MOCK EMAIL SENT]');
    console.log(`👉 TO:      ${to}`);
    console.log(`👉 FROM:    ${from}`);
    console.log(`👉 SUBJECT: ${subject}`);
    console.log('👉 CONTENT:');
    console.log(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
    console.log('==================================================');
    return { success: true, mock: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend API Error:', errText);
      return { success: false, error: errText };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}
