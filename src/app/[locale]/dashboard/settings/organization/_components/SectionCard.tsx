import { Card, CardContent } from '@/components/ui/card';
import type { CardSectionProps } from '../_schema';

export function SectionCard({ title, icon: Icon, children, className }: CardSectionProps) {
  return (
    <Card
      className={`text-on-surface rounded-[1.5rem] border border-white/5 bg-[#161b22] shadow-xl ${className ?? ''}`.trim()}
    >
      <CardContent className="p-8">
        <div className="mb-8 flex items-center gap-3">
          <Icon className="text-primary h-6 w-6" />
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
