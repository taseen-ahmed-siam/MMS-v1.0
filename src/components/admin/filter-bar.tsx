"use client"

import * as React from "react"

import { cn } from "@/lib/utils/format"
import { SearchInput } from "@/components/forms/search-input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

interface FilterOption {
  value: string
  label: string
}

interface Filter {
  key: string
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  filters?: Filter[]
  children?: React.ReactNode
  className?: string
}

function FilterBar({
  search,
  onSearchChange,
  filters = [],
  children,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search..."
        className="sm:w-64"
      />

      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={filter.value}
          onValueChange={filter.onChange}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All {filter.label}</SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {children}
    </div>
  )
}

export { FilterBar }
export type { FilterBarProps, Filter, FilterOption }
