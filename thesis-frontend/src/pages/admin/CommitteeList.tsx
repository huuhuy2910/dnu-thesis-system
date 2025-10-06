import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CommitteeDetailDto } from '../../api/committeeApi';
import { Calendar, Users, Plus, Eye, AlertCircle, Loader } from 'lucide-react';

const CommitteeList: React.FC = () => {
  const navigate = useNavigate();
  const [committees] = useState<CommitteeDetailDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    loadCommittees();
  }, []);

  const loadCommittees = async () => {
    // For now, we don't have a list endpoint, so this is placeholder
    // You may want to add a GetAllCommitteesAsync method in the backend
    setLoading(false);
  };

  const handleCreateNew = () => {
    navigate('/admin/committees/create');
  };

  const handleViewDetail = (code: string) => {
    navigate(`/admin/committees/detail/${code}`);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
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
            Quản lý Hội đồng Bảo vệ
          </h1>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Tạo và quản lý các hội đồng bảo vệ luận văn tốt nghiệp
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #F37021 0%, #FF8838 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
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
          <Plus size={20} />
          Tạo Hội đồng mới
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          background: '#FEE',
          border: '1px solid #FCC',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <AlertCircle size={20} color="#C33" />
          <span style={{ color: '#C33' }}>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px',
          gap: '12px'
        }}>
          <Loader size={24} color="#F37021" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: '#666' }}>Đang tải danh sách hội đồng...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && committees.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)',
          borderRadius: '12px',
          border: '2px dashed #F37021'
        }}>
          <Users size={64} color="#F37021" style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
            Chưa có hội đồng nào
          </h3>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Bắt đầu bằng cách tạo hội đồng bảo vệ đầu tiên
          </p>
          <button
            onClick={handleCreateNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'white',
              color: '#F37021',
              border: '2px solid #F37021',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F37021';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#F37021';
            }}
          >
            <Plus size={18} />
            Tạo Hội đồng
          </button>
        </div>
      )}

      {/* Committee Grid */}
      {!loading && committees.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {committees.map((committee) => (
            <div
              key={committee.committeeCode}
              style={{
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(243, 112, 33, 0.15)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#F37021';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
              onClick={() => handleViewDetail(committee.committeeCode)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
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
                <Eye size={18} color="#999" />
              </div>

              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '16px'
              }}>
                {committee.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {committee.defenseDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} color="#F37021" />
                    <span style={{ fontSize: '13px', color: '#333' }}>
                      {new Date(committee.defenseDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#F37021" />
                  <span style={{ fontSize: '13px', color: '#333' }}>
                    {committee.members.length} thành viên
                  </span>
                </div>
              </div>
            </div>
          ))}
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

export default CommitteeList;
