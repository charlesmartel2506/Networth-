export type Category = { key: string; label: string; icon: string; color: string };

export const ASSET_CATEGORIES: Category[] = [
  { key: "bank", label: "Cash & Bank", icon: "🏦", color: "#6d5efc" },
  { key: "investments", label: "Investments", icon: "📈", color: "#10b981" },
  {
    key: "retirement",
    label: "Retirement (RRSP/TFSA)",
    icon: "🏖️",
    color: "#f59e0b",
  },
  { key: "real_estate", label: "Real Estate", icon: "🏠", color: "#38bdf8" },
  { key: "crypto", label: "Crypto", icon: "🪙", color: "#a855f7" },
  { key: "vehicle", label: "Vehicle", icon: "🚗", color: "#ec4899" },
  { key: "other_assets", label: "Other Assets", icon: "💼", color: "#9aa3b2" },
];

export const LIABILITY_CATEGORIES: Category[] = [
  { key: "credit_card", label: "Credit Card", icon: "💳", color: "#f43f5e" },
  { key: "student_loan", label: "Student Loan", icon: "🎓", color: "#f59e0b" },
  { key: "car_loan", label: "Car Loan", icon: "🚗", color: "#ec4899" },
  { key: "mortgage", label: "Mortgage", icon: "🏠", color: "#38bdf8" },
  {
    key: "line_of_credit",
    label: "Line of Credit",
    icon: "🏧",
    color: "#a855f7",
  },
  { key: "other_debt", label: "Other Debt", icon: "📄", color: "#9aa3b2" },
];

const ALL = [...ASSET_CATEGORIES, ...LIABILITY_CATEGORIES];

export function labelFor(key: string): string {
  return ALL.find((c) => c.key === key)?.label ?? key;
}

export function iconFor(key: string): string {
  return ALL.find((c) => c.key === key)?.icon ?? "•";
}

export function colorForCategory(key: string): string {
  return ALL.find((c) => c.key === key)?.color ?? "#9aa3b2";
}
