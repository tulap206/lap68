<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LAP68 — project rules

- **Independent project.** Do not modify `79moto` or `3lmoto` / `3lmotohue` repos or their database tables.
- **Supabase:** only `lap68_*` tables. See `docs/NGUYEN_TAC_DOC_LAP.md`.
- **Real data:** persist via existing Supabase flow in `lib/supabase.ts`; no mock business data.
