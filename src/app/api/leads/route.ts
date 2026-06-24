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
