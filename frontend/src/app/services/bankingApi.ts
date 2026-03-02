const API_BASE_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

export type UserRole = 'customer' | 'staff' | 'manager';

export interface BankingUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone: string;
  accountNumber: string;
  balance: number;
  memberSince: string;
}

export interface BankingTransaction {
  _id: string;
  name: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  note?: string;
  recipient?: string;
  timestamp: string;
}

export interface LoanApplication {
  loanType: 'personal' | 'home' | 'auto' | 'business';
  amount: number;
  tenureMonths: number;
}

export interface MonthlyFinancialPoint {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface MonthlyLoanPoint {
  month: string;
  disbursed: number;
  repaid: number;
  defaulted: number;
}

export interface MonthlyCustomerPoint {
  month: string;
  customers: number;
}

export interface ManagerReportsData {
  role: UserRole;
  customerCount: number;
  totalLoans: number;
  approvedLoans: number;
  rejectedLoans: number;
  kpis: {
    totalRevenue: number;
    totalRevenueChange: number;
    netProfit: number;
    netProfitChange: number;
    totalCustomers: number;
    totalCustomersChange: number;
    defaultRate: number;
    defaultRateChange: number;
  };
  financialData: MonthlyFinancialPoint[];
  loanPerformance: MonthlyLoanPoint[];
  customerGrowth: MonthlyCustomerPoint[];
}

export interface StaffCustomerAccount {
  id: string;
  accountNumber: string;
  fullName: string;
  email: string;
  phone: string;
  balance: number;
  memberSince: string;
}

export interface CashRequestItem {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        fullName: string;
        email: string;
        accountNumber: string;
      };
  type: 'deposit' | 'withdrawal';
  amount: number;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

interface ApiResult<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

function getToken() {
  return localStorage.getItem('banking_token');
}

export function saveToken(token: string) {
  localStorage.setItem('banking_token', token);
}

function saveUserRole(role: UserRole) {
  localStorage.setItem('banking_user_role', role);
}

function saveUserName(name: string) {
  localStorage.setItem('banking_user_name', name);
}

export function getUserRole(): UserRole | null {
  const value = localStorage.getItem('banking_user_role');
  if (value === 'customer' || value === 'staff' || value === 'manager') {
    return value;
  }
  return null;
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function saveSession(token: string, user: BankingUser) {
  saveToken(token);
  saveUserRole(user.role);
  saveUserName(user.fullName);
}

export function clearToken() {
  localStorage.removeItem('banking_token');
}

export function clearSession() {
  clearToken();
  localStorage.removeItem('banking_user_role');
  localStorage.removeItem('banking_user_name');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = (await response.json()) as ApiResult<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload.data;
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: BankingUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getDashboard() {
  return request<{
    user: BankingUser;
    balance: number;
    thisMonthNet: number;
    recentTransactions: BankingTransaction[];
  }>('/banking/dashboard');
}

export async function getTransactions(search = '') {
  const q = search ? `?q=${encodeURIComponent(search)}` : '';
  return request<BankingTransaction[]>(`/banking/transactions${q}`);
}

export async function createTransfer(recipient: string, amount: number, note?: string) {
  return request<{ transaction: BankingTransaction; balance: number }>('/banking/transfers', {
    method: 'POST',
    body: JSON.stringify({ recipient, amount, note }),
  });
}

export async function applyLoan(payload: LoanApplication) {
  return request('/banking/loans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getProfile() {
  return request<BankingUser>('/banking/me');
}

export async function getManagerReports() {
  return request<ManagerReportsData>('/manager/dashboard');
}

export async function getStaffAccounts(search = '') {
  const q = search ? `?q=${encodeURIComponent(search)}` : '';
  return request<StaffCustomerAccount[]>(`/staff/accounts${q}`);
}

export async function createCashRequest(type: 'deposit' | 'withdrawal', amount: number, note?: string) {
  return request<CashRequestItem>('/banking/cash-requests', {
    method: 'POST',
    body: JSON.stringify({ type, amount, note }),
  });
}

export async function getMyCashRequests() {
  return request<CashRequestItem[]>('/banking/cash-requests');
}

export async function getStaffCashRequests(status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending') {
  const q = status === 'all' ? '' : `?status=${status}`;
  return request<CashRequestItem[]>(`/staff/requests${q}`);
}

export async function approveStaffCashRequest(requestId: string, note?: string) {
  return request<{ requestId: string; status: string; balance: number }>(`/staff/requests/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export async function rejectStaffCashRequest(requestId: string, note?: string) {
  return request<{ requestId: string; status: string }>(`/staff/requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export async function staffDeposit(userId: string, amount: number, note?: string) {
  return request<{ balance: number; customerId: string }>(`/staff/accounts/${userId}/deposit`, {
    method: 'POST',
    body: JSON.stringify({ amount, note }),
  });
}

export async function staffWithdraw(userId: string, amount: number, note?: string) {
  return request<{ balance: number; customerId: string }>(`/staff/accounts/${userId}/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ amount, note }),
  });
}
