import React, { useEffect, useState } from 'react';
import { committeeManagementApi, type LecturerCommitteesDto } from '../../api/committeeApi';
import { Calendar, Users, GraduationCap, Loader, AlertCircle, MapPin } from 'lucide-react';

const LecturerCommittees: React.FC = () => {
  const [data, setData] = useState<LecturerCommitteesDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommittees();
  }, []);

  const loadCommittees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const lecturerCode = localStorage.getItem('userCode'); // Assuming this is stored on login

      if (!token || !lecturerCode) {
        setError('Không tìm thấy thông tin xác thực');
        return;
      }

      const result = await committeeManagementApi.getLecturerCommittees(lecturerCode, token);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || 'Không tải được danh sách hội đồng');
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
        <span style={{ color: '#666' }}>Đang tải danh sách hội đồng...</span>
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

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
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
          <Users size={32} color="#F37021" />
          Hội đồng Bảo vệ của tôi
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Xem danh sách các hội đồng bạn tham gia và đề tài cần bảo vệ
        </p>
      </div>

      {/* Lecturer Info */}
      {data && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)',
          border: '1px solid #F37021',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F37021 0%, #FF8838 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(243, 112, 33, 0.3)'
          }}>
            {data.lecturerName.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>
              {data.lecturerName}
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Mã giảng viên: <strong>{data.lecturerCode}</strong> • 
              Tham gia <strong>{data.committees.length}</strong> hội đồng
            </p>
          </div>
        </div>
      )}

      {/* Committees List */}
      {data && data.committees.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
          borderRadius: '12px',
          border: '2px dashed #E5E7EB'
        }}>
          <Users size={64} color="#CCC" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
            Chưa có hội đồng nào
          </h3>
          <p style={{ color: '#666' }}>
            Bạn chưa được phân công tham gia hội đồng bảo vệ nào.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {data?.committees.map((committee) => (
            <div
              key={committee.committeeCode}
              style={{
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(243, 112, 33, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#F37021';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              {/* Committee Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: 'linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)',
                      color: '#F37021',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {committee.committeeCode}
                    </span>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: committee.role === 'Chủ tịch' ? 'linear-gradient(135deg, #F37021 0%, #FF8838 100%)' : 
                                 committee.role === 'Thư ký' ? '#E0F2FE' : '#F3F4F6',
                      color: committee.role === 'Chủ tịch' ? 'white' : committee.role === 'Thư ký' ? '#0369A1' : '#666',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {committee.role}
                    </span>
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '12px'
                  }}>
                    {committee.name}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {committee.defenseDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="#F37021" />
                        <span style={{ fontSize: '13px', color: '#666' }}>
                          {new Date(committee.defenseDate).toLocaleDateString('vi-VN', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                    {committee.room && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#F37021" />
                        <span style={{ fontSize: '13px', color: '#666' }}>Phòng {committee.room}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GraduationCap size={16} color="#F37021" />
                      <span style={{ fontSize: '13px', color: '#666' }}>
                        {committee.assignedTopics.length} đề tài
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics List */}
              {committee.assignedTopics.length > 0 && (
                <div style={{
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid #E5E7EB'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#666',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Đề tài bảo vệ ({committee.assignedTopics.length})
                  </h4>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {committee.assignedTopics.map((topic) => (
                      <div
                        key={topic.topicCode}
                        style={{
                          background: '#F9FAFB',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '16px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FFF5F0';
                          e.currentTarget.style.borderColor = '#F37021';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#F9FAFB';
                          e.currentTarget.style.borderColor = '#E5E7EB';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            background: 'white',
                            border: '1px solid #E5E7EB',
                            color: '#666',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {topic.topicCode}
                          </span>
                          {topic.scheduledAt && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} color="#F37021" />
                              <span style={{ fontSize: '12px', color: '#666' }}>
                                {new Date(topic.scheduledAt).toLocaleString('vi-VN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        <h5 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1a1a1a',
                          marginBottom: '6px'
                        }}>
                          {topic.title}
                        </h5>
                        {topic.studentName && (
                          <p style={{ fontSize: '12px', color: '#666' }}>
                            <strong>SV:</strong> {topic.studentName} ({topic.studentCode})
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LecturerCommittees;
