import "dotenv/config";
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);

  await sql`DROP TABLE IF EXISTS config_tags, upvotes, tags, upvote, users CASCADE`;
  await sql`DROP TABLE IF EXISTS "account", "session", "verificationToken", "user" CASCADE`;

  console.log("All old tables dropped.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
