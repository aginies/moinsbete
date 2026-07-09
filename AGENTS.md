<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Rules

- Run test after changes
- Sanitize URL always
- Avoid duplicate code
- Find simple solution
- Do not delete or reset DB
- Bump version in version.json to X.X.+1 for minor fixes

# Project Conventions

- Test file: `.test.ts` or `.test.tsx` next to source file. Use vitest
- Import alias: `@/` maps to `src/`
- DB: Prisma with libsql. Use `@/lib/db` for prisma client. Never drop tables
- URL validation: use `sanitizeUrl()` from `@/lib/utils`
- UI: shadcn components in `src/components/ui/`. Tailwind CSS v4
- Next.js 16: app router, server components default. Client components use `'use client'`
- API routes: `src/app/api/` with route handlers
- Actions: `src/actions/` for server actions
- Types: `src/types/` for custom type declarations
