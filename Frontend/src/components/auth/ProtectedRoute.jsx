import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE_LABELS } from "../../utils/status";
import { Card } from "../common/Card";
import { Btn } from "../common/Btn";
import { ShieldAlert } from "lucide-react";

export const ProtectedRoute = ({
  allowedRoles,
  children,
  onOpenAuth,
}) => {
  const { role, isAuthenticated, switchRole } = useAuth();

  if (!allowedRoles.includes(role)) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <Card className="p-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Khu vực này chỉ dành cho vai trò:{" "}
            <span className="font-semibold text-slate-700">
              {allowedRoles.map((r) => ROLE_LABELS[r]).join(", ")}
            </span>
            . Vai trò hiện tại của bạn là{" "}
            <span className="font-semibold text-blue-600">{ROLE_LABELS[role]}</span>.
          </p>
          <div className="flex flex-col gap-2">
            <Btn
              onClick={() => switchRole(allowedRoles[0])}
              color="#1d4ed8"
              className="w-full"
            >
              Chuyển sang vai trò {ROLE_LABELS[allowedRoles[0]]}
            </Btn>
            {!isAuthenticated && onOpenAuth && (
              <Btn onClick={onOpenAuth} variant="outline" className="w-full">
                Đăng nhập tài khoản khác
              </Btn>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
