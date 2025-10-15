import React, { useMemo } from "react";
import { ModalShell } from "./ModalShell";
import type { EligibleTopicSummary } from "../../../../services/committee-management.service";

type CommitteeRoleKey = "chair" | "reviewer1" | "reviewer2" | "secretary";

interface WizardStepOneForm {
  committeeCode: string;
  name: string;
  room: string;
  defenseDate: string;
  notes: string;
}

interface WizardLecturerOption {
  lecturerProfileId: number;
  lecturerCode: string;
  lecturerName: string;
  degree?: string | null;
  specialties?: string | null;
  specialtyCode?: string | null;
  availability?: boolean;
  isEligibleChair?: boolean;
}

interface WizardMemberForm {
  roleKey: CommitteeRoleKey;
  role: string;
  label: string;
  description: string;
  isChair: boolean;
  lecturerProfileId?: number;
  lecturerCode?: string;
  lecturerName?: string;
  degree?: string | null;
  isEligibleChair?: boolean;
}

interface WizardState {
  loading: boolean;
  step: 1 | 2 | 3;
  stepOne: WizardStepOneForm;
  members: WizardMemberForm[];
  availableLecturers: WizardLecturerOption[];
  tagCodes: string[];
  availableTags: { tagCode: string; tagName: string; description?: string | null }[];
  tagDescriptions: Record<string, string>;
  selectedTopics: EligibleTopicSummary[];
  creationInFlight: boolean;
}

interface CreationWizardProps {
  wizard: WizardState;
  setWizard: React.Dispatch<React.SetStateAction<WizardState>>;
  closeWizard: () => void;
  goNextStep: () => void;
  goPrevStep: () => void;
  assignLecturer: (roleKey: CommitteeRoleKey, lecturerCode: string) => void;
  clearLecturer: (roleKey: CommitteeRoleKey) => void;
  toggleTag: (tagCode: string) => void;
  removeTopic: (topicCode: string) => void;
  openEligibleModal: () => void;
  submitWizard: () => void | Promise<void>;
  getTagLabel: (tagCode: string) => string;
  asPage?: boolean;
}

function Stepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-4">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full border-4 ${
              currentStep === step ? "border-[#00B4D8] bg-[#1F3C88] text-white" : "border-[#D9E1F2] bg-white text-[#1F3C88]"
            }`}
          >
            {step}
          </div>
          {step !== 3 && <div className="h-0.5 w-24 bg-gradient-to-r from-[#1F3C88] to-[#00B4D8]" />}
        </React.Fragment>
      ))}
    </div>
  );
}

export function CreationWizard({
  wizard,
  setWizard,
  closeWizard,
  goNextStep,
  goPrevStep,
  assignLecturer,
  clearLecturer,
  toggleTag,
  removeTopic,
  openEligibleModal,
  submitWizard,
  getTagLabel,
  asPage = false,
}: CreationWizardProps) {
  const assignedCodes = useMemo(
    () => new Set(wizard.members.map((member) => member.lecturerCode).filter(Boolean) as string[]),
    [wizard.members]
  );

  const canProceedStepTwo = useMemo(
    () => wizard.members.every((member) => Boolean(member.lecturerProfileId)),
    [wizard.members]
  );

  const content = (
    <>
      {wizard.loading ? (
        <p className="text-[#1F3C88]">Đang lấy dữ liệu khởi tạo...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <Stepper currentStep={wizard.step} />

          {wizard.step === 1 && (
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-[#1F253D]">
                Mã hội đồng
                <input
                  type="text"
                  value={wizard.stepOne.committeeCode}
                  disabled
                  className="rounded-xl border border-[#D9E1F2] bg-[#F0F4FF] px-3 py-2 text-sm font-semibold text-[#1F3C88]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#1F253D]">
                Tên hội đồng
                <input
                  type="text"
                  value={wizard.stepOne.name}
                  onChange={(event) =>
                    setWizard((prev) => ({ ...prev, stepOne: { ...prev.stepOne, name: event.target.value } }))
                  }
                  placeholder="Nhập tên hội đồng"
                  className="rounded-xl border border-[#D9E1F2] px-3 py-2 text-sm text-[#1F253D] focus:border-[#1F3C88] focus:outline-none transition-colors"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#1F253D]">
                Phòng bảo vệ
                <input
                  type="text"
                  value={wizard.stepOne.room}
                  onChange={(event) =>
                    setWizard((prev) => ({ ...prev, stepOne: { ...prev.stepOne, room: event.target.value } }))
                  }
                  placeholder="Ví dụ: A101"
                  className="rounded-xl border border-[#D9E1F2] px-3 py-2 text-sm text-[#1F253D] focus:border-[#1F3C88] focus:outline-none transition-colors"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#1F253D]">
                Ngày bảo vệ dự kiến
                <input
                  type="date"
                  value={wizard.stepOne.defenseDate}
                  onChange={(event) =>
                    setWizard((prev) => ({ ...prev, stepOne: { ...prev.stepOne, defenseDate: event.target.value } }))
                  }
                  className="rounded-xl border border-[#D9E1F2] px-3 py-2 text-sm text-[#1F253D] focus:border-[#1F3C88] focus:outline-none transition-colors"
                />
              </label>
              <label className="md:col-span-2 flex flex-col gap-2 text-sm font-medium text-[#1F253D]">
                Ghi chú
                <textarea
                  value={wizard.stepOne.notes}
                  onChange={(event) =>
                    setWizard((prev) => ({ ...prev, stepOne: { ...prev.stepOne, notes: event.target.value } }))
                  }
                  rows={4}
                  placeholder="Ghi chú về hội đồng, ví dụ: ưu tiên đề tài thuộc khối AI"
                  className="rounded-xl border border-[#D9E1F2] px-3 py-2 text-sm text-[#1F253D] focus:border-[#1F3C88] focus:outline-none transition-colors resize-none"
                />
              </label>
              <div className="md:col-span-2">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#6B7A99]">Tag chuyên ngành</p>
                {wizard.availableTags.length === 0 ? (
                  <p className="text-sm text-[#6B7A99]">Không có tag chuyên ngành khả dụng</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {wizard.availableTags.map((tag) => {
                      const checked = wizard.tagCodes.includes(tag.tagCode);
                      return (
                        <button
                          key={tag.tagCode}
                          type="button"
                          onClick={() => toggleTag(tag.tagCode)}
                          className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${
                            checked ? "bg-[#00B4D8] text-white shadow-md" : "bg-[#F0F4FF] text-[#1F3C88] hover:bg-[#E3ECFF]"
                          }`}
                        >
                          {tag.description || tag.tagName}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {wizard.step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              {wizard.members.map((member) => {
                const availableOptions = wizard.availableLecturers.filter((lecturer) => {
                  if (member.lecturerCode && lecturer.lecturerCode === member.lecturerCode) return true;
                  const alreadyAssignedElsewhere = assignedCodes.has(lecturer.lecturerCode);
                  if (alreadyAssignedElsewhere) return false;
                  if (member.isChair && !lecturer.isEligibleChair) return false;
                  return true;
                });

                return (
                  <div key={member.roleKey} className="rounded-2xl border border-[#D9E1F2] bg-white p-4 shadow-sm">
                    <header className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7A99]">{member.label}</p>
                        <p className="text-sm text-[#1F253D]">{member.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => clearLecturer(member.roleKey)}
                        className="text-xs font-semibold uppercase text-[#6B7A99] hover:text-[#1F3C88]"
                        disabled={!member.lecturerCode}
                      >
                        Gỡ
                      </button>
                    </header>
                    <div className="mt-3">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7A99]">Chọn giảng viên</label>
                      <select
                        value={member.lecturerCode ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (!value) clearLecturer(member.roleKey);
                          else assignLecturer(member.roleKey, value);
                        }}
                        className="mt-2 w-full rounded-xl border border-[#D9E1F2] px-3 py-2 text-sm text-[#1F253D] focus:border-[#1F3C88] focus:outline-none"
                      >
                        <option value="">-- Chọn giảng viên --</option>
                        {availableOptions.map((lecturer) => (
                          <option key={lecturer.lecturerCode} value={lecturer.lecturerCode}>
                            {lecturer.lecturerName}
                            {lecturer.degree ? ` (${lecturer.degree})` : ""}
                          </option>
                        ))}
                      </select>
                      {member.isChair && member.lecturerCode && !member.isEligibleChair && (
                        <p className="mt-2 text-xs text-[#D9480F]">Giảng viên này chưa đủ điều kiện làm Chủ tịch, hãy chọn người khác.</p>
                      )}
                      {member.lecturerName && (
                        <div className="mt-3 rounded-xl bg-[#F5F7FB] p-3 text-xs text-[#4A5775]">
                          <p className="font-semibold text-[#1F3C88]">{member.lecturerName}</p>
                          <p>{member.lecturerCode}</p>
                          {member.degree && <p>Học vị: {member.degree}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {wizard.step === 3 && (
            <div className="flex flex-col gap-4">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7A99]">Đề tài liên quan</p>
                  <h3 className="text-lg font-semibold text-[#1F253D]">Gắn đề tài phù hợp với tag chuyên ngành của hội đồng</h3>
                </div>
                <button
                  type="button"
                  onClick={openEligibleModal}
                  className="rounded-full border border-[#1F3C88] px-4 py-1 text-xs font-semibold uppercase text-[#1F3C88] hover:bg-[#1F3C88]/5 transition-colors"
                >
                  Chọn đề tài
                </button>
              </header>
              <div className="flex flex-col gap-3">
                {wizard.selectedTopics.length === 0 ? (
                  <p className="text-sm text-[#6B7A99]">Chưa chọn đề tài nào. Bạn có thể chọn từ danh sách đề tài đủ điều kiện hoặc thực hiện sau.</p>
                ) : (
                  wizard.selectedTopics.map((topic) => (
                    <TopicCard key={topic.topicCode} topic={topic} removeTopic={removeTopic} getTagLabel={getTagLabel} />
                  ))
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={closeWizard}
              className="rounded-full border border-[#D9E1F2] px-4 py-2 text-sm font-semibold text-[#1F3C88] hover:bg-[#F8FAFF] transition-colors"
            >
              Đóng
            </button>
            <div className="flex items-center gap-3">
              {wizard.step > 1 && (
                <button
                  type="button"
                  onClick={goPrevStep}
                  className="rounded-full border border-[#1F3C88] px-4 py-2 text-sm font-semibold text-[#1F3C88] hover:bg-[#1F3C88]/5 transition-colors"
                >
                  Quay lại bước {wizard.step - 1}
                </button>
              )}

              {wizard.step < 3 ? (
                <button
                  type="button"
                  onClick={goNextStep}
                  disabled={wizard.step === 2 && !canProceedStepTwo}
                  className="rounded-full bg-[#1F3C88] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#2c53b8] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Tiếp tục bước {wizard.step + 1}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitWizard}
                  disabled={wizard.creationInFlight}
                  className="rounded-full bg-[#1F3C88] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#2c53b8] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {wizard.creationInFlight ? "Đang tạo..." : "Hoàn tất tạo hội đồng"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (!asPage) {
    return (
      <ModalShell
        onClose={closeWizard}
        title="Tạo mới hội đồng"
        subtitle={
          wizard.step === 1
            ? "Bước 1: Nhập thông tin cơ bản"
            : wizard.step === 2
              ? "Bước 2: Phân công vai trò thành viên"
              : "Bước 3: Gắn đề tài cho hội đồng"
        }
        wide
      >
        {content}
      </ModalShell>
    );
  }

  // asPage === true -> render the inner content inside a page container
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#6B7A99]">Tạo hội đồng mới</p>
          <h1 className="mt-1 text-2xl font-bold text-[#1F3C88]">Bộ công cụ tạo hội đồng</h1>
        </div>
        <div>
          <button
            type="button"
            onClick={closeWizard}
            className="px-4 py-2 rounded-full border border-[#D9E1F2] bg-white text-[#1F3C88]"
          >
            Quay lại
          </button>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">{content}</div>
    </div>
  );
}

function TopicCard({
  topic,
  removeTopic,
  getTagLabel,
}: {
  topic: EligibleTopicSummary;
  removeTopic: (topicCode: string) => void;
  getTagLabel: (tagCode: string) => string;
}) {
  return (
    <div className="rounded-2xl border border-[#1F3C88] bg-[#1F3C88]/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1F3C88]">
            {topic.topicCode}
            {typeof topic.selectedSession === "number" && (
              <span className="ml-2 inline-flex items-center rounded-full bg-[#E8EEFF] px-2 py-0.5 text-[10px] font-semibold text-[#1F3C88]">
                Phiên {topic.selectedSession}
              </span>
            )}
          </p>
          <h4 className="text-sm font-semibold text-[#1F253D]">{topic.title}</h4>
          {topic.studentName && (
            <p className="mt-1 text-xs text-[#4A5775]">
              {topic.studentName} · {topic.studentCode}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => removeTopic(topic.topicCode)}
          className="text-xs font-semibold uppercase text-[#1F3C88] hover:text-[#0F1C3F] transition-colors"
        >
          Gỡ
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {topic.tagCodes?.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#00B4D8]/10 px-3 py-1 text-xs font-semibold uppercase text-[#00B4D8] border border-[#00B4D8]/20"
          >
            {getTagLabel(tag)}
          </span>
        ))}
      </div>
    </div>
  );
}