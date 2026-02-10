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

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  const selectedDate = value ? new Date(value) : undefined
  const currentYear = new Date().getFullYear()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          type="button"
          className={cn(
            "w-full justify-start text-left font-normal h-9 bg-white hover:bg-slate-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(selectedDate!, "MMM d, yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          captionLayout="dropdown"
          fromYear={currentYear - 10}
          toYear={currentYear + 10}
          onSelect={(date) => {
            if (date) {
              onChange?.(format(date, "yyyy-MM-dd"))
              setOpen(false)
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
