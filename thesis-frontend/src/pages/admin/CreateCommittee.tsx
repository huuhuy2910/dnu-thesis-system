import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { committeeManagementApi, type CreateCommitteeDto } from '../../api/committeeApi';
import { ArrowLeft, Save, Loader, AlertCircle, CheckCircle } from 'lucide-react';

const CreateCommittee: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCommitteeDto>({
    committeeCode: '',
    name: '',
    defenseDate: '',
    room: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Không tìm thấy token xác thực');
        setLoading(false);
        return;
      }

      const result = await committeeManagementApi.createCommittee(formData, token);
      
      if (result.success) {
        setSuccess(`Tạo hội đồng thành công! Mã: ${result.data}`);
        setTimeout(() => {
          navigate(`/admin/committees/detail/${result.data}`);
        }, 1500);
      } else {
        setError(result.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
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

        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '8px'
        }}>
          Tạo Hội đồng Bảo vệ mới
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Điền thông tin cơ bản cho hội đồng. Sau khi tạo, bạn có thể thêm thành viên và phân công đề tài.
        </p>
      </div>

      {/* Messages */}
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
          <span style={{ color: '#C33', flex: 1 }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          background: '#EFE',
          border: '1px solid #CFC',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <CheckCircle size={20} color="#3C3" />
          <span style={{ color: '#3C3', flex: 1 }}>{success}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {/* Committee Code */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Mã Hội đồng <span style={{ color: '#F37021' }}>*</span>
            </label>
            <input
              type="text"
              name="committeeCode"
              value={formData.committeeCode}
              onChange={handleChange}
              required
              placeholder="VD: HD001"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #DDD',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#F37021'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#DDD'}
            />
          </div>

          {/* Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Tên Hội đồng <span style={{ color: '#F37021' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="VD: Hội đồng Bảo vệ Khoa CNTT - Đợt 1/2024"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #DDD',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#F37021'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#DDD'}
            />
          </div>

          {/* Defense Date */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Ngày Bảo vệ
            </label>
            <input
              type="date"
              name="defenseDate"
              value={formData.defenseDate}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #DDD',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#F37021'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#DDD'}
            />
          </div>

          {/* Room */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Phòng
            </label>
            <input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleChange}
              placeholder="VD: A101"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #DDD',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#F37021'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#DDD'}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/admin/committees')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#666',
                border: '1px solid #DDD',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#F5F5F5';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: loading ? '#CCC' : 'linear-gradient(135deg, #F37021 0%, #FF8838 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(243, 112, 33, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(243, 112, 33, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(243, 112, 33, 0.3)';
              }}
            >
              {loading ? (
                <>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Tạo Hội đồng
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CreateCommittee;
