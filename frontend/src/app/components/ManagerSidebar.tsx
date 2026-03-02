import { useNavigate, useLocation } from 'react-router';
import { LayoutDashboard, FileCheck, TrendingUp, BarChart3, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/manager/dashboard' },
  { icon: FileCheck, label: 'Loan Approvals', path: '/manager/loans' },
  { icon: TrendingUp, label: 'Financial Overview', path: '/manager/overview' },
  { icon: BarChart3, label: 'Reports & Analytics', path: '/manager/reports' },
];

export function ManagerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <span className="text-xl text-white font-bold">₹</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SecureBank</h1>
            <p className="text-xs text-gray-500">Manager Portal</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
