
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  FileText,
  Home,
  Layers,
  LogOut,
  Receipt,
  User,
  Users,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const navigate = useNavigate();
  const { logout, isAdmin, profile } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="hidden md:flex flex-col h-screen w-64 bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold">CRM</h1>
      </div>

      {profile && (
        <div className="p-4 border-b border-slate-800">
          <div className="font-medium">{profile.full_name}</div>
          <div className="text-sm text-slate-400">{profile.email}</div>
          <div className="mt-2 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full inline-block">
            {profile.role === 'admin' ? 'Administrator' : 'Staff Member'}
          </div>
        </div>
      )}

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-slate-800"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>

          {isAdmin ? (
            // Admin navigation
            <>
              <Link
                to="/customers"
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-slate-800"
              >
                <User className="h-4 w-4" />
                <span>Customers</span>
              </Link>

              <Link
                to="/staff"
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-slate-800"
              >
                <Users className="h-4 w-4" />
                <span>Staff</span>
              </Link>

              <Link
                to="/schedule"
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-slate-800"
              >
                <Calendar className="h-4 w-4" />
                <span>Schedule</span>
              </Link>

              <Link
                to="/categories"
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-slate-800"
              >
                <Layers className="h-4 w-4" />
                <span>Categories</span>
              </Link>

              <Link
                to="/quotations"
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-slate-800"
              >
                <FileText className="h-4 w-4" />
                <span>Quotations</span>
              </Link>

              <Link
                to="/invoices"
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-slate-800"
              >
                <Receipt className="h-4 w-4" />
                <span>Invoices</span>
              </Link>
            </>
          ) : (
            // Staff navigation
            <Link
              to="/staff-schedule"
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-slate-800"
            >
              <Calendar className="h-4 w-4" />
              <span>My Schedule</span>
            </Link>
          )}

          <Link
            to="/profile"
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md hover:bg-slate-800"
          >
            <Settings className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:bg-slate-800 px-4"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
