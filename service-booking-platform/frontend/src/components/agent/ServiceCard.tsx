import React from "react";
import type { Service } from "../../types/catalog.types";
import { Clock, Tag, ArrowRight } from "lucide-react";

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
  isSelected?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onSelect,
  isSelected = false,
}) => {
  return (
    <div
      className={`glass-panel-interactive p-4 rounded-xl flex flex-col justify-between gap-3 relative overflow-hidden group ${
        isSelected ? "ring-2 ring-indigo-500 bg-indigo-950/20" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-white text-base group-hover:text-indigo-300 transition-colors">
            {service.name}
          </h4>
          {service.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {service.description}
            </p>
          )}
        </div>
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap">
          {service.price_range || "Quote upon request"}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{service.duration_minutes ? `${service.duration_minutes} mins` : "Flexible"}</span>
        </div>
        <button
          type="button"
          onClick={() => onSelect(service)}
          className="flex items-center gap-1 text-indigo-400 font-medium hover:text-indigo-300 transition-colors cursor-pointer"
        >
          <span>Select</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
