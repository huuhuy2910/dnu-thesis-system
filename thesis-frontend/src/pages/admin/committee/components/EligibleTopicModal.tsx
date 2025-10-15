import { ModalShell } from "./ModalShell";
import type { EligibleTopicSummary } from "../../../../services/committee-management.service";

type EligibleTopicModalMode = "assign" | "multi-select";

interface EligibleTopicModalProps {
  topics: EligibleTopicSummary[];
  loading: boolean;
  mode: EligibleTopicModalMode;
  selectedTopicCodes?: string[];
  onClose: () => void;
  onAssign?: (topic: EligibleTopicSummary) => void;
  onToggleTopic?: (topicCode: string, checked: boolean) => void;
  onConfirmSelection?: () => void;
  resolveTagLabel?: (tagCode: string) => string;
}

export function EligibleTopicModal({
  topics,
  loading,
  mode,
  selectedTopicCodes = [],
  onClose,
  onAssign,
  onToggleTopic,
  onConfirmSelection,
  resolveTagLabel,
}: EligibleTopicModalProps) {
  const isMultiSelect = mode === "multi-select";

  const handleCheckboxChange = (topicCode: string, checked: boolean) => {
    onToggleTopic?.(topicCode, checked);
  };

  const isSelected = (topicCode: string) => selectedTopicCodes.includes(topicCode);

  return (
    <ModalShell
      onClose={onClose}
      title="Đề tài đủ điều kiện"
      subtitle="Chọn đề tài đã duyệt để gán vào hội đồng hoặc xem nhanh thông tin."
      wide
    >
      <div className="flex flex-col gap-5">
        {loading && <p className="text-[#1F3C88]">Đang tải dữ liệu...</p>}
        {!loading && topics.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[#1F3C88]/30 bg-[#F5F8FF] px-5 py-6 text-center text-sm font-medium text-[#1F3C88]/70">
            Chưa có đề tài đủ điều kiện để phân công.
          </p>
        )}

        {!loading && topics.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[#D9E1F2]">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="min-w-full divide-y divide-[#E5ECFB] text-left text-sm text-[#1F253D]">
                <thead className="bg-[#F5F8FF] text-xs font-semibold uppercase tracking-wider text-[#1F3C88]">
                  <tr>
                    {isMultiSelect && <th className="px-4 py-3">Chọn</th>}
                    <th className="px-4 py-3">Mã đề tài</th>
                    <th className="px-4 py-3">Tên đề tài</th>
                    <th className="px-4 py-3">Sinh viên</th>
                    <th className="px-4 py-3">Giảng viên hướng dẫn</th>
                    <th className="px-4 py-3">Tag chuyên ngành</th>
                    {mode === "assign" && <th className="px-4 py-3 text-center">Hành động</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F4FF]">
                  {topics.map((topic) => (
                    <tr key={topic.topicCode} className="transition hover:bg-[#F8FAFF]">
                      {isMultiSelect && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[#1F3C88]/30 text-[#1F3C88] focus:ring-[#00B4D8]"
                            checked={isSelected(topic.topicCode)}
                            onChange={(event) => handleCheckboxChange(topic.topicCode, event.target.checked)}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-semibold text-[#1F3C88]">{topic.topicCode}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-[#0F1C3F]">{topic.title}</span>
                          {topic.status && (
                            <span className="inline-flex w-fit rounded-full bg-[#00B4D8]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#00B4D8]">
                              {topic.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4A5775]">
                        {topic.studentName ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-[#1F3C88]">{topic.studentName}</span>
                            {topic.studentCode && <span className="text-xs text-[#6B7A99]">{topic.studentCode}</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-[#6B7A99]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4A5775]">
                        {topic.supervisorName ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-[#1F3C88]">{topic.supervisorName}</span>
                            {topic.supervisorLecturerCode && (
                              <span className="text-xs text-[#6B7A99]">{topic.supervisorLecturerCode}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#6B7A99]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {topic.tagCodes && topic.tagCodes.length > 0 ? (
                            topic.tagCodes.map((tag, index) => (
                              <span
                                key={`${topic.topicCode}-${tag}`}
                                className="inline-flex items-center rounded-full border border-[#00B4D8]/30 bg-[#E9F9FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#00B4D8]"
                              >
                                {topic.tagDescriptions?.[index] ?? resolveTagLabel?.(tag) ?? tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#6B7A99]">Chưa có tag</span>
                          )}
                        </div>
                      </td>
                      {mode === "assign" && (
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => onAssign?.(topic)}
                            className="rounded-full bg-[#1F3C88] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-[#2C53B8]"
                          >
                            Gán nhanh
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isMultiSelect && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5ECFB] bg-[#F8FAFF] px-5 py-4">
            <span className="text-sm font-medium text-[#1F3C88]">
              Đã chọn
              <span className="mx-2 inline-flex h-6 min-w-[28px] items-center justify-center rounded-full bg-[#1F3C88] px-2 text-xs font-semibold text-white">
                {selectedTopicCodes.length}
              </span>
              đề tài
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[#1F3C88]/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#1F3C88] transition hover:border-[#1F3C88]/60"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={selectedTopicCodes.length === 0}
                onClick={onConfirmSelection}
                className="rounded-full bg-[#00B4D8] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow transition enabled:hover:bg-[#0095B5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}