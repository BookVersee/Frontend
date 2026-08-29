# BookVerse Frontend

Enterprise-grade Single Page Application (SPA) for the BookVerse multi-vendor digital bookstore and logistics platform.

<div align="left">

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.9-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SignalR](https://img.shields.io/badge/SignalR_Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://learn.microsoft.com/aspnet/core/signalr)
[![Axios](https://img.shields.io/badge/Axios_HTTP-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![React Router](https://img.shields.io/badge/React_Router_v7-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![ESLint](https://img.shields.io/badge/ESLint_10-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)](https://eslint.org/)

</div>

---

## 1. System Architecture

The frontend is architected as a modular, role-based React application designed around high cohesion, strict separation of concerns, and clean contract boundaries.

```
                  +-------------------------------------------------+
                  |               Client Browser (Vite SPA)         |
                  +-------------------------------------------------+
                         |                                  |
               REST API (Axios / Bearer JWT)       WebSocket (SignalR Core)
                         |                                  |
                         v                                  v
                  +-------------------------------------------------+
                  |          Reverse Proxy (/api -> :5226)          |
                  +-------------------------------------------------+
                         |                                  |
                         v                                  v
                  +-------------------+            +----------------+
                  | .NET 10 REST APIs |            | Chat Hub (:5226)|
                  +-------------------+            +----------------+
```

### Architectural Principles
- **Unidirectional Data Flow & Scoped Contexts**: Global concerns (Authentication, Notifications, Real-time messaging) are managed via dedicated React Context providers with optimized re-render boundaries.
- **Contract-Driven API Layer**: Centralized Axios instance (`apiClient`) featuring automated Bearer Token injection, structured error transformation, and unified HTTP interceptors.
- **Multi-Role Domain Segmentation**: Independent business views for `Customer`, `Shop Owner`, `Shipper (Deliver)`, and `Platform Administrator` with role-guarded routes.
- **Fail-Safe & Resilient Operation**: Graceful error handling with structured user feedback and decoupled fallback mechanisms.

---

## 2. Core Modules & Capabilities

### 2.1 Identity & Access Management (IAM)
- **Token-Based Authentication**: JWT access token management with automatic Authorization header attachment.
- **Multi-Provider Support**: Standard credential authentication alongside Google Identity Services (GIS) / OAuth 2.0 integration.
- **Automated Password Recovery**: Multi-step OTP verification lifecycle via SMTP with live timer expiration (5 minutes) and rate-limiting cooldown protection (60 seconds).

### 2.2 Real-Time Communication
- **SignalR WebSocket Protocol**: Bidirectional, low-latency messaging pipeline connecting customers and book vendors.
- **State Synchronization**: Automatic connection lifecycle handling, unread indicator tracking, and conversation indexing.

### 2.3 Commerce & Payment Processing
- **Cart & Order Processing**: Multi-vendor checkout flow with itemized shop grouping and dynamic inventory checks.
- **Payment Gateways**: MoMo Sandbox integration (dynamic QR payload generation, deeplinking, and transaction callback verification) and VNPay redirect handling.
- **Logistics Integration**: Delivery manifest creation, GHN tracking code assignment, and COD reconciliation flows.

---

## 3. Directory Structure

```
Frontend/
├── docs/                               # Engineering specifications & technical reports
│   ├── API_INTEGRATION_GUIDE.md        # REST API endpoint contracts
│   ├── CHAT_REALTIME_ANALYSIS.md       # SignalR realtime architecture review
│   └── GOOGLE_LOGIN_ANALYSIS.md        # OAuth 2.0 gap analysis and implementation guide
├── public/                             # Static public assets
├── src/
│   ├── components/
│   │   ├── auth/                       # Authentication dialogs & OTP recovery workflows
│   │   ├── chat/                       # Realtime customer/shop conversation widgets
│   │   ├── common/                     # Core design system primitives (Button, Modal, Card, Badge)
│   │   └── payment/                    # Gateway QR scanner & payment status dialogs
│   ├── contexts/                       # Application state providers (AuthContext, NotificationContext)
│   ├── pages/
│   │   ├── admin/                      # Platform administration and governance dashboards
│   │   ├── customer/                   # Marketplace storefront, cart, checkout, order tracking
│   │   ├── deliver/                    # Shipper manifests and delivery execution
│   │   └── shop/                       # Merchant inventory, revenue analytics, dispute resolution
│   ├── services/                       # API clients, SignalR hub connection, storage managers
│   ├── types/                          # Canonical domain models and contract definitions
│   └── utils/                          # Currency formatting, date parsers, and status mappers
├── .env.development                    # Local environment variables
├── package.json                        # Dependency manifest and npm build scripts
├── tailwind.config.js                  # Design system tokens and theme extensions
└── vite.config.js                      # Development proxy and server configuration
```

---

## 4. Getting Started

### 4.1 Prerequisites
- **Node.js**: `>= 20.0.0` (LTS recommended)
- **Package Manager**: `npm` (`>= 10.x`) or `pnpm`
- **Backend Service**: ASP.NET Core Web API running on `http://localhost:5226`

### 4.2 Local Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BookVersee/Frontend.git
   cd Frontend
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment parameters**:
   Create or verify `.env.development`:
   ```bash
   cp .env.example .env.development
   ```

4. **Launch the development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

5. **Production Build & Verification**:
   ```bash
   npm run build
   ```

---

## 5. Environment Configuration Reference

The application reads configuration parameters at build and runtime via Vite's `import.meta.env`:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `string` | `/api` | Base path for REST calls (proxied to backend in development) |
| `VITE_API_TIMEOUT` | `number` | `15000` | HTTP request timeout in milliseconds |
| `VITE_WS_CHAT_URL` | `string` | `ws://localhost:5226/hubs/chat` | WebSocket endpoint for SignalR Chat Hub |
| `VITE_ENABLE_MOCK` | `boolean` | `false` | Fallback flag for mock service drivers when offline |
| `VITE_GOOGLE_CLIENT_ID`| `string` | `...` | Google OAuth Client ID for identity verification |

---

## 6. Security & Authentication Protocol

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

## 7. Quality Assurance & Standards

- **Code Quality**: Strict ESLint configuration with React Hooks and TypeScript rules.
- **Type Rigor**: Zero `any` policy across core domain models; all backend DTOs strictly mapped to TypeScript interfaces.
- **Performance**: Dynamic code splitting, asset optimization, and minimal bundle footprint.
