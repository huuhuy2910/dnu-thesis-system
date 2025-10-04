import React from 'react';

const Dashboard: React.FC = () => {
  // Giả lập dữ liệu (sau này sẽ gọi API)
  const studentInfo = {
    name: 'Nguyễn Văn Quang',
    studentId: 'SV20210045',
    department: 'Công nghệ thông tin',
    lecturer: 'ThS. Lê Trung Hiếu',
    topic: 'Xây dựng hệ thống quản lý đồ án tốt nghiệp',
    progress: 65,
    status: 'Đang thực hiện',
    nextDeadline: '10/10/2025 - Nộp báo cáo chương 3',
  };

  const notifications = [
    {
      id: 1,
      title: 'Giảng viên đã nhận xét báo cáo chương 2',
      date: '03/10/2025',
    },
    {
      id: 2,
      title: 'Cập nhật lịch bảo vệ dự kiến',
      date: '28/09/2025',
    },
    {
      id: 3,
      title: 'Thông báo nộp file tiến độ tuần 4',
      date: '22/09/2025',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px',
        padding: '10px 0',
      }}
    >
      {/* LEFT COLUMN */}
      <div>
        {/* THÔNG TIN SINH VIÊN */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ color: '#f37021', marginBottom: 12 }}>Thông tin sinh viên</h3>
          <table style={{ width: '100%', fontSize: 14, color: '#333' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: 140 }}>Họ tên:</td>
                <td>{studentInfo.name}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Mã SV:</td>
                <td>{studentInfo.studentId}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Ngành:</td>
                <td>{studentInfo.department}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>GV hướng dẫn:</td>
                <td>{studentInfo.lecturer}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Đề tài:</td>
                <td>{studentInfo.topic}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TIẾN ĐỘ ĐỒ ÁN */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ color: '#f37021', marginBottom: 10 }}>Tiến độ đồ án</h3>
          <p style={{ fontSize: 14, color: '#555' }}>
            Trạng thái hiện tại: <strong>{studentInfo.status}</strong>
          </p>
          <div
            style={{
              backgroundColor: '#eee',
              borderRadius: 8,
              height: 14,
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: `${studentInfo.progress}%`,
                backgroundColor: '#f37021',
                height: '100%',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <p style={{ fontSize: 13, color: '#777', marginBottom: 0 }}>
            Hoàn thành {studentInfo.progress}% • Hạn kế tiếp: {studentInfo.nextDeadline}
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div>
        {/* THÔNG BÁO */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ color: '#f37021', marginBottom: 12 }}>Thông báo mới nhất</h3>
          {notifications.map((item) => (
            <div
              key={item.id}
              style={{
                borderBottom: '1px solid #f0f0f0',
                padding: '8px 0',
              }}
            >
              <div style={{ fontWeight: 500, color: '#333' }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{item.date}</div>
            </div>
          ))}
        </div>

        {/* MỐC SẮP TỚI */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: 20,
            marginTop: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ color: '#f37021', marginBottom: 10 }}>Mốc sắp tới</h3>
          <p style={{ margin: 0, color: '#555', fontSize: 14 }}>
            📅 <strong>{studentInfo.nextDeadline}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
