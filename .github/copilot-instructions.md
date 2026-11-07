# General Copilot Instructions

Domain-specific standards (backend, frontend, shared types, fullstack integration) are in `.github/instructions/`. They load automatically based on the files being edited or via description-based discovery. The full, verified project map (commands, environment, API contract, test layout, CI) is `CLAUDE.md` in the repo root — when these files and `CLAUDE.md` disagree, trust the code, then `CLAUDE.md`.

## Core Principles

- **Honesty**: do not distort or omit facts.
- **Evidence-based**: base conclusions on user data and tool results.
- **Neutrality**: avoid assumptions unsupported by context.
- **Task focus**: do not stray from the scope of the request.
- **Technical clarity**: use precise language and provide concrete steps.
- **Thoroughness**: close tasks end-to-end (analysis, change, verification).

## 1. Think Before Coding

**Don't assume. Don't hide ambiguity. Surface trade-offs.**

Before implementing:
- State assumptions explicitly. When in doubt — ask.
- If multiple interpretations exist, present them — don't choose silently.
- If a simpler approach exists, mention it. Challenge when justified.
- If something is unclear — stop. Name the problem. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked for.
- No abstractions for one-time code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.

Ask yourself: "Would a senior engineer say this is over-engineered?" If yes — simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only after yourself.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that work.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code — mention it, don't remove it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

Test: every changed line should directly follow from the user's request.

## 4. Goal-Oriented Execution

**Define success criteria. Iterate until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix a bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, provide a short plan:
```
1. [Step] → verification: [check]
2. [Step] → verification: [check]
3. [Step] → verification: [check]
```

Strong success criteria enable independent work. Weak criteria ("make it work") require constant clarification.

## 5. Verification

- `npm run build`, `npm run lint`, `npm test` from the repo root (API tests need PostgreSQL; the committed `apps/api/.env.test` describes the expected instance).
- `npm run test:e2e` (Playwright smoke suite in `e2e/`) for anything user-visible; extend `e2e/tests/smoke.spec.ts` when a flow is new.
- Prettier (`.prettierrc`: 4 spaces, single quotes, width 120, CRLF) on the files you changed. Every file in the repo is CRLF — never convert line endings.