import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchData } from "../../api/fetchData";
import { useAuth } from "../../hooks/useAuth";
import type { ApiResponse } from "../../types/api";
import type {
  CatalogTopicSpecialty,
  LecturerSpecialty,
} from "../../types/specialty";
import type { User } from "../../types/user";
import type { TopicFormData } from "../../types/topic";
import type { CatalogTopic } from "../../types/catalog-topic";
import type { LecturerProfile } from "../../types/lecturer-profile";
import type { Department } from "../../types/department";
import type { Specialty } from "../../types/specialty-type";
import type { StudentProfile } from "../../types/student-profile";
import type { Topic } from "../../types/topic";
import {
  BookOpen,
  FileText,
  User as PersonIcon,
  Building,
  GraduationCap,
  Users,
} from "lucide-react";

const TopicRegistration: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
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
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [catalogRes, lecturerRes, departmentRes, specialtyRes] =
          await Promise.all([
            fetchData(
              "/CatalogTopics/get-list?AssignedStatus=Ch%C6%B0a%20giao"
            ),
            fetchData("/LecturerProfiles/get-list"),
            fetchData("/Departments/get-list"),
            fetchData("/Specialties/get-list"),
          ]);

        setCatalogTopics(
          (catalogRes as ApiResponse<CatalogTopic[]>)?.data || []
        );
        setLecturers(
          (lecturerRes as ApiResponse<LecturerProfile[]>)?.data || []
        );

        // Fetch user names for lecturers
        const lecturersData =
          (lecturerRes as ApiResponse<LecturerProfile[]>)?.data || [];
        if (lecturersData.length > 0) {
          const userCodes = lecturersData.map((l) => l.userCode);
          const userPromises = userCodes.map((userCode) =>
            fetchData(`/Users/get-list?UserCode=${userCode}`)
          );
          const userResponses = await Promise.all(userPromises);

          const userNameMap: Record<string, string> = {};
          userResponses.forEach((response, index) => {
            const userData = (response as ApiResponse<User[]>)?.data;
            if (userData && userData.length > 0) {
              userNameMap[userCodes[index]] =
                userData[0].fullName || userCodes[index];
            }
          });
          setUserNames(userNameMap);
        }
        setDepartments(
          (departmentRes as ApiResponse<Department[]>)?.data || []
        );
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
        if (auth.user?.userCode) {
          try {
            const topicsRes = await fetchData(
              `/Topics/get-list?ProposerUserCode=${auth.user.userCode}`
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
    };

    fetchInitialData();
  }, [auth]);

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
        departmentID:
          departments.find(
            (d) => d.departmentCode === selectedTopic.departmentCode
          )?.departmentID || null,
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

      // Get supervisor user ID from user API
      let supervisorUserID = 0;
      if (selectedLecturer?.userCode) {
        try {
          const userRes = await fetchData(
            `/Users/get-list?UserCode=${selectedLecturer.userCode}`
          );
          const userData = (userRes as ApiResponse<User[]>)?.data || [];
          if (userData.length > 0) {
            supervisorUserID = userData[0].userID || 0;
          }
        } catch (err) {
          console.error("Error fetching supervisor user:", err);
        }
      }

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
        type: formData.type,
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

      setSuccess("Đăng ký đề tài thành công!");
      // Navigate to home page after successful registration
      setTimeout(() => {
        navigate("/");
      }, 2000);
      // Reset form
      setFormData({
        topicCode: formData.topicCode, // Keep the same topic code
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
                  {userNames[existingTopic.supervisorUserCode || ""] ||
                    existingTopic.supervisorLecturerCode ||
                    "Chưa có"}
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
                  {departments.find(
                    (d) => d.departmentID === existingTopic.departmentID
                  )?.name ||
                    existingTopic.departmentCode ||
                    "Chưa có"}
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
                  {specialties.find(
                    (s) => s.specialtyID === existingTopic.specialtyID
                  )?.name ||
                    existingTopic.specialtyCode ||
                    "Chưa có"}
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
            <option value="">
              {registrationType === "catalog"
                ? "-- Chọn đề tài để xem giảng viên --"
                : "-- Chọn giảng viên --"}
            </option>
            {(registrationType === "catalog"
              ? filteredLecturers
              : lecturers
            ).map((lecturer) => (
              <option
                key={lecturer.lecturerProfileID}
                value={lecturer.lecturerProfileID}
              >
                {userNames[lecturer.userCode] || lecturer.lecturerCode} -{" "}
                {lecturer.degree} ({lecturer.currentGuidingCount}/
                {lecturer.guideQuota})
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
            disabled={
              registrationType === "catalog" && !!formData.catalogTopicID
            }
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "2px solid #ddd",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor:
                registrationType === "catalog" && formData.catalogTopicID
                  ? "#f5f5f5"
                  : "#fff",
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
    </div>
  );
};

export default TopicRegistration;
