import { Outlet } from 'react-router';
import { BottomNav } from '../components/navigation/BottomNav';
import { AgentChat } from '../components/agent/AgentChat';

export default function BankingLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <BottomNav />
      <AgentChat />
    </div>
  );
}
