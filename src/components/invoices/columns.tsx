
import { ColumnDef } from "@tanstack/react-table";
import { Invoice } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/utils/formatters";

export const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "reference_number",
    header: "Reference",
  },
  {
    accessorKey: "customers.name",
    header: "Customer",
    cell: ({ row }) => {
      return row.original.customers?.name || "N/A";
    },
  },
  {
    accessorKey: "issue_date",
    header: "Issue Date",
    cell: ({ row }) => formatDate(row.getValue("issue_date")),
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ row }) => formatDate(row.getValue("due_date")),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => formatCurrency(row.getValue("total")),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "Paid" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
];
