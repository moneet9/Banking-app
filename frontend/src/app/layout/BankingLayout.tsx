import { Outlet } from 'react-router';
import { BottomNav } from '../components/navigation/BottomNav';
import { CustomerChatbotModal } from '../components/modals/CustomerChatbotModal';

export default function BankingLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <CustomerChatbotModal />
      <BottomNav />
    </div>
  );
}
