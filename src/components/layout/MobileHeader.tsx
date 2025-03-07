
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, isAdmin, isAuthenticated, profile } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b md:hidden">
      <Link to="/" className="text-xl font-bold">CRM</Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-6 border-b">
            {isAuthenticated && profile ? (
              <div>
                <div className="font-medium">{profile.full_name}</div>
                <div className="text-sm text-muted-foreground">{profile.email}</div>
                <div className="mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block">
                  {profile.role === 'admin' ? 'Administrator' : 'Staff Member'}
                </div>
              </div>
            ) : (
              <div className="font-medium">Menu</div>
            )}
          </div>
          <nav className="flex flex-col space-y-1 p-2">
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm rounded-md hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            
            {isAdmin ? (
              // Admin navigation
              <>
                <Link
                  to="/customers"
                  className="px-4 py-2 text-sm rounded-md hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Customers
                </Link>
                <Link
                  to="/staff"
                  className="px-4 py-2 text-sm rounded-md hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Staff
                </Link>
                <Link
                  to="/schedule"
                  className="px-4 py-2 text-sm rounded-md hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Schedule
                </Link>
                <Link
                  to="/categories"
                  className="px-4 py-2 text-sm rounded-md hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Categories
                </Link>
                <Link
                  to="/quotations"
                  className="px-4 py-2 text-sm rounded-md hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Quotations
                </Link>
                <Link
                  to="/invoices"
                  className="px-4 py-2 text-sm rounded-md hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Invoices
                </Link>
              </>
            ) : (
              // Staff navigation
              <Link
                to="/staff-schedule"
                className="px-4 py-2 text-sm rounded-md hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                My Schedule
              </Link>
            )}
            
            <Link
              to="/profile"
              className="px-4 py-2 text-sm rounded-md hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            
            <Button 
              variant="ghost" 
              className="justify-start px-4 py-2 text-sm rounded-md hover:bg-gray-100"
              onClick={() => {
                handleLogout();
                setOpen(false);
              }}
            >
              Logout
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
