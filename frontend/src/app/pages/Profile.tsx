import { ArrowLeft, User, Mail, Phone, Bell, Shield, CreditCard, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { clearSession, getProfile } from '../services/bankingApi';

const settingsSections = [
  {
    title: 'Account Settings',
    items: [
      { icon: User, label: 'Edit Profile', route: '/edit-profile' },
      { icon: Shield, label: 'Security & Privacy', route: '/security' },
      { icon: Bell, label: 'Notifications', route: '/notifications' },
      { icon: CreditCard, label: 'Payment Methods', route: '/payment-methods' },
    ],
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: 'Customer',
    email: '',
    phone: '',
    accountNumber: '****',
    memberSince: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const user = await getProfile();
        const last4 = user.accountNumber.slice(-4);
        setProfileData({
          name: user.fullName,
          email: user.email,
          phone: user.phone,
          accountNumber: `****${last4}`,
          memberSince: new Date(user.memberSince).toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
          }),
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load profile');
        navigate('/login');
      }
    };

    load();
  }, [navigate]);

  const handleLogout = () => {
    clearSession();
    toast.success('Logged out successfully');
    setTimeout(() => navigate('/'), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] pt-6 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
          </div>

          {/* Profile Card */}
          <Card className="bg-white border-white/60 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                👤
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{profileData.name}</h2>
                <p className="text-[#2563EB] text-sm">Member since {profileData.memberSince}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{profileData.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{profileData.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">Account {profileData.accountNumber}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">{section.title}</h3>
            <Card className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {section.items.map((item, index) => (
                <button
                  key={item.label}
                  onClick={() => toast.info('Feature coming soon!')}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                    index !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#2563EB]" />
                    </div>
                    <span className="font-medium text-gray-900">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </Card>
          </div>
        ))}

        {/* App Info */}
        <Card className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-sm text-gray-700">About PayFlow</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-sm text-gray-700">Terms & Conditions</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-sm text-gray-700">Privacy Policy</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">Version 2.4.1</p>
            </div>
          </div>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-14 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl font-semibold"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
