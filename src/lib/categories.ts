export type Category = { key: string; label: string; icon: string };

export const ASSET_CATEGORIES: Category[] = [
  { key: "bank", label: "Cash & Bank", icon: "🏦" },
  { key: "investments", label: "Investments", icon: "📈" },
  { key: "retirement", label: "Retirement (RRSP/TFSA)", icon: "🏖️" },
  { key: "real_estate", label: "Real Estate", icon: "🏠" },
  { key: "crypto", label: "Crypto", icon: "🪙" },
  { key: "vehicle", label: "Vehicle", icon: "🚗" },
  { key: "other_assets", label: "Other Assets", icon: "💼" },
];

export const LIABILITY_CATEGORIES: Category[] = [
  { key: "credit_card", label: "Credit Card", icon: "💳" },
  { key: "student_loan", label: "Student Loan", icon: "🎓" },
  { key: "car_loan", label: "Car Loan", icon: "🚗" },
  { key: "mortgage", label: "Mortgage", icon: "🏠" },
  { key: "line_of_credit", label: "Line of Credit", icon: "🏧" },
  { key: "other_debt", label: "Other Debt", icon: "📄" },
];

export function labelFor(key: string): string {
  return (
    [...ASSET_CATEGORIES, ...LIABILITY_CATEGORIES].find((c) => c.key === key)
      ?.label ?? key
  );
}

export function iconFor(key: string): string {
  return (
    [...ASSET_CATEGORIES, ...LIABILITY_CATEGORIES].find((c) => c.key === key)
      ?.icon ?? "•"
  );
}
