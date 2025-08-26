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
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();
  const activeSearchTerm = externalSearchTerm !== undefined ? externalSearchTerm : searchQuery;
  const filteredData = searchKey ? data.filter(item => {
    const value = item[searchKey];
    if (typeof value === 'string') {
      return value.toLowerCase().includes(activeSearchTerm.toLowerCase());
    }
    return false;
  }) : data;

  // Pagination
  const pageSize = 50;
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showPagination = filteredData.length > pageSize;

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
          <Input placeholder="Search..." value={searchQuery} onChange={e => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }} className="pl-10 max-w-sm h-9" />
        </div>}
      {searchKey && !isMobile && externalSearchTerm !== undefined && onExternalSearchChange && <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={externalSearchTerm} onChange={e => {
            onExternalSearchChange(e.target.value);
            setCurrentPage(1);
          }} className="pl-10 max-w-sm h-9" />
        </div>}
      
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-6 text-center bg-slate-100">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : isMobile ? (
            renderCustomMobileCard ? (
              <div className="divide-y">
                {paginatedData.map((item, index) => (
                  <div key={getCardKey(item, index)} className="p-4">
                    {renderCustomMobileCard(item)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {paginatedData.map((item, index) => (
                  <div 
                    key={getCardKey(item, index)} 
                    className={`p-3 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    <div className="space-y-1">
                      {primaryColumn && (
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">
                            {primaryColumn.cell ? 
                              primaryColumn.cell({ row: { original: item } }) :
                              String(item[primaryColumn.accessorKey as keyof T] || '-')
                            }
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {mobileColumns.slice(1, 5).map((column, colIndex) => (
                          <div key={getCellKey(column, colIndex, index)} className="flex flex-col">
                            <span className="text-gray-500 text-xs font-medium">
                              {getMobileLabel(column)}
                            </span>
                            <span className="text-gray-900">
                              {column.cell ? 
                                column.cell({ row: { original: item } }) :
                                String(item[column.accessorKey as keyof T] || '-')
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                      {actionsColumn && (
                        <div className="mt-2 pt-2 border-t flex justify-end">
                          {actionsColumn.cell && actionsColumn.cell({ row: { original: item } })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="h-8">
                    {columns.map((column, index) => (
                      <TableHead key={`header-${index}`} className="py-2">
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row, rowIndex) => (
                    <TableRow 
                      key={getRowKey(row, rowIndex)} 
                      className={`h-8 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => onRowClick && onRowClick(row)}
                    >
                      {columns.map((column, colIndex) => (
                        <TableCell key={getCellKey(column, colIndex, rowIndex)} className="py-1">
                          {column.cell ? 
                            column.cell({ row: { original: row } }) :
                            String(row[column.accessorKey as keyof T] || '-')
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showPagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNumber > totalPages) return null;
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>;
}
