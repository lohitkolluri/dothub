import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { tags, configTags } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Fetch all tags with config counts
    const rows = await getDb()
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        configCount: sql<number>`(
          SELECT count(*) FROM ${configTags} WHERE ${configTags.tagId} = ${tags.id}
        )`,
      })
      .from(tags)
      .orderBy(sql`(
        SELECT count(*) FROM ${configTags} WHERE ${configTags.tagId} = ${tags.id}
      ) DESC`);

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      configCount: Number(r.configCount),
    }));
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch tags:", err);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
