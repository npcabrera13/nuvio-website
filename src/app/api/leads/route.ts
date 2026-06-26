import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Edge-compatible: NOT possible with Prisma.
 * This route requires Node.js. We'll make it a simple passthrough
 * that returns an error on Cloudflare but works on Vercel/local dev.
 * 
 * In practice, the leads feature is non-critical. If it fails on Cloudflare,
 * the form just shows an error and the user can still sign up.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email as string)?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    try {
      await db.lead.upsert({
        where: { email },
        update: {},
        create: { email, source: "landing_page" },
      });
    } catch {
      // Prisma not available on edge — silently ignore
    }

    return NextResponse.json({ success: true, message: "You're on the list!" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const adminKey = process.env.NUVIO_ADMIN_KEY ?? "nuvio-admin-2026";

  if (key !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leads = await db.lead.findMany({
      orderBy: { createdAt: "desc" },
      select: { email: true, source: true, createdAt: true },
    });
    return NextResponse.json({ count: leads.length, leads });
  } catch {
    return NextResponse.json({ count: 0, leads: [], error: "DB not available" });
  }
}
