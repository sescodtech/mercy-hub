// app/admin/digital-services/utils.ts
export function fmt(n: number) { return `₦${(n || 0).toLocaleString("en-NG")}`; }
export function dateStr(d: string) {
  return new Date(d).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
export function dateOnly(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
