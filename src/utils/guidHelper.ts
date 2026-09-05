/**
 * GUID Helper & Mapping Utilities
 * Đồng bộ các ID cũ kiểu số (1, 2, 3...) sang GUID chuẩn của Backend SQL Server
 */

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidGuid = (val?: any): boolean => {
  if (!val) return false;
  return UUID_REGEX.test(String(val).trim());
};

export const generateGuid = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const LEGACY_BOOK_ID_TO_GUID: Record<string, string> = {
  "1": "44444444-0000-0000-0000-000000000001", // Nhà Giả Kim / Đắc Nhân Tâm
  "2": "44444444-0000-0000-0000-000000000002", // Cây Cam Ngọt Của Tôi
  "3": "44444444-0000-0000-0000-000000000003", // Hoàng Tử Bé
  "4": "44444444-0000-0000-0000-000000000004", // Bố Già
  "5": "44444444-0000-0000-0000-000000000005", // Rừng Na Uy
  "6": "44444444-0000-0000-0000-000000000006", // Muôn Kiếp Nhân Sinh
  "7": "44444444-0000-0000-0000-000000000007", // Kính Vạn Hoa
  "8": "44444444-0000-0000-0000-000000000008", // Dế Mèn Phiêu Lưu Ký
  "9": "44444444-0000-0000-0000-000000000009", // Doraemon
  "10": "44444444-0000-0000-0000-000000000010", // Thần Thoại Hy Lạp
  "11": "44444444-0000-0000-0000-000000000011", // Sapiens
  "12": "44444444-0000-0000-0000-000000000012", // Homo Deus
  "13": "44444444-0000-0000-0000-000000000013", // Vũ Trụ Trong Vỏ Hạt Dẻ
  "14": "44444444-0000-0000-0000-000000000014", // Đại Việt Sử Ký Toàn Thư
  "15": "44444444-0000-0000-0000-000000000015", // Súng, Vi Trùng và Thép
  "16": "44444444-0000-0000-0000-000000000016", // Clean Code
  "17": "44444444-0000-0000-0000-000000000017", // Microservices
  "18": "44444444-0000-0000-0000-000000000018", // Pragmatic Programmer
  "19": "44444444-0000-0000-0000-000000000019", // Designing Data-Intensive Applications
  "20": "44444444-0000-0000-0000-000000000020", // Atomic Habits / Nghĩ Giàu Làm Giàu
};

export const normalizeBookGuid = (id: string | number): string => {
  const strId = String(id || "").trim();
  if (UUID_REGEX.test(strId)) {
    return strId;
  }
  if (LEGACY_BOOK_ID_TO_GUID[strId]) {
    return LEGACY_BOOK_ID_TO_GUID[strId];
  }
  return "44444444-0000-0000-0000-000000000001";
};
