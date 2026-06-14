import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { configs, users, comments, configTags, tags } from "@/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    description?: string;
    repoUrl?: string;
    installCommand?: string;
    screenshotUrl?: string;
    tools?: { name: string; category: string }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, repoUrl, installCommand, screenshotUrl, tools } =
    body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!repoUrl?.trim()) {
    return NextResponse.json(
      { error: "Repository URL is required" },
      { status: 400 },
    );
  }

  if (!repoUrl.match(/github\.com[/:][^/]+\/[^/\s#?]+/)) {
    return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
  }

  // Rate limit: max 5 submissions per hour per user
  const rl = rateLimit(`config:post:${session.user.id}`, {
    windowMs: 3600000,
    max: 5,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later." },
      { status: 429 },
    );
  }

  const dup = await getDb()
    .select({ id: configs.id })
    .from(configs)
    .where(eq(configs.repoUrl, repoUrl.trim()))
    .limit(1);

  if (dup.length > 0) {
    return NextResponse.json(
      { error: "This repository has already been submitted" },
      { status: 409 },
    );
  }

  try {
    const [created] = await getDb()
      .insert(configs)
      .values({
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description?.trim() ?? "",
        repoUrl: repoUrl.trim(),
        installCommand: installCommand?.trim() ?? null,
        screenshotUrl: screenshotUrl ?? null,
        tools: tools ?? [],
        userId: session.user.id,
        upvoteCount: 0,
      })
      .returning({ id: configs.id });

    return NextResponse.json(
      { id: created.id, title: title.trim() },
      { status: 201 },
    );
  } catch (err) {
    console.error("Failed to create config:", err);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const page = Math.max(1, parseInt(params.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(params.get("limit") || "24")),
    );
    const sort = params.get("sort") || "new";
    const q = params.get("q")?.trim() ?? "";
    const tag = params.get("tag")?.trim() ?? "";

    const db = getDb();

    // Build WHERE conditions
    const conditions: ReturnType<typeof and>[] = [];

    if (q) {
      const like = `%${q}%`;
      conditions.push(
        sql`(${configs.title} ILIKE ${like} OR ${configs.description} ILIKE ${like})`,
      );
    }

    if (tag) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${configTags} ct JOIN ${tags} t ON t.id = ct.tag_id WHERE ct.config_id = ${configs.id} AND t.slug = ${tag})`,
      );
    }

    // Build ORDER BY
    const orderByClause =
      sort === "hot"
        ? sql`${configs.upvoteCount}::float / (${configs.upvoteCount}::float + 2.0 + 0.05 * EXTRACT(EPOCH FROM (NOW() - ${configs.createdAt})) / 3600) DESC`
        : sort === "top"
          ? desc(configs.upvoteCount)
          : desc(configs.createdAt);

    // Single chain to avoid Drizzle type inference issues with reassignment
    const rows = await db
      .select({
        id: configs.id,
        title: configs.title,
        description: configs.description,
        repoUrl: configs.repoUrl,
        screenshotUrl: configs.screenshotUrl,
        tools: configs.tools,
        upvoteCount: configs.upvoteCount,
        commentCount:
          sql<number>`(SELECT count(*)::int FROM ${comments} WHERE config_id = ${configs.id})`,
        createdAt: configs.createdAt,
        userId: configs.userId,
        userName: users.name,
        userHandle: users.handle,
        userImage: users.image,
      })
      .from(configs)
      .leftJoin(users, eq(configs.userId, users.id))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset((page - 1) * limit);

    // Total count (respects WHERE filters)
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(configs)
      .where(and(...conditions));
    const total = count ?? 0;

    const mapped = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      author: {
        name: r.userName ?? "Anonymous",
        handle: r.userHandle ?? r.userName ?? "user",
        avatar: r.userImage,
      },
      tools: (r.tools ?? []) as { name: string; category: string }[],
      upvoteCount: r.upvoteCount,
      commentCount: r.commentCount,
      screenshotUrl: r.screenshotUrl,
      createdAt: r.createdAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      data: mapped,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    console.error("Failed to fetch configs:", err);
    return NextResponse.json(
      { error: "Failed to fetch configs" },
      { status: 500 },
    );
  }
}