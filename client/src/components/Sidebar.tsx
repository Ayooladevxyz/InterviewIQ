import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  ChartPie, 
  FileText, 
  Mic, 
  Lightbulb, 
  MessageSquare,
  Crown,
  LogOut
} from "lucide-react";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { path: "/", icon: ChartPie, label: "Dashboard" },
    { path: "/cv-analysis", icon: FileText, label: "CV Analysis" },
    { path: "/mock-interview", icon: Mic, label: "Mock Interview" },
    { path: "/career-hub", icon: Lightbulb, label: "Career Hub" },
    { path: "/feedback", icon: MessageSquare, label: "Feedback" },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-slate-200 flex-shrink-0 h-screen">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Brain className="text-white h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-800">InterviewIQ</h1>
            <p className="text-xs text-slate-500">AI Career Prep</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Upgrade Card */}
        <div className="mt-8 p-4 bg-violet-50 rounded-xl border border-violet-200">
          <div className="flex items-center space-x-2 mb-2">
            <Crown className="h-4 w-4 text-violet-600" />
            <span className="font-semibold text-violet-800">Upgrade to Pro</span>
          </div>
          <p className="text-sm text-violet-700 mb-3">
            Unlimited interviews, advanced analytics, and priority support.
          </p>
          <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700">
            Upgrade Now
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.fullName?.[0] || user?.username?.[0] || "U"}
              </span>
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {user?.fullName || user?.username || "User"}
              </p>
              <p className="text-sm text-slate-500">Free Plan</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
