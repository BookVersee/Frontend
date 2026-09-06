# BookVerse Frontend

Enterprise-grade, high-concurrency Single Page Application (SPA) for the **BookVerse** multi-vendor digital bookstore and logistics marketplace ecosystem. Built with React 19, TypeScript, Vite 8, Tailwind CSS, and powered by an ASP.NET Core (.NET 8) Web API with real-time SignalR WebSocket hubs.

<div align="left">

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.9-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SignalR](https://img.shields.io/badge/SignalR_Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://learn.microsoft.com/aspnet/core/signalr)
[![Axios](https://img.shields.io/badge/Axios_HTTP-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![React Router](https://img.shields.io/badge/React_Router_v7-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## Table of Contents
- [1. System Architecture](#1-system-architecture)
- [2. Core Business Domains & Capabilities](#2-core-business-domains--capabilities)
- [3. Multi-Role Portal Architecture](#3-multi-role-portal-architecture)
- [4. Directory Structure](#4-directory-structure)
- [5. Getting Started & Cross-Platform Setup](#5-getting-started--cross-platform-setup)
  - [5.1 Prerequisites](#51-prerequisites)
  - [5.2 macOS / Linux Setup](#52-macos--linux-setup)
  - [5.3 Windows Setup (PowerShell / Command Prompt)](#53-windows-setup-powershell--command-prompt)
  - [5.4 Database & Backend Launch Configurations](#54-database--backend-launch-configurations)
- [6. Unified Environment Configuration (.env)](#6-unified-environment-configuration-env)
- [7. Security, Identity & Payment Protocols](#7-security-identity--payment-protocols)
  - [7.1 OTP Password Recovery Protocol](#71-otp-password-recovery-protocol)
  - [7.2 Resilient Payment & Cart Recovery Flow](#72-resilient-payment--cart-recovery-flow)
- [8. Engineering Standards & Quality Assurance](#8-engineering-standards--quality-assurance)
- [9. Technical Documentation Sitemap](#9-technical-documentation-sitemap)
- [10. License](#10-license)

---

## 1. System Architecture

The client application follows a clean, modular, domain-driven frontend architecture. It is strictly separated into presentation layers, business logic hooks/contexts, centralized API services, and typed contract definitions.

```
                              +-------------------------------------------------+
                              |       Client Browser (React 19 + Vite SPA)      |
                              +-------------------------------------------------+
                                      |                                   |
                         HTTP / REST (Axios + JWT Bearer)     WebSockets (SignalR Core)
                                      |                                   |
                                      v                                   v
                              +-------------------------------------------------+
                              |      Vite Reverse Proxy (Local Development)     |
                              |      /api -> :5226        |      /hubs -> :5226 |
                              +-------------------------------------------------+
                                      |                                   |
                                      +-----------------+-----------------+
                                                        |
                                                        v
                              +-------------------------------------------------+
                              |        ASP.NET Core Web API (.NET 8 Engine)     |
                              |              Host: http://localhost:5226        |
                              +-------------------------------------------------+
                                   |                |                  |
                                   v                v                  v
                          +----------------+ +----------------+ +----------------+
                          |   SQL Server   | | SignalR Hubs   | |  Third-Party   |
                          | (or PostgreSQL)| | - /hubs/chat   | | - VNPay / MoMo |
                          | Local / Docker | | - /hubs/notif  | | - GHN Express  |
                          |  Port: 1433    | | - /hubs/app    | | - Cloudinary   |
                          +----------------+ +----------------+ +----------------+
```

### Architectural Highlights
- **Unidirectional Reactive State Flow**: Global application state (Authentication, Notifications, Real-time Chat) is isolated in dedicated React Contexts with fine-grained re-render control.
- **Contract-First Service Layer**: All network requests pass through a centralized Axios client (`api.ts`) equipped with request/response interceptors for automated JWT injection, token expiration handling, and standard error normalization.
- **Reverse Proxying for Zero-CORS Issues**: Development server leverages Vite's internal HTTP proxy to stream `/api` and `/hubs` traffic seamlessly to backend port `5226`, eliminating cross-origin browser rejections.
- **Fail-Safe Client Resilience**: Dynamic fallback drivers enable graceful offline/mock operation when backend microservices are temporarily unreachable.

---

## 2. Core Business Domains & Capabilities

### 2.1 Identity & Access Management (IAM)
- **Dual Authentication Engines**: Standard email/password credentials alongside Google Identity Services (GIS) OAuth 2.0.
- **Automated Password Recovery**: Multi-stage OTP verification lifecycle via SMTP with 5-minute cache TTL and a 60-second rate-limiting cooldown.
- **Role-Based Access Control (RBAC)**: Route-level protection via `<ProtectedRoute />` guarding unauthorized access across all four platform personas.

### 2.2 Real-Time Communication & Notification Engine
- **Bidirectional SignalR WebSockets**: Instant messaging pipeline between Customers and Merchants via `/hubs/chat`.
- **Interactive In-Chat Voucher Sharing**: Merchants can dispatch live voucher ticket widgets directly into chat threads; customers can claim coupons in real time.
- **System-Wide Notification Hub**: Live delivery updates, order status changes, and platform alerts streamed via `/hubs/notifications`.

### 2.3 Resilient Commerce & Checkout Engine
- **Multi-Vendor Cart Grouping**: Automatically segregates line items by merchant, computing independent shipping fees, discounts, and order totals.
- **Payment Gateway Integration**: Direct sandbox processing for **VNPay** and **MoMo** (dynamic QR payload generation, deeplinking, and cryptographic callback verification).
- **Cart Resilience on Transaction Failure**: When an online payment is canceled or rejected at the payment gateway, customer cart items are preserved instead of discarded, enabling instant retry.
- **Logistics Integration**: Real-time shipping fee calculation, delivery manifest creation, and order tracking via Giao Hàng Nhanh (GHN Express).

### 2.4 Post-Purchase Experience & Lifecycle
- **Self-Service Order Cancellation**: Customers can cancel pending orders with structured reason logging, instant order status synchronization, and automatic inventory replenishment.
- **Transaction History Ledger**: Dedicated financial audit view in the customer profile displaying all historical transactions (MoMo, VNPay, COD), transaction IDs, payment methods, timestamps, and payment statuses.
- **Book Reviews & Verified Feedback**: Post-delivery rating system supporting star ratings, textual feedback, and image attachments uploaded directly to Cloudinary.

---

## 3. Multi-Role Portal Architecture

The platform provides tailored user interfaces for all four key marketplace roles:

| Role | Access URL | Core Capabilities |
| :--- | :--- | :--- |
| **Customer** | `/` | Bookstore catalog, smart search, sample reading preview, multi-vendor cart & checkout, order tracking, order cancellation, transaction history ledger, reviews, shop chat. |
| **Shop Owner** | `/shop` | Storefront branding, book catalog management, stock replenishment, order processing (Confirm/Prepare), revenue analytics, discount vouchers, customer support chat. |
| **Shipper (Deliver)** | `/deliver` | Shipping manifest assignment, real-time route execution (Picking up -> Out for delivery -> Delivered / Failed), COD cash collection tracking. |
| **Administrator** | `/admin` | Marketplace governance dashboard, merchant shop approval/verification, user access suspension, platform-wide transaction auditing. |

---

## 4. Directory Structure

```
Frontend/
├── .env                                # Local environment variables (ignored by Git)
├── .env.example                        # Standard template variables (tracked by Git)
├── .gitattributes                      # Git LF line-ending normalization for cross-platform
├── .gitignore                          # Excludes secrets, node_modules, build outputs
├── LICENSE                             # MIT Open Source License
├── package.json                        # Project dependencies and operational scripts
├── vite.config.js                      # Vite bundler, plugin pipeline, and reverse proxy
├── tailwind.config.js                  # Design tokens, typography, and responsive breakpoints
├── docs/                               # Comprehensive engineering guides
│   ├── PROJECT_STRUCTURE_AND_GUIDE.md
│   ├── API_INTEGRATION_GUIDE.md
│   ├── GOOGLE_OAUTH_AND_NETWORK_CONFIG_GUIDE.md
│   ├── GOOGLE_LOGIN_BACKEND_FRONTEND_ANALYSIS.md
│   ├── CHAT_REALTIME_ANALYSIS_AND_SOLUTION.md
│   ├── TYPESCRIPT_AND_REACT_CORE_GUIDE.md
│   └── OPEN_SOURCE_LIBRARIES_GUIDE.md
├── public/                             # Static brand assets and web icons
└── src/
    ├── components/                     # Reusable UI component library
    │   ├── auth/                       # AuthModal (Login/Register/OTP), ProtectedRoute
    │   ├── chat/                       # ChatDrawer, VoucherTicket interactive widget
    │   ├── common/                     # Btn, Modal, Card, StatCard, Badge, BookCover, Header, Footer
    │   └── customer/                   # FeaturedShops, Customer-specific storefront modules
    ├── contexts/                       # Application state providers
    │   ├── AuthContext.tsx             # User session, JWT tokens, login/logout actions
    │   └── NotificationContext.tsx     # Real-time notification feed & unread counter
    ├── pages/                          # Role-based route view controllers
    │   ├── customer/                   # HomePage, BookDetailPage, CartPage, CheckoutPage,
    │   │                               # MyOrdersPage, OrderDetailPage, PaymentResultPage,
    │   │                               # ProfilePage (with Transaction History), ShopProfilePage
    │   ├── shop/                       # ShopDashboardPage (Inventory, Orders, Vouchers, Analytics)
    │   ├── deliver/                    # DeliverDashboardPage (Delivery manifests & COD)
    │   └── admin/                      # AdminDashboardPage (Platform control & shop approvals)
    ├── services/                       # Centralized API network clients
    │   ├── api.ts                      # Axios singleton instance with interceptors
    │   ├── authService.ts              # Authentication & OTP password recovery
    │   ├── bookService.ts              # Book catalog, search, and category querying
    │   ├── cartService.ts              # Local & server-synchronized shopping cart
    │   ├── orderService.ts             # Order lifecycle, cancellation, and transaction ledger
    │   ├── paymentService.ts           # VNPay & MoMo integration drivers
    │   ├── signalRService.ts           # Realtime Chat & Notification WebSocket connection
    │   ├── uploadService.ts            # Cloudinary direct image uploading
    │   └── feedbackService.ts          # Book ratings and reader review submissions
    ├── types/                          # Canonical TypeScript interfaces & DTO schemas
    └── utils/                          # Currency formatting (VND), date parsers, status mappers
```

---

## 5. Getting Started & Cross-Platform Setup

### 5.1 Prerequisites
- **Node.js**: `v20.x` or higher (LTS recommended)
- **Package Manager**: `npm` (`v10.x+`) or `pnpm`
- **Backend Service**: ASP.NET Core Web API running on `.NET 8` at `http://localhost:5226`
- **Database Engine**: Microsoft SQL Server 2019/2022 (Local or Docker container)

---

### 5.2 macOS / Linux Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BookVersee/Frontend.git
   cd Frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize local environment configuration**:
   ```bash
   cp .env.example .env
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```
   The client will be running at **`http://localhost:5173`**.

---

### 5.3 Windows Setup (PowerShell / Command Prompt)

1. **Clone the repository**:
   ```powershell
   git clone https://github.com/BookVersee/Frontend.git
   cd Frontend
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Initialize local environment configuration**:
   ```powershell
   # In Windows PowerShell:
   Copy-Item .env.example .env

   # Or in Command Prompt (CMD):
   copy .env.example .env
   ```

4. **Start development server**:
   ```powershell
   npm run dev
   ```

---

### 5.4 Database & Backend Launch Configurations

#### Database Connection Strategies (SQL Server):
- **Docker Strategy (macOS / Linux / Windows WSL2)**:
  ```env
  DB_CONNECTION_STRING=Server=localhost,1433;Database=BookManagementDb;User Id=sa;Password=YourStrongPasswordHere123!;TrustServerCertificate=True;
  ```
- **Local Windows SSMS Strategy**:
  - For default instance:
    ```env
    DB_CONNECTION_STRING=Server=.;Database=BookManagementDb;Trusted_Connection=True;TrustServerCertificate=True;
    ```
  - For SQL Server Express:
    ```env
    DB_CONNECTION_STRING=Server=.\SQLEXPRESS;Database=BookManagementDb;Trusted_Connection=True;TrustServerCertificate=True;
    ```

#### Backend Visual Studio Launch Profile (Windows):
When running the Backend via Visual Studio on Windows, ensure you select the **`http`** profile (running Kestrel on `http://localhost:5226`) instead of `IIS Express`. This ensures the ports match Vite's proxy rules.

---

## 6. Unified Environment Configuration (.env)

The project adheres to strict credential isolation:
- **[`.env`](.env)**: Local runtime file containing actual developer secrets and environment parameters. **Automatically ignored by Git via `.gitignore`**.
- **[`.env.example`](.env.example)**: Standardized template with sanitized placeholders. **Tracked by Git**.

```
Frontend Root
├── .env          <-- Secret credentials, DB strings, local keys [IGNORED BY GIT]
└── .env.example  <-- Clean variable schema, dummy values [TRACKED BY GIT]
```

### Parameter Reference Matrix

| Category | Parameter | Scope | Default / Example | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Networking** | `PORT_FRONTEND` | Docker / Node | `5173` | Exposed port for React Vite dev server |
| **Networking** | `PORT_BACKEND` | Docker / .NET | `5226` | Port for ASP.NET Core 8 Web API |
| **Networking** | `PORT_DB` | Docker | `1433` | Port for Microsoft SQL Server container |
| **Database** | `DB_TYPE` | System | `sqlserver` | Target RDBMS engine (`sqlserver` or `postgres`) |
| **Database** | `DB_HOST` | System | `localhost` | Host machine or Docker network service name (`db`) |
| **Database** | `DB_NAME` | System | `BookManagementDb` | Application relational database name |
| **Database** | `DB_CONNECTION_STRING` | Backend / Docker | `Server=...;` | Complete connection string with credentials |
| **Backend Core** | `ASPNETCORE_ENVIRONMENT` | Backend | `Development` | ASP.NET Core runtime hosting mode |
| **Backend Core** | `JWT_SECRET_KEY` | Backend | `...` | Cryptographic secret key for signing JWT tokens |
| **Client Core** | `VITE_PORT` | Client / Vite | `5173` | Local HTTP port for Vite development |
| **Client Core** | `VITE_API_URL` | Client / Axios | `/api` | Base path forwarded via Vite reverse proxy |
| **Client Core** | `VITE_API_TIMEOUT` | Client / Axios | `15000` | HTTP request timeout in milliseconds (15s) |
| **Client Core** | `VITE_BACKEND_URL` | Client | `http://localhost:5226` | Direct address of the backend service |
| **WebSockets** | `VITE_WS_CHAT_URL` | Client / SignalR | `http://localhost:5226/hubs/chat` | Endpoint for real-time buyer-seller chat |
| **WebSockets** | `VITE_WS_NOTIF_URL` | Client / SignalR | `http://localhost:5226/hubs/notifications` | Endpoint for real-time alert notifications |
| **Feature Flags**| `VITE_ENABLE_MOCK` | Client | `false` | Enables mock datasets when backend is offline |
| **Feature Flags**| `VITE_ENABLE_AI_ASSISTANT`| Client | `true` | Enables AI chatbot advisory widget |
| **Payments** | `VITE_VNPAY_PAYMENT_URL` | Client | `https://sandbox.vnpayment.vn/...` | VNPay Sandbox payment gateway endpoint |
| **Payments** | `VITE_MOMO_PAYMENT_URL` | Client | `https://test-payment.momo.vn/...` | MoMo Wallet payment gateway endpoint |
| **Logistics** | `VITE_GHN_API_URL` | Client | `https://dev-online-gateway.ghn.vn/...` | GHN Express logistics rate & dispatch API |
| **Media / Cloud**| `VITE_CLOUDINARY_CLOUD_NAME`| Client | `bookverse-dev` | Cloudinary storage bucket for book covers |
| **Identity** | `VITE_GOOGLE_CLIENT_ID` | Client | `...apps.googleusercontent.com` | Google OAuth 2.0 Client Credentials |

> [!NOTE]
> Vite only exposes variables prefixed with `VITE_` into the client-side JavaScript bundle. System variables (such as `DB_CONNECTION_STRING`, `JWT_SECRET_KEY`) remain strictly confidential on the server/Docker container.

---

## 7. Security, Identity & Payment Protocols

### 7.1 OTP Password Recovery Protocol

```
+--------+                 +----------------+                 +------------------+
| Client |                 | Backend API    |                 | Mail Server SMTP |
+--------+                 +----------------+                 +------------------+
    |                              |                                    |
    | 1. POST /api/auth/ForgotPassword                                  |
    |----------------------------->|                                    |
    |                              | 2. Generate 6-digit OTP            |
    |                              |    Cache in Memory (TTL: 5m)       |
    |                              | 3. Dispatch Email                  |
    |                              |----------------------------------->|
    |                              |                                    |
    | 4. POST /api/auth/ResetPassword { email, otpCode, newPassword }   |
    |----------------------------->|                                    |
    |                              | 5. Validate OTP signature & TTL    |
    |                              | 6. BCrypt hash & persist password  |
    | 7. HTTP 200 OK (Success)     |                                    |
    |<-----------------------------|                                    |
    |                              |                                    |
    | 8. POST /api/auth/Login { email, password }                       |
    |----------------------------->|                                    |
    | 9. HTTP 200 { AccessToken }  |                                    |
    |<-----------------------------|                                    |
```

---

### 7.2 Resilient Payment & Cart Recovery Flow

```
[ Checkout Page ] ---> Select Payment Method (VNPay / MoMo)
                             |
                             v
               Submit Order -> Redirect to Gateway
                             |
         +-------------------+-------------------+
         |                                       |
    [ Payment SUCCESS ]                    [ Payment FAILED / CANCELED ]
         |                                       |
         v                                       v
Redirect to /payment-result             Redirect to /payment-result?status=cancel
- Order Status: CONFIRMED               - Order Status: PENDING / CANCELED
- Clear purchased items from Cart       - AUTO-RESTORE items in Shopping Cart
- Render Success Confirmation           - Allow Instant Payment Retry
```

---

## 8. Engineering Standards & Quality Assurance

- **Zero-Any TypeScript Policy**: All domain entities, API payloads, and response envelopes are strongly typed via explicit TypeScript interfaces.
- **Cross-Platform Line Ending Consistency**: Enforced via [`.gitattributes`](.gitattributes) using `eol=lf` to prevent line-ending churn across macOS, Linux, and Windows teams.
- **Code Quality & Linting**: Strict ESLint 10 suite configured with React 19 Hooks and Refresh rules:
  ```bash
  npm run lint
  ```
- **Production Build Verification**: Rigorous compilation and asset bundle optimization:
  ```bash
  npm run build
  ```
- **Local Production Preview**:
  ```bash
  npm run preview
  ```

---

## 9. Technical Documentation Sitemap

For in-depth architectural analyses, domain specifications, and implementation walk-throughs, refer to the technical guides in the [`docs/`](docs/) directory:

1. [**Project Structure & Architecture Guide**](docs/PROJECT_STRUCTURE_AND_GUIDE.md): Detailed architectural tour of components, states, and reverse proxy routing.
2. [**REST API Integration Guide**](docs/API_INTEGRATION_GUIDE.md): Endpoints, payload contracts, Bearer token handling, and Axios interceptor workflows.
3. [**Google OAuth & Network Configuration Guide**](docs/GOOGLE_OAUTH_AND_NETWORK_CONFIG_GUIDE.md): End-to-end setup for Google Cloud Console, Authorized Origins, and JWT validation.
4. [**Google Login Backend & Frontend Gap Analysis**](docs/GOOGLE_LOGIN_BACKEND_FRONTEND_ANALYSIS.md): Comprehensive analysis of OAuth 2.0 integration between React and ASP.NET Core.
5. [**Real-time Chat & SignalR WebSocket Guide**](docs/CHAT_REALTIME_ANALYSIS_AND_SOLUTION.md): In-depth review of SignalR Hub topologies, reconnection states, and event listeners.
6. [**TypeScript & React Core Architecture**](docs/TYPESCRIPT_AND_REACT_CORE_GUIDE.md): Domain modeling conventions, type safety standards, and hook patterns.
7. [**Open Source Libraries & Package Guide**](docs/OPEN_SOURCE_LIBRARIES_GUIDE.md): Dependency rationale and architectural role of each external package.

---

## 10. License

This project is licensed under the terms of the [MIT License](LICENSE).

Copyright (c) 2026 BookVerse. Open source and free to use, modify, and distribute.
