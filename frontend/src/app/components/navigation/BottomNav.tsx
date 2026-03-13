import { Home, IndianRupee, FileText, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

const navItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: IndianRupee, label: 'Passbook', path: '/passbook' },
  { icon: FileText, label: 'Loans', path: '/loans' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-pb z-50">
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-4 gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${
                  isActive ? 'bg-[#DBEAFE]' : 'hover:bg-[#EFF6FF]'
                }`}
              >
                <item.icon 
                  className={`w-6 h-6 ${isActive ? 'text-[#2563EB]' : 'text-gray-500'}`}
                />
                <span className={`text-xs font-medium ${isActive ? 'text-[#2563EB]' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
