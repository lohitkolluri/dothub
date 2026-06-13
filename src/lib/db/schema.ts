import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";

/* ─── Auth.js Adapter Tables ────────────────────────────────── */
/* Table names match what @auth/drizzle-adapter expects.        */

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<"oauth" | "oidc" | "email">().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ─── Configs ───────────────────────────────────────────────── */

export type DetectedTool = {
  name: string;
  category: string;
};

export const configs = pgTable("configs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  repoUrl: text("repo_url").notNull(),
  screenshotUrl: text("screenshot_url"),
  installCommand: text("install_command"),
  tools: jsonb("tools").$type<DetectedTool[]>().default([]).notNull(),
  upvoteCount: integer("upvote_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─── Upvotes ───────────────────────────────────────────────── */

export const upvotes = pgTable(
  "upvotes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    configId: text("config_id")
      .notNull()
      .references(() => configs.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.configId] })],
);

/* ─── Tags ──────────────────────────────────────────────────── */

export const tags = pgTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

/* ─── Comments ─────────────────────────────────────────────── */

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  configId: text("config_id")
    .notNull()
    .references(() => configs.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const configTags = pgTable(
  "config_tags",
  {
    configId: text("config_id")
      .notNull()
      .references(() => configs.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.configId, t.tagId] })],
);
