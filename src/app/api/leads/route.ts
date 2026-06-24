import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/leads
 *
 * Collect trial-signup email leads. Stored locally via Prisma (SQLite).
 * Does NOT touch the Nuvio backend.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email as string)?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Upsert: if the email already exists, just acknowledge (no duplicate error).
    await db.lead.upsert({
      where: { email },
      update: {},
      create: { email, source: "landing_page" },
    });

    return NextResponse.json(
      { success: true, message: "You're on the list! Check your inbox." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads?key=<ADMIN_KEY>
 *
 * Admin endpoint to list collected leads. Password-protected via a query
 * key compared against the ADMIN_KEY env var. Does NOT touch the Nuvio backend.
 *
 * Supports `?format=csv` to download as CSV.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const format = searchParams.get("format");
  const adminKey = process.env.NUVIO_ADMIN_KEY ?? "nuvio-admin-2026";

  if (key !== adminKey) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid ?key= parameter." },
      { status: 401 }
    );
  }

  const leads = await db.lead.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, source: true, createdAt: true },
  });

  if (format === "csv") {
    const header = "email,source,createdAt\n";
    const rows = leads
      .map((l) => `${l.email},${l.source},${l.createdAt.toISOString()}`)
      .join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=nuvio-leads.csv",
      },
    });
  }

  return NextResponse.json({
    count: leads.length,
    leads,
  });
}
