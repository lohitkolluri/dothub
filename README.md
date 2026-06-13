# DotHub

A pastel-themed dotfiles gallery — image-first showcase with Reddit-style community features. Browse, share, and discover Unix rice configurations.

Built with Next.js 16, Tailwind CSS v4, and Supabase.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase + Drizzle ORM
- **Auth:** NextAuth v5
- **Deployment:** Vercel

## Project Structure

```
src/
├── app/             # App Router pages
│   ├── page.tsx     # Home — gallery
│   ├── explore/     # Explore — gallery (same component)
│   ├── configs/     # Config detail pages
│   ├── profile/     # User profiles
│   └── submit/      # Submission page
├── components/
│   ├── ui/          # UI primitives (button, card, badge, etc.)
│   └── gallery/     # Gallery components
└── lib/             # Utilities
```
