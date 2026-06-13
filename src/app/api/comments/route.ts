import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { comments, users } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const configId = searchParams.get("configId");

  if (!configId) {
    return NextResponse.json({ error: "configId is required" }, { status: 400 });
  }

  try {
    const rows = await getDb()
      .select({
        id: comments.id,
        configId: comments.configId,
        userId: comments.userId,
        parentId: comments.parentId,
        body: comments.body,
        createdAt: comments.createdAt,
        userName: users.name,
        userImage: users.image,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.configId, configId))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Failed to fetch comments:", err);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { configId?: string; parentId?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { configId, parentId, body: text } = body;

  if (!configId || !text?.trim()) {
    return NextResponse.json(
      { error: "configId and body are required" },
      { status: 400 },
    );
  }

  try {
    await getDb().insert(comments).values({
      id: crypto.randomUUID(),
      configId,
      userId: session.user.id,
      parentId: parentId ?? null,
      body: text.trim(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Failed to create comment:", err);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
