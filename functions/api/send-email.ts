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
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { to, subject, html } = await request.json() as EmailRequest;

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const smtpEmail = env.SMTP_EMAIL || 'nuviotv1@gmail.com';
    const smtpPassword = env.SMTP_PASSWORD || 'hnpu oblp fizr ejnl';

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
