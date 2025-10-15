import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
	createCommittee,
	getCommitteeCreateInit,
	getAvailableLecturers,
	getAvailableTopics,
	assignTopics,
	saveCommitteeMembers,
	committeeAssignmentApi,
} from '../../../api/committeeAssignmentApi';
import type {
	CommitteeCreateRequestDto,
	CommitteeMembersCreateRequestDto,
	CommitteeMembersUpdateRequestDto,
	CommitteeAssignmentUpdateRequest,
	AssignTopicRequestDto,
	AvailableLecturerDto,
	AvailableTopicDto,
	AssignTopicItemDto,
	CommitteeCreateInitDto,
	TagSummary,
} from '../../../api/committeeAssignmentApi';

type Step = 1 | 2 | 3;

interface BasicFormState {
	name: string;
	defenseDate: string;
	room: string;
}

const ROLE_SLOTS = [
	{ key: 'chair', label: 'Chủ tịch', role: 'Chủ tịch', required: true, isChair: true as const },
	{ key: 'secretary', label: 'Thư ký', role: 'Thư ký', required: true },
	{ key: 'reviewer', label: 'Phản biện', role: 'Phản biện', required: true },
	{ key: 'memberA', label: 'Ủy viên 1', role: 'Ủy viên', required: true },
	{ key: 'memberB', label: 'Ủy viên 2', role: 'Ủy viên', required: false },
] as const;

type RoleSlot = (typeof ROLE_SLOTS)[number];
type RoleSlotKey = RoleSlot['key'];

const buildInitialRoleSelections = (): Record<RoleSlotKey, number | ''> =>
	ROLE_SLOTS.reduce<Record<RoleSlotKey, number | ''>>((acc, slot) => {
		acc[slot.key] = '';
		return acc;
	}, {} as Record<RoleSlotKey, number | ''>);

const isDoctorDegree = (degree?: string | null): boolean => {
	if (!degree) return false;
	const normalized = degree.toLowerCase();
	return normalized.includes('tiến sĩ') || normalized.includes('ts');
};

const TIME_SLOTS = {
	morning: ["07:30", "08:30", "09:30", "10:30"],
	afternoon: ["13:30", "14:30", "15:30", "16:30"],
};

const toInputDateTime = (value?: Date | string): string => {
	if (!value) return '';
	const dt = new Date(value);
	if (Number.isNaN(dt.getTime())) return '';
	dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
	return dt.toISOString().slice(0, 16);
};

const CommitteeCreationPage: React.FC = () => {
	const [step, setStep] = useState<Step>(1);
	const [createLoading, setCreateLoading] = useState(false);
	const [memberLoading, setMemberLoading] = useState(false);
	const [assignLoading, setAssignLoading] = useState(false);
	const [initData, setInitData] = useState<CommitteeCreateInitDto | null>(null);
	const [tags, setTags] = useState<TagSummary[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [form, setForm] = useState<BasicFormState>({ name: '', defenseDate: '', room: '' });
	const [committeeCode, setCommitteeCode] = useState('');
	const [availableLecturers, setAvailableLecturers] = useState<AvailableLecturerDto[]>([]);
	const [roleSelections, setRoleSelections] = useState<Record<RoleSlotKey, number | ''>>(() => buildInitialRoleSelections());
	const [hasSavedMembers, setHasSavedMembers] = useState(false);
	const [availableTopics, setAvailableTopics] = useState<AvailableTopicDto[]>([]);
	const [topicsLoading, setTopicsLoading] = useState(false);
	const [topicPickerOpen, setTopicPickerOpen] = useState(false);
	const [assignSession, setAssignSession] = useState<number | null>(null);
	const [selectedTopicCodes, setSelectedTopicCodes] = useState<string[]>([]);
	const [selectedTopics, setSelectedTopics] = useState<AssignTopicItemDto[]>([]);
	const [hasAssignedTopics, setHasAssignedTopics] = useState(false);
	const [initialTopicCodes, setInitialTopicCodes] = useState<string[]>([]);

	useEffect(() => {
		const bootstrap = async () => {
			try {
				const res = await getCommitteeCreateInit();
						if (res.success && res.data) {
							const data = res.data;
							setInitData(data);
					setForm((prev) => ({
						...prev,
								defenseDate: toInputDateTime(data.defaultDefenseDate),
								room: data.rooms?.[0] ?? '',
					}));
				} else {
					toast.error(res.message || 'Không tải được dữ liệu khởi tạo');
				}
			} catch (error) {
				toast.error('Không tải được dữ liệu khởi tạo');
			}

			try {
				const tagRes = await committeeAssignmentApi.getTags();
				if (tagRes.success && tagRes.data) {
					setTags(tagRes.data);
				} else {
					toast.error(tagRes.message || 'Không tải được danh sách tags');
				}
			} catch (error) {
				toast.error('Không tải được danh sách tags');
			}
		};

		bootstrap();
	}, []);

	const handleFormChange = (field: keyof BasicFormState, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const toggleTag = (code: string) => {
		setSelectedTags((prev) => {
			const next = prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code];
			// fetch lecturers/topics filtered by tags immediately
			if (next.length > 0) {
				void loadLecturersByTags(next);
				// only load topics by tags if picker visible, otherwise defer until picker opens
				if (topicPickerOpen) void loadTopicsByTags(next);
			} else {
				// no tags selected: clear filters
				setAvailableLecturers([]);
				setAvailableTopics([]);
			}
			return next;
		});
	};

	// Load lecturers by tags (merge results from multiple tag queries, dedupe)
	const loadLecturersByTags = async (tagsToLoad: string[]) => {
		if (!tagsToLoad || tagsToLoad.length === 0) return;
		try {
			const calls = tagsToLoad.map((t) => getAvailableLecturers({ tag: t }));
			const results = await Promise.all(calls);
			const merged: AvailableLecturerDto[] = [];
			const seen = new Set<number>();
			for (const res of results) {
				if (res.success && res.data) {
					for (const lect of res.data) {
						if (!seen.has(lect.lecturerProfileId)) {
							seen.add(lect.lecturerProfileId);
							merged.push(lect);
						}
					}
				}
			}
			setAvailableLecturers(merged);
		} catch (error) {
			toast.error('Không tải được danh sách giảng viên theo tags');
		}
	};

	// Load available topics by tags (merge results, dedupe)
	const loadTopicsByTags = async (tagsToLoad: string[]) => {
		if (!tagsToLoad || tagsToLoad.length === 0) return;
		setTopicsLoading(true);
		try {
			const calls = tagsToLoad.map((t) => getAvailableTopics({ tag: t }));
			const results = await Promise.all(calls);
			const merged: AvailableTopicDto[] = [];
			const seen = new Set<string>();
			for (const res of results) {
				if (res.success && res.data) {
					for (const top of res.data) {
						if (!seen.has(top.topicCode)) {
							seen.add(top.topicCode);
							merged.push(top);
						}
					}
				}
			}
			setAvailableTopics(merged);
		} catch (error) {
			toast.error('Không tải được danh sách đề tài theo tags');
		} finally {
			setTopicsLoading(false);
		}
	};

	// Load lecturers: prefer tag-based filtering only. If tags are selected, merge results from tag queries.
	// If no tags are selected, fall back to fetching without filters (do NOT pass date/committeeCode/role/requireChair).
	const loadLecturers = async () => {
		try {
			if (selectedTags && selectedTags.length > 0) {
				// Delegate to tag-based loader which already merges/dedupes
				await loadLecturersByTags(selectedTags);
				return;
			}

			// No tags selected -> fetch without extra query params (server should return unfiltered list)
			const res = await getAvailableLecturers({});
			if (res.success && res.data) {
				setAvailableLecturers(res.data);
				const validIds = new Set(res.data.map((item) => item.lecturerProfileId));
				setRoleSelections((prev) => {
					let changed = false;
					const next = { ...prev };
					ROLE_SLOTS.forEach((slot) => {
						const value = next[slot.key];
						if (typeof value === 'number' && !validIds.has(value)) {
							next[slot.key] = '';
							changed = true;
						}
					});
					if (changed) {
						toast.warn('Một số lựa chọn giảng viên không còn khả dụng, vui lòng chọn lại.');
					}
					return changed ? next : prev;
				});
			} else {
				toast.error(res.message || 'Không tải được danh sách giảng viên');
			}
		} catch (error) {
			toast.error('Không tải được danh sách giảng viên');
		}
	};

	const loadTopics = async (code: string) => {
		setTopicsLoading(true);
		try {
			const res = await getAvailableTopics({ committeeCode: code });
			if (res.success && res.data) {
				setAvailableTopics(res.data);
			} else {
				toast.error(res.message || 'Không tải được danh sách đề tài');
			}
		} catch (error) {
			toast.error('Không tải được danh sách đề tài');
		} finally {
			setTopicsLoading(false);
		}
	};

		const handleCreateCommittee = async () => {
			if (!form.defenseDate) {
				toast.error('Vui lòng chọn thời gian bảo vệ');
				return;
			}
			setCreateLoading(true);
			try {
				if (committeeCode) {
					const updatePayload: CommitteeAssignmentUpdateRequest = {
						committeeCode,
						name: form.name?.trim() || null,
						defenseDate: form.defenseDate ? new Date(form.defenseDate).toISOString() : null,
						room: form.room?.trim() || null,
						tagCodes: selectedTags,
					};
					const res = await committeeAssignmentApi.updateCommittee(committeeCode, updatePayload);
					if (res.success) {
						toast.success('Đã cập nhật thông tin hội đồng');
					} else {
						toast.error(res.message || 'Không thể cập nhật hội đồng');
					}
					return;
				}

				const payload: CommitteeCreateRequestDto = {
					name: form.name?.trim() || undefined,
					defenseDate: form.defenseDate ? new Date(form.defenseDate) : undefined,
					room: form.room?.trim() || undefined,
					tagCodes: selectedTags,
					members: [],
				};
				const res = await createCommittee(payload);
				const { success, httpStatusCode, message, data } = res;
				const code = data?.committeeCode ?? initData?.nextCode ?? '';
				const isCreated = Boolean(success) || httpStatusCode === 201;

				if (isCreated) {
					if (!code) {
						toast.warn('Đã tạo hội đồng nhưng không lấy được mã. Vui lòng tải lại trang để tiếp tục.');
					}

					setCommitteeCode(code);
					setStep(2);
					setRoleSelections(
						ROLE_SLOTS.reduce<Record<string, number | ''>>((acc, slot) => {
							acc[slot.key] = '';
							return acc;
						}, {})
					);
					setHasSavedMembers(false);
					setAvailableLecturers([]);
					setHasAssignedTopics(false);
					setSelectedTopics([]);
					setInitialTopicCodes([]);
					toast.success('Đã tạo hội đồng mới');
					if (code) {
						void loadLecturers();
					}
				} else {
					toast.error(message ?? 'Không thể tạo hội đồng');
				}
			} catch (error) {
				toast.error('Không thể tạo hội đồng');
			} finally {
				setCreateLoading(false);
			}
		};

	const getLecturerByProfile = (profileId: number) =>
		availableLecturers.find((item) => item.lecturerProfileId === profileId);

	const formatLecturerLabel = (lecturer: AvailableLecturerDto) => {
		const segments = [lecturer.fullName];
		if (lecturer.degree) segments.push(lecturer.degree);
		if (lecturer.specialties) segments.push(lecturer.specialties);
		return segments.join(' • ');
	};

	const handleRoleSelectionChange = (slotKey: RoleSlotKey, value: string) => {
		setRoleSelections((prev) => ({
			...prev,
			[slotKey]: value ? Number(value) : '',
		}));
	};

	const collectSelectedMembers = () => {
		const result: { slot: RoleSlot; lecturer: AvailableLecturerDto }[] = [];
		for (const slot of ROLE_SLOTS) {
			const selection = roleSelections[slot.key];
			if (typeof selection === 'number') {
				const lecturer = getLecturerByProfile(selection);
				if (lecturer) {
					result.push({ slot, lecturer });
				}
			}
		}
		return result;
	};

	const handleSaveMembers = async () => {
		if (!committeeCode) {
			toast.error('Chưa có mã hội đồng');
			return;
		}

		const missingRequiredSlot = ROLE_SLOTS.some((slot) => slot.required && !roleSelections[slot.key]);
		if (missingRequiredSlot) {
			toast.error('Vui lòng chọn đủ 4 vị trí bắt buộc');
			return;
		}

		const selectedMembers = collectSelectedMembers();
		if (selectedMembers.length < 4) {
			toast.error('Cần tối thiểu 4 thành viên');
			return;
		}

		const chairMember = selectedMembers.find((item) => item.slot.key === 'chair');
		if (!chairMember) {
			toast.error('Phải có đúng một chủ tịch');
			return;
		}
		if (!isDoctorDegree(chairMember.lecturer.degree)) {
			toast.error('Chủ tịch phải có học vị Tiến sĩ');
			return;
		}

		const duplicates = new Set<number>();
		for (const member of selectedMembers) {
			if (duplicates.has(member.lecturer.lecturerProfileId)) {
				toast.error('Một giảng viên không thể đảm nhiệm hai vai trò');
				return;
			}
			duplicates.add(member.lecturer.lecturerProfileId);
		}

		setMemberLoading(true);
		try {
			if (hasSavedMembers) {
				const updatePayload: CommitteeMembersUpdateRequestDto = {
					committeeCode,
					members: selectedMembers.map(({ slot, lecturer }) => ({
						role: slot.role,
						lecturerCode: lecturer.lecturerCode,
					})),
				};
				const res = await committeeAssignmentApi.updateCommitteeMembers(updatePayload);
				if (res.success) {
					toast.success('Đã cập nhật thành viên hội đồng');
					setStep(3);
					void loadTopics(committeeCode);
				} else {
					toast.error(res.message || 'Không thể cập nhật thành viên');
				}
			} else {
				const createPayload: CommitteeMembersCreateRequestDto = {
					committeeCode,
					members: selectedMembers.map(({ slot, lecturer }) => ({
						lecturerProfileId: lecturer.lecturerProfileId,
						role: slot.role,
						isChair: slot.key === 'chair',
					})),
				};
				const res = await saveCommitteeMembers(createPayload);
				if (res.success) {
					toast.success('Đã lưu thành viên hội đồng');
					setHasSavedMembers(true);
					setStep(3);
					void loadTopics(committeeCode);
				} else {
					toast.error(res.message || 'Không thể lưu thành viên');
				}
			}
		} catch (error) {
			toast.error('Không thể lưu thành viên');
		} finally {
			setMemberLoading(false);
		}
	};

	// Helper: compute end time = start + 60 minutes
	const computeEndTime = (start: string) => {
		const [hh, mm] = start.split(':').map(Number);
		const date = new Date();
		date.setHours(hh, mm + 60, 0, 0);
		const h = String(date.getHours()).padStart(2, '0');
		const m = String(date.getMinutes()).padStart(2, '0');
		return `${h}:${m}`;
	};

	const handleAssignTopicsToSession = async (session: number) => {
		if (!committeeCode) return;
		// selectedTopicCodes are codes from picker
		const newCodes = selectedTopicCodes.filter(code => !selectedTopics.some(t => t.topicCode === code));
		const sessionCount = selectedTopics.filter(t => t.session === session).length;
		if (sessionCount + newCodes.length > 4) {
			toast.error('Mỗi phiên không được quá 4 đề tài');
			return;
		}
		const totalAfter = selectedTopics.length + newCodes.length;
		if (totalAfter > 8) {
			toast.error('Tổng đề tài không được quá 8');
			return;
		}

		// determine available slots for session
		const slotPool = session === 1 ? TIME_SLOTS.morning : TIME_SLOTS.afternoon;
		const usedStarts = new Set(selectedTopics.filter(t => t.session === session).map(t => t.startTime));
		const freeStarts = slotPool.filter(s => !usedStarts.has(s));
		if (newCodes.length > freeStarts.length) {
			toast.error('Không đủ khung giờ trống cho phiên này');
			return;
		}

		const toAdd: AssignTopicItemDto[] = newCodes.map((code, idx) => {
			const start = freeStarts[idx];
			return { topicCode: code, session, scheduledAt: form.defenseDate ? new Date(form.defenseDate) : undefined, startTime: start, endTime: computeEndTime(start) };
		});

		setSelectedTopics(prev => [...prev, ...toAdd]);
		setTopicPickerOpen(false);
		setAssignSession(null);
		setSelectedTopicCodes([]);
		// do not call API here — user will press "Phân công đề tài" to persist; but if already assigned, call API immediately for additions
		if (hasAssignedTopics) {
			// assign only new ones
			const payload: AssignTopicRequestDto = { committeeCode, scheduledAt: form.defenseDate ? new Date(form.defenseDate) : undefined, items: toAdd.map(t => ({ topicCode: t.topicCode, session: t.session, startTime: t.startTime || undefined, endTime: t.endTime || undefined })) };
			const res = await assignTopics(payload);
			if (res.success) {
				toast.success('Đã thêm đề tài');
				setInitialTopicCodes(prev => [...prev, ...newCodes]);
			} else {
				toast.error(res.message || 'Không thể thêm đề tài');
			}
		}
	};

	const handleRemoveTopic = async (topicCode: string) => {
		setSelectedTopics(prev => prev.filter(t => t.topicCode !== topicCode));
		setInitialTopicCodes(prev => prev.filter(c => c !== topicCode));
		if (hasAssignedTopics) {
			const res = await committeeAssignmentApi.removeAssignment(topicCode);
			if (!res.success) {
				toast.error(res.message || `Không thể hủy phân công cho đề tài ${topicCode}`);
			}
		}
	};

	const handleAssignTopics = async () => {
		if (!committeeCode) {
			toast.error('Chưa có mã hội đồng');
			return;
		}
		if (selectedTopics.length === 0) {
			toast.error('Chưa chọn đề tài');
			return;
		}

		setAssignLoading(true);
		const scheduledDate = form.defenseDate ? new Date(form.defenseDate) : undefined;
		const scheduledAtIso = scheduledDate ? scheduledDate.toISOString() : new Date().toISOString();
		try {
			if (!hasAssignedTopics) {
				const payload: AssignTopicRequestDto = {
					committeeCode,
					scheduledAt: scheduledDate,
					items: selectedTopics.map((item) => ({
						topicCode: item.topicCode,
						session: item.session,
						startTime: item.startTime || undefined,
						endTime: item.endTime || undefined,
					})),
				};
				const res = await assignTopics(payload);
				if (res.success) {
					toast.success('Đã phân công đề tài');
					setHasAssignedTopics(true);
					setInitialTopicCodes(selectedTopics.map((item) => item.topicCode));
				} else {
					toast.error(res.message || 'Không thể phân công đề tài');
				}
				return;
			}

			const currentCodes = selectedTopics.map((item) => item.topicCode);
			const removedCodes = initialTopicCodes.filter((code) => !currentCodes.includes(code));
			const addedTopics = selectedTopics.filter((item) => !initialTopicCodes.includes(item.topicCode));
			const persistedTopics = selectedTopics.filter((item) => initialTopicCodes.includes(item.topicCode));

			for (const topicCode of removedCodes) {
				const removeRes = await committeeAssignmentApi.removeAssignment(topicCode);
				if (!removeRes.success) {
					toast.error(removeRes.message || `Không thể hủy phân công cho đề tài ${topicCode}`);
					return;
				}
			}

			if (addedTopics.length > 0) {
				const assignPayload: AssignTopicRequestDto = {
					committeeCode,
					scheduledAt: scheduledDate,
					items: addedTopics.map((item) => ({
						topicCode: item.topicCode,
						session: item.session,
						startTime: item.startTime || undefined,
						endTime: item.endTime || undefined,
					})),
				};
				const assignRes = await assignTopics(assignPayload);
				if (!assignRes.success) {
					toast.error(assignRes.message || 'Không thể thêm đề tài mới');
					return;
				}
			}

			for (const topic of persistedTopics) {
				const changeRes = await committeeAssignmentApi.changeAssignment({
					committeeCode,
					topicCode: topic.topicCode,
					scheduledAt: scheduledAtIso,
					session: topic.session ?? 1,
					startTime: topic.startTime || undefined,
					endTime: topic.endTime || undefined,
				});
				if (!changeRes.success) {
					toast.error(changeRes.message || `Không thể cập nhật đề tài ${topic.topicCode}`);
					return;
				}
			}

			toast.success('Đã cập nhật phân công đề tài');
			setHasAssignedTopics(true);
			setInitialTopicCodes(currentCodes);
		} catch (error) {
			toast.error('Không thể phân công đề tài');
		} finally {
			setAssignLoading(false);
		}
	};

	const selectedProfileIds = Object.values(roleSelections).filter((value): value is number => typeof value === 'number');

		return (
			<div className="max-w-5xl mx-auto p-6 space-y-8">
				<header className="space-y-2">
					<div className="flex items-center justify-between">
						<h1 className="text-3xl font-bold text-gray-900">Thêm hội đồng mới</h1>
						<button
							type="button"
							onClick={() => window.history.back()}
							className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
						>
							Quay lại
						</button>
					</div>
					<p className="text-gray-600">Hoàn tất lần lượt 3 bước để tạo hội đồng, gán giảng viên và phân công đề tài.</p>
					<div className="flex items-center gap-2 text-sm">
					<span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Bước 1</span>
					<span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Bước 2</span>
					<span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Bước 3</span>
				</div>
			</header>

			{step === 1 && (
				<section className="space-y-6 bg-white border border-gray-200 rounded-xl p-6">
					<h2 className="text-xl font-semibold text-gray-900">Thông tin hội đồng</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">Tên hội đồng</label>
							<input
								value={form.name}
								onChange={(event) => handleFormChange('name', event.target.value)}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
								placeholder={initData?.nextCode || 'Nhập tên hội đồng'}
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">Phòng</label>
							<select
								value={form.room}
								onChange={(event) => handleFormChange('room', event.target.value)}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
							>
								<option value="">Chọn phòng</option>
								{initData?.rooms.map((room) => (
									<option key={room} value={room}>{room}</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">Thời gian bảo vệ</label>
							<input
								type="datetime-local"
								value={form.defenseDate}
								onChange={(event) => handleFormChange('defenseDate', event.target.value)}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">Mã gợi ý</label>
							<input
								value={initData?.nextCode || ''}
								readOnly
								className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-gray-600"
							/>
						</div>
					</div>

					<div className="space-y-3">
						<p className="text-sm font-medium text-gray-700">Chọn tags</p>
						<div className="flex flex-wrap gap-2">
							{tags.map((tag) => {
								const active = selectedTags.includes(tag.tagCode);
								return (
									<button
										key={tag.tagCode}
										type="button"
										onClick={() => toggleTag(tag.tagCode)}
										className={`px-3 py-1 rounded-full text-sm border ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
									>
										{tag.description || tag.tagName}
									</button>
								);
							})}
						</div>
						{selectedTags.length === 0 && <p className="text-xs text-gray-500">Bạn có thể chọn nhiều tags để gợi ý giảng viên phù hợp.</p>}
					</div>

					<div className="flex justify-end">
						<button
							onClick={handleCreateCommittee}
							disabled={createLoading}
							className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
						>
							{createLoading ? 'Đang tạo...' : 'Tạo hội đồng'}
						</button>
					</div>
				</section>
			)}

			{step === 2 && (
				<section className="space-y-6 bg-white border border-gray-200 rounded-xl p-6">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-gray-900">Chọn thành viên hội đồng</h2>
						<span className="text-sm text-gray-500">Mã hội đồng: {committeeCode}</span>
					</div>
					<p className="text-sm text-gray-600">
						Yêu cầu tối thiểu 4 thành viên (Chủ tịch, Thư ký, Phản biện, Ủy viên 1). Ủy viên 2 là tùy chọn.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{ROLE_SLOTS.map((slot) => {
							const selection = roleSelections[slot.key];
							const selectedId = typeof selection === 'number' ? selection : undefined;
							const selectedLecturer = selectedId ? getLecturerByProfile(selectedId) : undefined;
							const disabledIds = selectedProfileIds.filter((id) => id !== selectedId);
							return (
								<div key={slot.key} className="border border-gray-200 rounded-lg p-4 space-y-3">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-gray-900">{slot.label}</span>
										{!slot.required && <span className="text-xs text-gray-500">(Tùy chọn)</span>}
									</div>
									<select
										className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500 text-sm"
										value={selectedId ? String(selectedId) : ''}
										onChange={(event) => handleRoleSelectionChange(slot.key, event.target.value)}
									>
										<option value="">Chưa chọn</option>
										{availableLecturers.map((lecturer) => {
											const usedElsewhere = disabledIds.includes(lecturer.lecturerProfileId);
											const chairRestricted = slot.key === 'chair' && !isDoctorDegree(lecturer.degree);
											return (
												<option
													key={lecturer.lecturerProfileId}
													value={lecturer.lecturerProfileId}
													disabled={usedElsewhere || chairRestricted}
												>
													{formatLecturerLabel(lecturer)}
												</option>
											);
										})}
									</select>
									{slot.key === 'chair' && availableLecturers.every((lecturer) => !isDoctorDegree(lecturer.degree)) && (
										<p className="text-xs text-red-500">Chưa có giảng viên Tiến sĩ phù hợp để làm Chủ tịch.</p>
									)}
									{selectedLecturer && (
										<div className="text-xs text-gray-600 space-y-1">
											<p>Học vị: {selectedLecturer.degree || 'Chưa cập nhật'}</p>
											<p>Chuyên ngành: {selectedLecturer.specialties || 'Không có dữ liệu'}</p>
										</div>
									)}
								</div>
							);
						})}
					</div>

					<div className="border-t border-gray-200 pt-4 space-y-3">
						<h3 className="text-lg font-medium text-gray-800">Danh sách giảng viên khả dụng</h3>
						<div className="space-y-3">
							{availableLecturers.map((lecturer) => {
								const isDoctor = isDoctorDegree(lecturer.degree);
								const assignedSlot = ROLE_SLOTS.find((slot) => {
									const selection = roleSelections[slot.key];
									return typeof selection === 'number' && selection === lecturer.lecturerProfileId;
								});
								return (
									<div key={lecturer.lecturerProfileId} className="border border-gray-200 rounded-lg p-4">
										<div className="flex items-center justify-between">
											<p className="font-semibold text-gray-900">{lecturer.fullName}</p>
											{assignedSlot && <span className="text-xs text-blue-600">Đang giữ vị trí: {assignedSlot.label}</span>}
										</div>
										<p className="text-sm text-gray-600">Học vị: {lecturer.degree || 'Chưa cập nhật'}</p>
										<p className="text-sm text-gray-600">Chuyên ngành: {lecturer.specialties || 'Không có dữ liệu'}</p>
										<p className="text-xs text-gray-500">Định mức: {lecturer.currentDefenseLoad}/{lecturer.defenseQuota}</p>
										{assignedSlot?.key === 'chair' && !isDoctor && (
											<p className="text-xs text-red-500">Cần chọn giảng viên Tiến sĩ cho vị trí Chủ tịch.</p>
										)}
									</div>
								);
							})}
							{availableLecturers.length === 0 && <p className="text-sm text-gray-500">Không có giảng viên phù hợp.</p>}
						</div>
					</div>

					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={() => setStep(1)}
							className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
						>
							Quay lại
						</button>
						<button
							type="button"
							onClick={handleSaveMembers}
							disabled={memberLoading}
							className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
						>
							{memberLoading ? 'Đang lưu...' : hasSavedMembers ? 'Cập nhật thành viên' : 'Lưu thành viên'}
						</button>
					</div>
				</section>
			)}

			{step === 3 && (
				<section className="space-y-6 bg-white border border-gray-200 rounded-xl p-6">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-gray-900">Phân công đề tài</h2>
						<span className="text-sm text-gray-500">Mã hội đồng: {committeeCode}</span>
					</div>

					{/* Show topics for both sessions */}
					{[1, 2].map((session) => {
						const sessionTopics = selectedTopics.filter((t) => t.session === session);
						return (
							<div key={session} className="mb-6">
								<div className="flex items-center justify-between mb-2">
									<h3 className="text-md font-semibold text-[#1F3C88]">Phiên {session}</h3>
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() => { setTopicPickerOpen(true); setAssignSession(session); setSelectedTopicCodes([]); void loadTopics(committeeCode); }}
											className="rounded-full bg-[#00B4D8] px-3 py-1 text-xs font-semibold text-white"
										>
											Thêm đề tài vào Phiên {session}
										</button>
									</div>
								</div>
								<div className="space-y-2">
									{sessionTopics.map((topic) => (
										<div key={topic.topicCode} className="flex items-center justify-between p-3 bg-gray-50 rounded">
											<div>
												<div className="font-semibold">{availableTopics.find(a => a.topicCode === topic.topicCode)?.title || topic.topicCode}</div>
												<div className="text-sm text-gray-600">{topic.startTime} - {topic.endTime}</div>
											</div>
											<button
												onClick={() => {
												// remove topic by code
												handleRemoveTopic(topic.topicCode);
												}
											}
											className="text-red-600 hover:text-red-800"
											>
												Xóa
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
										onClick={() => handleAssignTopicsToSession(assignSession)}
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
																	const checked = (e.target as HTMLInputElement).checked;
																	setSelectedTopicCodes(prev => checked ? [...prev, topic.topicCode] : prev.filter(c => c !== topic.topicCode));
																}}
															/>
														</td>
														<td className="px-4 py-3 font-semibold text-[#1F3C88]">{topic.topicCode}</td>
														<td className="px-4 py-3">
															<div className="flex flex-col gap-1">
																<span className="font-medium text-[#0F1C3F]">{topic.title}</span>
																{topic.status && (
																	<span className="inline-flex w-fit rounded-full bg-[#00B4D8]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#00B4D8]">{topic.status}</span>
																	)}
															</div>
														</td>
														<td className="px-4 py-3 text-sm text-[#4A5775]">{topic.studentName ? (<div className="flex flex-col"><span className="font-medium text-[#1F3C88]">{topic.studentName}</span>{topic.studentCode && <span className="text-xs text-[#6B7A99]">{topic.studentCode}</span>}</div>) : (<span className="text-xs text-[#6B7A99]">—</span>)}</td>
														<td className="px-4 py-3 text-sm text-[#4A5775]">{topic.supervisorName ? (<div className="flex flex-col"><span className="font-medium text-[#1F3C88]">{topic.supervisorName}</span>{(topic as any).supervisorCode && (<span className="text-xs text-[#6B7A99]">{(topic as any).supervisorCode}</span>)}</div>) : (<span className="text-xs text-[#6B7A99]">—</span>)}</td>
														<td className="px-4 py-3"><div className="flex flex-wrap gap-2">{(topic.tags && topic.tags.length > 0) ? (topic.tags as string[]).map((tag: string, index: number) => (<span key={`${topic.topicCode}-${tag}`} className="inline-flex items-center rounded-full border border-[#00B4D8]/30 bg-[#E9F9FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#00B4D8]">{topic.tagDescriptions?.[index] ?? tag}</span>)) : (<span className="text-xs text-[#6B7A99]">Chưa có tag</span>)}</div></td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							)}
						</div>
					)}

					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={() => setStep(2)}
							className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
						>
							Quay lại
						</button>
						<button
							type="button"
							onClick={handleAssignTopics}
							disabled={assignLoading}
							className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
						>
							{assignLoading ? 'Đang phân công...' : 'Phân công đề tài'}
						</button>
					</div>
				</section>
			)}
		</div>
	);
};

export default CommitteeCreationPage;
