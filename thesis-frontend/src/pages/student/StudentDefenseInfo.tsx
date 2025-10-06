import React, { useEffect, useState } from 'react';
import { committeeManagementApi, type StudentDefenseInfoDto } from '../../api/committeeApi';
import { Calendar, Users, MapPin, GraduationCap, Loader, AlertCircle, User, Award } from 'lucide-react';

const StudentDefenseInfo: React.FC = () => {
  const [data, setData] = useState<StudentDefenseInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDefenseInfo();
  }, []);

  const loadDefenseInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const studentCode = localStorage.getItem('userCode'); // Assuming this is stored on login

      if (!token || !studentCode) {
        setError('Không tìm thấy thông tin xác thực');
        return;
      }

      const result = await committeeManagementApi.getStudentDefenseInfo(studentCode, token);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || 'Không tải được thông tin bảo vệ');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', gap: '12px' }}>
        <Loader size={24} color="#F37021" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#666' }}>Đang tải thông tin bảo vệ...</span>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          background: '#FEE',
          border: '1px solid #FCC',
          borderRadius: '8px'
        }}>
          <AlertCircle size={20} color="#C33" />
          <span style={{ color: '#C33' }}>{error}</span>
        </div>
      </div>
    );
  }

  const hasDefenseScheduled = data && data.scheduledAt && data.committee;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <GraduationCap size={32} color="#F37021" />
          Thông tin Bảo vệ Luận văn
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Xem lịch bảo vệ và thông tin hội đồng của bạn
        </p>
      </div>

      {/* Student Info */}
      {data && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)',
          border: '1px solid #F37021',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F37021 0%, #FF8838 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(243, 112, 33, 0.3)'
          }}>
            {data.studentName.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>
              {data.studentName}
            </h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              Mã sinh viên: <strong>{data.studentCode}</strong>
            </p>
            {data.topic && (
              <p style={{ fontSize: '14px', color: '#666' }}>
                Đề tài: <strong>{data.topic.title}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Defense Schedule */}
      {!hasDefenseScheduled ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
          borderRadius: '12px',
          border: '2px dashed #E5E7EB'
        }}>
          <Calendar size={64} color="#CCC" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
            Chưa có lịch bảo vệ
          </h3>
          <p style={{ color: '#666' }}>
            Lịch bảo vệ của bạn chưa được sắp xếp. Vui lòng liên hệ với khoa để biết thêm chi tiết.
          </p>
        </div>
      ) : (
        <>
          {/* Defense Schedule Card */}
          <div style={{
            background: 'white',
            border: '2px solid #F37021',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(243, 112, 33, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <Calendar size={28} color="#F37021" />
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a1a' }}>
                Lịch Bảo vệ
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)',
                borderRadius: '8px',
                border: '1px solid #F37021'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Calendar size={18} color="#F37021" />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                    Thời gian
                  </span>
                </div>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                  {new Date(data.scheduledAt!).toLocaleString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {data.committee?.room && (
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                  borderRadius: '8px',
                  border: '1px solid #3B82F6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <MapPin size={18} color="#3B82F6" />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                      Địa điểm
                    </span>
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                    Phòng {data.committee.room}
                  </p>
                </div>
              )}

              {data.committee && (
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                  borderRadius: '8px',
                  border: '1px solid #22C55E'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Users size={18} color="#22C55E" />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                      Hội đồng
                    </span>
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                    {data.committee.name}
                  </p>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {data.committee.committeeCode}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Committee Members */}
          {data.committee && data.committee.members && data.committee.members.length > 0 && (
            <div style={{
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <Users size={28} color="#F37021" />
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a1a' }}>
                  Thành viên Hội đồng
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {data.committee.members.map((member) => (
                  <div
                    key={member.committeeMemberID}
                    style={{
                      padding: '20px',
                      background: member.isChair ? 'linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)' : '#F9FAFB',
                      border: `2px solid ${member.isChair ? '#F37021' : '#E5E7EB'}`,
                      borderRadius: '12px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: member.isChair ? 'linear-gradient(135deg, #F37021 0%, #FF8838 100%)' : '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '18px'
                      }}>
                        {member.isChair ? <Award size={24} /> : <User size={24} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#1a1a1a',
                          marginBottom: '2px'
                        }}>
                          {member.lecturerName}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#999' }}>
                          {member.lecturerCode}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        background: member.isChair ? 'linear-gradient(135deg, #F37021 0%, #FF8838 100%)' : 
                                   member.role === 'Thư ký' ? '#E0F2FE' : 'white',
                        color: member.isChair ? 'white' : member.role === 'Thư ký' ? '#0369A1' : '#666',
                        border: member.isChair || member.role === 'Thư ký' ? 'none' : '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}>
                        {member.role}
                      </span>
                      {member.degree && (
                        <p style={{
                          fontSize: '12px',
                          color: '#666',
                          textAlign: 'center',
                          padding: '4px 8px',
                          background: 'white',
                          borderRadius: '4px'
                        }}>
                          {member.degree}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preparation Note */}
          <div style={{
            marginTop: '24px',
            padding: '20px',
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '8px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#92400E',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} />
              Lưu ý quan trọng
            </h3>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '13px',
              color: '#92400E',
              lineHeight: '1.8'
            }}>
              <li>Vui lòng có mặt trước giờ bảo vệ ít nhất 15 phút</li>
              <li>Chuẩn bị đầy đủ tài liệu: Luận văn in, file thuyết trình</li>
              <li>Ăn mặc lịch sự, trang trọng</li>
              <li>Kiểm tra thiết bị trình chiếu trước khi bắt đầu</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDefenseInfo;
