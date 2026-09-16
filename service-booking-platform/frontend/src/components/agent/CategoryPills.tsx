import React from "react";
import type { Category } from "../../types/catalog.types";
import { Tag } from "lucide-react";

interface CategoryPillsProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedId,
  onSelect,
}) => {
  return (
    <div className="flex flex-wrap gap-2 my-3">
      {categories.map((cat) => {
        const isSelected = selectedId === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 border ${
              isSelected
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 scale-105"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <Tag className="w-3.5 h-3.5 opacity-70" />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};
