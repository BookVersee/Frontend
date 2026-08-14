# BookVerse

BookVerse is a multi-vendor e-commerce platform for books, where multiple shops can list products, manage orders, and serve customers through a single marketplace experience.

This repository contains both frontend and backend applications:

- `Frontend/`: ReactJS client application
- `Backend/`: .NET 8 Web API services

## Project Overview

BookVerse is designed around four core business domains:

- Customer: discover books, place orders, track deliveries, and request refunds.
- Vendor (Shop): manage storefronts, inventory, orders, and revenue.
- Delivery: process assigned shipments and update fulfillment status.
- Administration: manage accounts, categories, moderation, and disputes.

The platform supports real-world marketplace workflows, including payment callback handling, shipping integration, and asynchronous order status updates.

## Core Capabilities

### Customer
- Account registration, sign-in, and secure session handling.
- Book discovery with category/price/rating/distance filtering.
- Multi-vendor cart with grouped checkout flow.
- Address autocomplete and shipping fee estimation.
- Online and offline payments (for example: VNPAY/MoMo and COD).
- End-to-end order tracking and post-purchase feedback.
- Return and refund requests with evidence attachments.

### Vendor (Shop)
- Shop onboarding and profile setup.
- Book catalog management (create, update, hide/show, stock updates).
- Order intake, preparation, and shipping handoff.
- Customer review responses.
- Revenue, wallet, and transaction history tracking.

### Delivery
- Assigned delivery job intake.
- Shipment state transitions (for example: out-for-delivery, delivered, returned).

### Administration
- User and shop approval/suspension.
- Category management.
- Dispute resolution and refund governance.

## High-Level Architecture

- Frontend: ReactJS SPA (Vite-based).
- Backend: ASP.NET Core Web API (.NET 8), layered architecture.
- Data access: Entity Framework Core (Code-First).
- Authentication: JWT-based access control.
- External services:
  - Maps and address suggestions (Google Maps Places API).
  - Shipping and fee calculation (GHN API).
  - Payment gateway integration (VNPAY/MoMo).

## Technology Stack

- Frontend: React, React Router, Axios, TailwindCSS and/or Ant Design
- Backend: ASP.NET Core 8, Entity Framework Core, LINQ
- Security: BCrypt password hashing, JWT authentication
- Database: SQL database (managed via EF Core migrations)
- Documentation: Swagger/OpenAPI
- Deployment:
  - Frontend: Vercel
  - Backend: Azure App Service, Render, or Railway

## Repository Structure

```text
BookVerse/
|- Frontend/
|- Backend/
`- README.md
```

## Local Development

### Prerequisites

- Node.js LTS (recommended: 20+)
- .NET SDK 8.0+
- SQL Server (or compatible SQL instance for development)
- Package manager: npm or pnpm

### 1) Clone and prepare

```bash
git clone <your-repository-url>
cd BookVerse
```

### 2) Run Backend

```bash
cd Backend
dotnet restore
dotnet ef database update
dotnet run
```

Default API docs are expected at Swagger endpoint once the API is running.

### 3) Run Frontend

```bash
cd Frontend
npm install
npm run dev
```

Set frontend environment variables (for example `VITE_API_URL`) to point to the running backend.

## Configuration

Create environment-specific configuration values for both applications.

Recommended variables include:

- Frontend:
  - `VITE_API_URL`
- Backend:
  - `ConnectionStrings__DefaultConnection`
  - `Jwt__Issuer`
  - `Jwt__Audience`
  - `Jwt__Secret`
  - `GoogleMaps__ApiKey`
  - `GHN__Token`
  - `VNPay__TmnCode`
  - `VNPay__HashSecret`

Do not commit secrets. Use local environment files and secure secret stores in production.

## Engineering Workflow

- Branching model:
  - `main`: production-ready branch
  - `develop`: integration branch
  - feature branches: `feature/<name>`
- Pull requests are required before merge.
- Branch protection and required checks are strongly recommended.
- Work tracking should be managed via issue board (Kanban/Sprint lanes).

## Quality Standards

- API contracts documented and versioned.
- Input validation and authorization required on protected endpoints.
- Error responses standardized across services.
- Integration and end-to-end test coverage for key business flows.
- Performance practices for EF Core queries (for example read-only tracking optimization and N+1 avoidance).

## Deployment Notes

- Frontend and backend are deployed independently.
- Configure CORS between frontend domain and API domain.
- Use production-grade SQL database and managed secrets.
- Verify payment callback URLs and shipping webhook endpoints before go-live.

## Current Status

BookVerse is structured as a production-oriented marketplace project with clear domain boundaries and extensible architecture for future scaling.

## License

Define your project license here (for example: MIT).
# BookVerse
# Frontend
