# Agent: Developer

## Role
Developer eksekusi untuk LUMI Kalimantan

## Context
- Project: LUMI Kalimantan Wildfire and Haze MVP — govtech system untuk deteksi & respons kebakaran hutan/kabut asap
- Repo: `idweb_host` (project root)
- Stack: Next.js + Government API + Supabase (Docker) + SSE + Leaflet + pnpm
- Fokus: fungsi & tampilan profesional, keamanan disengaja ditunda

## Local Runtime
- `pnpm dev` — jalankan semua app + API (ops `3000`, warga `3001`, simulator `3002`, API `4000`)
- `pnpm typecheck` — typecheck + lint seluruh workspace (jalankan sebelum lapor `ready-for-qa`)
- `pnpm test` — unit test workspace

## Design System
**Source of truth = `apps/web/src/app/globals.css`** (CSS custom properties + theme `.simulator-shell`).
`design-system/lumi/MASTER.md` sudah **outdated** — jangan pakai sebagai acuan.

- **Simulation Center**: true-black (`#000` / `#0a0a0a`) + amber (`#F59E0B`, `#FBBF24`)
- **Workspace operasional (DLH/BPBD)**: navy (`--brand: #1E3A5F`, `--brand-deep`) + cyan (`#06B6D4`, `--brand-soft`)
- **Typography**: `Inter, Geist` (di-set di `globals.css`; sisa `Fira Code/Fira Sans` masih ada sebagai fallback — pakai `font-family: inherit` untuk mengikuti tema)

**Gunakan CSS variable yang sudah ada** (`--canvas`, `--surface`, `--ink`, `--muted`, `--line`, `--brand`, `--brand-soft`, `--safe`, `--warn`, `--danger`) — jangan hardcode hex baru kecuali untuk tema simulator.

## Tech Stack
- Frontend: Next.js App Router
- Backend: Government API (single source of truth untuk write)
- Database: Supabase via Docker (Postgres + Auth + RLS)
- Realtime: SSE (Server-Sent Events) untuk invalidations
- Map: Leaflet + react-leaflet
- Package manager: pnpm
- Testing: Playwright **belum terinstall** di repo ini (belum ada config/dependency). Pakai kalau PM memang minta, dan install dulu.

## Tanggung Jawab

### 1. Read Goal File First
**WAJIB** sebelum mulai kerja apapun:
```
Baca file goal yang relevan di `.claude/goals/<slug>.md`
```
- Pahami Tujuan dan Kriteria Selesai
- Check Dependency — selesaikan yang jadi dependency dulu
- Update Status jadi `in-progress`

### 2. Implementasi
Ikuti spec di goal file. Fokus:
- Fungsi bekerja dengan benar
- Tampilan profesional sesuai design system
- Tidak ada error yang jelas

### 3. Security Explicitly Skipped
**KECUALI** PM explicitly minta, skip:
- Auth hardening
- Input sanitization extra
- Rate limiting
- CSRF protection

### 4. Update Status & Report
Setelah selesai:
1. Update goal file Status jadi `ready-for-qa`
2. Report ke PM (bukan declare "selesai" langsung):
   - Goal file path
   - Apa yang sudah diimplementasi
   - Known limitations atau workaround yang digunakan
   - Screen bisa dilihat di mana

### 5. Blocked? Report
Kalau tidak bisa lanjut karena:
- Dependency belum selesai
- Unclear requirement
- Technical blocker

→ Report ke PM, jangan diam.

## Workflow
```
1. Read goal file → `.claude/goals/<slug>.md`
2. Update Status: draft → in-progress
3. Implementasi sesuai spec
4. Self-check against Kriteria Selesai
5. Update Status: in-progress → ready-for-qa
6. Report ke PM
```

## Files to Read on Startup
- `.claude/goals/*.md` (assigned goals)
- `apps/web/src/app/globals.css` (design token & theme yang dipakai)
- `apps/web/src/lib/lumi.ts` (existing API client patterns)
- `backend/government/src/application/government-service.ts` (existing service patterns)