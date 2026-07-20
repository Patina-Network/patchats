# Increment 5 — Template management (create / list / delete + UI)

**Prerequisites:** [Increment 1](01-async-send-pipeline.md) only (the `email_templates` table +
read/list DAO). **Delivers:** self-service authoring — admins **create and delete** templates with no code.
Purely **additive**; it removes the "seeded/read-only" limitation that Increments 1–4 lived with.
See [00-overview.md](00-overview.md) for full context.

> **Templates are immutable — there is no edit/update.** To change copy, create a new template (and delete the
> old one if it's unused). This is deliberate: with render-at-send (#4), immutability means a queued row's
> template never changes under it, so there is no in-flight edit race to reason about.

## Decisions that apply here
- **Templates DB-stored; create/list/delete lands here** (#15).
- **All sends via a selected `templateId`** (#16) — this increment makes the selectable set self-service.
- **Render at send-time** (#4): safe here because templates are immutable — a `PENDING`/`ERROR` row always renders
  from the same template it was created against. The only in-flight concern is **delete** (see below).

---

## Backend — template create / list / delete

Extend `EmailTemplateRepo` (read/list already exists from Increment 1) with `insert` and `delete`, and add
endpoints:

- `POST /api/email/templates` — create.
- `DELETE /api/email/templates/{id}` — delete.
- *(list/read already exists: `GET /api/email/templates` from Increment 1.)*

**Validation** (reject before save, `400`):
- `name` unique and non-blank; `subject`/`body` non-blank.
- **Well-formed `${}` placeholders** — dry-run
  [TemplateRenderer](../../src/main/java/org/patinanetwork/patchats/email/TemplateRenderer.java) against a set
  of sample `per1.*`/`per2.*` + shared vars and reject a template that throws on malformed syntax.
- On `DELETE`: `template_id` is **load-bearing** with a `NOT NULL` FK from `emails`, so a template referenced by
  any row **cannot be hard-deleted** — the FK blocks it, and deleting one referenced by `PENDING` rows would make
  them unrenderable. Recommended: **block delete** if any row references it (or add a `deleted_at` **soft-delete**
  flag — hidden from the selector, kept for existing rows). Never hard-delete a referenced template.

## Frontend — `TemplateManager` (new route/tab)

- **(a) List/table** of templates: name, `created_at`, delete action.
- **(b) Create form:** `name` + subject + body textareas, with a **live preview** that reuses `/preview`
  + [EmailPreviewer](../../js/src/features/emails/_components/EmailPreviewer.tsx) so the author sees rendered
  output as they type.
- **(c) Placeholder helper:** a side panel listing the available variables (`${per1.name}`, `${per1.bio}`, …,
  `${per2.*}`, and shared vars like `${period}`) so authors know what they can reference.
- **(d) Delete** with a confirm dialog (disabled/blocked for referenced templates, per the delete policy).
- After this ships, the **template selectors** in Increments 3 (manual send) and 4 (matching) read this fuller,
  user-managed list instead of only the seeded rows — no change needed there beyond pointing at the same
  `GET /api/email/templates`.

---

## Files to touch
- **Modify (backend):** `EmailTemplateRepo` (add `insert` + `delete`); the email controller (add POST +
  DELETE); add validation (reuse `TemplateRenderer` for the dry run).
- **Create (frontend):** `TemplateManager` component/route; extend
  [emailAPI.ts](../../js/src/features/emails/api/emailAPI.ts) with `createTemplate` and `deleteTemplate`;
  template DTO types in [emailDto.ts](../../js/src/features/emails/dto/emailDto.ts).

## Verification
- Create a template in the UI, then use it in a **manual** send (Inc 3) and a **matching** send (Inc 4).
- Delete an **unreferenced** template succeeds; deleting a **referenced** template is blocked (or soft-deletes).
- Assert validation **rejects** a template with malformed `${}` syntax and a duplicate `name`.
