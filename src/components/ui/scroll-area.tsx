import { forwardRef } from 'react';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`overflow-y-auto ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
