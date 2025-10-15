import React from "react";
import { ModalShell } from "./ModalShell";
import type { EligibleTopicSummary } from "../../../../services/committee-management.service";
import type { CommitteeAssignmentListItem } from "../../../../api/committeeAssignmentApi";

interface AssignTopicModalProps {
  topic: EligibleTopicSummary;
  committees: CommitteeAssignmentListItem[];
  onClose: () => void;
  onSubmit: (payload: {
    committeeCode: string;
    scheduledAt: string;
    session: number;
    startTime?: string;
    endTime?: string;
  }) => void;
}

export function AssignTopicModal({ topic, committees, onClose, onSubmit }: AssignTopicModalProps) {
  const [selectedCommittee, setSelectedCommittee] = React.useState<string>("");
  const [scheduledAt, setScheduledAt] = React.useState<string>("");
  const [overrideDate, setOverrideDate] = React.useState<boolean>(false);
  const [session, setSession] = React.useState<number>(1);
  const [startTime, setStartTime] = React.useState<string>("");
  const [endTime, setEndTime] = React.useState<string>("");

  const handleSubmit = () => {
    if (!selectedCommittee) return;
    onSubmit({
      committeeCode: selectedCommittee,
      scheduledAt,
      session,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    });
  };

  return (
    <ModalShell onClose={onClose} title="Gán đề tài vào hội đồng" subtitle="Chọn hội đồng và thời gian để gán đề tài này.">
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-[#E5ECFB] bg-white p-4">
          <p className="text-sm font-semibold text-[#1F253D]">{topic.title}</p>
          <p className="text-xs text-[#6B7A99]">{topic.topicCode}</p>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[#1F253D]">Chọn hội đồng</span>
          <select
            value={selectedCommittee}
            onChange={(e) => setSelectedCommittee(e.target.value)}
            className="rounded-xl border border-[#D9E1F2] px-3 py-2"
          >
            <option value="">-- Chọn hội đồng --</option>
            {committees.map((c) => (
              <option key={c.committeeCode} value={c.committeeCode}>
                {c.committeeCode} - {c.name}
              </option>
            ))}
          </select>
        </label>
        {/* By default we use the selected committee's defenseDate. Allow optional override. */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-[#1F253D]">Ngày bảo vệ</span>
            <div className="mt-1 text-sm text-[#4A5775]">
              {selectedCommittee
                ? (committees.find(c => c.committeeCode === selectedCommittee)?.defenseDate ?? "(Chưa có)")
                : "Chưa chọn hội đồng"
              }
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#6B7A99]">Ghi đè ngày</label>
            <input type="checkbox" checked={overrideDate} onChange={(e) => setOverrideDate(e.target.checked)} />
          </div>
        </div>
        {overrideDate && (
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#1F253D]">Ngày (ghi đè)</span>
            <input
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-xl border border-[#D9E1F2] px-3 py-2"
            />
          </label>
        )}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[#1F253D]">Phiên</span>
          <input
            type="number"
            min="1"
            value={session}
            onChange={(e) => setSession(Number(e.target.value))}
            className="rounded-xl border border-[#D9E1F2] px-3 py-2"
          />
        </label>
        <div className="flex gap-2">
          <label className="flex flex-col gap-2 flex-1">
            <span className="text-sm font-medium text-[#1F253D]">Thời gian bắt đầu</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-xl border border-[#D9E1F2] px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-2 flex-1">
            <span className="text-sm font-medium text-[#1F253D]">Thời gian kết thúc</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-xl border border-[#D9E1F2] px-3 py-2"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-[#D9E1F2] px-4 py-2">
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedCommittee || !scheduledAt}
            className="rounded-full bg-[#FF6B35] px-4 py-2 text-white disabled:opacity-50"
          >
            Gán
          </button>
        </div>
      </div>
    </ModalShell>
  );
}