# 🏆 Dynasty

**Build the greatest team ever assembled.** A full-stack fantasy draft & simulation game with two modes:

- 🏀 **NBA Mode** — Draft 8 all-time greats under a salary cap and simulate an 82-game season. Can you go 82-0?
- ⚽ **Soccer Mode** — Pick a formation, draft an all-time XI, and run a 7-game World Cup gauntlet. Can you win the trophy?

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Supabase**.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app runs fully in **guest mode** (localStorage) with no configuration.

## Enabling cloud auth + global leaderboard (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.local.example` to `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

4. (Optional) Enable Google OAuth in Supabase → Authentication → Providers.
5. Restart `npm run dev`.

Without these vars, email/Google sign-in is hidden and everything saves locally.

## Deploying to Vercel

```bash
vercel
```

Add the two `NEXT_PUBLIC_SUPABASE_*` environment variables in the Vercel dashboard. Add your deployed URL to Supabase → Authentication → URL Configuration for OAuth redirects.

## Project structure

```
src/
  app/
    page.tsx            Landing page (blended NBA/Soccer hero)
    nba/page.tsx        Draft → 82-game sim → result
    soccer/page.tsx     Setup → pitch draft → tournament sim → result
    leaderboard/        NBA | Soccer tabs, time filters
    profile/            Saved rosters & records
    login/              Email/password, Google OAuth, guest
  components/           Nav, Pitch
  lib/
    nba/                players + simulation engine
    soccer/             players + formations + simulation engine
    store/              localStorage + Supabase leaderboard layer
    supabase/           optional browser client
    auth.tsx            auth context (works without Supabase)
  types/                shared TypeScript types
supabase/schema.sql     database tables + RLS policies
```

## Gameplay notes

- **Salary cap / budget** — better players cost more; you must build a balanced roster within the cap.
- **Simulation** — team rating vs. randomized opponents with Gaussian variance, so upsets happen and 82-0 is genuinely hard.
- **Soccer IQ mode** — stats are hidden during the draft; pick from memory.
- **Knockouts** — draws go to penalty shootouts; lose and you're out.
- **Team identity** — every finished roster is auto-named by its stat profile (e.g. _Run & Gun_, _Catenaccio_, _Tiki-Taka Dynasty_).
- **Awards & recap** — the result screen mines the sim for highlights: Franchise Player / Golden Boot, signature wins, win streaks, clean sheets.
- **Shareable cards** — copy a spoiler-light, Wordle-style emoji grid of your run; daily challenges are tagged by date.
- **Daily streaks** — completing a Daily Challenge builds a 🔥 streak (tracked locally), surfaced on the home page and profile.
- **Achievements** — 12 unlockable badges (82-0, World Champions, Golden Boot, Elite chemistry, streak milestones, …) shown on your profile.
