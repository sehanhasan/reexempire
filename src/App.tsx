
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
        element: <MainLayout />,
        children: [
          {
            path: "/",
            element: <Index />
          },
          {
            path: "/dashboard",
            element: <Dashboard />
          },
          {
            path: "/profile",
            element: <Profile />
          },
          // Staff-only routes
          {
            path: "/staff-schedule",
            element: <StaffSchedule />
          },
          // Admin-only routes
          {
            element: <ProtectedRoute requiredRole="admin" />,
            children: [
              {
                path: "/customers",
                element: <Customers />
              },
              {
                path: "/customers/add",
                element: <AddCustomer />
              },
              {
                path: "/staff",
                element: <Staff />
              },
              {
                path: "/staff/add",
                element: <AddStaffMember />
              },
              {
                path: "/staff/:id/edit",
                element: <EditStaffMember />
              },
              {
                path: "/schedule",
                element: <Schedule />
              },
              {
                path: "/appointments/add",
                element: <AddAppointment />
              },
              {
                path: "/categories",
                element: <Categories />
              },
              {
                path: "/categories/add",
                element: <AddCategory />
              },
              {
                path: "/quotations",
                element: <Quotations />
              },
              {
                path: "/quotations/create",
                element: <CreateQuotation />
              },
              {
                path: "/quotations/:id/edit",
                element: <EditQuotation />
              },
              {
                path: "/invoices",
                element: <Invoices />
              },
              {
                path: "/invoices/create",
                element: <CreateInvoice />
              },
              {
                path: "/invoices/:id/edit",
                element: <EditInvoice />
              }
            ]
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
