#!/bin/bash
# Script khởi chạy Backend BookVerse (.NET Web API) kết nối Docker SQL Server

echo "=========================================="
echo "🚀 ĐANG KHỞI ĐỘNG HỆ THỐNG BACKEND"
echo "=========================================="

# 1. Kiểm tra Docker container SQL Server
echo "📦 Kiểm tra trạng thái Docker Database..."
if ! docker ps | grep -q "edusphere_sqlserver"; then
    echo "🔄 SQL Server chưa chạy. Đang tự động start Docker container..."
    docker start edusphere_sqlserver edusphere_redis edusphere_qdrant
    echo "⏳ Chờ SQL Server khởi động hoàn tất (3s)..."
    sleep 3
else
    echo "✅ Docker SQL Server & Redis đang hoạt động tốt."
fi

# 2. Kiểm tra và giải phóng cổng 5226 nếu đang bị chiếm
OLD_PID=$(lsof -ti:5226)
if [ -n "$OLD_PID" ]; then
    echo "⚠️  Phát hiện tiến trình Backend cũ đang chiếm cổng 5226 (PID: $OLD_PID)."
    echo "🔄 Đang tắt tiến trình cũ để khởi động lại..."
    kill -9 $OLD_PID
    sleep 1
    echo "✅ Đã giải phóng cổng 5226."
fi

# 3. Chạy Backend với Connection String tương thích macOS & Docker SQL Server
echo "🚀 Đang khởi chạy .NET Web API..."
ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=BookManagementDb;User Id=sa;Password=EduSphere@2026StrongPass!;TrustServerCertificate=True;" \
dotnet run --project "$(dirname "$0")/Backend/BookManagement.Api"
