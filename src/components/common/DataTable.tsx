
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: keyof T;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  isLoading = false,
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
          <div className="h-32 flex items-center justify-center">
            <p className="text-center text-muted-foreground">Loading...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="h-32 flex items-center justify-center">
            <p className="text-center text-muted-foreground">No data available</p>
          </div>
        ) : (
          <>
            {isMobile ? (
              <div className="space-y-4">
                {filteredData.map((row, rowIndex) => (
                  <Card key={rowIndex} className="overflow-hidden">
                    <CardContent className="p-0">
                      {columns.map((column, colIndex) => {
                        // Skip rendering of certain columns that don't make sense on mobile
                        if (column.header === "Actions") {
                          return (
                            <div key={colIndex} className="border-t p-2 bg-muted/20 flex justify-center">
                              {column.cell ? column.cell(row) : row[column.accessorKey]}
                            </div>
                          );
                        }
                        
                        // Skip ID column on mobile
                        if (column.header === "ID" || column.accessorKey === "id") {
                          return null;
                        }
                        
                        return (
                          <div key={colIndex} className="flex flex-col px-4 py-2 border-b last:border-b-0">
                            <span className="text-xs font-medium text-muted-foreground">
                              {getMobileLabel(column)}
                            </span>
                            <div className="mt-1">
                              {column.cell ? column.cell(row) : row[column.accessorKey]}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table className="data-table">
                <TableHeader className="data-table-header">
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.header as string} className="data-table-head">
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="data-table-body">
                  {filteredData.map((row, index) => (
                    <TableRow key={index} className="data-table-row">
                      {columns.map((column) => (
                        <TableCell key={column.accessorKey as string} className="data-table-cell">
                          {column.cell ? column.cell(row) : row[column.accessorKey]}
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
