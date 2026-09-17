import React, { useState } from "react";
import type { Service } from "../../types/catalog.types";
import { Clock, Tag, ArrowRight, ImageOff, Package } from "lucide-react";

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
  isSelected?: boolean;
}

// Vertical-agnostic category keyword → gradient palette for icon fallback
const VERTICAL_PALETTES: { keywords: string[]; gradient: string; iconBg: string }[] = [
  { keywords: ["car", "auto", "vehicle", "suv", "sedan", "hatchback", "truck"], gradient: "from-blue-600 to-cyan-500", iconBg: "bg-blue-600/20 text-blue-400" },
  { keywords: ["salon", "spa", "beauty", "hair", "nail", "facial"], gradient: "from-pink-600 to-rose-400", iconBg: "bg-pink-600/20 text-pink-400" },
  { keywords: ["hotel", "room", "suite", "resort", "stay", "lodge"], gradient: "from-amber-600 to-yellow-400", iconBg: "bg-amber-600/20 text-amber-400" },
  { keywords: ["clinic", "doctor", "dental", "medical", "health", "therapy"], gradient: "from-emerald-600 to-green-400", iconBg: "bg-emerald-600/20 text-emerald-400" },
  { keywords: ["food", "catering", "restaurant", "meal", "cuisine", "chef"], gradient: "from-orange-600 to-red-400", iconBg: "bg-orange-600/20 text-orange-400" },
  { keywords: ["tech", "repair", "service", "maintenance", "install"], gradient: "from-violet-600 to-purple-400", iconBg: "bg-violet-600/20 text-violet-400" },
];

function resolveVerticalPalette(name: string, description: string) {
  const combined = `${name} ${description}`.toLowerCase();
  for (const palette of VERTICAL_PALETTES) {
    if (palette.keywords.some((kw) => combined.includes(kw))) return palette;
  }
  return { gradient: "from-indigo-600 to-purple-500", iconBg: "bg-indigo-600/20 text-indigo-400" };
}

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/static/") || url.startsWith("/api/");
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onSelect,
  isSelected = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const hasImage = isValidImageUrl(service.image_url) && !imgError;
  const palette = resolveVerticalPalette(service.name, service.description || "");

  return (
    <div
      className={`glass-panel-interactive rounded-2xl flex flex-col justify-between overflow-hidden group transition-all duration-200 border border-white/10 ${
        isSelected ? "ring-2 ring-indigo-500 bg-indigo-950/30" : "hover:border-indigo-500/30"
      }`}
    >
      {/* Dynamic Image Banner or Gradient Fallback */}
      <div className="h-32 w-full relative overflow-hidden bg-slate-900/60">
        {hasImage ? (
          <img
            src={service.image_url}
            alt={service.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 brightness-90 group-hover:brightness-100"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${palette.gradient} opacity-30 flex items-center justify-center`}>
            <Package className="w-10 h-10 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
        {service.price_range && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30 shadow-sm">
            {service.price_range}
          </span>
        )}
      </div>

      {/* Content details */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
        <div>
          <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${palette.iconBg}`}>
              <Tag className="w-3 h-3" />
            </span>
            {service.name}
          </h4>
          {service.description && (
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {service.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            {service.duration_minutes ? (
              <>
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{service.duration_minutes} min</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Flexible</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => onSelect(service)}
            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <span>Book</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
