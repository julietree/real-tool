export type StockStatus = "ok" | "warning" | "critical";

export function getStockStatus(inOffice: number, minQuantity: number): StockStatus {
  if (inOffice === 0) return "critical";
  if (inOffice <= minQuantity) return "warning";
  return "ok";
}

export function getEffectiveUsageStatus(returnDue: string | Date, returnedAt: string | Date | null) {
  if (returnedAt) return "returned";
  const due = new Date(returnDue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due < today) return "overdue";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (due <= tomorrow) return "due_soon";
  return "in_use";
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${month}/${day}(${weekdays[d.getDay()]})`;
}

export function formatFullDate(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
