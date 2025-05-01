import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

// CSS-only tooltip using Tailwind (no dependencies)
interface SimpleTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const SimpleTooltip = ({ content, children, side = 'top' }: SimpleTooltipProps) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div 
        className={`
          absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded py-1 px-2 z-50 whitespace-nowrap
          ${side === 'top' ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-1' : ''}
          ${side === 'right' ? 'left-full top-1/2 transform -translate-y-1/2 ml-1' : ''}
          ${side === 'bottom' ? 'top-full left-1/2 transform -translate-x-1/2 mt-1' : ''}
          ${side === 'left' ? 'right-full top-1/2 transform -translate-y-1/2 mr-1' : ''}
        `}
      >
        {content}
        <div 
          className={`
            absolute w-2 h-2 bg-gray-800 transform rotate-45
            ${side === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
            ${side === 'right' ? 'right-full top-1/2 translate-x-1/2 -translate-y-1/2' : ''}
            ${side === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2' : ''}
            ${side === 'left' ? 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
          `}
        ></div>
      </div>
    </div>
  );
};

// Shadcn UI tooltip components
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));