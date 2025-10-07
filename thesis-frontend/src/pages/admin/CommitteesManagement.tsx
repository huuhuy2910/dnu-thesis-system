import React, { useState } from "react";
import { ShieldCheck, Plus, Eye, Edit, UserPlus, X } from "lucide-react";
import "../admin/Dashboard.css";

interface CommitteeMember {
  role: string;
  name: string;
  degree: string;
}

interface Committee {
  id: string;
  code: string;
  topic: string;
  student: string;
  defenseDate: string;
  members: CommitteeMember[];
}

interface Lecturer {
  id: string;
  name: string;
  degree: string;
  specialty: string;
}

// Mock data - Danh sách hội đồng đã tạo
const mockCommittees: Committee[] = [
  {
    id: "1",
    code: "COM_01",
    topic: "Hệ gợi ý học tập dựa trên AI",
    student: "Nguyễn Văn A",
    defenseDate: "25/12/2025",
    members: [
      { role: "Chủ tịch", name: "TS. Nguyễn Văn Hòa", degree: "Tiến sĩ" },
      { role: "Thư ký", name: "ThS. Trần Thu Hằng", degree: "Thạc sĩ" },
      { role: "Thành viên", name: "ThS. Phạm Anh Dũng", degree: "Thạc sĩ" },
    ],
  },
  {
    id: "2",
    code: "COM_02",
    topic: "Tối ưu hóa cơ sở dữ liệu phân tán",
    student: "Lê Văn C",
    defenseDate: "26/12/2025",
    members: [
      { role: "Chủ tịch", name: "TS. Trần Minh Hòa", degree: "Tiến sĩ" },
      { role: "Thư ký", name: "ThS. Nguyễn Thu Hà", degree: "Thạc sĩ" },
      { role: "Thành viên", name: "ThS. Lê Thanh Tùng", degree: "Thạc sĩ" },
    ],
  },
];

// Mock data - Danh sách giảng viên
const mockLecturers: Lecturer[] = [
  {
    id: "1",
    name: "TS. Nguyễn Văn Hòa",
    degree: "Tiến sĩ",
    specialty: "Trí tuệ nhân tạo",
  },
  {
    id: "2",
    name: "TS. Trần Minh Hòa",
    degree: "Tiến sĩ",
    specialty: "Cơ sở dữ liệu",
  },
  {
    id: "3",
    name: "ThS. Trần Thu Hằng",
    degree: "Thạc sĩ",
    specialty: "Mạng máy tính",
  },
  {
    id: "4",
    name: "ThS. Nguyễn Thu Hà",
    degree: "Thạc sĩ",
    specialty: "Khoa học dữ liệu",
  },
  {
    id: "5",
    name: "ThS. Phạm Anh Dũng",
    degree: "Thạc sĩ",
    specialty: "Lập trình",
  },
  { id: "6", name: "ThS. Lê Thanh Tùng", degree: "Thạc sĩ", specialty: "IoT" },
];

const CommitteesManagement: React.FC = () => {
  const [committees] = useState<Committee[]>(mockCommittees);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(
    null
  );

  // Form state for creating committee
  const [newCommittee, setNewCommittee] = useState({
    topic: "",
    student: "",
    defenseDate: "",
    chairman: "",
    secretary: "",
    member: "",
  });

  const handleCreateCommittee = () => {
    if (
      !newCommittee.topic ||
      !newCommittee.student ||
      !newCommittee.chairman ||
      !newCommittee.secretary ||
      !newCommittee.member
    ) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    alert(
      "Phân công hội đồng thành công!\n\n" +
        `Đề tài: ${newCommittee.topic}\n` +
        `Sinh viên: ${newCommittee.student}\n` +
        `Ngày bảo vệ: ${newCommittee.defenseDate}\n` +
        `Chủ tịch: ${newCommittee.chairman}\n` +
        `Thư ký: ${newCommittee.secretary}\n` +
        `Thành viên: ${newCommittee.member}`
    );
    setShowCreateModal(false);
    // Reset form
    setNewCommittee({
      topic: "",
      student: "",
      defenseDate: "",
      chairman: "",
      secretary: "",
      member: "",
    });
  };

  // Filter lecturers by degree for chairman (only PhD)
  const chairmanOptions = mockLecturers.filter((l) => l.degree === "Tiến sĩ");
  const otherLecturers = mockLecturers.filter(
    (l) => l.degree !== "Tiến sĩ" || chairmanOptions.some((c) => c.id !== l.id)
  );

  const handleView = (committee: Committee) => {
    setSelectedCommittee(committee);
    setShowViewModal(true);
  };

  const handleEdit = (committee: Committee) => {
    setSelectedCommittee(committee);
    setShowEditModal(true);
  };

  const handleUpdateCommittee = () => {
    if (!selectedCommittee) return;

    // Logic cập nhật hội đồng (mock)
    alert(`Đã cập nhật hội đồng ${selectedCommittee.code} thành công!`);
    setShowEditModal(false);
    setSelectedCommittee(null);
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>
          <ShieldCheck
            size={32}
            style={{ marginRight: 12, color: "#f37021" }}
          />
          Quản lý hội đồng bảo vệ
        </h1>
        <p>Phân công và quản lý hội đồng bảo vệ đồ án tốt nghiệp.</p>
      </div>

      {/* Action Bar */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "16px", color: "#666" }}>
          Tổng số hội đồng:{" "}
          <strong style={{ color: "#f37021" }}>{committees.length}</strong>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            backgroundColor: "#f37021",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#d85f1a")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#f37021")
          }
        >
          <Plus size={20} />
          Tạo hội đồng mới
        </button>
      </div>

      {/* Committees List */}
      <div style={{ display: "grid", gap: "24px" }}>
        {committees.map((committee) => (
          <div
            key={committee.id}
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e0e0e0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "16px",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    color: "#333",
                    marginBottom: "8px",
                  }}
                >
                  {committee.code}: {committee.topic}
                </h3>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  Sinh viên: <strong>{committee.student}</strong> | Ngày bảo vệ:{" "}
                  <strong style={{ color: "#f37021" }}>
                    {committee.defenseDate}
                  </strong>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleView(committee)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#1e88e5",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Eye size={14} />
                  Xem
                </button>
                <button
                  onClick={() => handleEdit(committee)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#2e7d32",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Edit size={14} />
                  Sửa
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              {committee.members.map((member, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "8px",
                    borderLeft: "4px solid #f37021",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginBottom: "4px",
                    }}
                  >
                    {member.role}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    {member.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "2px",
                    }}
                  >
                    {member.degree}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Committee Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "32px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "24px",
                  color: "#f37021",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <UserPlus size={28} />
                Tạo hội đồng bảo vệ
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={24} color="#999" />
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  Đề tài
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên đề tài"
                  value={newCommittee.topic}
                  onChange={(e) =>
                    setNewCommittee({ ...newCommittee, topic: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  Sinh viên
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên sinh viên"
                  value={newCommittee.student}
                  onChange={(e) =>
                    setNewCommittee({
                      ...newCommittee,
                      student: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  Ngày bảo vệ
                </label>
                <input
                  type="date"
                  value={newCommittee.defenseDate}
                  onChange={(e) =>
                    setNewCommittee({
                      ...newCommittee,
                      defenseDate: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  borderTop: "2px solid #f0f0f0",
                  paddingTop: "16px",
                  marginTop: "8px",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    color: "#333",
                    marginBottom: "12px",
                  }}
                >
                  Thành viên hội đồng
                </h3>

                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    Chủ tịch (Tiến sĩ)
                  </label>
                  <select
                    value={newCommittee.chairman}
                    onChange={(e) =>
                      setNewCommittee({
                        ...newCommittee,
                        chairman: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">-- Chọn chủ tịch --</option>
                    {chairmanOptions.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.name}>
                        {lecturer.name} - {lecturer.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    Thư ký
                  </label>
                  <select
                    value={newCommittee.secretary}
                    onChange={(e) =>
                      setNewCommittee({
                        ...newCommittee,
                        secretary: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">-- Chọn thư ký --</option>
                    {otherLecturers.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.name}>
                        {lecturer.name} - {lecturer.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    Thành viên
                  </label>
                  <select
                    value={newCommittee.member}
                    onChange={(e) =>
                      setNewCommittee({
                        ...newCommittee,
                        member: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">-- Chọn thành viên --</option>
                    {otherLecturers.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.name}>
                        {lecturer.name} - {lecturer.specialty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button
                  onClick={handleCreateCommittee}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#f37021",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#d85f1a")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f37021")
                  }
                >
                  Lưu phân công
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#f5f5f5",
                    color: "#666",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Committee Modal */}
      {showViewModal && selectedCommittee && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ margin: 0, color: "#002855", fontSize: "24px" }}>
                Chi tiết hội đồng: {selectedCommittee.code}
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
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
                      marginBottom: "4px",
                      color: "#002855",
                    }}
                  >
                    Mã hội đồng
                  </label>
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#f5f5f5",
                      borderRadius: "4px",
                      color: "#333",
                    }}
                  >
                    {selectedCommittee.code}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "600",
                      marginBottom: "4px",
                      color: "#002855",
                    }}
                  >
                    Ngày bảo vệ
                  </label>
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#f5f5f5",
                      borderRadius: "4px",
                      color: "#333",
                    }}
                  >
                    {selectedCommittee.defenseDate}
                  </div>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "4px",
                    color: "#002855",
                  }}
                >
                  Đề tài
                </label>
                <div
                  style={{
                    padding: "12px",
                    background: "#f5f5f5",
                    borderRadius: "4px",
                    color: "#333",
                  }}
                >
                  {selectedCommittee.topic}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "4px",
                    color: "#002855",
                  }}
                >
                  Sinh viên
                </label>
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#f5f5f5",
                    borderRadius: "4px",
                    color: "#333",
                  }}
                >
                  {selectedCommittee.student}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "8px",
                    color: "#002855",
                  }}
                >
                  Thành viên hội đồng
                </label>
                <div style={{ display: "grid", gap: "12px" }}>
                  {selectedCommittee.members.map((member, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "16px",
                        background: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#002855",
                          }}
                        >
                          {member.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {member.degree}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "4px 12px",
                          background:
                            member.role === "Chủ tịch" ? "#f37021" : "#002855",
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        {member.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f37021",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#d85f1a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f37021")
                }
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Committee Modal */}
      {showEditModal && selectedCommittee && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ margin: 0, color: "#002855", fontSize: "24px" }}>
                Sửa hội đồng: {selectedCommittee.code}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
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
                      marginBottom: "8px",
                      color: "#002855",
                    }}
                  >
                    Mã hội đồng
                  </label>
                  <input
                    type="text"
                    value={selectedCommittee.code}
                    onChange={(e) =>
                      setSelectedCommittee({
                        ...selectedCommittee,
                        code: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#f37021")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "600",
                      marginBottom: "8px",
                      color: "#002855",
                    }}
                  >
                    Ngày bảo vệ
                  </label>
                  <input
                    type="text"
                    value={selectedCommittee.defenseDate}
                    onChange={(e) =>
                      setSelectedCommittee({
                        ...selectedCommittee,
                        defenseDate: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#f37021")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "8px",
                    color: "#002855",
                  }}
                >
                  Đề tài
                </label>
                <input
                  type="text"
                  value={selectedCommittee.topic}
                  onChange={(e) =>
                    setSelectedCommittee({
                      ...selectedCommittee,
                      topic: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#f37021")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "8px",
                    color: "#002855",
                  }}
                >
                  Sinh viên
                </label>
                <input
                  type="text"
                  value={selectedCommittee.student}
                  onChange={(e) =>
                    setSelectedCommittee({
                      ...selectedCommittee,
                      student: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#f37021")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "8px",
                    color: "#002855",
                  }}
                >
                  Thành viên hội đồng
                </label>
                <div style={{ display: "grid", gap: "12px" }}>
                  {selectedCommittee.members.map((member, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "16px",
                        background: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr auto",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#002855",
                            marginBottom: "4px",
                          }}
                        >
                          Tên
                        </label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => {
                            const newMembers = [...selectedCommittee.members];
                            newMembers[idx] = {
                              ...newMembers[idx],
                              name: e.target.value,
                            };
                            setSelectedCommittee({
                              ...selectedCommittee,
                              members: newMembers,
                            });
                          }}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#002855",
                            marginBottom: "4px",
                          }}
                        >
                          Học vị
                        </label>
                        <input
                          type="text"
                          value={member.degree}
                          onChange={(e) => {
                            const newMembers = [...selectedCommittee.members];
                            newMembers[idx] = {
                              ...newMembers[idx],
                              degree: e.target.value,
                            };
                            setSelectedCommittee({
                              ...selectedCommittee,
                              members: newMembers,
                            });
                          }}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          padding: "4px 8px",
                          background:
                            member.role === "Chủ tịch" ? "#f37021" : "#002855",
                          color: "white",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        {member.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
              <button
                onClick={handleUpdateCommittee}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f37021",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#d85f1a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f37021")
                }
              >
                Lưu thay đổi
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#f5f5f5",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteesManagement;
