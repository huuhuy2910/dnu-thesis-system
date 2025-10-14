import React, { useState, useEffect, useCallback } from "react";
import /* useNavigate */ "react-router-dom";
import { fetchData } from "../../api/fetchData";
import { useAuth } from "../../hooks/useAuth";
import type { ApiResponse } from "../../types/api";
import type {
  CatalogTopicSpecialty,
  LecturerSpecialty,
} from "../../types/specialty";
import type { TopicFormData } from "../../types/topic";
import type { CatalogTopic } from "../../types/catalog-topic";
import type { LecturerProfile } from "../../types/lecturer-profile";
import type { Department } from "../../types/department";
import type { Specialty } from "../../types/specialty-type";
import type { StudentProfile } from "../../types/studentProfile";
import type { Topic } from "../../types/topic";
import {
  BookOpen,
  FileText,
  User as PersonIcon,
  Building,
  GraduationCap,
  Users,
  CheckCircle,
} from "lucide-react";

const TopicRegistration: React.FC = () => {
  const auth = useAuth();
  // navigate removed; we now show a success modal instead of navigating
  const userCode = auth.user?.userCode;
  const [registrationType, setRegistrationType] = useState<"catalog" | "self">(
    "catalog"
  );
  const [catalogTopics, setCatalogTopics] = useState<CatalogTopic[]>([]);
  const [lecturers, setLecturers] = useState<LecturerProfile[]>([]);
  const [filteredLecturers, setFilteredLecturers] = useState<LecturerProfile[]>(
    []
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialtyInfo, setSelectedSpecialtyInfo] =
    useState<Specialty | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [existingTopic, setExistingTopic] = useState<Topic | null>(null);

  const [formData, setFormData] = useState<TopicFormData>({
    topicCode: "",
    title: "",
    summary: "",
    type: "CATALOG",
    catalogTopicID: null,
    supervisorLecturerProfileID: null,
    departmentID: null,
    specialtyID: null,
  });

  // Fetch initial data
  // Extracted loader so we can call it again when refreshing UI after success
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [catalogRes, lecturerRes, departmentRes, specialtyRes] =
        await Promise.all([
          fetchData("/CatalogTopics/get-list?AssignedStatus=Ch%C6%B0a%20giao"),
          fetchData("/LecturerProfiles/get-list"),
          fetchData("/Departments/get-list"),
          fetchData("/Specialties/get-list"),
        ]);

      setCatalogTopics((catalogRes as ApiResponse<CatalogTopic[]>)?.data || []);
      setLecturers((lecturerRes as ApiResponse<LecturerProfile[]>)?.data || []);

      setDepartments((departmentRes as ApiResponse<Department[]>)?.data || []);
      setSpecialties((specialtyRes as ApiResponse<Specialty[]>)?.data || []);

      // Fetch topic code template
      try {
        const templateRes = await fetchData("/Topics/get-create");
        const templateData = (templateRes as ApiResponse)?.data as Record<
          string,
          unknown
        >;
        if (templateData?.topicCode) {
          setFormData((prev) => ({
            ...prev,
            topicCode: templateData.topicCode as string,
          }));
        }
      } catch (err) {
        console.error("Error fetching topic code template:", err);
      }

      // Check if student already has a pending or approved topic
      if (userCode) {
        try {
          const topicsRes = await fetchData(
            `/Topics/get-list?ProposerUserCode=${userCode}`
          );
          const topics = (topicsRes as ApiResponse<Topic[]>)?.data || [];
          const existingTopic = topics.find(
            (topic) =>
              topic.status === "Đang chờ" ||
              topic.status === "Đã duyệt" ||
              topic.status === "Đã chấp nhận"
          );
          if (existingTopic) {
            setExistingTopic(existingTopic);
          } else {
            setExistingTopic(null);
          }
        } catch (err) {
          console.error("Error checking existing topics:", err);
        }
      }
    } catch (err) {
      setError("Không thể tải dữ liệu ban đầu");
      console.error("Error fetching initial data:", err);
    } finally {
      setLoading(false);
    }
  }, [userCode]);

  const handleContinueAfterSuccess = async () => {
    // Close modal and refresh data and form
    setShowSuccessModal(false);
    setSuccess(null);
    // reload initial data (topics, lecturers, etc.)
    await loadInitialData();
    // reset form to initial state
    setFormData({
      topicCode: formData.topicCode,
      title: "",
      summary: "",
      type: "CATALOG",
      catalogTopicID: null,
      supervisorLecturerProfileID: null,
      departmentID: null,
      specialtyID: null,
    });
    setRegistrationType("catalog");
    setSelectedSpecialtyInfo(null);
    setFilteredLecturers([]);
  };

  useEffect(() => {
    void loadInitialData();
  }, [userCode, loadInitialData]);

  // Handle registration type change
  const handleRegistrationTypeChange = (type: "catalog" | "self") => {
    setRegistrationType(type);
    setFormData({
      ...formData,
      type: type === "catalog" ? "CATALOG" : "SELF",
      catalogTopicID: type === "catalog" ? formData.catalogTopicID : null,
      title: type === "catalog" ? formData.title : "",
      summary: type === "catalog" ? formData.summary : "",
      specialtyID: type === "catalog" ? formData.specialtyID : null,
      supervisorLecturerProfileID: null, // Reset lecturer selection
    });

    // Reset filtered data when switching types
    if (type === "self") {
      setSelectedSpecialtyInfo(null);
      setFilteredLecturers([]);
    }
  };

  // Filter lecturers based on selected specialty for self-proposed topics
  useEffect(() => {
    if (registrationType === "self" && formData.specialtyID) {
      const filterLecturersForSpecialty = async () => {
        try {
          const selectedSpecialty = specialties.find(
            (s) => s.specialtyID === formData.specialtyID
          );
          if (!selectedSpecialty) return;

          // Get lecturer specialties for this specialty
          const lecturerSpecialtiesRes = await fetchData(
            `/LecturerSpecialties/get-list?SpecialtyCode=${selectedSpecialty.specialtyCode}`
          );
          const lecturerSpecialties =
            (lecturerSpecialtiesRes as ApiResponse<LecturerSpecialty[]>)
              ?.data || [];

          // Filter lecturers who can guide this specialty
          const specialtyLecturerCodes = lecturerSpecialties.map(
            (ls) => ls.lecturerCode
          );
          const availableLecturers = lecturers.filter((l) =>
            specialtyLecturerCodes.includes(l.lecturerCode)
          );

          setFilteredLecturers(availableLecturers);
          setSelectedSpecialtyInfo(selectedSpecialty);
        } catch (err) {
          console.error("Error filtering lecturers for specialty:", err);
        }
      };

      void filterLecturersForSpecialty();
    } else if (registrationType === "self" && !formData.specialtyID) {
      setFilteredLecturers([]);
      setSelectedSpecialtyInfo(null);
    }
  }, [registrationType, formData.specialtyID, specialties, lecturers]);

  // Handle catalog topic selection
  const handleCatalogTopicChange = async (catalogTopicID: number) => {
    const selectedTopic = catalogTopics.find(
      (t) => t.catalogTopicID === catalogTopicID
    );
    if (!selectedTopic) return;

    try {
      // Step 1: Get catalog topic specialties
      const catalogTopicSpecialtiesRes = await fetchData(
        `/CatalogTopicSpecialties/get-list?CatalogTopicCode=${selectedTopic.catalogTopicCode}`
      );
      const catalogTopicSpecialties =
        (catalogTopicSpecialtiesRes as ApiResponse<CatalogTopicSpecialty[]>)
          ?.data || [];

      if (catalogTopicSpecialties.length === 0) {
        setError("Đề tài này chưa có thông tin chuyên ngành");
        return;
      }

      // Get the first specialty (assuming one topic has one specialty)
      const specialtyCode = catalogTopicSpecialties[0].specialtyCode;

      // Step 2: Get specialty details
      const specialtyRes = await fetchData(
        `/Specialties/get-list?SpecialtyCode=${specialtyCode}`
      );
      const specialtyData =
        (specialtyRes as ApiResponse<Specialty[]>)?.data || [];

      if (specialtyData.length === 0) {
        setError("Không tìm thấy thông tin chuyên ngành");
        return;
      }

      const specialtyInfo = specialtyData[0];

      // Step 3: Get lecturers for this specialty
      const lecturerSpecialtiesRes = await fetchData(
        `/LecturerSpecialties/get-list?SpecialtyCode=${specialtyCode}`
      );
      const lecturerSpecialties =
        (lecturerSpecialtiesRes as ApiResponse<LecturerSpecialty[]>)?.data ||
        [];

      // Filter lecturers who can guide this specialty
      const specialtyLecturerCodes = lecturerSpecialties.map(
        (ls) => ls.lecturerCode
      );
      const availableLecturers = lecturers.filter((l) =>
        specialtyLecturerCodes.includes(l.lecturerCode)
      );

      // Update state
      setSelectedSpecialtyInfo(specialtyInfo);
      setFilteredLecturers(availableLecturers);

      // Update form data
      setFormData({
        ...formData,
        catalogTopicID,
        title: selectedTopic.title,
        summary: selectedTopic.summary,
        specialtyID: specialtyInfo.specialtyID,
        supervisorLecturerProfileID: null, // Reset lecturer selection
      });

      setError(null); // Clear any previous errors
    } catch (err) {
      setError("Có lỗi khi tải thông tin đề tài");
      console.error("Error loading topic details:", err);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // First get the create template
      const createTemplate = await fetchData("/Topics/get-create");

      // Prepare the payload
      const templateData =
        ((createTemplate as ApiResponse)?.data as Record<string, unknown>) ||
        {};

      // Get additional data for payload
      const selectedLecturer = lecturers.find(
        (l) => l.lecturerProfileID === formData.supervisorLecturerProfileID
      );
      const selectedDepartment = departments.find(
        (d) => d.departmentID === formData.departmentID
      );
      const selectedSpecialty = specialties.find(
        (s) => s.specialtyID === formData.specialtyID
      );
      const selectedCatalogTopic = catalogTopics.find(
        (c) => c.catalogTopicID === formData.catalogTopicID
      );

      // Backend will resolve supervisorUserID from supervisorUserCode
      const supervisorUserID = 0;

      // Get student profile for proposer
      let proposerStudentProfileID = 0;
      let proposerStudentCode = "";
      if (auth.user?.userCode) {
        try {
          const studentRes = await fetchData(
            `/StudentProfiles/get-list?UserCode=${auth.user.userCode}`
          );
          const studentData =
            (studentRes as ApiResponse<StudentProfile[]>)?.data || [];
          if (studentData.length > 0) {
            proposerStudentProfileID = studentData[0].studentProfileID;
            proposerStudentCode = studentData[0].studentCode;
          }
        } catch (err) {
          console.error("Error fetching student profile:", err);
        }
      }

      const payload = {
        ...templateData,
        topicCode: templateData.topicCode || "",
        title: formData.title,
        summary: formData.summary,
        type: formData.type, // "CATALOG" for existing topics, "SELF" for self-proposed topics
        proposerUserID: auth.user?.userID || 0,
        proposerUserCode: auth.user?.userCode || "",
        proposerStudentProfileID: proposerStudentProfileID,
        proposerStudentCode: proposerStudentCode,
        supervisorUserID: supervisorUserID,
        supervisorUserCode: selectedLecturer?.userCode || "",
        supervisorLecturerProfileID: formData.supervisorLecturerProfileID || 0,
        supervisorLecturerCode: selectedLecturer?.lecturerCode || "",
        catalogTopicID: formData.catalogTopicID || 0,
        catalogTopicCode: selectedCatalogTopic?.catalogTopicCode || "",
        departmentID: formData.departmentID || 0,
        departmentCode: selectedDepartment?.departmentCode || "",
        status: "Đang chờ",
        resubmitCount: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        specialtyID: formData.specialtyID || 0,
        specialtyCode: selectedSpecialty?.specialtyCode || "",
      };

      await fetchData("/Topics/create", {
        method: "POST",
        body: payload,
      });

      // Create initial progress milestone after successful topic creation
      try {
        const milestoneTemplate = await fetchData(
          "/ProgressMilestones/get-create"
        );
        const milestoneData =
          ((milestoneTemplate as ApiResponse)?.data as Record<
            string,
            unknown
          >) || {};

        const milestonePayload = {
          ...milestoneData,
          topicCode: templateData.topicCode || "",
          topicID: null, // Will be set by backend
          state: "Đang tiến hành",
          startedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };

        await fetchData("/ProgressMilestones/create", {
          method: "POST",
          body: milestonePayload,
        });
        console.log("Progress milestone created successfully");
      } catch (milestoneErr) {
        console.error("Error creating progress milestone:", milestoneErr);
        // Don't fail the entire registration if milestone creation fails
      }

      setSuccess("Đăng ký đề tài thành công!");
      setShowSuccessModal(true);
    } catch (err) {
      setError("Có lỗi xảy ra khi đăng ký đề tài");
      console.error("Error creating topic:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          color: "#f37021",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f37021",
              borderTop: "4px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          ></div>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  // If student already has a pending or approved topic, show topic details
  if (existingTopic) {
    return (
      <div
        style={{
          padding: "24px",
          maxWidth: "900px",
          margin: "10px auto",
          backgroundColor: "#fff",
          minHeight: "100vh",
        }}
      >
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>

        {/* Header */}
        <div
          style={{
            marginBottom: "32px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              color: "#f37021",
              fontSize: "28px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <BookOpen size={32} />
            {existingTopic.status === "Đang chờ"
              ? "Đề tài của bạn đang được xét duyệt"
              : "Đề tài của bạn"}
          </h1>
          <p
            style={{
              color: "#666",
              fontSize: "16px",
              margin: 0,
            }}
          >
            {existingTopic.status === "Đang chờ"
              ? "Vui lòng chờ quyết định từ giảng viên hướng dẫn và ban quản lý"
              : "Đề tài của bạn đã được duyệt thành công"}
          </p>
        </div>

        {/* Topic Details */}
        <div
          style={{
            backgroundColor: "#fafafa",
            padding: "32px",
            borderRadius: "12px",
            border: "1px solid #eee",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                color: "#f37021",
                fontSize: "20px",
                fontWeight: "bold",
                margin: "0 0 16px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FileText size={20} />
              Thông tin đề tài
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    color: "#333",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  Mã đề tài
                </label>
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  {existingTopic.topicCode}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    color: "#333",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  Trạng thái
                </label>
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor:
                      existingTopic.status === "Đang chờ"
                        ? "#fff3cd"
                        : "#e8f5e8",
                    border: `1px solid ${
                      existingTopic.status === "Đang chờ"
                        ? "#ffc107"
                        : "#4caf50"
                    }`,
                    borderRadius: "6px",
                    fontSize: "14px",
                    color:
                      existingTopic.status === "Đang chờ"
                        ? "#856404"
                        : "#2e7d32",
                    fontWeight: "500",
                  }}
                >
                  {existingTopic.status}
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    color: "#333",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  Tên đề tài
                </label>
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  {existingTopic.title}
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    color: "#333",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  Tóm tắt đề tài
                </label>
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#333",
                    lineHeight: "1.5",
                  }}
                >
                  {existingTopic.summary}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    color: "#333",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  Loại đề tài
                </label>
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  {existingTopic.type === "CATALOG"
                    ? "Chọn từ danh mục có sẵn"
                    : "Tự đề xuất"}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    color: "#333",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  Giảng viên hướng dẫn
                </label>
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  {(() => {
                    const supervisor = lecturers.find(
                      (l) => l.userCode === existingTopic.supervisorUserCode
                    );
                    return (
                      supervisor?.fullName ||
                      existingTopic.supervisorLecturerCode ||
                      "Chưa có"
                    );
                  })()}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    color: "#333",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  Khoa
                </label>
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  {(() => {
                    // Prefer department name by ID, then try to match by departmentCode, then fallback to raw code
                    const byId = departments.find(
                      (d) => d.departmentID === existingTopic.departmentID
                    )?.name;
                    if (byId) return byId;
                    const byCode = departments.find(
                      (d) => d.departmentCode === existingTopic.departmentCode
                    )?.name;
                    return byCode || existingTopic.departmentCode || "Chưa có";
                  })()}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    color: "#333",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  Chuyên ngành
                </label>
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#333",
                  }}
                >
                  {(() => {
                    // Prefer specialty name by ID, then try to match by specialtyCode, then fallback to raw code
                    const byId = specialties.find(
                      (s) => s.specialtyID === existingTopic.specialtyID
                    )?.name;
                    if (byId) return byId;
                    const byCode = specialties.find(
                      (s) => s.specialtyCode === existingTopic.specialtyCode
                    )?.name;
                    return byCode || existingTopic.specialtyCode || "Chưa có";
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div
            style={{
              backgroundColor:
                existingTopic.status === "Đang chờ" ? "#e3f2fd" : "#e8f5e8",
              border: `1px solid ${
                existingTopic.status === "Đang chờ" ? "#2196f3" : "#4caf50"
              }`,
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color:
                  existingTopic.status === "Đang chờ" ? "#1976d2" : "#2e7d32",
                fontSize: "16px",
                fontWeight: "500",
                marginBottom: "8px",
              }}
            >
              {existingTopic.status === "Đang chờ"
                ? "Đề tài của bạn đang trong quá trình xét duyệt"
                : "Đề tài của bạn đã được duyệt thành công"}
            </div>
            <div style={{ color: "#666", fontSize: "14px" }}>
              {existingTopic.status === "Đang chờ"
                ? "Bạn sẽ nhận được thông báo khi có kết quả. Trong thời gian này, bạn không thể đăng ký đề tài mới."
                : "Chúc mừng! Bạn có thể bắt đầu thực hiện đề tài của mình."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "900px",
        margin: "0 auto",
        backgroundColor: "#fff",
        minHeight: "100vh",
      }}
    >
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header */}
      <div
        style={{
          marginBottom: "32px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "#f37021",
            fontSize: "28px",
            fontWeight: "bold",
            margin: "0 0 8px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <BookOpen size={32} />
          Đăng ký đề tài
        </h1>
        <p
          style={{
            color: "#666",
            fontSize: "16px",
            margin: 0,
          }}
        >
          Chọn loại đăng ký và điền thông tin đề tài của bạn
        </p>
      </div>

      {/* Registration Type Selection */}
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          gap: "16px",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={() => handleRegistrationTypeChange("catalog")}
          style={{
            padding: "12px 24px",
            border: `2px solid ${
              registrationType === "catalog" ? "#f37021" : "#ddd"
            }`,
            borderRadius: "8px",
            backgroundColor:
              registrationType === "catalog" ? "#f37021" : "#fff",
            color: registrationType === "catalog" ? "#fff" : "#333",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FileText size={18} />
          Chọn đề tài có sẵn
        </button>
        <button
          type="button"
          onClick={() => handleRegistrationTypeChange("self")}
          style={{
            padding: "12px 24px",
            border: `2px solid ${
              registrationType === "self" ? "#f37021" : "#ddd"
            }`,
            borderRadius: "8px",
            backgroundColor: registrationType === "self" ? "#f37021" : "#fff",
            color: registrationType === "self" ? "#fff" : "#333",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <PersonIcon size={18} />
          Tự đề xuất đề tài
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div
          style={{
            backgroundColor: "#ffebee",
            border: "1px solid #f44336",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "24px",
            color: "#d32f2f",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "#e8f5e8",
            border: "1px solid #4caf50",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "24px",
            color: "#2e7d32",
          }}
        >
          {success}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#fafafa",
          padding: "32px",
          borderRadius: "12px",
          border: "1px solid #eee",
        }}
      >
        {/* Catalog Topic Selection (Only for catalog type) */}
        {registrationType === "catalog" && (
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
                fontSize: "16px",
              }}
            >
              <FileText
                size={16}
                style={{ marginRight: "8px", verticalAlign: "middle" }}
              />
              Chọn đề tài có sẵn
            </label>
            <select
              value={formData.catalogTopicID || ""}
              onChange={(e) => handleCatalogTopicChange(Number(e.target.value))}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                backgroundColor: "#fff",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#f37021")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            >
              <option value="">-- Chọn đề tài --</option>
              {catalogTopics.map((topic) => (
                <option key={topic.catalogTopicID} value={topic.catalogTopicID}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Topic Code */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333",
              fontSize: "16px",
            }}
          >
            <FileText
              size={16}
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            />
            Mã đề tài
          </label>
          <input
            type="text"
            value={formData.topicCode || ""}
            readOnly
            placeholder="Mã đề tài sẽ được tạo tự động"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: "#f5f5f5",
              color: "#666",
              cursor: "not-allowed",
            }}
          />
        </div>

        {/* Title */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333",
              fontSize: "16px",
            }}
          >
            <BookOpen
              size={16}
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            />
            Tên đề tài *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            disabled={
              registrationType === "catalog" && !formData.catalogTopicID
            }
            placeholder="Nhập tên đề tài"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor:
                registrationType === "catalog" && !formData.catalogTopicID
                  ? "#f5f5f5"
                  : "#fff",
              transition: "border-color 0.3s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
        </div>

        {/* Summary */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333",
              fontSize: "16px",
            }}
          >
            <FileText
              size={16}
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            />
            Tóm tắt đề tài *
          </label>
          <textarea
            value={formData.summary}
            onChange={(e) =>
              setFormData({ ...formData, summary: e.target.value })
            }
            required
            disabled={
              registrationType === "catalog" && !formData.catalogTopicID
            }
            placeholder="Mô tả chi tiết về đề tài"
            rows={4}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor:
                registrationType === "catalog" && !formData.catalogTopicID
                  ? "#f5f5f5"
                  : "#fff",
              transition: "border-color 0.3s ease",
              resize: "vertical",
              fontFamily: "inherit",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
        </div>

        {/* Specialty */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333",
              fontSize: "16px",
            }}
          >
            <GraduationCap
              size={16}
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            />
            Chuyên ngành *
          </label>
          {registrationType === "catalog" && selectedSpecialtyInfo ? (
            <div
              style={{
                padding: "12px 16px",
                border: "2px solid #f37021",
                borderRadius: "8px",
                backgroundColor: "#fff8f3",
                fontSize: "16px",
              }}
            >
              <div
                style={{
                  fontWeight: "600",
                  color: "#f37021",
                  marginBottom: "4px",
                }}
              >
                {selectedSpecialtyInfo.name}
              </div>
              <div style={{ color: "#666", fontSize: "14px" }}>
                {selectedSpecialtyInfo.description}
              </div>
            </div>
          ) : (
            <select
              value={formData.specialtyID || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specialtyID: Number(e.target.value) || null,
                })
              }
              required={registrationType === "self"}
              disabled={registrationType === "catalog"}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                backgroundColor:
                  registrationType === "catalog" ? "#f5f5f5" : "#fff",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#f37021")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            >
              <option value="">
                {registrationType === "catalog"
                  ? "-- Chọn đề tài để xem chuyên ngành --"
                  : "-- Chọn chuyên ngành (tùy chọn) --"}
              </option>
              {specialties.map((specialty) => (
                <option
                  key={specialty.specialtyID}
                  value={specialty.specialtyID}
                >
                  {specialty.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Supervisor */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333",
              fontSize: "16px",
            }}
          >
            <Users
              size={16}
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            />
            Giảng viên hướng dẫn *
          </label>
          <select
            value={formData.supervisorLecturerProfileID || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                supervisorLecturerProfileID: Number(e.target.value),
              })
            }
            required
            disabled={registrationType === "self" && !formData.specialtyID}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor:
                registrationType === "self" && !formData.specialtyID
                  ? "#f5f5f5"
                  : "#fff",
              transition: "border-color 0.3s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          >
            <option value="">
              {registrationType === "catalog"
                ? "-- Chọn đề tài để xem giảng viên --"
                : formData.specialtyID
                ? "-- Chọn giảng viên hướng dẫn --"
                : "-- Chọn chuyên ngành trước để lọc giảng viên --"}
            </option>
            {(registrationType === "catalog" ||
            (registrationType === "self" && filteredLecturers.length > 0)
              ? filteredLecturers
              : lecturers
            ).map((lecturer) => (
              <option
                key={lecturer.lecturerProfileID}
                value={lecturer.lecturerProfileID}
              >
                {lecturer.fullName || lecturer.lecturerCode} - {lecturer.degree}{" "}
                ({lecturer.currentGuidingCount}/{lecturer.guideQuota})
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333",
              fontSize: "16px",
            }}
          >
            <Building
              size={16}
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            />
            Khoa *
          </label>
          <select
            value={formData.departmentID || ""}
            onChange={(e) =>
              setFormData({ ...formData, departmentID: Number(e.target.value) })
            }
            required
            disabled={false}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: "#fff",
              transition: "border-color 0.3s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          >
            <option value="">-- Chọn khoa --</option>
            {departments.map((dept) => (
              <option key={dept.departmentID} value={dept.departmentID}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div style={{ textAlign: "center" }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "16px 40px",
              backgroundColor: submitting ? "#ccc" : "#f37021",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "18px",
              fontWeight: "600",
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "background-color 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: "0 auto",
            }}
          >
            {submitting ? (
              <>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid #fff",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <BookOpen size={20} />
                Đăng ký đề tài
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            animation: "modalFadeIn 0.3s ease-out",
          }}
        >
          <style>
            {`
              @keyframes modalFadeIn {
                from {
                  opacity: 0;
                  transform: scale(0.8);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}
          </style>
          <div
            style={{
              width: 520,
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
              textAlign: "center",
              animation: "modalContentSlideIn 0.4s ease-out",
            }}
          >
            <style>
              {`
                @keyframes modalContentSlideIn {
                  from {
                    opacity: 0;
                    transform: translateY(-20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                @keyframes iconBounce {
                  0% {
                    transform: scale(0.3);
                    opacity: 0;
                  }
                  50% {
                    transform: scale(1.05);
                  }
                  70% {
                    transform: scale(0.9);
                  }
                  100% {
                    transform: scale(1);
                    opacity: 1;
                  }
                }
                @keyframes iconGlow {
                  from {
                    filter: drop-shadow(0 0 0 rgba(76, 175, 80, 0));
                  }
                  to {
                    filter: drop-shadow(0 0 10px rgba(76, 175, 80, 0.5));
                  }
                }
                @keyframes textFadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                @keyframes titleGradient {
                  0% {
                    background-position: 0% 50%;
                  }
                  50% { 
                    background-position: 100% 50%;
                  }
                  100% {
                    background-position: 0% 50%;
                  }
                }
              `}
            </style>
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                animation:
                  "iconBounce 0.6s ease-out, iconGlow 2s ease-in-out infinite alternate",
              }}
            >
              <CheckCircle size={64} color="#4caf50" />
            </div>
            <h2
              style={{
                margin: "0 0 12px 0",
                background: "linear-gradient(45deg, #4caf50, #66bb6a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontSize: "24px",
                fontWeight: "bold",
                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                animation:
                  "textFadeIn 0.5s ease-out 0.2s both, titleGradient 3s ease-in-out infinite",
              }}
            >
              Đăng ký thành công!
            </h2>
            <p
              style={{
                color: "#475569",
                marginTop: 0,
                lineHeight: 1.5,
                animation: "textFadeIn 0.5s ease-out 0.4s both",
              }}
            >
              Đề tài của bạn đã được gửi thành công! Bạn sẽ nhận được thông báo
              qua email khi đề tài được duyệt hoặc có cập nhật.
            </p>
            <div
              style={{
                marginTop: 24,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <button
                onClick={handleContinueAfterSuccess}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "#f37021",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  transition: "background-color 0.3s ease",
                }}
                onMouseOver={(e) =>
                  ((e.target as HTMLElement).style.backgroundColor = "#e55a1b")
                }
                onMouseOut={(e) =>
                  ((e.target as HTMLElement).style.backgroundColor = "#f37021")
                }
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicRegistration;
