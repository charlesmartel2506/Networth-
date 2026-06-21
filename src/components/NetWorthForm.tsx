"use client";

import { useState } from "react";
import { addEntry } from "@/app/dashboard/actions";
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from "@/lib/categories";

const money = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);

export default function NetWorthForm({ today }: { today: string }) {
  const [values, setValues] = useState<Record<string, string>>({});

  const set = (name: string, v: string) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  const sum = (prefix: string) =>
    Object.entries(values).reduce(
      (acc, [k, v]) =>
        k.startsWith(prefix) ? acc + (parseFloat(v) || 0) : acc,
      0,
    );

  const totalAssets = sum("asset_");
  const totalLiabilities = sum("liability_");
  const netWorth = totalAssets - totalLiabilities;

  const field = (prefix: string, key: string, label: string, icon: string) => {
    const name = `${prefix}_${key}`;
    return (
      <label key={name} className="flex items-center gap-2 text-sm">
        <span className="w-7 text-center">{icon}</span>
        <span className="flex-1">{label}</span>
        <input
          name={name}
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          placeholder="0"
          value={values[name] ?? ""}
          onChange={(e) => set(name, e.target.value)}
          className="input w-28 text-right"
        />
      </label>
    );
  };

  return (
    <form action={addEntry} className="flex flex-col gap-5">
      {/* Assets */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-positive">Assets</h3>
          <span className="text-sm font-semibold tabular-nums text-positive">
            {money(totalAssets)}
          </span>
        </div>
        {ASSET_CATEGORIES.map((c) => field("asset", c.key, c.label, c.icon))}
      </div>

      {/* Liabilities */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-negative">Debts</h3>
          <span className="text-sm font-semibold tabular-nums text-negative">
            {money(totalLiabilities)}
          </span>
        </div>
        {LIABILITY_CATEGORIES.map((c) =>
          field("liability", c.key, c.label, c.icon),
        )}
      </div>

      {/* Total */}
      <div className="rounded-xl bg-surface-2 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold">Total Net Worth</span>
        <span
          className={`text-xl font-bold tabular-nums ${
            netWorth < 0 ? "text-negative" : "text-primary"
          }`}
        >
          {money(netWorth)}
        </span>
      </div>

      {/* Date + note */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Date
          <input
            name="recorded_at"
            type="date"
            defaultValue={today}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Note
          <input name="note" type="text" placeholder="Optional" className="input" />
        </label>
      </div>

      <button className="btn-primary">Save net worth</button>
    </form>
  );
}
