import { apiClient } from "./api";
import { ApiResponse, UploadImageResponse } from "../types";

export const uploadService = {
  /**
   * Tải tệp hình ảnh lên Cloudinary thông qua Backend API (/api/upload/image)
   * @param file Tệp hình ảnh được chọn từ thiết bị (JPG, PNG, WEBP, GIF, <= 10MB)
   * @param folder Thư mục lưu trữ trên Cloudinary (mặc định: "bookverse/books")
   * @returns Thông tin ảnh gồm url, public_id, file_name, size
   */
  async uploadImage(file: File, folder = "bookverse/books"): Promise<UploadImageResponse> {
    // 1. Client-side validation
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new Error("Định dạng file không hỗ trợ. Chỉ chấp nhận JPG, JPEG, PNG, WEBP, GIF.");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Dung lượng file tối đa là 10MB.");
    }

    // 2. Chuẩn bị FormData
    const formData = new FormData();
    formData.append("File", file);
    formData.append("Folder", folder);

    try {
      // 3. Gửi HTTP POST multipart/form-data
      const res = await apiClient.post<ApiResponse<UploadImageResponse>>("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }

      throw new Error(res.data?.message || "Upload ảnh thất bại.");
    } catch (error: any) {
      console.error("[uploadService] uploadImage error:", error);
      const serverMessage = error.response?.data?.message || error.message || "Lỗi tải ảnh lên máy chủ.";
      throw new Error(serverMessage);
    }
  },

  /**
   * Xóa ảnh trên Cloudinary theo publicId
   * @param publicId PublicId của ảnh trên Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    if (!publicId) return false;
    try {
      const res = await apiClient.delete<ApiResponse<any>>("/upload/image", {
        params: { publicId },
      });
      return !!res.data?.success;
    } catch (error) {
      console.warn("[uploadService] deleteImage error:", error);
      return false;
    }
  },
};
