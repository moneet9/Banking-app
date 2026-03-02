import { Outlet } from 'react-router';
import { BottomNav } from '../components/navigation/BottomNav';

export default function BankingLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <BottomNav />
    </div>
  );
}
