import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { configs } from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; description?: string; repoUrl?: string; tools?: any[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, repoUrl, tools } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!repoUrl?.trim()) {
    return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
  }

  // Validate GitHub URL format
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
        tools: tools ?? [],
        userId: session.user.id,
        upvoteCount: 0,
      })
      .returning({ id: configs.id });

    return NextResponse.json({ id: created.id, title: title.trim() }, { status: 201 });
  } catch (err) {
    console.error("Failed to create config:", err);
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allConfigs = await getDb().select().from(configs).orderBy(configs.upvoteCount);
    return NextResponse.json(allConfigs);
  } catch (err) {
    console.error("Failed to fetch configs:", err);
    return NextResponse.json({ error: "Failed to fetch configs" }, { status: 500 });
  }
}
