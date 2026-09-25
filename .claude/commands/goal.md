# `/goal` — Goal Management Command

## Behavior

Creates or updates a goal file for tracking work items. Used by PM agent to document tasks before delegation to developer/QA agents.

## Usage

```
/goal <task-name>
```

Creates a new goal file at `.claude/goals/<slug-task-name>.md`.

## Goal File Format

```markdown
# Goal: <nama task>

## Tujuan
<hasil akhir yang harus dicapai, satu-dua kalimat>

## Kriteria Selesai (Definition of Done)
<daftar checklist konkret & terukur — bukan "bagus", tapi "map render tanpa lag saat 20 titik", dsb>

## Dikerjakan oleh
<nama agent: developer / qa-visual / qa-functional>

## Dependency
<goal/file lain yang harus selesai dulu, atau "tidak ada">

## Status
<draft / in-progress / ready-for-qa / done>
```

## Workflow

1. **PM agent** calls `/goal <task-name>` to create a goal file before delegating work
2. **Developer/QA agents** MUST read the relevant goal file before starting any work
3. **Developer agent** updates the Status field to `ready-for-qa` when done
4. **QA agents** update Status to `done` after passing, or report issues to PM for rework

## Rules

- Goal files live in `.claude/goals/` directory
- Slug format: lowercase, spaces replaced with hyphens
- Status transitions: `draft` → `in-progress` → `ready-for-qa` → `done`
- Developer/QA agents MUST reference the goal file path in their reports to PM