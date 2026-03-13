import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, UserCog, Shield } from 'lucide-react';

const roles = [
  {
    id: 'customer',
    title: 'Customer',
    description: 'Access your account, transfer money, and apply for loans',
    icon: Users,
    color: 'bg-blue-500',
    route: '/login',
  },
  {
    id: 'staff',
    title: 'Staff',
    description: 'Manage customer accounts and review loan applications',
    icon: UserCog,
    color: 'bg-purple-500',
    route: '/staff/login',
  },
  {
    id: 'manager',
    title: 'Manager',
    description: 'Final approvals and unified reports analytics',
    icon: Shield,
    color: 'bg-green-500',
    route: '/manager/login',
  },
];

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#0066FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white font-bold">₹</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SecureBank</h1>
          <p className="text-gray-600">Select your role to continue</p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="p-6 rounded-2xl bg-white hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
              onClick={() => navigate(role.route)}
            >
              <div className={`w-16 h-16 ${role.color} rounded-2xl flex items-center justify-center mb-4`}>
                <role.icon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{role.title}</h2>
              <p className="text-gray-600 mb-6">{role.description}</p>
              <Button className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl">
                Continue as {role.title}
              </Button>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2026 SecureBank. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
