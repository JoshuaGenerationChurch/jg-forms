# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
A Laravel 12 + React 19 application for handling church work request forms. Uses Inertia.js for SPA-like navigation with server-side routing. The main feature is a multi-page conditional form (`work-request.tsx`) for event requests, signage, digital media, print media, and video/film projects.

## Build & Development Commands

```bash
# Start development (runs server, queue, logs, vite concurrently)
composer dev

# Setup project from scratch
composer setup

# Run all tests (includes lint check)
composer test

# Run a single Pest test file
php artisan test tests/Feature/SomeTest.php

# Run a specific test by name
php artisan test --filter="test name"

# PHP linting (Laravel Pint)
composer lint              # Fix issues
composer test:lint         # Check only

# Frontend linting and formatting
npm run lint               # ESLint with --fix
npm run format             # Prettier
npm run format:check       # Check formatting
npm run types              # TypeScript type checking

# Build frontend
npm run build
npm run build:ssr          # With SSR support
```

## Architecture

### Backend (Laravel)
- **Routes**: `routes/web.php` (main), `routes/settings.php` (user settings)
- **Authentication**: Laravel Fortify with 2FA support, configured in `app/Providers/FortifyServiceProvider.php`
- **Requests/Validation**: Form requests in `app/Http/Requests/`
- **Database**: SQLite by default, uses `RefreshDatabase` trait in feature tests

### Frontend (React + TypeScript)
- **Entry point**: `resources/js/app.tsx`
- **Pages**: `resources/js/pages/` - Inertia renders these based on route name (lowercase, e.g., `dashboard.tsx`)
- **Layouts**: `resources/js/layouts/` - `AppLayout` wraps authenticated pages, `AuthLayout` for auth pages
- **UI Components**: `resources/js/components/ui/` - Radix UI primitives with shadcn/ui styling
- **Types**: `resources/js/types/` - Shared TypeScript types
- **Hooks**: `resources/js/hooks/` - Custom React hooks (appearance, clipboard, 2FA, etc.)
- **Wayfinder**: Auto-generates TypeScript route helpers from Laravel routes (`resources/js/wayfinder/`)

### Key Conventions
- Pages use lowercase filenames matching route names
- Import alias `@/` maps to `resources/js/`
- ESLint enforces alphabetized imports with type imports separated
- Pint uses Laravel preset for PHP formatting
- Tailwind CSS v4 configured via Vite plugin

### Form Structure
The work request form (`resources/js/pages/work-request.tsx`) is a complex multi-page form with conditional logic. Reference `form-conditional-logic.md` for the complete page flow and field dependencies.

## Testing
- Uses Pest PHP testing framework
- Feature tests use `RefreshDatabase` trait (see `tests/Pest.php`)
- Test database runs in-memory SQLite
