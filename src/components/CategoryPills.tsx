import { CATEGORIES } from "../types";

interface Props {
  active: string;
  onSelect: (label: string) => void;
}

export default function CategoryPills({ active, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
      {CATEGORIES.map((c) => (
        <button
          key={c.label}
          onClick={() => onSelect(c.label)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            active === c.label
              ? "bg-white text-black border-white"
              : "bg-card border-card-border text-t-secondary hover:bg-card-hover hover:text-white"
          }`}
        >
          {c.emoji} {c.label}
        </button>
      ))}
    </div>
  );
}
