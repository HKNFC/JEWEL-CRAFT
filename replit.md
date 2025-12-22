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
The application has six main tables:
1. **users** - User accounts with company info, credentials, email API settings, and admin flag
2. **manufacturers** - Jewelry manufacturers with contact info (shared across all users)
3. **stone_setting_rates** - Pricing tiers based on carat ranges (shared across all users)
4. **gemstone_price_lists** - Gemstone types with quality grades and per-carat pricing (shared across all users)
5. **analysis_records** - Main cost analysis records with gold labor, fire percentage, polish, and certificate costs (user-specific via userId)
6. **analysis_stones** - Individual stones within an analysis record (one-to-many relationship)
7. **batches** - Batch groupings for analysis records (user-specific via userId)
8. **exchange_rates** - USD/TRY and gold prices (shared across all users)
9. **rapaport_prices** - Diamond price data from Rapaport (shared across all users)
10. **rapaport_discount_rates** - Discount percentages by carat range (shared across all users)

### Data Isolation Strategy
- **Shared data**: Manufacturers, stone setting rates, gemstone prices, exchange rates, Rapaport prices, and discount rates are shared across all users. Any user can view and modify these.
- **User-specific data**: Analysis records and batches are isolated per user. Each user can only see and modify their own analysis records and batch reports.

### Authentication System
- **Session-based authentication** using express-session with memorystore
- **Password hashing** with bcrypt (10 rounds)
- **Protected routes** - All pages except login require authentication
- **User-specific email API keys** - Each user can configure their own Resend API key

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
- `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me` - Authentication endpoints
- `/auth/profile`, `/auth/password`, `/auth/email-api-key` - User settings endpoints
- `/manufacturers` - CRUD for manufacturer management
- `/stone-setting-rates` - CRUD for setting rate tiers
- `/gemstone-prices` - CRUD for gemstone price lists
- `/analysis-records` - CRUD for analysis records with nested stones
- `/send-batch-report` - POST endpoint to send batch reports via email (uses user's Resend API key)

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