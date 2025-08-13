
import { ColumnDef } from "@tanstack/react-table";
import { Quotation } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/utils/formatters";

export const columns: ColumnDef<Quotation>[] = [
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
    accessorKey: "expiry_date",
    header: "Expiry Date",
    cell: ({ row }) => formatDate(row.getValue("expiry_date")),
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
        <Badge variant={status === "Accepted" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
];
