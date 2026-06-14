/**
 * DotHub — Seed Script
 *
 * Inserts 4 real famous dotfiles repos as sample configs.
 * Also creates the author user entries, tags, sample upvotes, and comments.
 *
 * Usage: bun run src/lib/db/seed.ts
 * Requires DATABASE_URL in .env
 */

import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

/* ─── Database connection ───────────────────────────────── */
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL is not set in .env");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

/* ─── Sample data ────────────────────────────────────────── */

const AUTHORS = [
  {
    id: "seed-user-mathias",
    name: "Mathias Bynens",
    handle: "mathiasbynens",
    email: "mathias@example.com",
    image: "https://avatars.githubusercontent.com/u/168665?v=4",
    bio: "Web standards enthusiast @tc39 delegate. Created jsPerf, MOTW, & more.",
  },
  {
    id: "seed-user-holman",
    name: "Zach Holman",
    handle: "holman",
    email: "zach@example.com",
    image: "https://avatars.githubusercontent.com/u/272?v=4",
    bio: "Developer, speaker, writer. Previously @github, now working on my own thing.",
  },
  {
    id: "seed-user-paulirish",
    name: "Paul Irish",
    handle: "paulirish",
    email: "paul@example.com",
    image: "https://avatars.githubusercontent.com/u/43981?v=4",
    bio: "Frontend developer, Chrome DevTools advocate, speaker.",
  },
  {
    id: "seed-user-hlissner",
    name: "Henrik Lissner",
    handle: "hlissner",
    email: "henrik@example.com",
    image: "https://avatars.githubusercontent.com/u/855938?v=4",
    bio: "Creator of Doom Emacs and exwm/. NixOS enthusiast.",
  },
];

const TAGS = [
  { id: "tag-macos", name: "macOS", slug: "macos" },
  { id: "tag-linux", name: "Linux", slug: "linux" },
  { id: "tag-nixos", name: "NixOS", slug: "nixos" },
  { id: "tag-shell", name: "Shell", slug: "shell" },
  { id: "tag-neovim", name: "Neovim", slug: "neovim" },
  { id: "tag-emacs", name: "Emacs", slug: "emacs" },
  { id: "tag-terminal", name: "Terminal", slug: "terminal" },
  { id: "tag-git", name: "Git", slug: "git" },
  { id: "tag-zsh", name: "Zsh", slug: "zsh" },
  { id: "tag-bash", name: "Bash", slug: "bash" },
];

const CONFIGS = [
  {
    id: "seed-config-mathias",
    userId: "seed-user-mathias",
    title: "Mathias Bynens' dotfiles",
    description:
      "The most-starred dotfiles repository on GitHub (31k+ ☆). A comprehensive macOS setup with sensible defaults for Bash, Vim, Git, and Homebrew. Includes .macos — a meticulous collection of system-level macOS preferences tweaks covering Dock, Finder, Safari, Disk Utility, and more. Widely forked and considered the gold standard for macOS dotfiles.",
    repoUrl: "https://github.com/mathiasbynens/dotfiles",
    screenshotUrl: null,
    installCommand: "git clone https://github.com/mathiasbynens/dotfiles.git ~/.dotfiles && cd ~/.dotfiles && source bootstrap.sh",
    tools: [
      { name: "Bash", category: "Shell" },
      { name: "Homebrew", category: "Package Manager" },
      { name: "Git", category: "Version Control" },
      { name: "Vim", category: "Editor" },
      { name: "Nerd Fonts", category: "Font" },
    ],
    tags: ["tag-macos", "tag-shell", "tag-bash", "tag-git"],
    createdAt: new Date("2024-01-15T10:00:00Z"),
    upvoteCount: 147,
  },
  {
    id: "seed-config-holman",
    userId: "seed-user-holman",
    title: "holman's dotfiles",
    description:
      "Zach Holman's widely-used Zsh-centric dotfiles (7.7k ☆). Originally forked from Ryan Bates' legendary setup, now a top reference for Zsh, Ruby, Homebrew, and macOS development environments. Organized into topical folders with a Rakefile-based bootstrap system. Features a custom `dotfiles` command for easy symlinking.",
    repoUrl: "https://github.com/holman/dotfiles",
    screenshotUrl: null,
    installCommand: "git clone https://github.com/holman/dotfiles.git ~/.dotfiles && cd ~/.dotfiles && script/bootstrap && script/install",
    tools: [
      { name: "Zsh", category: "Shell" },
      { name: "Homebrew", category: "Package Manager" },
      { name: "Git", category: "Version Control" },
      { name: "Ruby", category: "Runtime" },
      { name: "Oh My Zsh", category: "Shell Framework" },
    ],
    tags: ["tag-macos", "tag-shell", "tag-zsh", "tag-git"],
    createdAt: new Date("2024-03-20T14:30:00Z"),
    upvoteCount: 89,
  },
  {
    id: "seed-config-paulirish",
    userId: "seed-user-paulirish",
    title: "Paul Irish's dotfiles",
    description:
      "Paul Irish's pragmatic dotfiles (4.3k ☆) featuring Fish shell as the primary shell alongside Bash. Used by a Chrome DevTools engineer with optimized Git configs, Homebrew bundles, and macOS defaults. Includes Chromium-specific development tools and well-organized directory structure easy to adapt.",
    repoUrl: "https://github.com/paulirish/dotfiles",
    screenshotUrl: null,
    installCommand: "git clone https://github.com/paulirish/dotfiles.git ~/.dotfiles && cd ~/.dotfiles && script/bootstrap",
    tools: [
      { name: "Fish", category: "Shell" },
      { name: "Bash", category: "Shell" },
      { name: "Homebrew", category: "Package Manager" },
      { name: "Git", category: "Version Control" },
      { name: "Neovim", category: "Editor" },
    ],
    tags: ["tag-macos", "tag-shell", "tag-git", "tag-neovim", "tag-terminal"],
    createdAt: new Date("2024-06-10T09:00:00Z"),
    upvoteCount: 56,
  },
  {
    id: "seed-config-hlissner",
    userId: "seed-user-hlissner",
    title: "hlissner's NixOS dotfiles",
    description:
      "Henrik Lissner's NixOS dotfiles (1.9k ☆) — a Nix-flake-based system configuration from the creator of Doom Emacs. Features Neovim, Emacs, tmux, and a fully declarative NixOS setup managed entirely through Nix flakes. Includes home-manager integration and custom services.",
    repoUrl: "https://github.com/hlissner/dotfiles",
    screenshotUrl: null,
    installCommand: "git clone https://github.com/hlissner/dotfiles.git ~/.dotfiles && cd ~/.dotfiles && nix run .#install",
    tools: [
      { name: "Nix", category: "Package Manager" },
      { name: "Neovim", category: "Editor" },
      { name: "Emacs", category: "Editor" },
      { name: "Git", category: "Version Control" },
      { name: "tmux", category: "Terminal Multiplexer" },
    ],
    tags: ["tag-linux", "tag-nixos", "tag-neovim", "tag-emacs", "tag-terminal"],
    createdAt: new Date("2024-09-05T16:00:00Z"),
    upvoteCount: 34,
  },
];

const SAMPLE_COMMENTS = [
  {
    id: "seed-comment-1",
    configId: "seed-config-mathias",
    userId: "seed-user-holman",
    parentId: null,
    body: "The gold standard for dotfiles. I forked this years ago and it's still the foundation of my setup. The .macos defaults file alone is worth the visit.",
  },
  {
    id: "seed-comment-2",
    configId: "seed-config-mathias",
    userId: "seed-user-paulirish",
    parentId: "seed-comment-1",
    body: "Totally agree. The bootstrap script is so well organized that I still reference it when setting up new machines.",
  },
  {
    id: "seed-comment-3",
    configId: "seed-config-holman",
    userId: "seed-user-mathias",
    parentId: null,
    body: "Love the topical organization — each topic gets its own folder. The Rakefile bootstrap is elegant.",
  },
  {
    id: "seed-comment-4",
    configId: "seed-config-paulirish",
    userId: "seed-user-holman",
    parentId: null,
    body: "Fish shell with Chrome dev tooling is a great combo. The brew bundle approach is super clean.",
  },
  {
    id: "seed-comment-5",
    configId: "seed-config-hlissner",
    userId: "seed-user-mathias",
    parentId: null,
    body: "Amazing to see a full NixOS config in a single repo. The flake setup is inspirational for anyone going all-in on Nix.",
  },
];

/* ─── Main ──────────────────────────────────────────────── */
async function main() {
  console.log("🌱 Seeding DotHub database...\n");

  // 1. Upsert tags
  console.log("  Tags…");
  for (const tag of TAGS) {
    await db
      .insert(schema.tags)
      .values(tag)
      .onConflictDoNothing({ target: schema.tags.slug });
  }

  // 2. Upsert users
  console.log("  Users…");
  for (const author of AUTHORS) {
    await db
      .insert(schema.users)
      .values({
        id: author.id,
        name: author.name,
        handle: author.handle,
        email: author.email,
        image: author.image,
        bio: author.bio,
      })
      .onConflictDoNothing({ target: schema.users.handle });
  }

  // 3. Upsert configs
  console.log("  Configs…");
  for (const cfg of CONFIGS) {
    await db
      .insert(schema.configs)
      .values({
        id: cfg.id,
        userId: cfg.userId,
        title: cfg.title,
        description: cfg.description,
        repoUrl: cfg.repoUrl,
        screenshotUrl: cfg.screenshotUrl,
        installCommand: cfg.installCommand,
        tools: cfg.tools,
        upvoteCount: cfg.upvoteCount,
        createdAt: cfg.createdAt,
        updatedAt: cfg.createdAt,
      })
      .onConflictDoNothing({ target: schema.configs.repoUrl });

    // Link tags
    for (const tagId of cfg.tags) {
      await db
        .insert(schema.configTags)
        .values({ configId: cfg.id, tagId })
        .onConflictDoNothing();
    }
  }

  // 4. Sample upvotes
  console.log("  Upvotes…");
  const upvotePairs = [
    { userId: "seed-user-holman", configId: "seed-config-mathias" },
    { userId: "seed-user-paulirish", configId: "seed-config-mathias" },
    { userId: "seed-user-mathias", configId: "seed-config-holman" },
    { userId: "seed-user-hlissner", configId: "seed-config-mathias" },
    { userId: "seed-user-paulirish", configId: "seed-config-holman" },
    { userId: "seed-user-holman", configId: "seed-config-paulirish" },
    { userId: "seed-user-mathias", configId: "seed-config-hlissner" },
    { userId: "seed-user-hlissner", configId: "seed-config-paulirish" },
  ];
  for (const { userId, configId } of upvotePairs) {
    await db
      .insert(schema.upvotes)
      .values({ userId, configId })
      .onConflictDoNothing();
  }

  // 5. Sample comments
  console.log("  Comments…");
  for (const c of SAMPLE_COMMENTS) {
    await db
      .insert(schema.comments)
      .values({
        id: c.id,
        configId: c.configId,
        userId: c.userId,
        parentId: c.parentId,
        body: c.body,
      })
      .onConflictDoNothing();
  }

  // 6. Update upvote count to match real inserted votes
  console.log("  Syncing vote counts…");
  const ids = CONFIGS.map((c) => `'${c.id}'`).join(",");
  await db.execute(sql`
    UPDATE configs
    SET upvote_count = (SELECT count(*)::int FROM upvotes WHERE upvotes.config_id = configs.id)
    WHERE id IN (${sql.raw(ids)})
  `);

  console.log("\n✅ Seeding complete!");
  console.log(`  • ${TAGS.length} tags`);
  console.log(`  • ${AUTHORS.length} users`);
  console.log(`  • ${CONFIGS.length} configs`);
  console.log(`  • ${upvotePairs.length} upvotes`);
  console.log(`  • ${SAMPLE_COMMENTS.length} comments`);

  await client.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});