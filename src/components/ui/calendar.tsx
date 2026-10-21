import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  modifiers,
  modifiersClassNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // Built-in `checkoutOnly` modifier: a day that is the checkout of an
  // existing booking — physically free for new check-in. We render a diagonal
  // stripe so the guest sees it's only valid as a "from" date.
  const mergedModifiersClassNames = {
    checkoutOnly: 'rdp-checkout-only',
    ...modifiersClassNames,
  };

  return (
    <>
      <style>{`
        .rdp-checkout-only {
          background-image: repeating-linear-gradient(
            -45deg,
            transparent 0,
            transparent 3px,
            hsl(var(--muted-foreground) / 0.35) 3px,
            hsl(var(--muted-foreground) / 0.35) 4px
          );
        }
      `}</style>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("relative p-3 pointer-events-auto", className)}
        classNames={{
          months: "relative flex flex-col gap-4 sm:flex-row",
          month: "space-y-4",
          month_caption: "flex h-11 justify-center relative items-center",
          caption_label: "text-sm font-medium",
          nav: "absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between",
          button_previous: cn(
            buttonVariants({ variant: "outline" }),
            "h-11 w-11 bg-transparent p-0 opacity-50 hover:opacity-100",
          ),
          button_next: cn(buttonVariants({ variant: "outline" }), "h-11 w-11 bg-transparent p-0 opacity-50 hover:opacity-100"),
          month_grid: "w-full border-collapse space-y-1",
          weekdays: "flex",
          weekday: "text-muted-foreground rounded-none w-9 font-normal text-[0.8rem]",
          week: "flex w-full mt-2",
          day: "rdp-day h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day_button: cn(buttonVariants({ variant: "ghost" }), "rdp-day_button h-9 w-9 p-0 font-normal touch-manipulation"),
          range_end: "day-range-end",
          range_start: "day-range-start",
          selected:
            "bg-primary text-primary-foreground [&:not(.day-range-middle)>button]:bg-primary [&:not(.day-range-middle)>button]:text-primary-foreground [&:not(.day-range-middle)>button]:hover:bg-primary [&:not(.day-range-middle)>button]:hover:text-primary-foreground [&:not(.day-range-middle)>button]:focus:bg-primary [&:not(.day-range-middle)>button]:focus:text-primary-foreground",
          today: "bg-accent text-accent-foreground",
          outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          disabled: "text-muted-foreground opacity-50",
          range_middle: "day-range-middle aria-selected:bg-accent aria-selected:text-accent-foreground",
          hidden: "invisible",
          ...classNames,
        }}
        modifiers={modifiers}
        modifiersClassNames={mergedModifiersClassNames}
        components={{
          Chevron: ({ orientation, className: iconClassName }) => {
            const Icon = orientation === 'left' ? ChevronLeft : orientation === 'right' ? ChevronRight : orientation === 'up' ? ChevronUp : ChevronDown;
            return <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />;
          },
        }}
        {...props}
      />
    </>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
