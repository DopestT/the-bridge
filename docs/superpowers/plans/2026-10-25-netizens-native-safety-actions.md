# NETIZENS Native Safety Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the missing native block/report UI slice for NETIZENS private messaging without weakening the existing privacy or canonical-state boundaries.

**Architecture:** Extend the existing authenticated `NetizensRepository` with server-confirmed citizen-block and message-report mutations against the already-defined Supabase tables, then expose those actions on inbound messages in `ThreadScreen`. Safety mutations are not placed in the ordinary retry outbox: the UI reports success only after the canonical backend accepts them, while live RLS enforcement remains a separate device/backend acceptance gate.

**Tech Stack:** Expo SDK 57, React Native 0.86, React 19.2, TypeScript, Supabase REST, Jest / React Native Testing Library, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-05-netizens-mobile-app-design.md`

## Global Constraints

- Preserve `one network, many places`; this slice changes private-message safety only.
- Supabase remains canonical social state; device state is presentation state only.
- Private messages never traverse public entity discussion paths.
- Perception remains off ordinary social and safety critical paths.
- Do not claim live block enforcement, private-beta readiness, or device acceptance from code tests alone.
- Do not close issue #16 from this implementation PR.

## Review Focus

- A Citizen cannot block themself.
- Duplicate block submission is idempotent only when the canonical matching block can be read back.
- Report details cannot exceed the backend 4,000-character limit.
- Safety controls never appear on the current Citizen's own messages.
- A failed safety request must leave the message visible and show an actionable error instead of claiming success.

---

### Task 1: Authenticated safety repository contract

**Files:**
- Modify: `apps/netizens-mobile/tests/repository.test.mjs`
- Modify: `apps/netizens-mobile/src/api/netizens-repository.ts`

**Interfaces:**
- Produces: `blockCitizen(blockedId: string): Promise<void>` and `reportMessage(messageId: string, category: string, details?: string): Promise<Record<string, unknown>>`.

- [ ] Add failing repository tests for authenticated block/report payloads, self-block validation, duplicate-block recovery, and report detail length.
- [ ] Run `npm run test:storage -- --test-name-pattern="safety"` from `apps/netizens-mobile` and verify RED because the methods do not exist.
- [ ] Implement the two repository methods with backend-bound validation and duplicate-block readback.
- [ ] Re-run the targeted storage tests and verify GREEN.
- [ ] Run the complete `npm run test:storage` suite.

### Task 2: Native inbound-message safety controls

**Files:**
- Modify: `apps/netizens-mobile/src/features/messages/messages.test.tsx`
- Modify: `apps/netizens-mobile/src/features/messages/ThreadScreen.tsx`

**Interfaces:**
- Consumes: Task 1 `blockCitizen` and `reportMessage`.
- Produces: inbound-message Block sender and Report message controls with explicit success/error state.

- [ ] Add failing UI tests proving controls are inbound-only, block removes the sender's visible messages only after success, report category submission calls the repository, and failures preserve the message.
- [ ] Run the message test file and verify RED.
- [ ] Implement minimal message-card safety UI and state handling.
- [ ] Re-run the message test file and verify GREEN.
- [ ] Run mobile Jest, typecheck, lint, and storage tests.

### Task 3: Release evidence and tracker continuity

**Files:**
- Modify: `docs/NETIZENS_STATUS.md`

- [ ] Record the implementation as code-complete only after CI is green; leave live RLS/device enforcement explicitly unverified.
- [ ] Open a PR against `main` without an automatic closing reference to issue #16.
- [ ] Verify GitHub Actions on the PR head and report any remaining acceptance blockers.
