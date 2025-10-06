import React, { useState } from 'react';
import { BookOpen, Search, Filter, CheckCircle, XCircle, Eye } from 'lucide-react';
import '../admin/Dashboard.css';

interface Topic {
  id: string;
  code: string;
  title: string;
  student: string;
  lecturer: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress';
  statusText: string;
}

// Mock data - Dữ liệu mẫu đề tài
const mockTopics: Topic[] = [
  {
    id: '1',
    code: 'DT001',
    title: 'Hệ gợi ý học tập dựa trên trí tuệ nhân tạo',
    student: 'Nguyễn Văn A (SV001)',
    lecturer: 'TS. Trần Minh Hòa',
    department: 'Công nghệ thông tin',
    status: 'in-progress',
    statusText: 'Đang thực hiện'
  },
  {
    id: '2',
    code: 'DT002',
    title: 'Phân loại văn bản tiếng Việt bằng deep learning',
    student: 'Trần Thị B (SV002)',
    lecturer: 'ThS. Nguyễn Thu Hà',
    department: 'Công nghệ thông tin',
    status: 'pending',
    statusText: 'Chờ duyệt'
  },
  {
    id: '3',
    code: 'DT003',
    title: 'Tối ưu hóa cơ sở dữ liệu phân tán',
    student: 'Lê Văn C (SV003)',
    lecturer: 'ThS. Phạm Anh Dũng',
    department: 'Hệ thống thông tin',
    status: 'approved',
    statusText: 'Đã duyệt'
  },
  {
    id: '4',
    code: 'DT004',
    title: 'Ứng dụng blockchain trong quản lý chuỗi cung ứng',
    student: 'Hoàng Thị D (SV004)',
    lecturer: 'TS. Trần Minh Hòa',
    department: 'Công nghệ thông tin',
    status: 'pending',
    statusText: 'Chờ duyệt'
  },
  {
    id: '5',
    code: 'DT005',
    title: 'Xây dựng hệ thống IoT cho nhà thông minh',
    student: 'Phạm Văn E (SV005)',
    lecturer: 'ThS. Lê Thanh Tùng',
    department: 'Điện tử viễn thông',
    status: 'rejected',
    statusText: 'Từ chối'
  }
];

const TopicsManagement: React.FC = () => {
  const [topics] = useState<Topic[]>(mockTopics);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.student.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || topic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>
          <BookOpen size={32} style={{ marginRight: 12, color: '#f37021' }} />
          Quản lý đề tài
        </h1>
        <p>Quản lý và phê duyệt các đề tài đồ án tốt nghiệp.</p>
      </div>

      {/* Toolbar */}
      <div style={{ 
        background: 'white', 
        padding: '20px 24px', 
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên đề tài, mã, sinh viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="#666" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="in-progress">Đang thực hiện</option>
          </select>
        </div>
      </div>

      {/* Topics Table */}
      <div className="recent-topics-section">
        <table className="topics-table">
          <thead>
            <tr>
              <th>Mã đề tài</th>
              <th>Tên đề tài</th>
              <th>Sinh viên</th>
              <th>Giảng viên HD</th>
              <th>Khoa</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredTopics.map((topic) => (
              <tr key={topic.id}>
                <td><strong>{topic.code}</strong></td>
                <td style={{ maxWidth: '300px' }}>{topic.title}</td>
                <td>{topic.student}</td>
                <td>{topic.lecturer}</td>
                <td>{topic.department}</td>
                <td>
                  <span className={`status-badge ${topic.status}`}>
                    {topic.statusText}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#1e88e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                      Xem
                    </button>
                    {topic.status === 'pending' && (
                      <>
                        <button
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#2e7d32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Phê duyệt"
                          onClick={() => alert(`Duyệt đề tài: ${topic.title}`)}
                        >
                          <CheckCircle size={14} />
                          Duyệt
                        </button>
                        <button
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#d32f2f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Từ chối"
                          onClick={() => alert(`Từ chối đề tài: ${topic.title}`)}
                        >
                          <XCircle size={14} />
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ marginTop: '16px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
          Hiển thị {filteredTopics.length} / {topics.length} đề tài
        </div>
      </div>
    </div>
  );
};

export default TopicsManagement;
