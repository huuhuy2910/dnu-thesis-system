import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers3, Plus, RefreshCw } from "lucide-react";
import { useToast } from "../../../context/useToast";
import {
  committeeAssignmentApi,
} from "../../../api/committeeAssignmentApi";
import { committeeService, type EligibleTopicSummary } from "../../../services/committee-management.service";
import type {
  CommitteeAssignmentAutoAssignCommittee,
  CommitteeAssignmentAutoAssignRequest,
  CommitteeAssignmentDefenseItem,
  CommitteeAssignmentListItem,
} from "../../../api/committeeAssignmentApi";

// Shared UI constant and types used by multiple helpers in this module
const PRIMARY_COLOR = "#1F3C88";

interface FilterState {
  search: string;
  defenseDate: string;
  specialty: string;
  term: string;
  status: string;
}

interface StatsSnapshot {
  totalCommittees: number;
  eligibleTopics: number;
  assignedTopics: number;
  nextSession: {
    committeeCode: string;
    defenseDate?: string | null;
    room?: string | null;
    startTime?: string | null;
    topicCount?: number;
  } | null;
}

// Import components
import { ModalShell } from "./components/ModalShell";
import { EligibleTopicModal } from "./components/EligibleTopicModal";
import { StatsSection } from "./components/StatsSection";
import { FilterBar } from "./components/FilterBar";
import { CommitteeTable } from "./components/CommitteeTable";
import { AssignTopicModal } from "./components/AssignTopicModal";
import { AutoAssignModal } from "./components/AutoAssignModal";
import { CommitteeDetail } from "./components/CommitteeDetail";

const CommitteeManagement = () => {
  const pageSize = 10;

  // UI state
  const [page, setPage] = useState<number>(1);
  const [tableLoading, setTableLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ search: "", defenseDate: "", specialty: "", term: "", status: "" });
  const [committeeRows, setCommitteeRows] = useState<CommitteeAssignmentListItem[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [stats, setStats] = useState<StatsSnapshot>({ totalCommittees: 0, eligibleTopics: 0, assignedTopics: 0, nextSession: null });

  // modal / transient state
  const defaultModalState = useMemo(() => ({ eligibleTopics: false, assignTopic: false, autoAssign: false }), []);
  const [modals, setModals] = useState(defaultModalState);
  const [assigningTopic, setAssigningTopic] = useState<EligibleTopicSummary | null>(null);
  const [autoAssignResult, setAutoAssignResult] = useState<CommitteeAssignmentAutoAssignCommittee[] | null>(null);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);

  // eligible topic list state
  const [eligibleTopicList, setEligibleTopicList] = useState<EligibleTopicSummary[]>([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [eligibleMode, setEligibleMode] = useState<"assign" | "multi-select">("assign");
  const [eligibleSelectedCodes, setEligibleSelectedCodes] = useState<string[]>([]);
  const eligibleConfirmRef = useRef<(topics: EligibleTopicSummary[]) => void>(() => {});

  // cached helpers and tag dictionary
  const cachedTags = useRef<{ tagCode: string; tagName: string; description?: string | null }[] | null>(null);
  const cachedTagDictionary = useRef<Record<string, { name: string; description?: string | null }>>({});
  const [tagDictionary, setTagDictionary] = useState<Record<string, { name: string; description?: string | null }>>({});

  // detail view state
  const [detailCommitteeCode, setDetailCommitteeCode] = useState<string | null>(null);
  const [showingDetail, setShowingDetail] = useState(false);

  // delete state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { addToast } = useToast();
  const closeAllModals = useCallback(() => {
    setModals(defaultModalState);
    setAssigningTopic(null);
    setAutoAssignResult(null);
    setEligibleSelectedCodes([]);
    eligibleConfirmRef.current = () => {};
  }, [defaultModalState]);

  const openAutoAssignModal = useCallback(() => {
    setAutoAssignResult(null);
    setModals((prev) => ({ ...prev, autoAssign: true }));
  }, []);

  const refreshStats = useCallback(
    async (signal?: AbortSignal) => {
      setTableLoading(true);
      try {
        const [listResponse, eligibleCount] = await Promise.all([
          committeeAssignmentApi.listCommittees({
            page,
            pageSize,
            search: filters.search,
            defenseDate: filters.defenseDate || undefined,
          }, { signal }),
          committeeService.eligibleTopicCount({ signal }),
        ]);

        if (signal?.aborted) return;

        if (listResponse?.success && listResponse.data) {
          setCommitteeRows(listResponse.data.items ?? []);
          setTotalRows(listResponse.data.totalCount ?? 0);

          const assignedTopicSum = (listResponse.data.items ?? []).reduce(
            (sum, item) => sum + (item.topicCount ?? 0),
            0
          );

          const nextSession = computeNextSessionCandidate(listResponse.data.items ?? []);
          let nextSessionEnriched: StatsSnapshot["nextSession"] = nextSession;

          if (nextSession?.defenseDate) {
            try {
              const detail = await committeeAssignmentApi.getCommitteeDetail(nextSession.committeeCode, { signal });
              if (!signal?.aborted && detail?.success && detail.data) {
                const soonest = extractSoonestAssignment(detail.data.assignments);
                const baseTopicCount = detail.data.assignments?.length ?? nextSession?.topicCount ?? 0;

                nextSessionEnriched = {
                  committeeCode: detail.data.committeeCode,
                  defenseDate:
                    soonest?.scheduledAt ?? detail.data.defenseDate ?? nextSession?.defenseDate ?? null,
                  room: soonest?.room ?? detail.data.room ?? nextSession?.room ?? null,
                  startTime: soonest?.startTime ?? undefined,
                  topicCount: baseTopicCount,
                };
              }
            } catch (detailError) {
              console.warn("Unable to enrich next session", detailError);
            }
          }

          setStats({
            totalCommittees: listResponse.data.totalCount ?? 0,
            eligibleTopics: eligibleCount,
            assignedTopics: assignedTopicSum,
            nextSession: nextSessionEnriched,
          });
        }
      } catch (error) {
        if (!signal?.aborted) {
          console.error("Không thể tải dữ liệu hội đồng", error);
        }
      } finally {
        if (!signal?.aborted) {
          setTableLoading(false);
        }
      }
    },
    [filters.defenseDate, filters.search, page, pageSize]
  );

  useEffect(() => {
    const controller = new AbortController();
    refreshStats(controller.signal);
    return () => controller.abort();
  }, [refreshStats]);

  useEffect(() => {
    const controller = new AbortController();
    if (cachedTags.current) {
      setTagDictionary(cachedTagDictionary.current);
    } else {
      committeeAssignmentApi
        .getTags({ signal: controller.signal })
        .then((response) => {
          if (!response?.success || !response.data) return;
          const dictionary: Record<string, { name: string; description?: string | null }> = {};
          response.data.forEach((tag) => {
            dictionary[tag.tagCode] = { name: tag.tagName, description: tag.description };
          });
          cachedTags.current = response.data.map((tag) => ({
            tagCode: tag.tagCode,
            tagName: tag.tagName,
            description: tag.description,
          }));
          cachedTagDictionary.current = dictionary;
          setTagDictionary(dictionary);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          console.warn("Không thể tải danh sách tag", error);
        });
    }
    return () => controller.abort();
  }, []);

  const closeEligibleModal = useCallback(() => {
    setModals((prev) => ({ ...prev, eligibleTopics: false }));
    setEligibleSelectedCodes([]);
    eligibleConfirmRef.current = () => {};
  }, []);

  const openEligibleModal = useCallback(
    async (config: { mode?: "assign" | "multi-select"; initialSelectedCodes?: string[]; onConfirm?: (topics: EligibleTopicSummary[]) => void } = {}) => {
      const desiredMode = config.mode ?? "assign";
      setEligibleMode(desiredMode);
      setEligibleSelectedCodes(config.initialSelectedCodes ?? []);
      eligibleConfirmRef.current = config.onConfirm ?? (() => {});

      setEligibleLoading(true);
      setModals((prev) => ({ ...prev, eligibleTopics: true }));
      try {
        const topics = await committeeService.eligibleTopicSummaries();
        setEligibleTopicList(topics);
      } catch (error) {
        console.error("Không thể lấy danh sách đề tài đủ điều kiện", error);
        setEligibleTopicList([]);
      } finally {
        setEligibleLoading(false);
      }
    },
    []
  );

  const handleToggleEligibleTopic = useCallback((topicCode: string, checked: boolean) => {
    setEligibleSelectedCodes((prev) => {
      if (checked) {
        if (prev.includes(topicCode)) return prev;
        return [...prev, topicCode];
      }
      return prev.filter((code) => code !== topicCode);
    });
  }, []);

  const handleConfirmEligibleTopics = useCallback(() => {
    const selectedSet = new Set(eligibleSelectedCodes);
    const selectedTopics = eligibleTopicList.filter((topic) => selectedSet.has(topic.topicCode));
    eligibleConfirmRef.current(selectedTopics);
    eligibleConfirmRef.current = () => {};
    closeEligibleModal();
  }, [eligibleSelectedCodes, eligibleTopicList, closeEligibleModal]);

  const openDetailView = useCallback(
    async (committeeCode: string) => {
      setDetailCommitteeCode(committeeCode);
      setShowingDetail(true);
    },
    []
  );

  const closeDetailView = useCallback(() => {
    setShowingDetail(false);
    setDetailCommitteeCode(null);
  }, []);

  const handleRefreshClick = useCallback(() => {
    const controller = new AbortController();
    refreshStats(controller.signal);
  }, [refreshStats]);

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    []
  );

  const assignedTopicsPercent = useMemo(() => {
    if (!stats.eligibleTopics) return 0;
    const pct = (stats.assignedTopics / stats.eligibleTopics) * 100;
    return Math.min(100, Math.round(pct));
  }, [stats.assignedTopics, stats.eligibleTopics]);

  const handlePageChange = useCallback((direction: "next" | "prev") => {
    setPage((prev) => {
      if (direction === "prev") {
        return Math.max(1, prev - 1);
      }
      const maxPage = Math.max(1, Math.ceil(totalRows / pageSize));
      return Math.min(maxPage, prev + 1);
    });
  }, [pageSize, totalRows]);

  const navigate = useNavigate();
  const openWizard = useCallback(() => {
    // navigate to the dedicated creation page instead of opening the modal
    navigate('/admin/committees/create');
  }, [navigate]);
  const getTagLabel = useCallback(
    (tagCode: string) => {
      const entry = tagDictionary[tagCode];
      return entry?.description || entry?.name || tagCode;
    },
    [tagDictionary]
  );

  const submitAutoAssign = useCallback(
    async (request: CommitteeAssignmentAutoAssignRequest) => {
      setAutoAssignLoading(true);
      try {
        const response = await committeeAssignmentApi.autoAssignTopics(request);
        if (!response?.success || !response.data) {
          throw new Error(response?.message || "Không thể tự động phân công");
        }
        setAutoAssignResult(response.data.committees ?? []);
        handleRefreshClick();
      } catch (error) {
        console.error(error);
      } finally {
        setAutoAssignLoading(false);
      }
    },
    [handleRefreshClick]
  );

  const beginManualAssign = useCallback((topic: EligibleTopicSummary) => {
    setAssigningTopic(topic);
    setModals((prev) => ({ ...prev, assignTopic: true }));
  }, []);

  const submitManualAssign = useCallback(
    async (payload: {
      committeeCode: string;
      scheduledAt: string;
      session: number;
      startTime?: string;
      endTime?: string;
    }) => {
      if (!assigningTopic) return;
      try {
        const response = await committeeAssignmentApi.assignTopics({
          committeeCode: payload.committeeCode,
          scheduledAt: payload.scheduledAt,
          session: payload.session,
          items: [
            {
              topicCode: assigningTopic.topicCode,
              startTime: payload.startTime,
              endTime: payload.endTime,
            },
          ],
        });

        if (!response?.success) {
          throw new Error(response?.message || "Không thể gán đề tài");
        }

        closeAllModals();
        handleRefreshClick();
      } catch (error) {
        console.error(error);
      }
    },
    [assigningTopic, closeAllModals, handleRefreshClick]
  );

  return (
    <div className="min-h-screen bg-[#F5F7FB] py-10">
      {showingDetail && detailCommitteeCode ? (
        <CommitteeDetail committeeCode={detailCommitteeCode} onClose={closeDetailView} />
      ) : (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6">
          <HeaderSection
            onRefresh={handleRefreshClick}
            openWizard={openWizard}
            openAutoAssign={openAutoAssignModal}
          />
          <StatsSection
            stats={stats}
            assignedTopicsPercent={assignedTopicsPercent}
            onOpenEligible={() => openEligibleModal({ mode: "assign" })}
          />
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearchChange={(value) => handleFilterChange("search", value)}
          />
          <CommitteeTable
            data={committeeRows}
            loading={tableLoading}
            page={page}
            pageSize={pageSize}
            total={totalRows}
            onPageChange={handlePageChange}
            onViewDetail={openDetailView}
            onDelete={(committeeCode: string) => setDeleteTarget(committeeCode)}
            resolveTagLabel={getTagLabel}
          />
        </div>
      )}

      {modals.eligibleTopics && (
        <EligibleTopicModal
          topics={eligibleTopicList}
          loading={eligibleLoading}
          mode={eligibleMode}
          onClose={closeEligibleModal}
          onAssign={eligibleMode === "assign" ? beginManualAssign : undefined}
          onToggleTopic={eligibleMode === "multi-select" ? handleToggleEligibleTopic : undefined}
          onConfirmSelection={eligibleMode === "multi-select" ? handleConfirmEligibleTopics : undefined}
          selectedTopicCodes={eligibleMode === "multi-select" ? eligibleSelectedCodes : []}
          resolveTagLabel={getTagLabel}
        />
      )}

        {deleteTarget && (
          <ModalShell
            onClose={() => setDeleteTarget(null)}
            title="Xác nhận xóa hội đồng"
            subtitle={`Bạn có chắc muốn xóa hội đồng ${deleteTarget}? Hành động này không thể hoàn tác.`}
          >
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[#4A5775]">Hành động sẽ xóa toàn bộ thông tin liên quan đến hội đồng này. Vui lòng xác nhận.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border border-[#D9E1F2] px-4 py-2">Hủy</button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    if (!deleteTarget) return;
                    setDeleting(true);
                    try {
                      const res = await committeeAssignmentApi.deleteCommittee(deleteTarget, true);
                      if (res?.success) {
                        await refreshStats();
                        addToast(`Đã xóa hội đồng ${deleteTarget}`, "success");
                        setDeleteTarget(null);
                      } else {
                        throw new Error(res?.message || "Xóa thất bại");
                      }
                    } catch (err: unknown) {
                      console.error('Delete committee failed', err);
                      addToast((err as Error)?.message ?? "Xóa thất bại", "error");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="rounded-full bg-[#FF6B35] px-4 py-2 text-white"
                >
                  {deleting ? 'Đang xóa...' : 'Xóa hội đồng'}
                </button>
              </div>
            </div>
          </ModalShell>
        )}

      {modals.assignTopic && assigningTopic && (
        <AssignTopicModal
          topic={assigningTopic}
          committees={committeeRows}
          onClose={closeAllModals}
          onSubmit={submitManualAssign}
        />
      )}

      {modals.autoAssign && (
        <AutoAssignModal
          loading={autoAssignLoading}
          result={autoAssignResult}
          committees={committeeRows}
          onSubmit={submitAutoAssign}
          onClose={closeAllModals}
        />
      )}

      {/* CreationWizard moved to its own page: /admin/committees/create */}
    </div>
  );
};

export default CommitteeManagement;

function HeaderSection({
  onRefresh,
  openWizard,
  openAutoAssign,
}: {
  onRefresh: () => void | Promise<void>;
  openWizard: () => void | Promise<void>;
  openAutoAssign: () => void | Promise<void>;
}) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: PRIMARY_COLOR }}
          >
            Hệ thống quản trị FIT - Đại học Đại Nam
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#0F1C3F]">
            Quản lý và phân công Hội đồng bảo vệ đồ án tốt nghiệp
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-full border border-[#D9E1F2] bg-white px-4 py-2 text-sm font-semibold text-[#FF6B35] shadow-sm transition hover:border-[#FF6B35] hover:text-[#FF6B35]"
          >
            <RefreshCw size={16} /> Tải lại dữ liệu
          </button>
          <button
            type="button"
            onClick={openAutoAssign}
            className="flex items-center gap-2 rounded-full border border-[#1F3C88] bg-[#1F3C88]/10 px-4 py-2 text-sm font-semibold text-[#1F3C88] shadow-sm transition hover:bg-[#1F3C88]/20"
          >
            <Layers3 size={16} /> Tự động phân công
          </button>
          <button
            type="button"
            onClick={openWizard}
            className="flex items-center gap-2 rounded-full bg-[#FF6B35] px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#E55A2B]"
          >
            <Plus size={18} className="text-white" /> Tạo hội đồng mới
          </button>
        </div>
      </div>

    </header>
  );
}









// Removed CommitteeDetailModal as it's replaced by CommitteeDetail component

function extractSoonestAssignment(
  assignments?: CommitteeAssignmentDefenseItem[] | null
): CommitteeAssignmentDefenseItem | null {
  if (!assignments || assignments.length === 0) {
    return null;
  }
  const sorted = [...assignments].sort((a, b) => {
    const dateA = new Date(a.scheduledAt ?? "").getTime();
    const dateB = new Date(b.scheduledAt ?? "").getTime();
    return dateA - dateB;
  });
  return sorted[0] ?? null;
}

function computeNextSessionCandidate(items: CommitteeAssignmentListItem[]): StatsSnapshot["nextSession"] {
  const upcoming = items
    .filter((item) => item.defenseDate)
    .map((item) => ({
      committeeCode: item.committeeCode,
      defenseDate: item.defenseDate,
      room: item.room,
      topicCount: item.topicCount ?? 0,
    }))
    .sort((a, b) => new Date(a.defenseDate ?? "").getTime() - new Date(b.defenseDate ?? "").getTime());

  return upcoming[0] ?? null;
}
