import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthProvider } from "./hooks/useAuth";

// Pages
import Dashboard from "./pages/Dashboard";
import Quotations from "./pages/Quotations";
import CreateQuotation from "./pages/CreateQuotation";
import EditQuotation from "./pages/EditQuotation";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import EditInvoice from "./pages/EditInvoice";
import Finance from "./pages/Finance";
import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import CustomerHistory from "./pages/CustomerHistory";
import Staff from "./pages/Staff";
import AddStaffMember from "./pages/AddStaffMember";
import EditStaffMember from "./pages/EditStaffMember";
import Schedule from "./pages/Schedule";
import AddAppointment from "./pages/AddAppointment";

import PublicAppointment from "./pages/PublicAppointment";
import Warranty from "./pages/Warranty";
import AddWarrantyItem from "./pages/AddWarrantyItem";
import Categories from "./pages/Categories";
import AddCategory from "./pages/AddCategory";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ViewQuotation from "./pages/ViewQuotation";
import ViewInvoice from "./pages/ViewInvoice";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route element={<MainLayout><Outlet /></MainLayout>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/add" element={<AddCustomer />} />
                <Route path="/customers/history/:id" element={<CustomerHistory />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/staff/add" element={<AddStaffMember />} />
                <Route path="/staff/edit/:id" element={<EditStaffMember />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/schedule/add" element={<AddAppointment />} />
                <Route path="/schedule/edit/:id" element={<AddAppointment />} />
                <Route path="/appointments/add" element={<AddAppointment />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/warranty" element={<Warranty />} />
                <Route path="/add-warranty-item" element={<AddWarrantyItem />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/add" element={<AddCategory />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/create" element={<CreateInvoice />} />
                <Route path="/invoices/edit/:id" element={<EditInvoice />} />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/quotations/create" element={<CreateQuotation />} />
                <Route path="/quotations/edit/:id" element={<EditQuotation />} />
              </Route>
              
              {/* Public quotation view route */}
              <Route path="/quotations/view/:id" element={<ViewQuotation />} />
              
              {/* Public invoice view route */}
              <Route path="/invoices/view/:id" element={<ViewInvoice />} />
              
              {/* Public appointment view route */}
              <Route path="/appointments/view/:id" element={<PublicAppointment />} />
              
              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
