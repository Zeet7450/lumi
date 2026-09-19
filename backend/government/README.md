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
pnpm --filter @lumi/contracts run build
pnpm --filter @lumi/government run build
pnpm --filter @lumi/government test
```

The current fixture server requires `LUMI_SESSION_HMAC_KEY` plus
`LUMI_DEMO_PASSWORD_DLH`, `LUMI_DEMO_PASSWORD_BPBD`, and
`LUMI_DEMO_PASSWORD_DISKOMINFO`. Supply them through the shell or a local
untracked environment loader; no password value is committed:

```sh
pnpm --filter @lumi/government run build
pnpm --filter @lumi/government start
```

All mutation requests require an `Origin` exactly matching `LUMI_OPS_ORIGIN`,
not the request Host header. Login creates a server-side opaque session and a
host-only cookie; credentials are never returned in a response or log. In
production, terminate HTTPS at Nginx and keep port `4000` reachable only from
that local reverse proxy.

## Demo login untuk walkthrough lokal

Portal warga tetap tidak memerlukan akun: ia publik dan hanya membaca informasi
yang sudah berstatus `PUBLISHED`. Tujuh identitas di bawah disiapkan untuk demo
lokal; tiga akun warga tidak dapat membuka API operasional. Akun simulator
dipisahkan dari tiga instansi agar hasil SIMULASI tidak bercampur dengan data
live. Jangan gunakan pada deployment, jangan masukkan ke log, dan ganti semua
nilai environment pada deployment nyata.

| Peran server | Email | Jabatan yang ditampilkan | Password lokal |
| --- | --- | --- | --- |
| `DLH` | `operator.dlh@demo.lumi.id` | Operator & Validator Kualitas Udara | `LUMI_DEMO_PASSWORD_DLH` |
| `BPBD` | `koordinator.bpbd@demo.lumi.id` | Koordinator Respons Risiko | `LUMI_DEMO_PASSWORD_BPBD` |
| `DISKOMINFO` | `approver.diskominfo@demo.lumi.id` | Approver Informasi Publik | `LUMI_DEMO_PASSWORD_DISKOMINFO` |
| `ADMIN_DEMO` | `simulator@demo.lumi.id` | Administrator Simulation Center | `LUMI_DEMO_PASSWORD_ADMIN` atau fallback DLH |
| `CITIZEN` | `amelia.warga@demo.lumi.id` | Warga demo | `LUMI_DEMO_PASSWORD_CITIZEN` atau fallback DLH |
| `CITIZEN` | `joko.warga@demo.lumi.id` | Warga demo | `LUMI_DEMO_PASSWORD_CITIZEN` atau fallback DLH |
| `CITIZEN` | `nadia.warga@demo.lumi.id` | Warga demo | `LUMI_DEMO_PASSWORD_CITIZEN` atau fallback DLH |

`LUMI_DEMO_PASSWORD_CITIZEN` dan `LUMI_DEMO_PASSWORD_ADMIN` bersifat opsional;
jika tidak diatur, runtime menggunakan `LUMI_DEMO_PASSWORD_DLH`. Sistem
menyimpan hash `scrypt`, bukan password plaintext, dan tidak pernah
mengembalikan password atau session token dalam JSON.

## Kontrak autentikasi untuk frontend

`POST /api/ops/login` menerima `{ "email", "password" }` dari origin operasi
yang sudah dikonfigurasi. Role, instansi, dan jabatan selalu berasal dari user
yang ditemukan server; field role dari browser tidak dipercaya. Respons sukses
mengatur cookie `HttpOnly` dan hanya berisi `actor` dan `expiresAt`.

`GET /api/ops/session` mengembalikan actor yang sama dari cookie aktif. Panggil
endpoint ini saat dashboard dimuat ulang untuk memulihkan status login tanpa
menaruh token di local storage. `POST /api/ops/logout` menghapus sesi.

## Supabase boundary

`migrations/0001_government_core.sql` targets the existing Supabase PostgreSQL
project, but is intentionally not applied by P0. It records the decision bound
to each public notice so a live refresh cannot rewrite an approved public tier.
Apply it only through the approved migration workflow after a TLS database
connection is injected outside the repository. Keep Supabase Data API disabled
and do not add a local PostgreSQL Docker service.
