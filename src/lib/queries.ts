import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { configs, users } from "./db/schema";

export type ConfigDetail = {
  id: string;
  title: string;
  description: string;
  repoUrl: string;
  screenshotUrl: string | null;
  installCommand: string | null;
  tools: { name: string; category: string }[];
  upvoteCount: number;
  createdAt: Date;
  author: { id: string; name: string | null; handle: string; image: string | null };
};

export async function getConfigById(id: string): Promise<ConfigDetail | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: configs.id,
      title: configs.title,
      description: configs.description,
      repoUrl: configs.repoUrl,
      screenshotUrl: configs.screenshotUrl,
      installCommand: configs.installCommand,
      tools: configs.tools,
      upvoteCount: configs.upvoteCount,
      createdAt: configs.createdAt,
      userId: configs.userId,
      userName: users.name,
      userImage: users.image,
    })
    .from(configs)
    .leftJoin(users, eq(configs.userId, users.id))
    .where(eq(configs.id, id))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    repoUrl: row.repoUrl,
    screenshotUrl: row.screenshotUrl,
    installCommand: row.installCommand,
    tools: (row.tools ?? []) as { name: string; category: string }[],
    upvoteCount: row.upvoteCount,
    createdAt: row.createdAt,
    author: {
      id: row.userId,
      name: row.userName,
      handle: row.userName ?? "user",
      image: row.userImage,
    },
  };
}

export async function getConfigsByUserId(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(configs)
    .where(eq(configs.userId, userId))
    .orderBy(configs.createdAt);
}

export type ProfileData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  configCount: number;
  totalUpvotes: number;
  configs: Array<{
    id: string;
    title: string;
    description: string;
    upvoteCount: number;
    createdAt: Date;
  }>;
};

export async function getUserByHandle(
  handle: string,
): Promise<ProfileData | null> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.name, handle))
    .limit(1);

  if (!user) return null;

  const userConfigs = await getConfigsByUserId(user.id);
  const totalUpvotes = userConfigs.reduce(
    (sum, c) => sum + c.upvoteCount,
    0,
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    configCount: userConfigs.length,
    totalUpvotes,
    configs: userConfigs.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description ?? "",
      upvoteCount: c.upvoteCount,
      createdAt: c.createdAt,
    })),
  };
}
