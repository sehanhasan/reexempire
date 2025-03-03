
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  } | string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className 
}: StatCardProps) {
  // Process trend to handle both string and object formats
  const trendDisplay = typeof trend === 'string' 
    ? trend 
    : trend && `${trend.isPositive ? '+' : ''}${trend.value}%`;
  
  // Determine if trend is positive (for styling)
  const isTrendPositive = typeof trend === 'object' ? trend.isPositive : true;
  
  return (
    <div className={cn(
      "bg-white rounded-lg border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md",
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
          
          {trend && (
            <div className="flex items-center mt-1">
              <span className={cn(
                "text-xs font-medium",
                isTrendPositive ? "text-green-600" : "text-red-600"
              )}>
                {trendDisplay}
              </span>
              {description && (
                <span className="text-xs text-slate-500 ml-1">{description}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-blue-50 rounded-md text-blue-600">
            {icon}
          </div>
        )}
      </div>
      {!trend && description && (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}
