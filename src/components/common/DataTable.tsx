import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: ({
    row,
    getValue,
  }: {
    row: { original: T };
    getValue: () => any;
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
  onRowClick,
}: DataTableProps<T>) {
  const [searchQuery] = useState("");
  const isMobile = useIsMobile();
  const activeSearchTerm = externalSearchTerm ?? searchQuery;

  const filteredData = searchKey
    ? data.filter((item) => {
        const value = item[searchKey as string];
        if (typeof value === "string") {
          return value.toLowerCase().includes(activeSearchTerm.toLowerCase());
        }
        return true;
      })
    : data;

  const getRowKey = (row: T, rowIndex: number) => `row-${(row as any).id ?? "idx"}-${rowIndex}`;
  const getCellKey = (colHeader: string, colIndex: number, rowIndex: number) =>
    `cell-${colIndex}-${rowIndex}-${colHeader.replace(/\s+/g, "-")}`;
  const getCardKey = (row: T, rowIndex: number) => `card-${(row as any).id ?? "idx"}-${rowIndex}`;

  const getValueForColumn = (row: T, column: Column<T>) => {
    const key = column.accessorKey as string;
    return row[key as keyof T as string as any];
  };

  const renderCell = (row: T, column: Column<T>) => {
    const value = getValueForColumn(row, column);
    if (column.cell) {
      return column.cell({ row: { original: row }, getValue: () => value });
    }
    if (value === null || value === undefined || value === "") return "-";
    return typeof value === "string" || typeof value === "number" ? String(value) : "-";
  };

  // Simple mobile rendering: stacked cards
  const MobileList = () => (
    <div className="space-y-3">
      {filteredData.map((row, rowIndex) => (
        <Card
          key={getCardKey(row, rowIndex)}
          className="shadow-sm"
          onClick={() => onRowClick?.(row)}
        >
          <CardContent className="p-4">
            {renderCustomMobileCard ? (
              renderCustomMobileCard(row)
            ) : (
              <div className="space-y-2">
                {columns.map((column, colIndex) => (
                  <div key={getCellKey(column.header, colIndex, rowIndex)} className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-muted-foreground">{column.header}</div>
                    <div className="col-span-2 text-sm">{renderCell(row, column)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const DesktopTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, idx) => (
              <TableHead key={`head-${idx}-${column.header.replace(/\s+/g, "-")}`}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((row, rowIndex) => (
            <TableRow
              key={getRowKey(row, rowIndex)}
              className={onRowClick ? "cursor-pointer" : undefined}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={getCellKey(column.header, colIndex, rowIndex)}>
                  {renderCell(row, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : isMobile ? (
          <div className="p-3">
            <MobileList />
          </div>
        ) : (
          <DesktopTable />
        )}
      </div>
    </div>
  );
}

