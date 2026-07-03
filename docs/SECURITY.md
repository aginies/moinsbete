# Sécurité

## Authentification & Rôles

- **Mots de passe**: hashés avec bcrypt (12 rounds)
- **Session**: JWT (NextAuth v4), cookie `next-auth.session-token`
- **Rôles**: `USER` (default), `ADMIN` — stocké dans JWT + DB
- **Admin RBAC**: page `/admin` et routes API vérifient `session.user.role === 'ADMIN'`
- **CSRF**: validation par `origin` vs `request.nextUrl.origin` sur tous les endpoints POST
- **Rate limiting**: login (5/min), register (3/min), topic suggest (10/min) — `src/lib/rate-limiter.ts`
- **Secret**: `NEXTAUTH_SECRET` avec fallback fort généré par `openssl rand -base64 32`

## Audit de sécurité (dernière mise à jour)

| Severity | Issue | Status |
|----------|-------|--------|
| HIGH | CSRF broken — `protocol + host` concat produced `http:http://host` | **FIXED** — use `request.nextUrl.origin` |
| HIGH | Admin accessible to all authenticated users | **FIXED** — role check added |
| HIGH | Default NextAuth secret forgeable | **FIXED** — strong random fallback |
| MEDIUM | User ID tampering on view/history endpoints | **FIXED** — use session.user.id only |
| MEDIUM | Rate limiting in-memory per-instance | **FIXED** — periodic cleanup added |
| MEDIUM | Auth endpoints no rate limiting | **FIXED** — login(5/min), register(3/min) |
| MEDIUM | Reset token exposed in API response | **FIXED** — link dev-only fallback |
| MEDIUM | Phantom user creation on view | **FIXED** — removed user upsert |
| LOW | CSP in `generateMetadata` (deprecated) | **FIXED** — moved to `generateResponseHeaders()` |
| LOW | PII logged (user email, ID) | **FIXED** — removed email from logs |
| LOW | Password length inconsistent (6 vs 8) | **FIXED** — register now requires 8 |
| LOW | Cookie missing `__Secure-` prefix | **FIXED** — conditional prefix in prod |
| LOW | DB file 644 world-readable | Documented — use `chmod 600` in production |

## Admin setup

Après la première inscription, définir un admin :

```bash
echo "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'your@email.com';" | npx prisma db execute --url "file:./dev.db" --stdin
```

## Variables de sécurité

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | Clé de signature JWT — générer avec `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL de l'app (HTTPS en production) |

## Migration de rôle

Dernière migration : `prisma/migrations/20260703151606_add_role/migration.sql`

Ajoute `role` (ENUM: USER, ADMIN) au modèle User.
