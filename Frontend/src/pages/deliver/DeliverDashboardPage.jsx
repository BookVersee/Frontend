import React, { useState, useEffect } from "react";
import { Truck, MapPin, Phone, CheckCircle, Package } from "lucide-react";
import { deliverService } from "../../services/deliverService";
import { useAuth } from "../../contexts/AuthContext";
import { deliveryStatusInfo } from "../../utils/status";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Btn } from "../../components/common/Btn";

export const DeliverDashboardPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    deliverService
      .getDeliverTasks()
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  const advanceTaskStatus = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextStatusMap = {
      PENDING: "TRANSIT",
      TRANSIT: "OUT_FOR_DELIVERY",
      OUT_FOR_DELIVERY: "DELIVERED",
      DELIVERED: "DELIVERED",
      RETURNED: "RETURNED",
    };

    const nextStatus = nextStatusMap[task.status];
    await deliverService.updateTaskStatus(id, nextStatus);

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    );
  };

  const pendingCount = tasks.filter((t) => t.status !== "DELIVERED").length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          Danh sách điều phối giao hàng
        </h1>
        <Badge
          label={`${pendingCount} đơn cần xử lý`}
          color="#6d28d9"
          bg="#ede9fe"
        />
      </div>
      <p className="text-slate-500 text-xs sm:text-sm mb-6">
        Nhân viên giao hàng:{" "}
        <strong className="text-slate-800">{user?.name || "Nguyễn Văn Giao"}</strong>{" "}
        (GHN Express Hub)
      </p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 bg-white rounded-2xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          Hôm nay chưa có đơn hàng nào được phân công.
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const ds = deliveryStatusInfo(task.status);
            return (
              <Card key={task.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        Đơn #{task.orderId}
                      </span>
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {task.trackingNumber}
                      </span>
                    </div>

                    <p className="font-bold text-slate-800 text-base">
                      {task.customer}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span>{task.address}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <a
                        href={`tel:${task.phone}`}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        {task.phone}
                      </a>
                    </div>
                  </div>

                  <Badge label={ds.label} color={ds.color} bg={ds.bg} />
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Package size={13} /> {task.items} kiện
                    </span>
                    <span>⚖️ {task.weight}</span>
                    <span>📅 Dự kiến: {task.estimatedDate}</span>
                  </div>

                  {task.status !== "DELIVERED" && task.status !== "RETURNED" && (
                    <Btn
                      onClick={() => advanceTaskStatus(task.id)}
                      size="sm"
                      color="#6d28d9"
                    >
                      <Truck size={14} />
                      {task.status === "PENDING"
                        ? "Lấy hàng tại Shop"
                        : task.status === "TRANSIT"
                        ? "Bắt đầu đi giao"
                        : "Xác nhận đã giao"}
                    </Btn>
                  )}

                  {task.status === "DELIVERED" && (
                    <Badge
                      label="Giao thành công ✓"
                      color="#047857"
                      bg="#d1fae5"
                      icon={<CheckCircle size={12} />}
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
