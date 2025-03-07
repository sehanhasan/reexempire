
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Pages
import Dashboard from "./pages/Dashboard";
import Quotations from "./pages/Quotations";
import CreateQuotation from "./pages/CreateQuotation";
import EditQuotation from "./pages/EditQuotation";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import EditInvoice from "./pages/EditInvoice";
import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import Staff from "./pages/Staff";
import AddStaffMember from "./pages/AddStaffMember";
import EditStaffMember from "./pages/EditStaffMember";
import Schedule from "./pages/Schedule";
import StaffSchedule from "./pages/StaffSchedule";
import AddAppointment from "./pages/AddAppointment";
import Categories from "./pages/Categories";
import AddCategory from "./pages/AddCategory";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute />}>
              {/* Admin-only routes */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/quotations" element={<MainLayout><Quotations /></MainLayout>} />
                <Route path="/quotations/create" element={<MainLayout><CreateQuotation /></MainLayout>} />
                <Route path="/quotations/edit/:id" element={<MainLayout><EditQuotation /></MainLayout>} />
                
                <Route path="/invoices" element={<MainLayout><Invoices /></MainLayout>} />
                <Route path="/invoices/create" element={<MainLayout><CreateInvoice /></MainLayout>} />
                <Route path="/invoices/edit/:id" element={<MainLayout><EditInvoice /></MainLayout>} />
                
                <Route path="/customers" element={<MainLayout><Customers /></MainLayout>} />
                <Route path="/customers/add" element={<MainLayout><AddCustomer /></MainLayout>} />
                
                <Route path="/staff" element={<MainLayout><Staff /></MainLayout>} />
                <Route path="/staff/add" element={<MainLayout><AddStaffMember /></MainLayout>} />
                <Route path="/staff/edit/:id" element={<MainLayout><EditStaffMember /></MainLayout>} />
                
                <Route path="/schedule" element={<MainLayout><Schedule /></MainLayout>} />
                <Route path="/schedule/add" element={<MainLayout><AddAppointment /></MainLayout>} />
                <Route path="/schedule/edit/:id" element={<MainLayout><AddAppointment /></MainLayout>} />
                
                <Route path="/categories" element={<MainLayout><Categories /></MainLayout>} />
                <Route path="/categories/add" element={<MainLayout><AddCategory /></MainLayout>} />
              </Route>
              
              {/* Routes accessible by both admin and staff */}
              <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
              <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
              
              {/* Staff-only routes */}
              <Route element={<ProtectedRoute requiredRole="staff" />}>
                <Route path="/staff-schedule" element={<MainLayout><StaffSchedule /></MainLayout>} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
