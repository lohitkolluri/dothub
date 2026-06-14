import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { configs, upvotes } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { and, eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: max 30 votes per minute per user
  const rl = rateLimit(`vote:${session.user.id}`, { windowMs: 60000, max: 30 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many votes. Slow down." }, { status: 429 });
  }


  let body: { configId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { configId } = body;
  if (!configId) {
    return NextResponse.json({ error: "configId is required" }, { status: 400 });
  }

  const db = getDb();
  const userId = session.user.id;

  try {
    // Check if the user already voted
    const existing = await db
      .select()
      .from(upvotes)
      .where(and(eq(upvotes.userId, userId), eq(upvotes.configId, configId)))
      .limit(1);

    if (existing.length > 0) {
      // Remove vote
      await db
        .delete(upvotes)
        .where(and(eq(upvotes.userId, userId), eq(upvotes.configId, configId)));

      await db
        .update(configs)
        .set({ upvoteCount: sql`${configs.upvoteCount} - 1` })
        .where(eq(configs.id, configId));

      const [updated] = await db
        .select({ upvoteCount: configs.upvoteCount })
        .from(configs)
        .where(eq(configs.id, configId))
        .limit(1);

      return NextResponse.json({ voted: false, count: updated?.upvoteCount ?? 0 });
    }

    // Add vote
    await db.insert(upvotes).values({ userId, configId });

    await db
      .update(configs)
      .set({ upvoteCount: sql`${configs.upvoteCount} + 1` })
      .where(eq(configs.id, configId));

    const [updated] = await db
      .select({ upvoteCount: configs.upvoteCount })
      .from(configs)
      .where(eq(configs.id, configId))
      .limit(1);

    return NextResponse.json({ voted: true, count: updated?.upvoteCount ?? 0 });
  } catch (err) {
    console.error("Vote error:", err);
    return NextResponse.json({ error: "Failed to process vote" }, { status: 500 });
  }
}
