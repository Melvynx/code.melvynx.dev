# Model Test Lab Product Brief

## Source

This document captures the product direction given for `/prompts/test`, especially the model benchmark workflow, Convex persistence, image uploads, password-protected writes, and the interactive grid UI.

## Objective

Build a model testing workspace that makes it fast to compare coding models on reusable benchmark suites. A suite should not be a hardcoded page. It should be a live workspace where the user can choose models, define challenges, enter result evidence, and compare model performance.

## Product Principles

- No hardcoded model comparisons. Models such as Opus, Gemini, or any future model must be user-created or selected, not baked into the app.
- The main interaction should be a grid, not scattered sidebar forms.
- The UI should feel like a serious internal lab tool: dense, direct, editable, and easy to update.
- Avoid explanatory filler copy in the product surface. Use labels, controls, and values.
- Commit and push after changes in this project unless explicitly told otherwise.
- Production must work through Vercel and Convex, not only local state.

## Core Workflow

1. Create a test suite.
2. Name the suite and set its status.
3. Add or select the models to compare.
4. Each selected model becomes a column in the grid.
5. Add challenges as rows in the grid.
6. For each challenge and model pair, open the result cell and record evidence.
7. Review the summary at the bottom to compare model performance.

## Suites

A suite is one benchmark comparison. It contains:

- A name.
- Optional description or notes.
- Status: draft, running, or complete.
- A selected set of models.
- A list of challenges.
- Result cells for every challenge/model pair.

Suites must be reusable and editable. The user should be able to create a new suite with different models and challenges without changing code.

## Models

Models belong to a reusable model library, but the suite decides which models are active for that comparison.

Required model capabilities:

- Create a model.
- Rename a model.
- Change the provider.
- Add an existing model to the current suite.
- Remove a model column from the current suite without necessarily deleting the model globally.
- Add model columns directly from the grid.

The grid column header should be editable. It should not force the user to jump to a separate sidebar just to change a model name.

## Challenges

Challenges are user-created tasks that every selected model should solve.

Each challenge should support:

- Challenge name.
- Prompt or task text.
- Expected outcome.
- Optional prompt import from the existing prompt library.
- Inline editing from the grid row.
- Deletion from the suite.

Challenges must not be hardcoded in the app. The user should be able to add "Challenge 1 Feature", "Challenge 2 Feature", or any custom task from the interface.

## Result Cells

Each result cell represents one model solving one challenge.

A result should support:

- Duration.
- Number of shots.
- Screenshots or image evidence.
- Notes.
- Positive points as a list.
- Negative points as a list.
- Rubric scores.

The cell should be easy to open, edit, save, and revisit.

## Scoring Rubric

Do not use one generic score. Use separate dimensions:

- Code Quality: 1 to 5.
- Prompt Feature: 1 to 5. Measures how well the requested feature was respected.
- Reliability: 1 to 5. Measures stability, runtime behavior, build confidence, and edge-case handling.

The summary can average these dimensions, but the raw dimensions must remain visible and editable.

## Images

Screenshots are part of the test evidence.

Implementation direction:

- Support image uploads on result cells.
- Store images through R2.
- Use a setup similar to `nowstack-saas` where possible.
- Keep image storage production-ready, not only local browser storage.

## Persistence

Use Convex for production persistence.

Expected Convex-backed entities:

- Model.
- Suite.
- SuiteModel link.
- Challenge.
- Result.
- Attachment.

The local fallback can exist for development, but production should persist through Convex.

## Write Access

Editing Convex data requires a password.

Rules:

- The app can be publicly readable.
- Mutations require password verification.
- The password must be stored as an environment variable.
- Do not commit real passwords or deploy keys into the repository.

## Vercel And Convex Deployment

Production deploys must include Convex deploys.

Build command requirement:

```sh
pnpm convex:deploy:vercel
```

The command should deploy Convex with the production deploy key and then run the Next.js build with `NEXT_PUBLIC_CONVEX_URL` available.

Required production setup:

- Generate a Convex deploy key for production.
- Add `CONVEX_DEPLOY_KEY` to Vercel Production environment variables.
- Add the model-test admin password to Convex production env.
- Add R2 env vars to Convex production env.
- Confirm that Vercel build logs show the Convex deploy before `next build`.

## UI Direction

The main surface should be the grid:

- Suite controls at the top.
- Challenge rows.
- Model columns.
- Add-model column.
- Add-challenge row.
- Result cells at intersections.
- Summary below the grid.

Avoid:

- Hardcoded starter comparisons.
- Big explanatory hero text.
- Sidebar-heavy workflows for common grid edits.
- Decorative copy such as "clean modern style" or feature explanations in the UI.
- Layouts where the user cannot directly add/change columns.

Use:

- Inline editable fields.
- Icon buttons where appropriate.
- Compact inputs.
- Native density.
- Clear disabled states before unlocking write access.

## Production Validation Checklist

After changing this feature, verify:

- `eslint` passes.
- `next build` passes.
- Vercel production deployment completes.
- Vercel build runs `pnpm convex:deploy:vercel`.
- Convex production functions deploy successfully.
- `/prompts/test` hydrates in production.
- Password unlock works.
- Adding a model column is possible.
- Adding a challenge row is possible.
- Old hardcoded seed data does not reappear.

