# LUMI Government API

P0 is an offline, fixture-backed government API on port `4000`. It does not
contact Supabase, external data providers, or AI services while running tests.
Live demo fixtures are explicitly labeled `Data demo LUMI`; their synthetic
timestamps are rebased to the runtime clock so the API never claims a fixed,
old fixture is fresh.

It also exposes unauthenticated, read-only future-web routes:

- `GET /api/public/regions/:slug` returns only a PUBLISHED projection, or a
  `null` projection when the known region has no approved notice. It is sent
  with `Cache-Control: no-cache` so a new urgent approval is revalidated.
- `GET /api/public/guidance` returns deterministic baseline guidance by tier.

These routes never expose a draft, internal evidence, action brief, audit log,
session, or simulator result. Source strings are reduced to an allowlisted
public label, never a provider URL, credential, or raw payload field.

A fresh `MONITOR` decision resolves its open working incident. It never edits a
published public notice automatically; any previously pending approval becomes
conflicted and must be reviewed against the current decision.

Freshness is recomputed when an incident or public projection is read. If an
ingestion worker stops, stored evidence ages to `STALE`; the API preserves the
last tier instead of inventing a lower-risk decision.

Every live ingestion stores new immutable evidence IDs, even when a provider
reuses an observation identifier. A later refresh therefore cannot rewrite the
evidence referenced by an older decision, audit record, or approved notice.

## Local commands

```sh
pnpm install
pnpm supabase:start
pnpm setup:local-env
pnpm seed:demo
pnpm start:government:local
pnpm supabase:test
pnpm supabase:advisors
pnpm --filter @lumi/contracts run build
pnpm --filter @lumi/government run build
pnpm --filter @lumi/government test
```

Use `pnpm supabase:stop` to stop the local Docker services without deleting the
local database. `pnpm supabase:reset` is intentionally local-only and should be
used only when replaying the committed migrations is desired.

Run `pnpm setup:local-env` after starting local Supabase. It generates the one
`DEMO_PASSWORD`, `LUMI_SESSION_HMAC_KEY`, local Supabase keys, and temporary
role-specific compatibility variables in an ignored mode-0600 `.env.local`.
The compatibility variables preserve the fixture server until Stage 2; no
password value is committed or printed. Start that fixture server from the
repository root with `pnpm start:government:local`; its Node process explicitly
loads the ignored `.env.local` through `--env-file`:

```sh
pnpm start:government:local
```

All mutation requests require an `Origin` exactly matching `LUMI_OPS_ORIGIN`,
not the request Host header. Login creates a server-side opaque session and a
host-only cookie; credentials are never returned in a response or log. In
production, terminate HTTPS at Nginx and keep port `4000` reachable only from
that local reverse proxy.

## Demo login untuk walkthrough lokal

Portal warga tetap tidak memerlukan akun: ia publik dan hanya membaca informasi
yang sudah berstatus `PUBLISHED`. Lima identitas di bawah disiapkan untuk demo
lokal. Akun simulator dipisahkan dari tiga instansi agar hasil SIMULASI tidak
bercampur dengan data resmi. Semua menggunakan secret lokal `DEMO_PASSWORD`.
Jangan gunakan akun demo pada deployment atau memasukkan nilainya ke log.

| Peran server | Email | Jabatan yang ditampilkan | Password lokal |
| --- | --- | --- | --- |
| `DLH` | `operator.dlh@demo.lumi.id` | Operator & Validator Kualitas Udara | `DEMO_PASSWORD` |
| `BPBD` | `koordinator.bpbd@demo.lumi.id` | Koordinator Respons Risiko | `DEMO_PASSWORD` |
| `DISKOMINFO` | `approver.diskominfo@demo.lumi.id` | Approver Informasi Publik | `DEMO_PASSWORD` |
| `ADMIN_DEMO` | `simulator@demo.lumi.id` | Administrator Simulation Center | `DEMO_PASSWORD` |
| `CITIZEN` | `amelia.warga@demo.lumi.id` | Warga demo | `DEMO_PASSWORD` |

## Kontrak autentikasi untuk frontend

`POST /api/ops/login` menerima `{ "email", "password" }` dari origin operasi
yang sudah dikonfigurasi. Role, instansi, dan jabatan selalu berasal dari user
yang ditemukan server; field role dari browser tidak dipercaya. Respons sukses
mengatur cookie `HttpOnly` dan hanya berisi `actor` dan `expiresAt`.

`GET /api/ops/session` mengembalikan actor yang sama dari cookie aktif. Panggil
endpoint ini saat dashboard dimuat ulang untuk memulihkan status login tanpa
menaruh token di local storage. `POST /api/ops/logout` menghapus sesi.

## Supabase boundary

The authoritative schema is versioned in root `supabase/migrations`. The old
`migrations/0001_government_core.sql` is an unapplied P0 prototype and must not
be applied. Stage 1 uses only the local Supabase Docker stack; it does not link,
push to, reset, or otherwise modify a managed project.
