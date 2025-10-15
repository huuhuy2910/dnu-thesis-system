import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Save, Trash2, Trash } from "lucide-react";
import { useToast } from "../../../../context/useToast";
import { committeeAssignmentApi } from "../../../../api/committeeAssignmentApi";
import { committeeService, type EligibleTopicSummary } from "../../../../services/committee-management.service";
import type { CommitteeAssignmentDetail, CommitteeAssignmentAvailableLecturer } from "../../../../api/committeeAssignmentApi";
import { EligibleTopicModal } from "./EligibleTopicModal";
import { ModalShell } from "./ModalShell";

interface CommitteeDetailProps {
  committeeCode: string;
  onClose: () => void;
}

const ROLE_CONFIG = [
  { key: "chair", label: "Chủ tịch", role: "Chủ tịch" },
  { key: "secretary", label: "Thư ký", role: "Thư ký" },
  { key: "reviewer1", label: "Phản biện 1", role: "Phản biện 1" },
  { key: "reviewer2", label: "Phản biện 2", role: "Phản biện 2" },
];

export function CommitteeDetail({ committeeCode, onClose }: CommitteeDetailProps) {
  const { addToast } = useToast();
  const [data, setData] = useState<CommitteeAssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    members: false,
    sessions: false,
  });

  // Form states
  const [infoForm, setInfoForm] = useState({ name: "", room: "" });
  const [membersForm, setMembersForm] = useState<Record<string, string>>({});
  const [availableLecturers, setAvailableLecturers] = useState<CommitteeAssignmentAvailableLecturer[]>([]);
  
  // Topic assignment states
  // topicPickerOpen is kept for backward compatibility for single-assign flows, but
  // we'll render the multi-select panel inline in the Sessions section.
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<EligibleTopicSummary[]>([]);
  const [selectedTopicCodes, setSelectedTopicCodes] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  // Which session we're assigning to (1 or 2) when opening the picker
  const [assignSession, setAssignSession] = useState<1 | 2 | null>(null);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [removeTopicConfirm, setRemoveTopicConfirm] = useState<{ open: boolean; topicCode?: string }>({ open: false });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await committeeAssignmentApi.getCommitteeDetail(committeeCode);
      if (response.success && response.data) {
        setData(response.data);
        setInfoForm({
          name: response.data.name || "",
          room: response.data.room || "",
        });
        // Initialize members form
        const membersMap: Record<string, string> = {};
        response.data.members.forEach(member => {
          const roleKey = ROLE_CONFIG.find(r => r.role === member.role)?.key;
          if (roleKey) {
            membersMap[roleKey] = member.lecturerCode;
          }
        });
        setMembersForm(membersMap);
      }
    } catch {
      addToast("Lỗi tải dữ liệu hội đồng", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, committeeCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadAvailableLecturers = async () => {
    try {
      const response = await committeeAssignmentApi.getAvailableLecturers();
      if (response.success) {
        setAvailableLecturers(response.data || []);
      }
    } catch {
      addToast("Lỗi tải danh sách giảng viên", "error");
    }
  };

  const loadAvailableTopics = async () => {
    if (!data) return;
    setTopicsLoading(true);
    try {
      const topics = await committeeService.eligibleTopicSummaries();
      // Filter out topics already assigned to this committee
      const assignedTopicCodes = new Set(
        data.sessions.flatMap(session => session.topics.map(topic => topic.topicCode))
      );
      const filteredTopics = topics.filter(topic => !assignedTopicCodes.has(topic.topicCode));
      setAvailableTopics(filteredTopics);
      setSelectedTopicCodes([]);
    } catch {
      addToast("Lỗi tải danh sách đề tài", "error");
    } finally {
      setTopicsLoading(false);
    }
  };

  const handleAssignTopics = async (session: 1 | 2) => {
    if (selectedTopicCodes.length === 0) return;
    
    if (!data) return;

    // Validation: per-session capacity (max 4 topics per session)
    const currentSessionTopics = data.sessions.find(s => s.session === session)?.topics || [];
    if (currentSessionTopics.length + selectedTopicCodes.length > 4) {
      addToast(`Phiên ${session} chỉ có thể có tối đa 4 đề tài`, "error");
      return;
    }

    // Validation: per-day capacity (max 8 topics per committee per day)
    const totalCurrent = data.sessions.flatMap(s => s.topics).length;
    if (totalCurrent + selectedTopicCodes.length > 8) {
      addToast("Một hội đồng chỉ có tối đa 8 đề tài mỗi ngày (4 đề tài/phiên)", "error");
      return;
    }

    if (!data) return;
    
    try {
      setSaving(true);
      const selectedTopics = availableTopics.filter(topic => selectedTopicCodes.includes(topic.topicCode));
      
      // Assign topics with automatic time slots
      const TIME_SLOTS = {
        morning: ["07:30", "08:30", "09:30", "10:30"],
        afternoon: ["13:30", "14:30", "15:30", "16:30"],
      };
      
      const slots = session === 1 ? TIME_SLOTS.morning : TIME_SLOTS.afternoon;
      const startIndex = currentSessionTopics.length;
      
      const assignRequest = {
        committeeCode: data.committeeCode,
        scheduledAt: data.defenseDate || new Date().toISOString().split('T')[0],
        session,
        items: selectedTopics.map((topic, index) => {
          const slotIndex = startIndex + index;
          return {
            topicCode: topic.topicCode,
            startTime: slots[slotIndex] ? `${slots[slotIndex]}:00` : null,
            endTime: slots[slotIndex + 1] ? `${slots[slotIndex + 1]}:00` : (session === 1 ? "11:30:00" : "17:30:00"),
          };
        }),
      };

      const response = await committeeAssignmentApi.assignTopics(assignRequest);
      if (response.success) {
        addToast(`Đã thêm ${selectedTopics.length} đề tài vào phiên ${session}`, "success");
        loadData(); // Refresh data
        setTopicPickerOpen(false);
        setAssignSession(null);
        setSelectedTopicCodes([]);
      } else {
        addToast("Lỗi phân công đề tài", "error");
      }
    } catch {
      addToast("Lỗi phân công đề tài", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCommittee = async () => {
    if (!data) return;
    
    try {
      setSaving(true);
      const response = await committeeAssignmentApi.deleteCommittee(data.committeeCode, true);
      if (response.success) {
        addToast("Đã xóa hội đồng thành công", "success");
        onClose(); // Close the detail view
      } else {
        addToast("Lỗi xóa hội đồng", "error");
      }
    } catch {
      addToast("Lỗi xóa hội đồng", "error");
    } finally {
      setSaving(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!data) return;
    try {
      setSaving(true);
      const request = {
        committeeCode: data.committeeCode,
        name: infoForm.name || null,
        room: infoForm.room || null,
      };
      const response = await committeeAssignmentApi.updateCommittee(data.committeeCode, request);
      if (response.success) {
        addToast("Cập nhật thông tin thành công", "success");
        loadData();
      } else {
        addToast("Lỗi cập nhật thông tin", "error");
      }
    } catch {
      addToast("Lỗi cập nhật thông tin", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMembers = async () => {
    if (!data) return;

    // Validation: Check for duplicate lecturers
    const selectedLecturers = Object.values(membersForm).filter(code => code);
    const uniqueLecturers = new Set(selectedLecturers);
    if (selectedLecturers.length !== uniqueLecturers.size) {
      addToast("Không được gán cùng một giảng viên cho nhiều vai trò", "error");
      return;
    }

    // Validation: Chairman must be PhD
    const chairLecturerCode = membersForm.chair;
    if (chairLecturerCode) {
      const chairLecturer = availableLecturers.find(l => l.lecturerCode === chairLecturerCode);
      if (chairLecturer && chairLecturer.degree !== "Tiến sĩ") {
        addToast("Chủ tịch hội đồng phải là Tiến sĩ", "error");
        return;
      }
    }

    try {
      setSaving(true);
      const members = ROLE_CONFIG.map(role => ({
        role: role.role,
        lecturerCode: membersForm[role.key] || "",
      })).filter(m => m.lecturerCode);

      const request = {
        committeeCode: data.committeeCode,
        members,
      };
      const response = await committeeAssignmentApi.updateCommitteeMembers(request);
      if (response.success) {
        addToast("Cập nhật thành viên thành công", "success");
        loadData();
      } else {
        addToast("Lỗi cập nhật thành viên", "error");
      }
    } catch {
      addToast("Lỗi cập nhật thành viên", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTopic = async (topicCode: string) => {
    setRemoveTopicConfirm({ open: true, topicCode });
  };

  const confirmRemoveTopic = async () => {
    const topicCode = removeTopicConfirm.topicCode;
    if (!topicCode) return setRemoveTopicConfirm({ open: false });
    try {
      const response = await committeeAssignmentApi.removeAssignment(topicCode);
      if (response.success) {
        addToast("Gỡ đề tài thành công", "success");
        loadData();
      } else {
        addToast("Lỗi gỡ đề tài", "error");
      }
    } catch {
      addToast("Lỗi gỡ đề tài", "error");
    } finally {
      setRemoveTopicConfirm({ open: false });
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-[#1F3C88]">Đang tải...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">Không tìm thấy dữ liệu hội đồng</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1F3C88]">Chi tiết hội đồng: {data.committeeCode}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <Trash size={16} />
            Xóa hội đồng
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-lg border border-[#D9E1F2] shadow-sm">
        <button
          onClick={() => toggleSection("info")}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h2 className="text-lg font-semibold text-[#1F3C88]">Thông tin chung</h2>
          {expandedSections.info ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {expandedSections.info && (
          <div className="p-4 border-t border-[#E5ECFB] space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B7A99]">Mã hội đồng</label>
                <input
                  type="text"
                  value={data.committeeCode}
                  readOnly
                  className="w-full px-3 py-2 border border-[#D9E1F2] rounded bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7A99]">Tên hội đồng</label>
                <input
                  type="text"
                  value={infoForm.name}
                  onChange={(e) => setInfoForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#D9E1F2] rounded focus:ring-2 focus:ring-[#1F3C88]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7A99]">Ngày bảo vệ</label>
                <input
                  type="text"
                  value={data.defenseDate || ""}
                  readOnly
                  className="w-full px-3 py-2 border border-[#D9E1F2] rounded bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7A99]">Phòng</label>
                <input
                  type="text"
                  value={infoForm.room}
                  onChange={(e) => setInfoForm(prev => ({ ...prev, room: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#D9E1F2] rounded focus:ring-2 focus:ring-[#1F3C88]"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                data.status === "Sắp diễn ra" ? "bg-green-100 text-green-800" :
                data.status === "Đang diễn ra" ? "bg-blue-100 text-blue-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {data.status || "Chưa xác định"}
              </span>
              <button
                onClick={handleSaveInfo}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#1F3C88] text-white rounded hover:bg-[#0F1C3F] disabled:opacity-50"
              >
                <Save size={16} />
                Lưu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-lg border border-[#D9E1F2] shadow-sm">
        <button
          onClick={() => {
            toggleSection("members");
            if (!expandedSections.members) loadAvailableLecturers();
          }}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h2 className="text-lg font-semibold text-[#1F3C88]">Thành viên hội đồng</h2>
          {expandedSections.members ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {expandedSections.members && (
          <div className="p-4 border-t border-[#E5ECFB] space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {ROLE_CONFIG.map(role => (
                <div key={role.key}>
                  <label className="block text-sm font-medium text-[#6B7A99]">{role.label}</label>
                  <select
                    value={membersForm[role.key] || ""}
                    onChange={(e) => setMembersForm(prev => ({ ...prev, [role.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#D9E1F2] rounded focus:ring-2 focus:ring-[#1F3C88]"
                  >
                    <option value="">Chọn giảng viên</option>
                    {availableLecturers.map(lecturer => (
                      <option key={lecturer.lecturerCode} value={lecturer.lecturerCode}>
                        {lecturer.fullName} ({lecturer.degree})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveMembers}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#1F3C88] text-white rounded hover:bg-[#0F1C3F] disabled:opacity-50"
              >
                <Save size={16} />
                Lưu thành viên
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sessions Section */}
      <div className="bg-white rounded-lg border border-[#D9E1F2] shadow-sm">
        <button
          onClick={() => {
            toggleSection("sessions");
            if (!expandedSections.sessions) loadAvailableLecturers();
          }}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h2 className="text-lg font-semibold text-[#1F3C88]">Đề tài theo phiên</h2>
          {expandedSections.sessions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {expandedSections.sessions && (
          <div className="p-4 border-t border-[#E5ECFB]">
            <div className="flex space-x-4 mb-4">
              {[1, 2].map(session => {
                const sessionTopics = data.sessions.find(s => s.session === session)?.topics || [];
                const isFull = sessionTopics.length >= 4;
                return (
                  <button
                    key={session}
                    className={`px-4 py-2 rounded ${
                      isFull
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-[#1F3C88] text-white hover:bg-[#0F1C3F]"
                    }`}
                    disabled={isFull}
                    onClick={() => {
                        // Open inline picker below sessions and set target session
                        setAssignSession(session as 1 | 2);
                        // ensure topics are loaded and selection is fresh
                        loadAvailableTopics();
                        // open inline panel by toggling a state; re-use topicPickerOpen
                        setTopicPickerOpen(true);
                    }}
                  >
                    Phiên {session} ({sessionTopics.length}/4)
                  </button>
                );
              })}
            </div>
            {/* Show topics for both sessions */}
            {[1, 2].map(session => {
              const sessionTopics = data.sessions.find(s => s.session === session)?.topics || [];
              return (
                <div key={session} className="mb-6">
                  <h3 className="text-md font-semibold text-[#1F3C88] mb-2">Phiên {session}</h3>
                  <div className="space-y-2">
                    {sessionTopics.map(topic => (
                      <div key={topic.topicCode} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-semibold">{topic.title}</div>
                          <div className="text-sm text-gray-600">{topic.startTime} - {topic.endTime}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveTopic(topic.topicCode)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {sessionTopics.length === 0 && (
                      <p className="text-sm text-gray-500 italic">Chưa có đề tài</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Inline eligible topics panel (shown when topicPickerOpen and assignSession is set) */}
            {topicPickerOpen && assignSession && (
              <div className="rounded-2xl border border-[#D9E1F2] bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-[#1F3C88]">Đề tài đủ điều kiện</h4>
                    <p className="text-xs text-[#6B7A99]">Chọn đề tài và bấm "Gán vào Phiên {assignSession}"</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTopicPickerOpen(false);
                        setAssignSession(null);
                        setSelectedTopicCodes([]);
                      }}
                      className="rounded-full border border-[#D9E1F2] px-3 py-1 text-xs text-[#1F3C88]"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      disabled={selectedTopicCodes.length === 0}
                      onClick={() => handleAssignTopics(assignSession)}
                      className="rounded-full bg-[#00B4D8] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Gán vào Phiên {assignSession} ({selectedTopicCodes.length})
                    </button>
                  </div>
                </div>

                {topicsLoading && <p className="text-[#1F3C88]">Đang tải đề tài...</p>}
                {!topicsLoading && availableTopics.length === 0 && (
                  <p className="text-sm text-[#6B7A99]">Không có đề tài đủ điều kiện để chọn.</p>
                )}

                {!topicsLoading && availableTopics.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-[#E5ECFB]">
                    <div className="max-h-[360px] overflow-y-auto">
                      <table className="min-w-full divide-y divide-[#E5ECFB] text-left text-sm text-[#1F253D]">
                        <thead className="bg-[#F5F8FF] text-xs font-semibold uppercase tracking-wider text-[#1F3C88]">
                          <tr>
                            <th className="px-4 py-3">Chọn</th>
                            <th className="px-4 py-3">Mã đề tài</th>
                            <th className="px-4 py-3">Tên đề tài</th>
                            <th className="px-4 py-3">Sinh viên</th>
                            <th className="px-4 py-3">Giảng viên hướng dẫn</th>
                            <th className="px-4 py-3">Tag chuyên ngành</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F4FF]">
                          {availableTopics.map((topic) => (
                            <tr key={topic.topicCode} className="transition hover:bg-[#F8FAFF]">
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-[#1F3C88]/30 text-[#1F3C88] focus:ring-[#00B4D8]"
                                  checked={selectedTopicCodes.includes(topic.topicCode)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedTopicCodes(prev =>
                                      checked ? [...prev, topic.topicCode] : prev.filter(c => c !== topic.topicCode)
                                    );
                                  }}
                                />
                              </td>
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
                                        {topic.tagDescriptions?.[index] ?? tag}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-[#6B7A99]">Chưa có tag</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Topic Picker Modal */}
      {topicPickerOpen && (
        <EligibleTopicModal
          topics={availableTopics}
          loading={topicsLoading}
          mode="multi-select"
          onClose={() => {
            setTopicPickerOpen(false);
            setAssignSession(null);
            setSelectedTopicCodes([]);
          }}
          onToggleTopic={(topicCode, checked) => {
            setSelectedTopicCodes(prev => 
              checked 
                ? [...prev, topicCode] 
                : prev.filter(code => code !== topicCode)
            );
          }}
          onConfirmSelection={() => {
            if (!assignSession) return;
            handleAssignTopics(assignSession);
          }}
          selectedTopicCodes={selectedTopicCodes}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <ModalShell
          onClose={() => setDeleteConfirmOpen(false)}
          title="Xác nhận xóa hội đồng"
        >
          <div className="p-6">
            <p className="text-sm text-[#4A5775] mb-6">
              Bạn có chắc muốn xóa hội đồng <strong>{data.committeeCode}</strong>? 
              Hành động này không thể hoàn tác và sẽ xóa toàn bộ thông tin liên quan đến hội đồng này.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-[#D9E1F2] rounded text-[#6B7A99] hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteCommittee}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Đang xóa..." : "Xóa hội đồng"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Remove topic confirmation modal */}
      {removeTopicConfirm.open && (
        <ModalShell onClose={() => setRemoveTopicConfirm({ open: false })} title="Xác nhận gỡ đề tài">
          <div className="p-6">
            <p className="text-sm text-[#4A5775] mb-6">Bạn có chắc muốn gỡ đề tài <strong>{removeTopicConfirm.topicCode}</strong> khỏi hội đồng? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setRemoveTopicConfirm({ open: false })} className="px-4 py-2 border border-[#D9E1F2] rounded text-[#6B7A99] hover:bg-gray-50">Hủy</button>
              <button type="button" onClick={() => confirmRemoveTopic()} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{saving ? 'Đang gỡ...' : 'Gỡ đề tài'}</button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}