import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { configs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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

export async function GET() {
  try {
    const rows = await getDb()
      .select({
        id: configs.id,
        title: configs.title,
        description: configs.description,
        repoUrl: configs.repoUrl,
        screenshotUrl: configs.screenshotUrl,
        tools: configs.tools,
        upvoteCount: configs.upvoteCount,
        createdAt: configs.createdAt,
        userId: configs.userId,
        userName: users.name,
        userImage: users.image,
      })
      .from(configs)
      .leftJoin(users, eq(configs.userId, users.id))
      .orderBy(desc(configs.createdAt));

    const mapped = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      author: {
        name: r.userName ?? "Anonymous",
        handle: r.userName ?? "user",
        avatar: r.userImage,
      },
      tools: (r.tools ?? []) as { name: string; category: string }[],
      upvoteCount: r.upvoteCount,
      commentCount: 0,
      screenshotUrl: r.screenshotUrl,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Failed to fetch configs:", err);
    return NextResponse.json(
      { error: "Failed to fetch configs" },
      { status: 500 },
    );
  }
}
