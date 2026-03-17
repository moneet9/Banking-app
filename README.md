# Banking App (Frontend + Backend)

## Abstract

This project is a full-stack banking application designed to simulate core banking operations in a secure and role-driven environment.
It provides three distinct user roles — Customer, Staff, and Manager — each with tailored access and functionality.
Customers can manage their accounts, initiate fund transfers, apply for loans, and view detailed transaction histories.
Staff members handle cash request workflows, reviewing and approving or rejecting customer deposit and withdrawal requests.
Managers gain access to analytics dashboards and comprehensive reports generated from live backend data.
The backend is built with Node.js and Express, using MongoDB Atlas as the database and JWT for stateless authentication.
The frontend is developed with React and Vite, offering a responsive and intuitive interface for all user roles.
Role-based access control (RBAC) is enforced at both the API and UI levels to ensure data security and separation of concerns.
The application supports LAN-based access, making it suitable for local network demonstrations and development environments.
Overall, this project demonstrates a practical, production-oriented approach to building secure, scalable, and maintainable banking software.

Full-stack banking application with role-based access control (Customer, Staff, Manager), MongoDB backend, and React frontend.

## Project Structure

- `frontend/` — React + Vite UI
- `backend/` — Express + MongoDB API

## Features

- JWT authentication with RBAC (`customer`, `staff`, `manager`)
- Customer banking flows: dashboard, transfer, loans, profile, transactions
- Cash request workflow:
  - Customer creates `deposit/withdrawal` request
  - Staff reviews and `approve/reject`
- Manager analytics and reports from backend data

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas connection string

## Quick Start

### 1) Backend setup

```bash
cd backend
npm install
```

Create `.env` from `.env.example` and set values:

- `HOST=0.0.0.0`
- `PORT=5000`
- `MONGODB_URI=...`
- `JWT_SECRET=...`
- `CLIENT_ORIGIN=http://localhost:5173,http://<LAN_IP>:5173,http://<LAN_IP>:4173`

Seed sample data:

```bash
npm run seed
```

Start backend:

```bash
npm run dev
```

### 2) Frontend setup

```bash
cd frontend
npm install --legacy-peer-deps
```

Create `.env` from `.env.example`:

- Local: `VITE_API_BASE_URL=http://localhost:5000/api`
- LAN: `VITE_API_BASE_URL=http://<LAN_IP>:5000/api`

Start frontend:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

## Demo Users

- Customer: `rahul.kumar@email.com` / `Password@123`
- Staff: `staff@securebank.com` / `Password@123`
- Manager: `manager@securebank.com` / `Password@123`

## API Highlights

- Auth: `/api/auth/*`
- Customer banking: `/api/banking/*`
- Staff operations: `/api/staff/*`
- Manager analytics: `/api/manager/*`

## Network Access Notes

If frontend is opened from another device, do not use `localhost` in frontend API URL. Use your machine LAN IP.

## Security Note

Do not commit real secrets. Keep `.env` files local. This repository is configured to ignore env files via `.gitignore`.
