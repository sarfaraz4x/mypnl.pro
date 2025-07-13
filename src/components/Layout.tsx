
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Upload, 
  BookOpen, 
  Settings, 
  LogOut,
  Crown,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout = ({ children, activeTab, onTabChange }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === 'sarfarazalam.sa460@gmail.com') {
        setIsAdmin(true);
      }
    };
    checkAdminStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account."
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Trade', icon: Upload },
    { id: 'journal', label: 'Trade Journal', icon: BookOpen },
    { id: 'pricing', label: 'Pricing', icon: Crown },
    { id: 'settings', label: 'Settings', icon: Settings },
    // Admin panel link - only show for admin user
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: Shield }] : []),
  ];

  const NavigationContent = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <>
      <div className="p-6">
        <div className={`flex items-center justify-between mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center">
            <img src="/logo.png" alt="MyPnL Logo" className="h-10 w-auto" />
            <span className={`ml-3 text-2xl font-bold text-white ${isCollapsed ? 'hidden' : 'lg:block'}`}>My <span className="text-[#0181FE]">PnL</span></span>
          </div>
          <Button 
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:bg-primary/10 hover:text-primary p-2 h-auto hidden lg:flex"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full text-left p-3 h-auto ${isCollapsed ? 'justify-center' : 'justify-start'} ${
                  activeTab === item.id 
                    ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" 
                    : "text-slate-300 hover:bg-primary/10 hover:text-primary"
                }`}
                onClick={() => {
                  onTabChange(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </div>
      
      <div className="p-6 mt-auto">
        <Button
          variant="ghost"
          className={`w-full text-slate-300 hover:bg-primary/10 hover:text-primary p-3 h-auto ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          onClick={handleLogout}
        >
          <LogOut className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
          {!isCollapsed && <span className="text-sm">Sign Out</span>}
        </Button>

      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-slate-800 transform transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="lg:hidden flex justify-end p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <NavigationContent isCollapsed={isCollapsed} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-white">My<span className="text-[#0181FE]">PnL</span></h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        <main className="min-h-screen bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
