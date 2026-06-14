import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, bio } = body;

  const update: Record<string, string | null> = {};
  if (typeof name === "string" && name.length > 0) {
    update.name = name.trim();
  }
  if (bio !== undefined) {
    update.bio = typeof bio === "string" ? bio.trim() || null : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const db = getDb();
  try {
    await db.update(users).set(update).where(eq(users.id, session.user.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile update failed:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
