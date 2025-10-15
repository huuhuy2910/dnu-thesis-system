import { Filter, Search } from "lucide-react";

interface FilterState {
  search: string;
  defenseDate: string;
  specialty: string;
  term: string;
  status: string;
}

function FilterChip({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date";
}) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-[#D9E1F2] bg-[#F8FAFF] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#4A5775] transition-colors hover:border-[#1F3C88]/50">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-none bg-transparent text-xs font-medium uppercase text-[#1F3C88] outline-none placeholder:text-[#6B7A99]"
        placeholder="Tất cả"
      />
    </label>
  );
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (field: keyof FilterState, value: string) => void;
  onSearchChange: (value: string) => void;
}

export function FilterBar({ filters, onFilterChange, onSearchChange }: FilterBarProps) {
  return (
    <section className="rounded-3xl border border-[#D9E1F2] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-[#D9E1F2] bg-white px-3 py-1.5 transition-colors focus-within:border-[#1F3C88]">
          <Search size={16} className="text-[#1F3C88]" />
          <input
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm kiếm hội đồng, mã, phòng..."
            className="w-56 border-none bg-transparent text-sm outline-none placeholder:text-[#6B7A99]"
          />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1F3C88]">
          <Filter size={16} />
          Bộ lọc
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <FilterChip
            label="Ngày bảo vệ"
            value={filters.defenseDate}
            onChange={(value) => onFilterChange("defenseDate", value)}
            type="date"
          />
          <FilterChip
            label="Chuyên ngành"
            value={filters.specialty}
            onChange={(value) => onFilterChange("specialty", value)}
          />
          <FilterChip
            label="Học kỳ"
            value={filters.term}
            onChange={(value) => onFilterChange("term", value)}
          />
          <FilterChip
            label="Trạng thái"
            value={filters.status}
            onChange={(value) => onFilterChange("status", value)}
          />
        </div>
      </div>
    </section>
  );
}