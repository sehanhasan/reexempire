
import { ColumnDef } from "@tanstack/react-table";
import { Invoice } from "@/types/database";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "reference_number",
    header: "Reference #",
    cell: ({ row }) => <div>{row.getValue("reference_number")}</div>,
  },
  {
    accessorKey: "issue_date",
    header: "Issue Date",
    cell: ({ row }) => {
      const date = row.getValue("issue_date") as string;
      return <div>{format(new Date(date), "PPP")}</div>;
    },
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ row }) => {
      const date = row.getValue("due_date") as string;
      return <div>{format(new Date(date), "PPP")}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "draft" ? "outline" : "default"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "subtotal",
    header: "Subtotal",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("subtotal"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "payment_status",
    header: "Payment Status",
    cell: ({ row }) => {
      const status = row.getValue("payment_status") as string;
      return (
        <Badge variant={status === "paid" ? "success" : "destructive"}>
          {status}
        </Badge>
      );
    },
  },
];
