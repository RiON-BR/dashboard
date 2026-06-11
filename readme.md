# Chatvia - Full-Stack Social & Enterprise Dashboard Platform

An ecosystem combining a modular **React + Redux (MUI)** admin dashboard panel with a robust **Node.js + Express** backend server utilizing **Oracle DB** relational structures and live **Socket.io** event layers.

---

## 🏗️ Project Architecture Overview

The workspace is organized into two primary micro-directories decoupled at the root:

```text
main/
├── Admin/               # Frontend Single Page Application (React.js)
│   ├── src/
│   │   ├── components/  # Reusable UI Atoms (Sidebar, Header, Layouts)
│   │   ├── pages/       # View Frameworks (Dashboard, Marketplace, Profile)
│   │   ├── redux/       # Redux-Saga Global State Pipeline
│   │   └── assets/      # Stylesheets (SCSS), Images, and Fonts
└── server/              # Backend Application Service Layer (Node.js)
    ├── routes/          # Express Router Endpoint Groupings
    ├── services/        # Business Logic & DB Transactions Mapping
    ├── db/              # Relational Schema Definitions
    └── middleware/      # Authentication & Security Handlers

└── middleware/      # Authentication & Security Handlers
```


💻 Frontend Module (React)
Location: Admin/

Core Technologies: React 18+, Material-UI (MUI v5), Reactstrap, Redux-Saga, Axios, Socket.io-client.

Key Features & Implementations
Interactive Responsive Sidebar: Built as an expandable/collapsible persistent drawer (70px compact to 240px expanded on hover zone mouse enter) utilizing smooth CSS transitions and opacity control to reveal label indicators without causing layout thrashing.

Global State Engine: Managed via Redux-Saga handling state persistence for authentication states, asynchronous chat messaging history pools, shopping carts, and dynamic multi-mode theme layouts.

Theming: Leverages dynamic style wrappers switching structural parameters gracefully without hardcoding elements to preserve dark/light contrast rules across active views.

Local Initialization
Bash
cd Admin
npm install
npm start

⚙️ Backend Module (Node/Express)Location: server/Core Technologies: Node.js, Express, Oracle DB Connection Driver (oracledb), Socket.io, JSON Web Tokens (JWT).API Route Layout MatrixThe service architecture isolates specific transactional tables via explicit router maps:DomainRoute PathOperational ContextAuth/api/authJWT State Creation, Registration, Secure Password ChangeChat/api/chatP2P Messaging Logs, Room Creations, Message Status SyncBlogs/api/blogsFeed Interactions, Content Post Engines, Like TogglesProducts/api/productsE-commerce Catalog Mapping, Stock Counter OperationsOrders/api/ordersCheckout Pipeline Tracking, Merchant Distribution Updates

🚀 Key Features Matrix Implemented
Compact Matrix Analytics Panel: High-fidelity dashboard displaying active system performance indexes using responsive linear spline area tracking configurations without data collision layout loops.

Amazon-Style E-Commerce Grid: Clamped product layouts built into clean 4-column responsive grid items featuring static product aspect frames and quick-action "Add to Cart" and "Buy Now" checkout buttons.

Unified Communications Framework: Combined standard text views with live operational states to deliver seamless multi-user chat sessions.