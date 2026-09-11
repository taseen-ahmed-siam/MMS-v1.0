"use client"

import * as React from "react"

import { cn } from "@/lib/utils/format"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <Card className={cn("rounded-2xl border shadow-sm", className)}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-sm lg:min-w-0">
            <thead>
              <tr className="border-b">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <th
                    key={colIndex}
                    className="h-10 px-4 text-left font-medium"
                  >
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b last:border-b-0">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="h-12 px-4">
                      <Skeleton className="h-4 rounded-md" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export { TableSkeleton }
export type { TableSkeletonProps }
