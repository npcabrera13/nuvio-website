// Cloudflare Pages Function — NOT a Next.js route
// This runs natively on Cloudflare Workers, bypasses Next.js build entirely
// worker-mailer works here because there's no webpack/turbopack involved

import { WorkerMailer } from "worker-mailer";

interface Env {
  SMTP_EMAIL: string;
  SMTP_PASSWORD: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;  // plain-text alternative (helps with spam filters)
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { to, subject, html, text } = await request.json() as EmailRequest;

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const smtpEmail = env.SMTP_EMAIL;
    const smtpPassword = env.SMTP_PASSWORD;

    if (!smtpEmail || !smtpPassword) {
      return new Response(JSON.stringify({ error: 'SMTP credentials not configured. Set SMTP_EMAIL and SMTP_PASSWORD env vars in Cloudflare.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const mailer = await WorkerMailer.connect({
      credentials: {
        username: smtpEmail,
        password: smtpPassword,
      },
      authType: 'plain',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
    });

    await mailer.send({
      from: { name: 'Nuvio', email: smtpEmail },
      to: { email: to },
      subject: subject,
      html: html,
      text: text,  // plain-text alternative — multipart email
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Email error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
