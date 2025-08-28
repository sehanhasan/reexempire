import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: ({
    row
  }: {
    row: {
      original: T;
    };
  }) => React.ReactNode;
}
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
  renderCustomMobileCard?: (item: T) => React.ReactNode;
  externalSearchTerm?: string;
  onExternalSearchChange?: (value: string) => void;
  onRowClick?: (item: T) => void;
}
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  isLoading = false,
  emptyMessage = "No data available",
  renderCustomMobileCard,
  externalSearchTerm,
  onExternalSearchChange,
  onRowClick
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const activeSearchTerm = externalSearchTerm !== undefined ? externalSearchTerm : searchQuery;
  const filteredData = searchKey ? data.filter(item => {
    const value = item[searchKey];
    if (typeof value === 'string') {
      return value.toLowerCase().includes(activeSearchTerm.toLowerCase());
    }
    return false;
  }) : data;

  // Generate labels for mobile view
  const getMobileLabel = (column: Column<T>) => {
    return column.header;
  };

  // Skip certain columns on mobile view
  const shouldShowColumnOnMobile = (column: Column<T>) => {
    const skipHeaders = ["ID", "Email", "Service", "Projects", "Actions"];
    return !skipHeaders.includes(column.header);
  };

  // Generate unique stable keys for each row and cell
  const getRowKey = (row: T, rowIndex: number) => {
    return `row-${row.id || rowIndex}-${rowIndex}`;
  };
  const getCellKey = (column: Column<T>, colIndex: number, rowIndex: number) => {
    return `cell-${colIndex}-${rowIndex}-${column.header.replace(/\s+/g, '-')}`;
  };
  const getCardKey = (row: T, rowIndex: number) => {
    return `card-${row.id || rowIndex}-${rowIndex}`;
  };

  // Process columns for mobile view
  const mobileColumns = columns.filter(column => shouldShowColumnOnMobile(column));

  // Get the actions column for potential use in card footer
  const actionsColumn = columns.find(column => column.header === "Actions");

  // Get a suitable primary column (name, title, etc.)
  const getPrimaryColumn = () => {
    const nameColumn = columns.find(col => col.header.toLowerCase().includes('name') || col.header.toLowerCase().includes('title') || col.accessorKey.toString().toLowerCase().includes('name') || col.accessorKey.toString().toLowerCase().includes('title'));
    return nameColumn || mobileColumns[0];
  };
  const primaryColumn = getPrimaryColumn();
  return <div className="space-y-4">
      {searchKey && !isMobile && externalSearchTerm === undefined}
      {searchKey && !isMobile && externalSearchTerm !== undefined && onExternalSearchChange && <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={externalSearchTerm} onChange={e => onExternalSearchChange(e.target.value)} className="pl-10 max-w-sm h-10" />
        </div>}
      
      {/* Pagination setup */}
      {(() => {
      return null;
    })()}
      
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? <div className="py-6 text-center bg-slate-100">
              <p className="text-muted-foreground">Loading...</p>
            </div> : filteredData.length === 0 ? <div className="py-6 text-center">
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div> : (() => {
          // Client-side pagination when records exceed 50
          const pageSize = 50;
          const [currentPage, setCurrentPage] = [undefined as any, undefined as any];
          return null;
        })()}
        </CardContent>
      </Card>
    </div>;
}