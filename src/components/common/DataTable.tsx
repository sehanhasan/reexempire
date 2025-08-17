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
}
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  isLoading = false,
  emptyMessage = "No data available",
  renderCustomMobileCard,
  externalSearchTerm,
  onExternalSearchChange
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
      {searchKey && !isMobile && externalSearchTerm === undefined && <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 max-w-sm h-10" />
        </div>}
      {searchKey && !isMobile && externalSearchTerm !== undefined && onExternalSearchChange && <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={externalSearchTerm} onChange={e => onExternalSearchChange(e.target.value)} className="pl-10 max-w-sm h-10" />
        </div>}
      
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? <div className="py-8 text-center bg-slate-100">
              <p className="text-muted-foreground">Loading...</p>
            </div> : filteredData.length === 0 ? <div className="py-8 text-center">
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div> : <>
              {isMobile ? <div className="space-y-3 mx-2">
                  {renderCustomMobileCard ?
            // Use custom mobile card renderer if provided
            filteredData.map(item => renderCustomMobileCard(item)) :
            // Default mobile card rendering
            filteredData.map((row, rowIndex) => <Card key={getCardKey(row, rowIndex)} className="overflow-hidden border-l-2 border-l-blue-500 shadow-sm">
                        <CardContent className="p-0">
                          {/* Card Header with primary information */}
                          <div className="p-3 border-b bg-blue-50/30">
                            <div className="flex justify-between items-center">
                              <div className="font-medium text-blue-700">
                                {primaryColumn.cell ? primaryColumn.cell({
                        row: {
                          original: row
                        }
                      }) : String(row[primaryColumn.accessorKey] || '')}
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                          
                          {/* Card Content */}
                          <div className="px-3 py-2 space-y-1.5">
                            {mobileColumns.filter(col => col !== primaryColumn) // Skip the primary column as it's already in the header
                  .map((column, colIndex) => {
                    // Skip empty values
                    const cellValue = column.cell ? column.cell({
                      row: {
                        original: row
                      }
                    }) : row[column.accessorKey];
                    if (cellValue === null || cellValue === undefined || cellValue === '') {
                      return null;
                    }
                    return <div key={getCellKey(column, colIndex, rowIndex)} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">{getMobileLabel(column)}</span>
                                    <span className="font-normal">{cellValue}</span>
                                  </div>;
                  })}
                          </div>
                          
                          {/* Card Footer with Actions */}
                          {actionsColumn && actionsColumn.cell}
                        </CardContent>
                      </Card>)}
                </div> : <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column, idx) => <TableHead key={`header-${idx}-${column.header.replace(/\s+/g, '-')}`}>
                          {column.header}
                        </TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row, rowIndex) => <TableRow key={getRowKey(row, rowIndex)}>
                        {columns.map((column, colIndex) => <TableCell key={getCellKey(column, colIndex, rowIndex)}>
                            {column.cell ? column.cell({
                    row: {
                      original: row
                    }
                  }) : row[column.accessorKey]}
                          </TableCell>)}
                      </TableRow>)}
                  </TableBody>
                </Table>}
            </>}
        </CardContent>
      </Card>
    </div>;
}