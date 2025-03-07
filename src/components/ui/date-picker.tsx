
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  mode?: "single" | "range" | "multiple";
  selected?: Date | Date[] | undefined;
  onSelect?: (date: Date | Date[] | { from: Date; to?: Date } | undefined) => void;
  className?: string;
  disabled?: (date: Date) => boolean;
}

export function DatePicker({
  mode = "single",
  selected,
  onSelect,
  className,
  disabled,
}: DatePickerProps) {
  return (
    <div className={cn("p-3", className)}>
      {mode === "single" && (
        <Calendar
          mode="single"
          selected={selected as Date}
          onSelect={onSelect as (date: Date | undefined) => void}
          disabled={disabled}
          className="pointer-events-auto"
        />
      )}
      {mode === "range" && (
        <Calendar
          mode="range"
          selected={selected as { from: Date; to?: Date }}
          onSelect={onSelect as (date: { from: Date; to?: Date } | undefined) => void}
          disabled={disabled}
          className="pointer-events-auto"
        />
      )}
      {mode === "multiple" && (
        <Calendar
          mode="multiple"
          selected={selected as Date[]}
          onSelect={onSelect as (date: Date[] | undefined) => void}
          disabled={disabled}
          className="pointer-events-auto"
        />
      )}
    </div>
  );
}
