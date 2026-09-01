import { apiClient } from "./api";
import { ApiResponse, UploadImageResponse, ImageUploadItem } from "../types";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateImageFile(file: File) {
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận JPG, JPEG, PNG, WEBP, GIF.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Tệp "${file.name}" vượt quá dung lượng tối đa 10MB.`);
  }
}

export const uploadService = {
  /**
   * Tải hàng loạt hình ảnh lên Cloudinary thông qua Backend API (/api/upload/images)
   * @param files Danh sách tệp hình ảnh từ thiết bị
   * @param folder Thư mục lưu trữ trên Cloudinary (mặc định: "bookverse/books")
   * @returns Danh sách kết quả ảnh { url, publicId }
   */
  async uploadMultipleImages(files: File[], folder = "bookverse/books"): Promise<ImageUploadItem[]> {
    if (!files || files.length === 0) return [];

    // 1. Client-side validation
    for (const file of files) {
      validateImageFile(file);
    }

    // 2. Chuẩn bị FormData
    const formData = new FormData();
    for (const file of files) {
      formData.append("Files", file);
    }
    formData.append("Folder", folder);

    try {
      // 3. Gửi HTTP POST multipart/form-data đến /upload/images
      const res = await apiClient.post<ApiResponse<ImageUploadItem[]>>("/upload/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }

      throw new Error(res.data?.message || "Tải lên danh sách ảnh thất bại.");
    } catch (error: any) {
      console.error("[uploadService] uploadMultipleImages error:", error);
      const serverMessage = error.response?.data?.message || error.message || "Lỗi khi tải danh sách ảnh lên máy chủ.";
      throw new Error(serverMessage);
    }
  },

  /**
   * Tải 1 tệp hình ảnh lên Cloudinary (sử dụng /api/upload/images)
   * @param file Tệp hình ảnh được chọn
   * @param folder Thư mục lưu trữ
   */
  async uploadImage(file: File, folder = "bookverse/books"): Promise<UploadImageResponse> {
    const list = await this.uploadMultipleImages([file], folder);
    if (list.length > 0) {
      return {
        url: list[0].url,
        public_id: list[0].publicId,
        file_name: file.name,
        size: file.size,
      };
    }
    throw new Error("Không nhận được kết quả ảnh từ máy chủ.");
  },

  /**
   * Xóa hàng loạt ảnh trên Cloudinary theo danh sách publicIds (/api/upload/images)
   * @param publicIds Mảng các PublicId cần xóa
   */
  async deleteMultipleImages(publicIds: string[]): Promise<number> {
    if (!publicIds || publicIds.length === 0) return 0;
    try {
      const res = await apiClient.delete<ApiResponse<{ deletedCount: number }>>("/upload/images", {
        data: { publicIds },
      });
      return res.data?.data?.deletedCount || 0;
    } catch (error) {
      console.warn("[uploadService] deleteMultipleImages error:", error);
      return 0;
    }
  },

  /**
   * Xóa 1 ảnh trên Cloudinary theo publicId
   * @param publicId PublicId của ảnh trên Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    if (!publicId) return false;
    const count = await this.deleteMultipleImages([publicId]);
    return count > 0;
  },
};

