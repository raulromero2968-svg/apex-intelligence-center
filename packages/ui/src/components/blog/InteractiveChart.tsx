/**
 * InteractiveChart - Bloomberg-esque Price History Visualization
 *
 * A minimal, dark-mode optimized area chart for embedding price history
 * data within blog posts. Uses the brand "Electric Blue" (#00F0FF) as
 * the default accent color for visual consistency.
 *
 * @module @apex/ui/components/blog
 */

"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { cn } from "../../lib/utils";

export interface ChartDataPoint {
  /** Date string (ISO format or readable format) */
  date: string;
  /** Numeric value for this data point */
  value: number;
}

export interface InteractiveChartProps {
  /** Array of data points to visualize */
  data: ChartDataPoint[];
  /** Title displayed above the chart */
  title: string;
  /** Primary color for the chart (defaults to Electric Blue) */
  color?: string;
  /** Height of the chart in pixels */
  height?: number;
  /** Optional className for the container */
  className?: string;
  /** Format function for Y-axis values */
  formatValue?: (value: number) => string;
  /** Format function for date display */
  formatDate?: (date: string) => string;
}

/**
 * Default Electric Blue - Brand accent color
 */
const ELECTRIC_BLUE = "#00F0FF";

/**
 * Default value formatter (currency-style)
 */
function defaultFormatValue(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Default date formatter
 */
function defaultFormatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Custom tooltip component with Bloomberg-esque styling
 */
function CustomTooltip({
  active,
  payload,
  label,
  formatValue,
  formatDate,
  color,
}: TooltipProps<number, string> & {
  formatValue: (value: number) => string;
  formatDate: (date: string) => string;
  color: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const dataValue = payload[0]?.value as number;

  return (
    <div
      className={cn(
        "px-3 py-2",
        "bg-space-void/95 backdrop-blur-md",
        "border border-slate-700/50",
        "rounded-md",
        "shadow-lg shadow-black/40"
      )}
    >
      <p className="text-xs text-slate-400 mb-1">{formatDate(label)}</p>
      <p
        className="text-sm font-mono font-semibold"
        style={{ color }}
      >
        {formatValue(dataValue)}
      </p>
    </div>
  );
}

export function InteractiveChart({
  data,
  title,
  color = ELECTRIC_BLUE,
  height = 280,
  className,
  formatValue = defaultFormatValue,
  formatDate = defaultFormatDate,
}: InteractiveChartProps) {
  // Compute min/max for better Y-axis scaling
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1;

  return (
    <div
      className={cn(
        "w-full",
        "p-4 md:p-6",
        "bg-space-void",
        "border border-slate-700/30",
        "rounded-lg",
        className
      )}
    >
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-200">{title}</h3>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-slate-500 font-mono">
            {data.length} points
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickFormatter={formatDate}
              dy={8}
              interval="preserveStartEnd"
              minTickGap={40}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickFormatter={formatValue}
              domain={[minValue - padding, maxValue + padding]}
              dx={-4}
              width={60}
            />

            <Tooltip
              content={
                <CustomTooltip
                  formatValue={formatValue}
                  formatDate={formatDate}
                  color={color}
                />
              }
              cursor={{
                stroke: color,
                strokeWidth: 1,
                strokeDasharray: "4 4",
                strokeOpacity: 0.4,
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${title.replace(/\s/g, "-")})`}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer - Data Range */}
      {data.length > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-mono">
            {formatDate(data[0].date)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {formatDate(data[data.length - 1].date)}
          </span>
        </div>
      )}
    </div>
  );
}

export default InteractiveChart;
