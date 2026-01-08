1. Migration Strategy (Non-Negotiable)

Migrate incrementally, not all files at once

Preserve runtime behavior exactly

Do not refactor logic unless required for typing

Prefer minimal diffs

2. File Conversion Rules

Rename files one by one:
*.js → *.ts

Do not introduce new abstractions

Do not change folder structure

Leave untouched files as JavaScript

3. Type Safety Rules

Prefer inference over explicit types

Avoid any unless unavoidable

If type is unknown → use unknown

If value may be missing → handle null/undefined explicitly

Allowed

const x = foo() // inferred


Avoid

const x: any = foo()

4. Hono-Specific Rules

Do NOT wrap Hono types manually

Let Hono infer Context, Request, and Response

Use Hono generics only for env bindings

type Env = {
  DATABASE_URL: string
}

const app = new Hono<{ Bindings: Env }>()


Always access params via:

c.req.param('id')

5. Validation & Schemas (Critical)

Replace manual validation with Zod

Use @hono/zod-validator

Never trust request data without validation

Pattern

zValidator('json', schema)
c.req.valid('json')


Schema = single source of truth

No duplicate interfaces

6. Environment Variables

All environment variables must be typed

No process.env.X as string

No implicit string assumptions

Correct

type Env = {
  JWT_SECRET: string
}

7. Function & Utility Rules

Add explicit types only at module boundaries

function params

return values

Internal variables rely on inference

export function createUser(input: CreateUserInput): User

8. Error Handling Rules

Catch blocks use unknown

catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err.message)
  }
}


No catch (e: any)

9. Imports & Exports

Use ES modules only

import { foo } from './foo'


No require

No default export changes unless necessary

10. tsconfig Constraints

Respect existing tsconfig

Do NOT enable strict unless instructed

Do NOT change module target or runtime assumptions

11. What AI Must NOT Do 🚫

❌ Do not rewrite logic

❌ Do not rename variables

❌ Do not “clean up” code

❌ Do not add frameworks or libraries

❌ Do not change behavior

❌ Do not silence errors with any

12. Preferred Migration Order

Entry file (index.ts)

Hono routes

Middleware

Utilities/helpers

Models/schemas

Tests

13. Completion Checklist

AI must confirm:

✅ Compiles with TypeScript

✅ No runtime behavior change

✅ No any unless justified

✅ Validation exists for external input

✅ Env vars are typed