# Imagine Apps Pricing System - Development Plan

## Overview

Replace the "Herramienta Pricy" Excel spreadsheet with a responsive web application built with React (frontend) and Node.js/Express (backend). The system allows commercials to build project quotes by selecting team members, setting margins, and generating professional PDF proposals — all with role-based access control.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + TypeScript + Vite | Modern, fast, type-safe |
| UI | Tailwind CSS + shadcn/ui | Professional, responsive, fast to build |
| Backend | Node.js + Express + TypeScript | Same language as frontend, great ecosystem |
| Database | PostgreSQL + Prisma ORM | Relational data fits perfectly, type-safe queries |
| Auth | JWT (access + refresh tokens) | Stateless, simple, secure |
| PDF | @react-pdf/renderer | Client-side PDF generation |
| Deploy | Docker Compose | One-command deployment on any VPS |

---

## Epic 1: Project Setup & Infrastructure

### US-1.1: Project Initialization
**As a** developer
**I want to** set up the monorepo with frontend and backend projects
**So that** I have a working development environment

**Acceptance Criteria:**
- [ ] Backend: Node.js + Express + TypeScript project in `/backend`
- [ ] Frontend: React + Vite + TypeScript project in `/frontend`
- [ ] Tailwind CSS + shadcn/ui configured
- [ ] ESLint configured for both projects
- [ ] `package.json` scripts for dev, build, start
- [ ] Both projects start without errors

### US-1.2: Database Schema & Seed Data
**As a** developer
**I want to** define the database schema and seed it with data from the Excel
**So that** the system has the same master data as the current spreadsheet

**Acceptance Criteria:**
- [ ] Prisma schema with all tables: users, clients, role_catalog, parameters, team_templates, team_template_members, quotes, quote_team_members
- [ ] Migration runs successfully on a fresh PostgreSQL database
- [ ] Seed script populates:
  - All role profiles with salaries from "Parámetros" sheet (Forward Deployed PM, DevOps Senior, FDE, etc.)
  - Tax parameters (ICA: 0.69%, Renta: 0%, TC commission: 2.9%)
  - TRM exchange rate (3550)
  - Commission structure per lead source from "Política Comisiones"
  - Team templates from Excel sheets (Equipo Base, UX, UX+PM, FDE, Sprint MVP)
  - Default admin user
- [ ] All seeded data matches the Excel values

### US-1.3: Docker Compose Setup
**As a** developer
**I want to** containerize the entire application
**So that** it can be deployed on any VPS with a single command

**Acceptance Criteria:**
- [ ] `docker-compose.yml` with 3 services: frontend (Nginx), backend (Node), db (PostgreSQL)
- [ ] Environment variables for DB credentials, JWT secret, etc.
- [ ] `docker-compose up` starts the full application
- [ ] Frontend serves on port 80, backend on port 3001
- [ ] Database data persists via Docker volume

---

## Epic 2: Authentication & User Management

### US-2.1: User Login
**As a** commercial or admin
**I want to** log in with my email and password
**So that** I can access the pricing system securely

**Acceptance Criteria:**
- [ ] POST `/api/auth/login` accepts email + password, returns JWT access token + refresh token
- [ ] Passwords are hashed with bcrypt
- [ ] Access token expires in 15 minutes, refresh token in 7 days
- [ ] POST `/api/auth/refresh` returns a new access token
- [ ] Login page with email/password fields, responsive design
- [ ] Invalid credentials show error message
- [ ] On successful login, redirect to dashboard
- [ ] Token stored in httpOnly cookie or localStorage with auto-refresh

### US-2.2: Role-Based Access Control
**As an** admin
**I want** commercials to only see their own quotes and clients
**So that** each salesperson's data is private

**Acceptance Criteria:**
- [ ] User model has `role` field: `ADMIN` or `COMMERCIAL`
- [ ] Backend middleware checks role on protected routes
- [ ] Admin can access all resources (all quotes, all clients, all users)
- [ ] Commercial can only access their own quotes and clients
- [ ] Frontend hides admin-only navigation items for commercials
- [ ] Unauthorized API access returns 403

### US-2.3: User Management (Admin)
**As an** admin
**I want to** create, edit, and deactivate user accounts
**So that** I can manage who has access to the system

**Acceptance Criteria:**
- [ ] Admin page listing all users with name, email, role, status
- [ ] Create user form: name, email, password, role
- [ ] Edit user: change name, email, role, reset password
- [ ] Deactivate/activate user (soft delete, not hard delete)
- [ ] Cannot deactivate your own account
- [ ] Only accessible by admins

---

## Epic 3: Parameters & Configuration (Admin)

### US-3.1: Role Catalog Management
**As an** admin
**I want to** manage the role catalog (profiles, salaries, company costs)
**So that** commercials use up-to-date pricing when building quotes

**Acceptance Criteria:**
- [ ] Admin page listing all roles with: name, base salary (COP), company cost
- [ ] Add new role with name, salary, company cost
- [ ] Edit existing role's salary and cost
- [ ] Deactivate a role (hides from quote builder, doesn't delete)
- [ ] Changes take effect on new quotes only (existing quotes keep snapshot)
- [ ] Salary displays formatted in COP (e.g., $5,000,000)

### US-3.2: Financial Parameters Management
**As an** admin
**I want to** update financial parameters (TRM, taxes, commissions)
**So that** quotes always reflect current rates

**Acceptance Criteria:**
- [ ] Admin settings page with editable fields:
  - TRM exchange rate (COP/USD)
  - ICA tax rate (%)
  - Income tax rate (%)
  - Credit card commission (%)
  - Face value commission (%)
  - Hours per month (default 180)
- [ ] Commission structure table editable per lead source:
  - Marketing: Referido %, KAM %, Total %
  - Directo: Referido %, KAM %, Total %
  - Referido Imagine: Referido %, KAM %, Total %
  - Network/Cold Calling: Referido %, KAM %, Total %
- [ ] Save button with confirmation
- [ ] Audit trail: log who changed what and when

### US-3.3: Team Templates Management
**As an** admin
**I want to** create and manage team templates
**So that** commercials can quickly start quotes with pre-built team compositions

**Acceptance Criteria:**
- [ ] Admin page listing all templates with name and team members
- [ ] Create template: name, description, add members from role catalog with dedication %
- [ ] Edit template members and dedication
- [ ] Delete template (soft delete)
- [ ] Pre-seeded templates: Equipo Base, Equipo con UX, Equipo UX+PM, Equipo dos FDE, Sprint MVP

---

## Epic 4: Client Management

### US-4.1: Client CRUD
**As a** commercial
**I want to** create and manage client records
**So that** I can associate quotes with clients

**Acceptance Criteria:**
- [ ] Clients list page with search and pagination
- [ ] Create client form: name, company, email, phone, notes
- [ ] Edit client details
- [ ] Client detail page showing all associated quotes
- [ ] Commercial sees only clients they created
- [ ] Admin sees all clients
- [ ] Client can be selected when creating a quote

---

## Epic 5: Quote Builder (Core Feature)

### US-5.1: Quote Configuration Step
**As a** commercial
**I want to** configure the basic parameters of a quote
**So that** the system can calculate pricing correctly

**Acceptance Criteria:**
- [ ] Step 1 of quote wizard with fields:
  - Business line dropdown: Equipo Dedicado, Descubrimiento, Sprint MVP, Caso Express
  - Client selector (search + create new inline)
  - Duration in months (numeric input)
  - Seller contract type: Nómina, Prestación de Servicios, Deel/Ontop
  - Lead source: Marketing, Directo, Referido Imagine, Network/Cold Calling
  - Commission rate (auto-filled from lead source + contract type, editable)
  - Credit card payment toggle (adds 2.9%)
  - Factoring toggle
  - Staff augmentation toggle
  - Target Gross Margin % (default from parameters, e.g., 40%-50%)
- [ ] All fields validated before proceeding to next step
- [ ] Responsive layout (single column on mobile, two columns on desktop)

### US-5.2: Team Composition Step
**As a** commercial
**I want to** build the project team by selecting roles and dedication
**So that** the system can calculate the team cost

**Acceptance Criteria:**
- [ ] Step 2 of quote wizard
- [ ] "Load Template" button opens modal with available team templates
- [ ] Selecting a template populates the team with pre-configured members
- [ ] "Add Team Member" button opens role selector from catalog
- [ ] Each team member card shows:
  - Role name
  - Base salary (read-only from catalog)
  - Contract type dropdown (Nómina, P. Servicios, Deel/Ontop)
  - Dedication % input (0-100%, step 5%)
  - Calculated hours (dedication × 180)
  - Calculated cost (real-time)
  - Remove button
- [ ] Running total at bottom: total team cost (COP), total hours
- [ ] Minimum team validation hint: "Per dev: PM 33%, QA 20%, Design 10%"
- [ ] Can add same role multiple times (e.g., 2 developers)

### US-5.3: Pricing & Margin Calculation (Real-Time)
**As a** commercial
**I want to** see pricing calculated in real-time as I adjust margins
**So that** I can find the right price point for the client

**Acceptance Criteria:**
- [ ] Step 3 of quote wizard
- [ ] Two pricing scenarios displayed side by side:
  **Scenario A: "Jugar con Gross Margin"**
  - Input: Target Gross Margin %
  - Calculated: Total price, monthly price, hourly rate (COP + USD)
  - Calculated: Commission amount, ICA, income tax
  - Calculated: Resulting Net Margin %

  **Scenario B: "Jugar con Net Margin"**
  - Input: Target Net Margin %
  - Calculated: Total price, monthly price, hourly rate (COP + USD)
  - Calculated: Commission amount, ICA, income tax
  - Calculated: Resulting Gross Margin %

- [ ] Margin health indicator:
  - Green: "Dentro del margen" (at or above target)
  - Red: "¡Por debajo del margen!" (below target)
- [ ] Per-member pricing breakdown table:
  - Role | Dedication | Hours | Price/Hour | Total Price
  - In both COP and USD columns
- [ ] Summary section:
  - Costo Equipo (team cost)
  - Costo + Gasto Fijo (cost + fixed expenses)
  - Computador/Herramientas (equipment/tools)
  - ROP Gasto, ROP Costo Fijo
  - Comisión Venta
  - ICA, Impuesto Renta
  - Net Margin, Gross Margin
- [ ] All calculations update instantly when any input changes
- [ ] Formulas match Excel exactly (verified against sample data)

### US-5.4: Quote Review & Save
**As a** commercial
**I want to** review the complete quote and save it
**So that** I can access it later or send it to the client

**Acceptance Criteria:**
- [ ] Step 4: full quote summary read-only view
- [ ] Auto-generated quote code (e.g., QT-2026-001)
- [ ] Save as Draft (can edit later)
- [ ] Save as Final (locked, status = SENT)
- [ ] Redirect to quote detail page after save
- [ ] Edit button on drafts returns to wizard with all data loaded

### US-5.5: Quote List & History
**As a** commercial
**I want to** view all my quotes with filters
**So that** I can track my work and find past quotes

**Acceptance Criteria:**
- [ ] Quotes list page with columns: code, client, business line, total (USD), status, date
- [ ] Filters: status (Draft/Sent/Approved/Rejected), date range, client
- [ ] Search by code or client name
- [ ] Sort by date, amount, client
- [ ] Click row opens quote detail
- [ ] Commercial sees own quotes, admin sees all
- [ ] Admin can filter by commercial

---

## Epic 6: PDF Export

### US-6.1: Professional PDF Quote Export
**As a** commercial
**I want to** export a quote as a professional PDF
**So that** I can send it to the client

**Acceptance Criteria:**
- [ ] "Export PDF" button on quote detail page
- [ ] PDF includes:
  - Imagine Apps logo and branding
  - Quote code and date
  - Client information
  - Team composition table with roles and dedication
  - Pricing table (USD): Role, Hours, Price/Hour, Total
  - Total price and monthly price
  - Payment terms
  - Server policy section (from "Política de Servidores")
  - Validity period
- [ ] PDF is well-formatted and professional
- [ ] Download triggers immediately in browser
- [ ] Works on mobile (download or share)

---

## Epic 7: Dashboard

### US-7.1: Dashboard Overview
**As a** user
**I want to** see a summary of key metrics on login
**So that** I can quickly understand my pipeline

**Acceptance Criteria:**
- [ ] Summary cards:
  - Total quotes (all time)
  - Quotes this month
  - Total quoted value (USD) this month
  - Quotes by status (Draft/Sent/Approved/Rejected)
- [ ] Recent quotes table (last 10)
- [ ] Quick action buttons: "New Quote", "New Client"
- [ ] Admin sees company-wide metrics
- [ ] Commercial sees personal metrics only
- [ ] Responsive: cards stack on mobile

---

## Epic 8: Responsive Design & Polish

### US-8.1: Mobile-First Responsive Layout
**As a** user
**I want to** use the system comfortably on my phone or tablet
**So that** I can create quotes on the go

**Acceptance Criteria:**
- [ ] Sidebar collapses to hamburger menu on mobile
- [ ] Quote wizard steps are scrollable on small screens
- [ ] Tables become card layouts on mobile
- [ ] All inputs are touch-friendly (min 44px tap targets)
- [ ] Pricing tables scroll horizontally on small screens
- [ ] PDF download works on mobile browsers

---

## Calculation Engine (Reference)

These formulas replicate the Excel logic and will be implemented in the backend:

```
CONSTANTS:
  hours_per_month = 180

INPUTS:
  team_members[]  = { role, salary, contract_type, dedication }
  duration_months
  target_gross_margin OR target_net_margin
  commission_rate, ica_rate, income_tax_rate, cc_rate
  trm (COP/USD)

CALCULATIONS:
  // Contract multiplier (Nómina has prestaciones ~38%)
  contract_multiplier = contract_type == 'Nómina' ? 1.38 : 1.0

  // Per member
  member_cost_monthly = salary * contract_multiplier * dedication
  member_hours = hours_per_month * dedication

  // Totals
  team_cost_monthly = SUM(member_cost_monthly)
  team_cost_total = team_cost_monthly * duration_months
  total_hours = SUM(member_hours)

  // Fixed costs (from ROP parameters)
  fixed_costs = rop_gasto + rop_costo_fijo + equipment_cost
  cost_base = team_cost_monthly + fixed_costs

  // SCENARIO A: Target Gross Margin
  gross_price_cop = cost_base / (1 - target_gross_margin)
  commission_a = gross_price_cop * commission_rate
  cc_charge_a = credit_card ? gross_price_cop * cc_rate : 0
  ica_a = gross_price_cop * ica_rate
  income_tax_a = gross_price_cop * income_tax_rate
  net_margin_a = (gross_price_cop - cost_base - commission_a - ica_a - income_tax_a - cc_charge_a) / gross_price_cop

  // SCENARIO B: Target Net Margin
  net_price_cop = cost_base / (1 - target_net_margin - commission_rate - ica_rate - income_tax_rate - (credit_card ? cc_rate : 0))
  gross_margin_b = (net_price_cop - cost_base) / net_price_cop

  // USD conversion
  price_usd = price_cop / trm
  hourly_rate_cop = price_cop / total_hours
  hourly_rate_usd = price_usd / total_hours

  // Monthly pricing
  monthly_price = total_price / duration_months
```

---

## Development Order

I will build in this exact sequence:

1. **Backend foundation** → Express + Prisma + PostgreSQL schema + seed
2. **Auth API** → Login, JWT, role middleware
3. **Core APIs** → Roles, clients, parameters, templates, quotes + calculation engine
4. **Frontend foundation** → Vite + React + Tailwind + shadcn + routing + auth pages
5. **Dashboard** → Summary cards + recent quotes
6. **Quote builder** → All 4 steps with real-time calculations
7. **Client pages** → CRUD + quote history
8. **Admin pages** → Parameters, roles, templates, users
9. **PDF export** → Professional quote document
10. **Docker** → Compose file for full deployment
11. **Responsive polish** → Mobile testing and fixes
