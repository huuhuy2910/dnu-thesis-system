import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { committeeManagementApi, type CommitteeDetailDto } from '../../api/committeeApi';
import { ArrowLeft, Users, Calendar, MapPin, Plus, Loader, AlertCircle, User, GraduationCap } from 'lucide-react';

const CommitteeDetail: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'members' | 'topics'>('members');
  const [committee, setCommittee] = useState<CommitteeDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      loadCommitteeDetail();
    }
  }, [code]);

  const loadCommitteeDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token || !code) return;

      const result = await committeeManagementApi.getCommitteeDetail(code, token);
      if (result.success && result.data) {
        setCommittee(result.data);
      } else {
        setError(result.message || 'Không tải được thông tin hội đồng');
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
        <span style={{ color: '#666' }}>Đang tải thông tin hội đồng...</span>
      </div>
    );
  }

  if (error || !committee) {
    return (
      <div style={{ padding: '24px' }}>
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
          <span style={{ color: '#C33' }}>{error || 'Không tìm thấy hội đồng'}</span>
        </div>
        <button
          onClick={() => navigate('/admin/committees')}
          style={{
            marginTop: '16px',
            padding: '10px 20px',
            background: '#F37021',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/admin/committees')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'transparent',
            color: '#666',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F5F5F5';
            e.currentTarget.style.color = '#F37021';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#666';
          }}
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <div style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)',
                color: '#F37021',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                {committee.committeeCode}
              </span>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1a1a1a',
                marginBottom: '16px'
              }}>
                {committee.name}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {committee.defenseDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="#F37021" />
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      {new Date(committee.defenseDate).toLocaleDateString('vi-VN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
                {committee.room && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="#F37021" />
                    <span style={{ fontSize: '14px', color: '#666' }}>Phòng {committee.room}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#F37021" />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {committee.members.length} thành viên
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E5E7EB' }}>
          <button
            onClick={() => setActiveTab('members')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'members' ? 'linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)' : 'transparent',
              color: activeTab === 'members' ? '#F37021' : '#666',
              border: 'none',
              borderBottom: activeTab === 'members' ? '3px solid #F37021' : 'none',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '-2px'
            }}
          >
            <Users size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Thành viên Hội đồng
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'topics' ? 'linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)' : 'transparent',
              color: activeTab === 'topics' ? '#F37021' : '#666',
              border: 'none',
              borderBottom: activeTab === 'topics' ? '3px solid #F37021' : 'none',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '-2px'
            }}
          >
            <GraduationCap size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Đề tài được phân công
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
              Danh sách Thành viên ({committee.members.length})
            </h2>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #F37021 0%, #FF8838 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(243, 112, 33, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(243, 112, 33, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(243, 112, 33, 0.3)';
              }}
            >
              <Plus size={18} />
              Thêm Thành viên
            </button>
          </div>

          {committee.members.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#F9FAFB',
              borderRadius: '12px',
              border: '2px dashed #E5E7EB'
            }}>
              <Users size={48} color="#CCC" style={{ marginBottom: '16px' }} />
              <p style={{ color: '#666' }}>Chưa có thành viên nào. Thêm thành viên để bắt đầu.</p>
            </div>
          ) : (
            <div style={{
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>
                      Giảng viên
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>
                      Vai trò
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>
                      Học vị
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {committee.members.map((member, index) => (
                    <tr key={member.committeeMemberID} style={{
                      borderBottom: index < committee.members.length - 1 ? '1px solid #F3F4F6' : 'none'
                    }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #F37021 0%, #FF8838 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600'
                          }}>
                            <User size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#333', marginBottom: '2px' }}>
                              {member.lecturerName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#999' }}>{member.lecturerCode}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: member.isChair ? 'linear-gradient(135deg, #F37021 0%, #FF8838 100%)' : 
                                     member.role === 'Thư ký' ? '#E0F2FE' : '#F3F4F6',
                          color: member.isChair ? 'white' : member.role === 'Thư ký' ? '#0369A1' : '#666',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {member.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#666' }}>
                        {member.degree || 'Chưa cập nhật'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'topics' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
              Đề tài được phân công ({committee.assignedTopics.length})
            </h2>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #F37021 0%, #FF8838 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(243, 112, 33, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(243, 112, 33, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(243, 112, 33, 0.3)';
              }}
            >
              <Plus size={18} />
              Phân công Đề tài
            </button>
          </div>

          {committee.assignedTopics.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#F9FAFB',
              borderRadius: '12px',
              border: '2px dashed #E5E7EB'
            }}>
              <GraduationCap size={48} color="#CCC" style={{ marginBottom: '16px' }} />
              <p style={{ color: '#666' }}>Chưa có đề tài nào được phân công. Thêm đề tài để bắt đầu.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {committee.assignedTopics.map((topic) => (
                <div
                  key={topic.topicCode}
                  style={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#F37021';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: '#F3F4F6',
                        color: '#666',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        marginBottom: '8px'
                      }}>
                        {topic.topicCode}
                      </span>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1a1a1a',
                        marginBottom: '8px'
                      }}>
                        {topic.title}
                      </h3>
                      {topic.studentName && (
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                          <strong>Sinh viên:</strong> {topic.studentName} ({topic.studentCode})
                        </p>
                      )}
                      {topic.scheduledAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                          <Calendar size={16} color="#F37021" />
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            Lịch bảo vệ: {new Date(topic.scheduledAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CommitteeDetail;
