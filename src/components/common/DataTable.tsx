
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, Info, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: ({ row }: { row: { original: T } }) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  isLoading = false,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  const filteredData = searchKey
    ? data.filter((item) => {
        const value = item[searchKey];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return false;
      })
    : data;

  // Generate labels for mobile view
  const getMobileLabel = (column: Column<T>) => {
    return column.header;
  };

  // Skip certain columns on mobile view
  const shouldShowColumnOnMobile = (column: Column<T>) => {
    // Add "Actions" to the list of columns to skip on mobile
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

  // Get a suitable primary key column (name, title, etc.)
  const getPrimaryColumn = () => {
    const nameColumn = columns.find(col => 
      col.header.toLowerCase().includes('name') || 
      col.header.toLowerCase().includes('title') ||
      col.accessorKey.toString().toLowerCase().includes('name') ||
      col.accessorKey.toString().toLowerCase().includes('title')
    );
    return nameColumn || mobileColumns[0];
  };

  const primaryColumn = getPrimaryColumn();

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
      )}
      <div className="table-container">
        {isLoading ? (
          <div className="h-24 flex items-center justify-center">
            <p className="text-center text-muted-foreground">Loading...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="h-24 flex items-center justify-center">
            <p className="text-center text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <>
            {isMobile ? (
              <div className="space-y-3">
                {filteredData.map((row, rowIndex) => (
                  <Card key={getCardKey(row, rowIndex)} className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="p-0">
                      {/* Card Header with primary information */}
                      <div className="p-3 border-b bg-blue-50/30">
                        <div className="flex justify-between items-center">
                          <div className="font-medium text-blue-700">
                            {primaryColumn.cell 
                              ? primaryColumn.cell({ row: { original: row } }) 
                              : String(row[primaryColumn.accessorKey] || '')}
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Card Content */}
                      <div className="px-3 py-2 space-y-1.5">
                        {mobileColumns
                          .filter(col => col !== primaryColumn) // Skip the primary column as it's already in the header
                          .map((column, colIndex) => {
                            // Skip empty values
                            const cellValue = column.cell 
                              ? column.cell({ row: { original: row } }) 
                              : row[column.accessorKey];
                            
                            if (cellValue === null || cellValue === undefined || cellValue === '') {
                              return null;
                            }
                            
                            return (
                              <div key={getCellKey(column, colIndex, rowIndex)} className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">{getMobileLabel(column)}</span>
                                <span className="font-normal">{cellValue}</span>
                              </div>
                            );
                          })}
                      </div>
                      
                      {/* Card Footer with Actions */}
                      {actionsColumn && actionsColumn.cell && (
                        <div className="border-t p-2 bg-gray-50 flex justify-end gap-2">
                          {actionsColumn.cell({ row: { original: row } })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table className="data-table">
                <TableHeader className="data-table-header">
                  <TableRow>
                    {columns.map((column, idx) => (
                      <TableHead key={`header-${idx}-${column.header.replace(/\s+/g, '-')}`} className="data-table-head">
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="data-table-body">
                  {filteredData.map((row, rowIndex) => (
                    <TableRow key={getRowKey(row, rowIndex)} className="data-table-row">
                      {columns.map((column, colIndex) => (
                        <TableCell key={getCellKey(column, colIndex, rowIndex)} className="data-table-cell">
                          {column.cell ? column.cell({ row: { original: row } }) : row[column.accessorKey]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
