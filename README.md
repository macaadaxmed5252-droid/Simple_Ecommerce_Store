# CodeAlpha_Simple_Ecommerce_Store — Enterprise Grade E-Commerce Web Application

An elegant, responsive storefront with a secure Express and MongoDB API, customer accounts, persistent shopping bag, simulated checkout, product reviews, and an admin workspace.

## 1. Table of Contents

- [Project Overview & Features Highlight](#2-project-overview--features-highlight)
- [System Architecture & Tech Stack](#3-system-architecture--tech-stack)
- [Project Folder Structure](#4-project-folder-structure)
- [Getting Started & Installation Guide](#5-getting-started--installation-guide)
- [API Documentation Overview](#6-api-documentation-overview)
- [UI/UX Highlights](#7-uiux-highlights)
- [Submission Details & CodeAlpha Metadata](#8-submission-details--codealpha-metadata)
- [License & Author Info](#9-license--author-info)

## 2. Project Overview & Features Highlight

Atelier is a full-stack e-commerce application created for the CodeAlpha Task 1 assignment. Customers can explore a curated product catalog, manage a local shopping bag, register and sign in, check out using a clearly identified mock payment flow, and review previous purchases. Store admins can manage products and update order fulfillment status.

### Customer features

- Registration and sign-in with bcrypt (12 salt rounds), strong password rules, login rate limiting, request sanitization, and a strictly verified JWT in an HTTP-only cookie.
- Responsive product catalog with category filters, text search, price range, and sorting.
- Product detail pages with image gallery, stock availability, ratings, and customer reviews.
- Persistent local-storage shopping bag with quantity controls and live subtotal, estimated tax, and shipping.
- Multi-step shipping and mock payment checkout, with inventory checks and order confirmation.
- Dedicated customer portal layouts at `/account`, `/dashboard`, and `/orders`, with profile information and order history.

### Store management

- Role-based access for customers and admins.
- Admin overview with product, order, customer, and paid revenue totals.
- Monthly revenue / order analytics, category sales distribution, and customer access management.
- Create, edit, and delete products; review stock levels.
- View placed orders, assign tracking references, and update status: pending, processing, shipped, delivered, or cancelled.
- Customer profile photo uploads validate JPEG, PNG, or WebP signatures and a 2 MB limit before being served from the uploads directory.
- Customer portal includes detailed order history, fulfillment and tracking information, and downloadable plain-text receipts.

## 3. System Architecture & Tech Stack

The application uses a modular MVC-style layout. Express routes map HTTP requests to controllers. Controllers validate requests and coordinate Mongoose models; middleware handles authentication, authorization, request limits, and errors. The browser UI is served as static assets and communicates with the API using same-origin JSON requests.

| Layer | Technology | Responsibility |
|---|---|---|
| Backend | Node.js, Express.js | REST API, static frontend delivery, request middleware |
| Models / Database | MongoDB, Mongoose | Users, products, embedded reviews, orders, inventory |
| Authentication | bcryptjs, JSON Web Token | Password hashing, signed HTTP-only session cookie, customer/admin authorization |
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) | Responsive storefront, catalog filters, cart, account, checkout, admin UI |
| Payment | Mock checkout | Demonstrates order completion without collecting or charging payment card details |

The cart is persisted in browser local storage. Product prices, available stock, tax, shipping, totals, and user permissions are validated or calculated by the API at order creation; the browser does not set the authoritative order total.

## 4. Project Folder Structure

```text
CodeAlpha_Simple_Ecommerce_Store/
├── Backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   └── productController.js
│   ├── middleware/
│   │   ├── auth.js               # JWT and role checks
│   │   ├── avatarUpload.js       # File size and media-type gate
│   │   ├── errorHandler.js
│   │   ├── sanitizeInput.js      # HTML sanitization for request bodies
│   │   └── validate.js
│   ├── models/
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── orderRoutes.js
│   │   └── productRoutes.js
│   ├── storage/uploads/          # Created when profile images are uploaded
│   └── seed.js                   # Idempotent product/admin seed script
├── Frontend/
│   ├── css/styles.css
│   ├── js/app.js
│   └── index.html
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js                     # Express entry point
```

## 5. Getting Started & Installation Guide

### Prerequisites

- Node.js 20.13 or later and npm.
- MongoDB running locally, or a MongoDB Atlas connection string.
- A terminal opened at the project root.

### Environment Variables setup (`.env`)

Copy `.env.example` to `.env` and set your MongoDB URI and a unique JWT secret of at least 32 characters. Configure a private admin password before seeding.

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `PORT` | Express port (default `4000`) |
| `MONGODB_URI` | Local or Atlas MongoDB connection string |
| `JWT_SECRET` | Private signing key; use a long random value |
| `JWT_EXPIRES_IN` | JWT lifetime (default `7d`) |
| `CLIENT_URL` | Allowed browser origin (default `http://localhost:4000`) |
| `TAX_RATE` | Tax rate as a decimal (default `0.08`) |
| `SHIPPING_FEE` | Standard shipping amount in USD (default `8`) |
| `FREE_SHIPPING_THRESHOLD` | Subtotal for complimentary shipping in USD (default `100`) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created by the seed script |

Never commit `.env` or use the example JWT/admin credentials in a deployed environment.

### Installation (`npm install`)

```bash
npm install
```

### Database Setup & Seeding Mock Data (`npm run seed`)

Start MongoDB, then seed the sample catalog and configured admin account:

```bash
npm run seed
```

The seed script can be run again safely: it updates the sample products and admin account using the values in `.env`. Admin credentials come from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### Running the Server (`npm run dev`)

```bash
npm run dev
```

Open [http://localhost:4000](http://localhost:4000). The development script uses Node.js built-in watch mode. Use `npm start` for a standard Node.js process. The API health check is available at `/api/health`.

## 6. API Documentation Overview

All routes are prefixed with `/api`. “Authenticated” means a valid JWT session cookie or `Authorization: Bearer <token>`. Admin routes also require the admin role. Product list filters accept `search`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, and `limit` query parameters.

| HTTP Method | Endpoint | Description | Auth status |
|---|---|---|---|
| `GET` | `/api/health` | API health check | Public |
| `GET` | `/api/store-config` | Get public tax and shipping settings | Public |
| `POST` | `/api/auth/register` | Create a customer account | Public |
| `POST` | `/api/auth/login` | Sign in and issue session cookie | Public |
| `POST` | `/api/auth/logout` | Clear the session cookie | Public |
| `GET` | `/api/auth/me` | Get current account | Authenticated |
| `PATCH` | `/api/auth/me` | Update name or email | Authenticated |
| `GET` | `/api/auth/me/orders` | Get current user’s order history | Authenticated |
| `GET` | `/api/products` | List, search, filter, and sort products | Public |
| `GET` | `/api/products/categories` | List catalog categories | Public |
| `GET` | `/api/products/:id` | Get product details and reviews | Public |
| `POST` | `/api/products/:id/reviews` | Add a product review | Authenticated |
| `POST` | `/api/orders` | Validate stock and create an order | Authenticated |
| `GET` | `/api/orders/mine` | Get current user’s orders | Authenticated |
| `GET` | `/api/orders/:id` | Get an order owned by the user | Authenticated / Admin |
| `GET` | `/api/orders/:id/receipt` | Download an order receipt | Authenticated / Admin |
| `GET` | `/api/admin/overview` | Get store summary metrics | Admin |
| `POST` | `/api/admin/products` | Create a product | Admin |
| `PATCH` | `/api/admin/products/:id` | Update a product | Admin |
| `DELETE` | `/api/admin/products/:id` | Delete a product | Admin |
| `GET` | `/api/admin/orders` | List recent orders, optionally filtered by status | Admin |
| `PATCH` | `/api/admin/orders/:id/status` | Update order fulfillment status | Admin |
| `GET` | `/api/admin/users` | List accounts with order count and lifetime spend | Admin |
| `PATCH` | `/api/admin/users/:id` | Change account role or active status | Admin |
| `POST` | `/api/auth/me/avatar` | Upload the authenticated user’s profile image (`multipart/form-data`) | Authenticated |

The checkout endpoint accepts product IDs and quantities plus a shipping address. It derives current product prices and totals on the server, decrements inventory with stock guards, and marks the mock payment as complete. No card information is accepted or stored.

## 7. UI/UX Highlights

- Calm editorial art direction with warm paper tones, forest green, tactile product photography, and modern sans-serif typography.
- Responsive layouts for desktop, tablet, and mobile with accessible labels and reduced-motion support.
- Dedicated customer and admin portals keep public shop navigation out of account workflows.
- Login and registration include password reveal controls and a live password-strength checklist.
- Product image gallery, responsive product cards, category chips, search, price slider, and sort controls.
- Persistent cart drawer with quantity editing, removal, free-shipping progress, and live totals.
- Clear checkout progress, order summary, mock-payment disclosure, and confirmation receipt.
- Account and admin dashboards with status badges, inventory controls, and inline product management.
- Toast feedback, hover transitions, loading skeletons, and empty states.

## 8. Submission Details & CodeAlpha Metadata

- **Program:** CodeAlpha Full Stack Development Internship
- **Task:** Task 1 — Simple E-Commerce Store
- **Project:** `CodeAlpha_Simple_Ecommerce_Store`
- **Submission alignment:** Express and MongoDB backend, separated routes/controllers/models/middleware, authentication and role-based access, responsive frontend, product catalog, cart and checkout, admin management, `.env.example`, seed data, and setup/API documentation are included.
- **Before submission:** Add your full name and internship cohort to the author details below if required by your CodeAlpha mentor. Keep secrets in `.env` and follow the submission channel and deadline provided by CodeAlpha.

## 9. License & Author Info

This project is released under the MIT License. See [LICENSE](LICENSE) for the license text.

**Author:** CodeAlpha Intern (add your preferred public name before submission)  
**Project:** CodeAlpha Simple E-Commerce Store
