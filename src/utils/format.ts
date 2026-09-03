export const fmt = (n: number): string =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return dateStr;
  }
};

// Rút gọn mã đơn hàng dạng #D8AC393A chuẩn eCommerce
export const formatOrderCode = (id: string | number): string => {
  if (!id) return "#";
  const raw = String(id).trim();
  const clean = raw.replace(/[^a-zA-Z0-9]/g, "");
  const code = (clean.length >= 8 ? clean.slice(0, 8) : raw).toUpperCase();
  return `#${code}`;
};

// Format ngày giờ đặt hàng chuẩn tiếng Việt (HH:mm · DD/MM/YYYY)
export const formatOrderDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} · ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};
