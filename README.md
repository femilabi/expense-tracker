# Expense Tracker

A personal finance app for recording income and expenses, setting monthly category budgets, and reviewing spending trends.

## Features

- Monthly dashboard with income, expenses, savings, recent transactions, and spending pace
- Record and review income and expenses
- Set monthly budgets by spending category
- Account signup with email verification, password reset, and email-change confirmation
- User profiles with currency preferences and avatar uploads
- Automated tests for finance calculations and account workflows

## Tech stack

- Next.js App Router, React, and TypeScript
- Chakra UI and Recharts
- Prisma with MySQL-compatible MariaDB
- NextAuth for authentication
- Vitest for tests

## Requirements

- Node.js compatible with the versions required by the installed Next.js release
- pnpm (the package manager pinned in `package.json`)
- A MySQL-compatible database (MySQL or MariaDB)
- A Resend account for production email delivery
- Cloudinary credentials for profile photo uploads

## Getting started

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/femilabi/expense-tracker.git
   cd expense-tracker
   pnpm install
   ```

2. Copy `.env.example` to `.env` and set the values for your environment. At minimum, configure `DATABASE_URL` and `AUTH_SECRET`. Set `APP_URL` to the app's public URL. For production, configure `RESEND_API_KEY` and `RESEND_FROM`; configure the Cloudinary variables to enable avatar uploads.

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   macOS/Linux:

   ```bash
   cp .env.example .env
   ```

3. Generate the Prisma client and apply the development migrations:

   ```bash
   pnpm db:generate
   pnpm db:migrate:dev
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

In development, if email delivery is not configured, signup codes and email links are written to the server terminal. Production email delivery requires a configured Resend sender.

## Useful commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Generate Prisma client and start the development server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run the Vitest suite |
| `pnpm ci-build` | Generate Prisma client and build the app |
| `pnpm db:generate` | Generate Prisma client after schema changes |
| `pnpm db:migrate:dev` | Create and apply a development migration |
| `pnpm db:migrate:deploy` | Apply committed migrations |
| `pnpm db:studio` | Open Prisma Studio |

`pnpm build` and `pnpm start` apply committed database migrations. Ensure the configured database is reachable before using them.

## Project layout

- `src/app/` — Pages, layouts, and API routes
- `src/components/` — Shared and feature-specific UI
- `src/lib/` — Data access, finance calculations, and shared utilities
- `src/emails/` — Account and notification email templates
- `prisma/` — Database schema and migrations

## Configuration

See [`.env.example`](.env.example) for the required environment variable names and setup notes. Keep your real `.env` file and credentials private; do not commit them.
