import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { CommitteeAssignmentListItem } from "../../../../api/committeeAssignmentApi";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ActionButton({
  icon,
  tooltip,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-[#D9E1F2] bg-white text-[#1F3C88] shadow-sm transition-all duration-200 hover:border-[#1F3C88] hover:text-[#0F1C3F] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1F3C88] px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
        {tooltip}
      </span>
    </button>
  );
}

interface CommitteeTableProps {
  data: CommitteeAssignmentListItem[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (direction: "next" | "prev") => void;
  onViewDetail: (committeeCode: string) => void;
  onDelete?: (committeeCode: string) => void;
  resolveTagLabel?: (tagCode: string) => string;
}

export function CommitteeTable({
  data,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onViewDetail,
  onDelete,
  resolveTagLabel,
}: CommitteeTableProps) {
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="overflow-hidden rounded-3xl border border-[#D9E1F2] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E5ECFB] px-6 py-4">
        <div>
          <p className="text-lg font-semibold text-[#1F3C88]">Danh sách hội đồng</p>
          <p className="text-sm text-[#6B7A99]">
            Header cố định, hàng bo tròn nhẹ, tooltip và hiệu ứng hover tinh tế.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold uppercase text-[#4A5775]">
          Trang {page}/{maxPage}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange("prev")}
              disabled={page <= 1}
              className="rounded-full border border-[#D9E1F2] bg-white px-3 py-1 text-[#1F3C88] transition-all duration-200 hover:bg-[#F8FAFF] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => onPageChange("next")}
              disabled={page >= maxPage}
              className="rounded-full border border-[#D9E1F2] bg-white px-3 py-1 text-[#1F3C88] transition-all duration-200 hover:bg-[#F8FAFF] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <table className="min-w-full border-separate border-spacing-y-2 px-6">
          <thead className="sticky top-0 z-10 bg-white text-left text-xs font-semibold uppercase tracking-wider text-[#6B7A99]">
            <tr>
              <th className="px-6 py-3">Mã hội đồng</th>
              <th className="px-6 py-3">Tên hội đồng</th>
              <th className="px-6 py-3">Ngày bảo vệ</th>
              <th className="px-6 py-3">Phòng</th>
              <th className="px-6 py-3 text-center">Thành viên</th>
              <th className="px-6 py-3 text-center">Đề tài</th>
              <th className="px-6 py-3">Trạng thái</th>
              <th className="px-6 py-3">Tag</th>
              <th className="px-6 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm text-[#1F253D]">
            {loading && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-[#1F3C88]">
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-[#6B7A99]">
                  Chưa có hội đồng nào phù hợp bộ lọc.
                </td>
              </tr>
            )}
            {!loading &&
              data.map((item) => (
                <tr
                  key={item.committeeCode}
                  className="rounded-2xl border border-[#E5ECFB] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <td className="rounded-l-2xl px-6 py-4 font-semibold text-[#1F3C88]">
                    {item.committeeCode}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#1F253D]">{item.name ?? "(Chưa đặt tên)"}</div>
                    <div className="text-xs text-[#6B7A99]">Cập nhật {formatDateTime(item.lastUpdated)}</div>
                  </td>
                  <td className="px-6 py-4 text-[#1F253D]">{item.defenseDate ? formatDate(item.defenseDate) : "-"}</td>
                  <td className="px-6 py-4 text-[#1F253D]">{item.room ?? "-"}</td>
                  <td className="px-6 py-4 text-center font-semibold text-[#1F3C88]">{item.memberCount}</td>
                  <td className="px-6 py-4 text-center font-semibold text-[#1F3C88]">{item.topicCount}</td>
                  <td className="px-6 py-4">
                    {item.status ? (
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "Sắp diễn ra"
                            ? "bg-green-100 text-green-800"
                            : item.status === "Đang diễn ra"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    ) : (
                      <span className="text-xs text-[#6B7A99]">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {item.tagCodes?.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#00B4D8]/10 px-3 py-1 text-xs font-semibold uppercase text-[#00B4D8] border border-[#00B4D8]/20"
                        >
                          {resolveTagLabel ? resolveTagLabel(tag) : tag}
                        </span>
                      ))}
                      {(!item.tagCodes || item.tagCodes.length === 0) && (
                        <span className="text-xs text-[#6B7A99]">Chưa gắn tag</span>
                      )}
                    </div>
                  </td>
                  <td className="rounded-r-2xl px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <ActionButton icon={<Eye size={16} />} tooltip="Xem chi tiết" onClick={() => onViewDetail(item.committeeCode)} />
                      <ActionButton icon={<Pencil size={16} />} tooltip="Chỉnh sửa" onClick={() => onViewDetail(item.committeeCode)} />
                      <ActionButton icon={<Trash2 size={16} />} tooltip="Xóa" onClick={() => onDelete && onDelete(item.committeeCode)} />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}