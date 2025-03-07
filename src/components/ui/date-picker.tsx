
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type DatePickerProps = {
  className?: string;
  mode?: "single" | "range" | "multiple";
  selected?: Date | Date[] | { from: Date; to?: Date };
  onSelect?: (date: Date | Date[] | { from: Date; to?: Date } | undefined) => void;
}

export function DatePicker({
  className,
  mode = "single",
  selected,
  onSelect,
}: DatePickerProps) {
  // Determine what to display in the button based on the mode and selected value
  const getDisplayValue = () => {
    if (!selected) return "Pick a date";

    if (mode === "range" && typeof selected === "object" && "from" in selected) {
      const { from, to } = selected;
      if (from && to) {
        return `${format(from, "PPP")} - ${format(to, "PPP")}`;
      }
      return format(from, "PPP");
    }

    if (mode === "multiple" && Array.isArray(selected)) {
      return selected.length > 0 
        ? `${selected.length} dates selected`
        : "Pick dates";
    }

    if (mode === "single" && selected instanceof Date) {
      return format(selected, "PPP");
    }

    return "Pick a date";
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDisplayValue()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode={mode}
            selected={selected}
            onSelect={onSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
