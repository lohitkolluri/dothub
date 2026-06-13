import { NextResponse } from "next/server";
import { analyzeRepo } from "@/lib/detection";

export async function POST(request: Request) {
  let body: { repoUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { repoUrl } = body;

  if (!repoUrl?.trim()) {
    return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
  }

  if (!repoUrl.match(/github\.com[/:][^/]+\/[^/\s#?]+/)) {
    return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
  }

  try {
    const { detected, fileCount, error } = await analyzeRepo(repoUrl.trim());

    if (error) {
      return NextResponse.json({ error, tools: [], fileCount: 0 }, { status: 422 });
    }

    return NextResponse.json({
      tools: detected.map((t) => ({
        name: t.name,
        category: t.category,
        icon: t.icon,
      })),
      fileCount,
    });
  } catch (err) {
    console.error("Detection error:", err);
    return NextResponse.json({ error: "Failed to analyze repository" }, { status: 500 });
  }
}
