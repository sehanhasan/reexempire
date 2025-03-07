
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import AddCustomer from "@/pages/AddCustomer";
import Staff from "@/pages/Staff";
import AddStaffMember from "@/pages/AddStaffMember";
import EditStaffMember from "@/pages/EditStaffMember";
import Schedule from "@/pages/Schedule";
import AddAppointment from "@/pages/AddAppointment";
import Categories from "@/pages/Categories";
import AddCategory from "@/pages/AddCategory";
import Quotations from "@/pages/Quotations";
import CreateQuotation from "@/pages/CreateQuotation";
import EditQuotation from "@/pages/EditQuotation";
import Invoices from "@/pages/Invoices";
import CreateInvoice from "@/pages/CreateInvoice";
import EditInvoice from "@/pages/EditInvoice";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import StaffSchedule from "@/pages/StaffSchedule";

// Create the router
const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout><Index /></MainLayout>
      },
      {
        path: "/dashboard",
        element: <MainLayout><Dashboard /></MainLayout>
      },
      {
        path: "/profile",
        element: <MainLayout><Profile /></MainLayout>
      },
      // Staff-only routes
      {
        path: "/staff-schedule",
        element: <MainLayout><StaffSchedule /></MainLayout>
      },
      // Admin-only routes
      {
        element: <ProtectedRoute requiredRole="admin" />,
        children: [
          {
            path: "/customers",
            element: <MainLayout><Customers /></MainLayout>
          },
          {
            path: "/customers/add",
            element: <MainLayout><AddCustomer /></MainLayout>
          },
          {
            path: "/staff",
            element: <MainLayout><Staff /></MainLayout>
          },
          {
            path: "/staff/add",
            element: <MainLayout><AddStaffMember /></MainLayout>
          },
          {
            path: "/staff/:id/edit",
            element: <MainLayout><EditStaffMember /></MainLayout>
          },
          {
            path: "/schedule",
            element: <MainLayout><Schedule /></MainLayout>
          },
          {
            path: "/appointments/add",
            element: <MainLayout><AddAppointment /></MainLayout>
          },
          {
            path: "/categories",
            element: <MainLayout><Categories /></MainLayout>
          },
          {
            path: "/categories/add",
            element: <MainLayout><AddCategory /></MainLayout>
          },
          {
            path: "/quotations",
            element: <MainLayout><Quotations /></MainLayout>
          },
          {
            path: "/quotations/create",
            element: <MainLayout><CreateQuotation /></MainLayout>
          },
          {
            path: "/quotations/:id/edit",
            element: <MainLayout><EditQuotation /></MainLayout>
          },
          {
            path: "/invoices",
            element: <MainLayout><Invoices /></MainLayout>
          },
          {
            path: "/invoices/create",
            element: <MainLayout><CreateInvoice /></MainLayout>
          },
          {
            path: "/invoices/:id/edit",
            element: <MainLayout><EditInvoice /></MainLayout>
          }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
