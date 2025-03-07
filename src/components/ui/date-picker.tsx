
"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type DatePickerProps = {
  mode?: "single" | "multiple" | "range";
  selected?: Date | Date[] | { from: Date; to?: Date | undefined };
  onSelect?: (date: Date | Date[] | { from: Date; to?: Date | undefined }) => void;
  className?: string;
  error?: string;
  initialFocus?: boolean;
  placeholder?: string;
};

export function DatePicker({
  mode = "single",
  selected,
  onSelect,
  className,
  error,
  initialFocus = true,
  placeholder = "Pick a date",
}: DatePickerProps) {
  const Component = (
    <div className={cn("grid gap-2", className)}>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <DayPicker
        className={cn("p-3", error && "border-red-500")}
        initialFocus={initialFocus}
        // Type assertion based on mode to ensure correct type
        {...(mode === "single"
          ? {
              mode: "single" as const,
              selected: selected as Date,
              onSelect: onSelect as (date: Date | undefined) => void,
            }
          : mode === "range"
          ? {
              mode: "range" as const,
              selected: selected as { from: Date; to?: Date },
              onSelect: onSelect as (range: { from: Date; to?: Date } | undefined) => void,
            }
          : {
              mode: "multiple" as const,
              selected: selected as Date[],
              onSelect: onSelect as (dates: Date[] | undefined) => void,
            })}
      />
    </div>
  );
  return Component;
}

export function DatePickerWithInput({
  mode = "single",
  selected,
  onSelect,
  className,
  error,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    (selected as Date) || undefined
  );

  React.useEffect(() => {
    if (selected && mode === "single") {
      setDate(selected as Date);
    }
  }, [selected, mode]);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (onSelect && mode === "single") {
      onSelect(selectedDate as Date);
    }
  };

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? date.toLocaleDateString() : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <DatePicker
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
