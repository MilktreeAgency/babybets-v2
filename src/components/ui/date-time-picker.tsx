import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Create hours array in reverse order (12, 11, 10, ..., 1)
  const hours = React.useMemo(() => Array.from({ length: 12 }, (_, i) => 12 - i), []);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Preserve existing time if available
      if (date) {
        selectedDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
      } else {
        // Default to 12:00 PM if no time set
        selectedDate.setHours(12, 0, 0, 0);
      }
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (
    type: "hour" | "minute" | "ampm",
    value: string
  ) => {
    const newDate = date ? new Date(date) : new Date();

    if (type === "hour") {
      const hour = parseInt(value);
      const isPM = newDate.getHours() >= 12;
      // Convert 12-hour format to 24-hour: 12 AM = 0, 1-11 AM = 1-11, 12 PM = 12, 1-11 PM = 13-23
      newDate.setHours((hour % 12) + (isPM ? 12 : 0));
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value));
    } else if (type === "ampm") {
      const currentHours = newDate.getHours();
      if (value === "PM" && currentHours < 12) {
        newDate.setHours(currentHours + 12);
      } else if (value === "AM" && currentHours >= 12) {
        newDate.setHours(currentHours - 12);
      }
    }

    setDate(newDate);
  };

  // Get display hour (12-hour format)
  const getDisplayHour = (date: Date | undefined) => {
    if (!date) return 12;
    const hours = date.getHours();
    return hours % 12 || 12; // Convert 0 to 12, keep 1-11 as is, convert 12-23 to 12,1-11
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-info-fg flex items-center text-left cursor-pointer bg-admin-card-bg hover:bg-admin-hover-bg transition-colors text-sm",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "MM/dd/yyyy hh:mm aa")
          ) : (
            <span>MM/DD/YYYY hh:mm aa</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-admin-card-bg border-border" align="start">
        <div className="flex">
          <div className="min-w-[320px]">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="w-full"
              classNames={{
                day_button: "data-[selected-single=true]:bg-admin-info-fg data-[selected-single=true]:text-white hover:bg-admin-hover-bg data-[selected-single=true]:hover:bg-admin-info-fg data-[selected-single=true]:hover:text-white"
              }}
            />
          </div>
          <div className="flex h-[300px] border-l border-border bg-admin-card-bg">
            {/* Hours */}
            <div className="w-16 overflow-y-auto border-r border-border bg-admin-card-bg">
              <div className="flex flex-col p-2 text-foreground">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleTimeChange("hour", hour.toString())}
                    className={cn(
                      "h-9 w-full rounded-md text-sm font-medium transition-colors cursor-pointer mb-1",
                      getDisplayHour(date) === hour
                        ? "bg-admin-info-fg text-white"
                        : "hover:bg-admin-hover-bg"
                    )}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="w-16 overflow-y-auto border-r border-border bg-admin-card-bg">
              <div className="flex flex-col p-2 text-foreground">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleTimeChange("minute", minute.toString())}
                    className={cn(
                      "h-9 w-full rounded-md text-sm font-medium transition-colors cursor-pointer mb-1",
                      date && date.getMinutes() === minute
                        ? "bg-admin-info-fg text-white"
                        : "hover:bg-admin-hover-bg"
                    )}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM */}
            <div className="w-16 overflow-y-auto bg-admin-card-bg">
              <div className="flex flex-col p-2 text-foreground">
                {["AM", "PM"].map((ampm) => (
                  <button
                    key={ampm}
                    type="button"
                    onClick={() => handleTimeChange("ampm", ampm)}
                    className={cn(
                      "h-9 w-full rounded-md text-sm font-medium transition-colors cursor-pointer mb-1",
                      date &&
                      ((ampm === "AM" && date.getHours() < 12) ||
                        (ampm === "PM" && date.getHours() >= 12))
                        ? "bg-admin-info-fg text-white"
                        : "hover:bg-admin-hover-bg"
                    )}
                  >
                    {ampm}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
