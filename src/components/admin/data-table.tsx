"use client"

import * as React from "react"

import { cn } from "@/lib/utils/format"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

interface Column<T = unknown> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T = unknown> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  className?: string
}

function DataTable<T>({
  columns,
  data,
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <Table className={cn("min-w-[64rem] lg:min-w-0", className)}>
      <TableHeader>
        <TableRow className="bg-[#064E3B] hover:bg-[#064E3B]">
          {columns.map((col) => (
            <TableHead
              key={col.key}
              className={cn("text-xs font-semibold uppercase tracking-wider text-white", col.className)}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-24 text-center text-sm text-muted-foreground"
            >
              No results.
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, rowIndex) => (
            <TableRow
              key={(row as { id?: string }).id ?? rowIndex}
              className={cn(
                onRowClick && "cursor-pointer",
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export { DataTable }
export type { DataTableProps, Column }
