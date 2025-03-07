
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface ChartProps {
  type: "bar" | "pie";
  data: any[];
  categories: string[];
  index: string;
  colors: string[];
  valueFormatter?: (value: number) => string;
  height?: number;
}

export function Chart({
  type = "bar",
  data = [],
  categories = ["value"],
  index = "name",
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
  valueFormatter = (value: number) => value.toString(),
  height = 300
}: ChartProps) {
  
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey={index}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickMargin={10}
          />
          <YAxis 
            tickFormatter={(value) => valueFormatter(value)}
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">{payload[0].payload[index]}</div>
                      <div className="font-medium text-right">
                        {valueFormatter(Number(payload[0].value))}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey={categories[0]} radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  
  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={categories[0]}
            nameKey={index}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={0}
            paddingAngle={1}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">{payload[0].name}</div>
                      <div className="font-medium text-right">
                        {valueFormatter(Number(payload[0].value))}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  
  return null;
}
