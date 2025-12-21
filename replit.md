# Jewelry Cost Analysis Application

## Overview

This is a jewelry cost analysis application built for manufacturers to track and calculate product costs. The application manages manufacturers, stone setting rates, gemstone price lists, and analysis records to provide comprehensive cost breakdowns for jewelry products. The UI is in Turkish, indicating the target market.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful API with JSON responses
- **Development Server**: Vite dev server with HMR proxied through Express

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)

### Database Schema
The application has five main tables:
1. **manufacturers** - Jewelry manufacturers with contact info
2. **stone_setting_rates** - Pricing tiers based on carat ranges
3. **gemstone_price_lists** - Gemstone types with quality grades and per-carat pricing
4. **analysis_records** - Main cost analysis records with gold labor, fire percentage, polish, and certificate costs
5. **analysis_stones** - Individual stones within an analysis record (one-to-many relationship)

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components (shadcn + custom)
│       ├── pages/        # Route components
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utilities and API client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared code between frontend/backend
│   └── schema.ts     # Drizzle schema definitions
└── migrations/       # Database migrations
```

### API Endpoints
All routes prefixed with `/api/`:
- `/manufacturers` - CRUD for manufacturer management
- `/stone-setting-rates` - CRUD for setting rate tiers
- `/gemstone-prices` - CRUD for gemstone price lists
- `/analysis-records` - CRUD for analysis records with nested stones
- `/send-batch-report` - POST endpoint to send batch reports via email (uses Resend)

### Build System
- Development: `tsx` for TypeScript execution with Vite dev server
- Production: esbuild bundles server, Vite builds client to `dist/`

## External Dependencies

### Database
- **PostgreSQL**: Primary database (connection via `DATABASE_URL` environment variable)
- **pg**: Node.js PostgreSQL client
- **Drizzle Kit**: Database schema management and migrations

### UI/Component Libraries
- **Radix UI**: Headless component primitives (dialogs, dropdowns, forms, etc.)
- **Lucide React**: Icon library
- **shadcn/ui**: Pre-built component patterns using Radix + Tailwind
- **jsPDF + jspdf-autotable**: PDF report generation for analysis records

### Email Service
- **Resend**: Email service for sending batch reports to manufacturers
- **API Key**: Stored in `RESEND_API_KEY` secret

### Development Tools
- **Vite**: Frontend build tool with React plugin
- **Replit plugins**: Runtime error overlay, cartographer, dev banner (development only)