# 🎓 Admin Dashboard - Hệ thống quản lý đồ án tốt nghiệp

## Đại học Đại Nam - Thesis Management System

---

## 📋 Tổng quan

Dashboard quản trị viên được thiết kế để cung cấp giao diện trực quan, dễ sử dụng cho việc quản lý toàn bộ hệ thống đồ án tốt nghiệp. Giao diện tuân thủ bộ nhận diện thương hiệu của Đại học Đại Nam với màu cam chủ đạo (#F37021).

---

## 🎨 Thiết kế giao diện

### Bảng màu chủ đạo
- **Cam chủ đạo**: `#F37021` (Logo Đại học Đại Nam)
- **Xanh dương phụ**: `#1E88E5`
- **Xanh lá**: `#2E7D32`
- **Tím**: `#8E24AA`
- **Đỏ cảnh báo**: `#D32F2F`
- **Nền sáng**: `#FAFAFA`
- **Xám chữ**: `#333333`

### Font chữ
- Segoe UI / Inter / Roboto (hệ thống tự chọn)

---

## 🧩 Cấu trúc Dashboard

### 1. **Header (Thanh công cụ trên cùng)**
- Tên hệ thống: "Quản trị hệ thống đồ án tốt nghiệp"
- Icon thông báo 🔔 với badge số (hiện tại: 3)
- Tên người dùng hiện tại
- Nút đăng xuất

### 2. **Sidebar (Thanh điều hướng bên trái)**
- Logo Đại học Đại Nam
- Menu điều hướng:
  - 🏠 **Trang chủ** (`/admin`)
  - 👥 **Quản lý người dùng** (`/admin/users`)
  - 📘 **Quản lý đề tài** (`/admin/topics`)
  - 🛡️ **Quản lý hội đồng** (`/admin/committees`)
  - ⚙️ **Cấu hình hệ thống** (placeholder)
  - 🧩 **Cài đặt khác** (placeholder)
- Footer: © 2025 Đại học Đại Nam

### 3. **Dashboard Chính** (`/admin`)

#### A. Thẻ thống kê nhanh (Stats Cards)
4 thẻ hiển thị số liệu tổng quan:

| Icon | Tiêu đề | Giá trị | Màu |
|------|---------|---------|-----|
| 👨‍🎓 | Tổng số sinh viên | 324 | Cam |
| 📘 | Đề tài đang thực hiện | 45 | Xanh dương |
| 📄 | Báo cáo nộp tuần này | 132 | Xanh lá |
| 📅 | Lịch bảo vệ sắp tới | 8 | Tím |

#### B. Biểu đồ tiến độ (Progress Chart)
- Biểu đồ cột thể hiện tiến độ hoàn thành đồ án
- Dữ liệu: Đang thực hiện (45), Đã hoàn thành (30), Quá hạn (15), Chờ duyệt (10)
- Hover để xem chi tiết

#### C. Bảng đề tài mới nhất
Hiển thị 3 đề tài mới được tạo gần đây với thông tin:
- Tên đề tài
- Sinh viên thực hiện
- Giảng viên hướng dẫn
- Trạng thái (badge màu)

#### D. Thông báo hệ thống
Danh sách 3 thông báo mẫu về:
- Hội đồng bảo vệ
- Hạn chót báo cáo
- Lịch họp

---

## 📂 Cấu trúc file

```
thesis-frontend/src/
├── pages/admin/
│   ├── Dashboard.tsx              # Trang chủ dashboard
│   ├── Dashboard.css              # Styles cho dashboard
│   ├── UsersManagement.tsx        # Quản lý người dùng
│   ├── TopicsManagement.tsx       # Quản lý đề tài
│   └── CommitteesManagement.tsx   # Quản lý hội đồng
├── components/
│   ├── Layouts/
│   │   └── AdminLayout.tsx        # Layout chung cho admin
│   └── SideNavs/
│       └── AdminNav.tsx           # Menu điều hướng
└── routes/
    └── AppRoutes.tsx              # Định tuyến routes
```

---

## 🔧 Tính năng các module

### 1. **Quản lý người dùng** (`/admin/users`)
- Hiển thị danh sách sinh viên và giảng viên
- Tìm kiếm theo tên/mã
- Lọc theo vai trò (Sinh viên/Giảng viên)
- Thao tác: Sửa, Khóa/Mở khóa tài khoản
- Nút "Thêm người dùng" (UI mock)

**Mock data**: 5 người dùng mẫu

### 2. **Quản lý đề tài** (`/admin/topics`)
- Danh sách đề tài với đầy đủ thông tin
- Tìm kiếm theo tên/mã/sinh viên
- Lọc theo trạng thái (Chờ duyệt/Đã duyệt/Từ chối/Đang thực hiện)
- Thao tác: Xem chi tiết, Duyệt, Từ chối (cho đề tài chờ duyệt)

**Mock data**: 5 đề tài mẫu

### 3. **Quản lý hội đồng** (`/admin/committees`)
- Danh sách hội đồng đã phân công
- Hiển thị đầy đủ: Chủ tịch, Thư ký, Thành viên
- Nút "Tạo hội đồng mới" mở modal

#### Modal tạo hội đồng:
- Form nhập: Đề tài, Sinh viên, Ngày bảo vệ
- Dropdown chọn Chủ tịch (chỉ hiện Tiến sĩ)
- Dropdown chọn Thư ký và Thành viên (theo chuyên ngành)
- Nút "Lưu phân công" hiển thị thông báo thành công

**Mock data**: 2 hội đồng mẫu, 6 giảng viên

---

## 📊 Mock Data

### Stats Cards
```typescript
const mockStats = [
  { label: 'Tổng số sinh viên', value: 324 },
  { label: 'Đề tài đang thực hiện', value: 45 },
  { label: 'Báo cáo nộp tuần này', value: 132 },
  { label: 'Lịch bảo vệ sắp tới', value: 8 }
];
```

### Chart Data
```typescript
const mockChartData = [
  { label: 'Đang thực hiện', value: 45, color: '#f37021' },
  { label: 'Đã hoàn thành', value: 30, color: '#2e7d32' },
  { label: 'Quá hạn', value: 15, color: '#d32f2f' },
  { label: 'Chờ duyệt', value: 10, color: '#1e88e5' }
];
```

### Recent Topics
```typescript
const mockRecentTopics = [
  {
    title: 'Hệ gợi ý học tập',
    student: 'Nguyễn Văn A',
    lecturer: 'TS. Trần Minh Hòa',
    status: 'in-progress',
    statusText: 'Đang thực hiện'
  },
  // ... 2 đề tài khác
];
```

### Notifications
```typescript
const mockNotifications = [
  {
    title: 'Hội đồng bảo vệ K17',
    desc: 'Dự kiến tổ chức 25/12/2025',
    date: '03/10/2025'
  },
  // ... 2 thông báo khác
];
```

---

## 🚀 Chạy ứng dụng

### Cài đặt dependencies
```bash
cd thesis-frontend
npm install
```

### Chạy dev server
```bash
npm run dev
```

### Truy cập
```
http://localhost:5173
```

### Đăng nhập Admin
- Đường dẫn: `/login`
- Sau khi đăng nhập với vai trò ADMIN, hệ thống sẽ redirect đến `/admin`

---

## 📱 Responsive Design

### Desktop (> 1200px)
- Sidebar cố định bên trái (250px)
- Stats cards: 4 cột
- Dashboard content: 2 cột (Chart 2fr | Notifications 1fr)

### Tablet (768px - 1200px)
- Sidebar thu nhỏ (icon-only)
- Stats cards: 2 cột
- Dashboard content: 1 cột (stack vertical)

### Mobile (< 768px)
- Sidebar ẩn, có nút menu ☰
- Stats cards: 1 cột
- Tables có scroll ngang
- Modal full width

---

## 🎯 Mục tiêu thiết kế

✅ **Đã hoàn thành:**
- Giao diện dashboard đầy đủ với mock data
- 4 module chính: Dashboard, Users, Topics, Committees
- Responsive design cho mọi thiết bị
- Theme màu đúng bộ nhận diện Đại học Đại Nam
- Header với thông báo và user info
- Sidebar với logo và menu điều hướng
- Footer thông tin bản quyền

✅ **Sẵn sàng:**
- Kiểm thử UI đầy đủ không cần backend
- Dễ dàng thay mock data bằng API calls
- Structure rõ ràng, dễ maintain

---

## 🔄 Kết nối API (Tương lai)

Khi backend sẵn sàng, thay thế mock data bằng API calls:

```typescript
// Example: Dashboard stats
useEffect(() => {
  fetch('/api/admin/stats')
    .then(res => res.json())
    .then(data => setStats(data));
}, []);
```

Các endpoint cần thiết:
- `GET /api/admin/stats` - Thống kê tổng quan
- `GET /api/admin/chart-data` - Dữ liệu biểu đồ
- `GET /api/admin/recent-topics` - Đề tài mới nhất
- `GET /api/admin/notifications` - Thông báo
- `GET /api/admin/users` - Danh sách người dùng
- `GET /api/admin/topics` - Danh sách đề tài
- `GET /api/admin/committees` - Danh sách hội đồng
- `POST /api/admin/committees` - Tạo hội đồng mới

---

## 📝 Ghi chú quan trọng

⚠️ **Dữ liệu hiện tại là MOCK DATA** - chỉ để demo và test UI
⚠️ **Không có xác thực thật** - sử dụng AuthContext mock
⚠️ **Các thao tác chỉ hiển thị alert** - chưa gọi API thật

📌 **Next steps:**
1. Kết nối backend API
2. Thêm form validation
3. Implement real-time notifications
4. Thêm pagination cho tables
5. Export reports (PDF/Excel)
6. Advanced filtering và search

---

## 👨‍💻 Liên hệ

**Đại học Đại Nam**  
Hệ thống quản lý đồ án tốt nghiệp  
© 2025 All rights reserved

---

## 📄 License

Dự án nội bộ - Đại học Đại Nam
