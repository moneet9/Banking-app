// ============================================================================
// Application Routes
// ============================================================================

import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import RoleSelection from './pages/RoleSelection';
import BankLogin from './pages/BankLogin';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import Loans from './pages/Loans';
import Profile from './pages/Profile';
import Transactions from './pages/Transactions';
import CashRequests from './pages/CashRequests';
import BankingLayout from './layout/BankingLayout';

// Staff imports
import StaffLogin from './pages/staff/StaffLogin';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffLoans from './pages/staff/StaffLoans';
import StaffAccounts from './pages/staff/StaffAccounts';
import StaffReports from './pages/staff/StaffReports';
import StaffPassbook from './pages/staff/StaffPassbook';

// Manager imports
import ManagerLogin from './pages/manager/ManagerLogin';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerLoans from './pages/manager/ManagerLoans';
import ManagerReports from './pages/manager/ManagerReports';
import ManagerPassbookLogs from './pages/manager/ManagerPassbookLogs';
import ManagerStaffLogs from './pages/manager/ManagerStaffLogs';
import { getUserRole, isAuthenticated } from './services/bankingApi';

function RequireAuth() {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function RequireRole({ allowedRoles, redirectTo }: { allowedRoles: Array<'customer' | 'staff' | 'manager'>; redirectTo: string }) {
  const role = getUserRole();

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RoleSelection />,
  },
  // Customer Routes
  {
    path: '/login',
    element: <BankLogin />,
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole allowedRoles={['customer']} redirectTo="/" />,
        children: [
          {
            path: '/',
            element: <BankingLayout />,
            children: [
              {
                path: 'dashboard',
                element: <Dashboard />,
              },
              {
                path: 'transfer',
                element: <Transfer />,
              },
              {
                path: 'loans',
                element: <Loans />,
              },
              {
                path: 'profile',
                element: <Profile />,
              },
              {
                path: 'passbook',
                element: <Transactions />,
              },
              {
                path: 'transactions',
                element: <Transactions />,
              },
              {
                path: 'cash-requests',
                element: <CashRequests />,
              },
            ],
          },
        ],
      },
    ],
  },
  // Staff Routes
  {
    path: '/staff/login',
    element: <StaffLogin />,
  },
  {
    path: '/staff',
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole allowedRoles={['staff', 'manager']} redirectTo="/staff/login" />,
        children: [
          {
            path: 'dashboard',
            element: <StaffDashboard />,
          },
          {
            path: 'loans',
            element: <StaffLoans />,
          },
          {
            path: 'accounts',
            element: <StaffAccounts />,
          },
          {
            path: 'reports',
            element: <StaffReports />,
          },
          {
            path: 'passbook',
            element: <StaffPassbook />,
          },
        ],
      },
    ],
  },
  // Manager Routes
  {
    path: '/manager/login',
    element: <ManagerLogin />,
  },
  {
    path: '/manager',
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole allowedRoles={['manager']} redirectTo="/manager/login" />,
        children: [
          {
            path: 'dashboard',
            element: <ManagerDashboard />,
          },
          {
            path: 'loans',
            element: <ManagerLoans />,
          },
          {
            path: 'overview',
            element: <ManagerDashboard />,
          },
          {
            path: 'reports',
            element: <ManagerReports />,
          },
          {
            path: 'passbook-logs',
            element: <ManagerPassbookLogs />,
          },
          {
            path: 'staff-logs',
            element: <ManagerStaffLogs />,
          },
          {
            path: 'logs',
            element: <Navigate to="/manager/passbook-logs" replace />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);