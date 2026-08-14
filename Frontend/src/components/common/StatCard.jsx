import React from "react";
import { Card } from "./Card";

export const StatCard = ({ label, value, sub, icon, color }) => {
  return (
    <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-0.5 truncate">{label}</p>
        <p className="text-xl font-bold text-slate-800 tracking-tight truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </Card>
  );
};
