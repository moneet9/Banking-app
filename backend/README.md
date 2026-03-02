# Banking App Backend

Express + MongoDB backend for the customer banking frontend.

## Setup

1. Install packages:

```bash
npm install
```

2. Create `.env` from `.env.example` and set:

- `MONGODB_URI`
- `JWT_SECRET`
- `PORT` (optional)
- `CLIENT_ORIGIN` (frontend URL)

3. Seed sample user data:

```bash
npm run seed
```

4. Start backend:

```bash
npm run dev
```

Server runs at `http://localhost:5000` by default.

## Demo credentials

- Email: `rahul.kumar@email.com`
- Password: `Password@123`
- Staff: `staff@securebank.com` / `Password@123`
- Manager: `manager@securebank.com` / `Password@123`

## API routes

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/banking/me`
- `GET /api/banking/dashboard`
- `GET /api/banking/transactions?q=...`
- `POST /api/banking/transfers`
- `GET /api/banking/loans`
- `POST /api/banking/loans`
- `GET /api/staff/dashboard` (staff, manager)
- `GET /api/manager/dashboard` (manager)

## RBAC

- User roles: `customer`, `staff`, `manager`
- Role is persisted in MongoDB and embedded in JWT during login
- Backend enforces role access with `requireRole(...)` middleware
