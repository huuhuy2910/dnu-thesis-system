import { ModalShell } from "./ModalShell";
import type { CommitteeAssignmentAutoAssignCommittee, CommitteeAssignmentAutoAssignRequest, CommitteeAssignmentListItem } from "../../../../api/committeeAssignmentApi";

interface AutoAssignModalProps {
  loading: boolean;
  result: CommitteeAssignmentAutoAssignCommittee[] | null;
  committees: CommitteeAssignmentListItem[];
  onSubmit: (data: CommitteeAssignmentAutoAssignRequest) => void;
  onClose: () => void;
}

export function AutoAssignModal({ loading, result, committees, onSubmit, onClose }: AutoAssignModalProps) {
  const handleSubmit = () => {
    const committeeCodes = committees.map(c => c.committeeCode);
    onSubmit({ committeeCodes });
  };

  return (
    <ModalShell onClose={onClose} title="Tự động phân công" subtitle="Phân công đề tài vào hội đồng tự động.">
      <div className="flex flex-col gap-4">
        {loading && <p>Đang xử lý...</p>}
        {!loading && result && <p>Kết quả: {JSON.stringify(result)}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-[#D9E1F2] px-4 py-2">
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-full bg-[#FF6B35] px-4 py-2 text-white"
          >
            Chạy tự động
          </button>
        </div>
      </div>
    </ModalShell>
  );
}