import { getDb } from '@/lib/db';
import { accounts, sessions, users as usersTable, verificationTokens } from '@/lib/db/schema';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import NextAuth, { type DefaultSession } from 'next-auth';
import GitHub from 'next-auth/providers/github';

/* ─── Extend next-auth types ──────────────────────────────── */

declare module 'next-auth' {
  interface User {
    handle: string;
    bio: string | null;
  }
  interface Session {
    user: {
      handle: string;
      bio: string | null;
    } & DefaultSession['user'];
  }
}

/* ─── Auth.js config ──────────────────────────────────────── */

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(getDb(), {
    usersTable,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHub({
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          handle: profile.login,
          bio: profile.bio ?? null,
          email: profile.email ?? '',
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github' && profile && user.id) {
        const gh = profile as { login?: string; bio?: string | null };

        await getDb()
          .update(usersTable)
          .set({
            handle: gh.login ?? user.handle ?? '',
            bio: gh.bio ?? user.bio ?? null,
            image: user.image,
            name: user.name,
          })
          .where(eq(usersTable.id, user.id));
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        const [dbUser] = await getDb()
          .select({
            id: usersTable.id,
            handle: usersTable.handle,
            bio: usersTable.bio,
          })
          .from(usersTable)
          .where(eq(usersTable.id, user.id))
          .limit(1);

        session.user.id = user.id;
        session.user.handle = dbUser?.handle || user.handle || '';
        session.user.bio = dbUser?.bio ?? user.bio ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
});
