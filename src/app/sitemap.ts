import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { configs, users } from "@/lib/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dothub.dev";

  const db = getDb();

  const configRows = await db
    .select({ id: configs.id, updatedAt: configs.updatedAt })
    .from(configs);

  const userRows = await db
    .select({ handle: users.handle })
    .from(users);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/submit`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/settings`, changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  const configEntries = configRows.map(c => ({
    url: `${baseUrl}/configs/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const userEntries = userRows.map(u => ({
    url: `${baseUrl}/profile/${u.handle}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...configEntries, ...userEntries];
}
