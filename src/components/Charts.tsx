"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);

type Point = { label: string; value: number };

export function NetWorthAreaChart({
  data,
  color = "#6d5efc",
}: {
  data: Point[];
  color?: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => fmt(Number(v))}
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            formatter={(v) => [fmt(Number(v)), "Net worth"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(128,128,128,0.2)",
              background: "var(--surface)",
              color: "var(--foreground)",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#nwFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiLineChart({
  data,
  series,
}: {
  data: Record<string, number | string>[];
  series: { key: string; label: string; color: string }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => fmt(Number(v))}
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            formatter={(v, name) => [fmt(Number(v)), name as string]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(128,128,128,0.2)",
              background: "var(--surface)",
              color: "var(--foreground)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AllocationDonut({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => [fmt(Number(v)), name as string]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(128,128,128,0.2)",
              background: "var(--surface)",
              color: "var(--foreground)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpensesBarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => fmt(Number(v))}
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            formatter={(v) => [fmt(Number(v)), "Expenses"]}
            cursor={{ fill: "rgba(128,128,128,0.08)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(128,128,128,0.2)",
              background: "var(--surface)",
              color: "var(--foreground)",
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
