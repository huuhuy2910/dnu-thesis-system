<h2 align="center">
 Hệ thống Quản lý Đồ Án Tốt Nghiệp (FIT – Đại học Đại Nam)
</h2>

<div align="center">
    <p align="center">
        <img src="docs/aiotlab_logo.png" alt="AIoTLab Logo" width="170"/>
        <img src="docs/fitdnu_logo.png" alt="FIT DNU Logo" width="180"/>
        <img src="docs/dnu_logo.png" alt="DaiNam University Logo" width="200"/>
    </p>

[![AIoTLab](https://img.shields.io/badge/AIoTLab-green?style=for-the-badge)](https://www.facebook.com/DNUAIoTLab)
[![Faculty of Information Technology](https://img.shields.io/badge/Faculty%20of%20Information%20Technology-blue?style=for-the-badge)](https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin)
[![DaiNam University](https://img.shields.io/badge/DaiNam%20University-orange?style=for-the-badge)](https://dainam.edu.vn)

</div>

> **Mô tả ngắn:**  Hệ thống quản lý toàn bộ vòng đời đồ án tốt nghiệp — đăng ký đề tài, theo dõi tiến độ, phân công hội đồng, tổ chức bảo vệ và chấm điểm.
> 
> Hiện tại đã hoàn thành 3/4 module chính (đăng ký – phân công – bảo vệ); module chấm điểm và thống kê đang được hoàn thiện & tối ưu.
> 
> Đây là phiên bản MVP (Minimum Viable Product) — đã hoạt động ổn định với các chức năng lõi và sẵn sàng mở rộng.
#### Thực hiện bởi: Nguyễn Thanh Bình & Nguyễn Hữu Huy
#### Lớp CNTT 16-01 — Khoa Công nghệ Thông tin, Trường Đại học Đại Nam
## ✨ Giới thiệu nhanh

* **Đối tượng:** Sinh viên, giảng viên, quản trị khoa.
* **Mục tiêu:** Chuẩn hóa quy trình đồ án, giảm thao tác thủ công, tăng tính minh bạch.
* **Trạng thái:** MVP với các chức năng lõi (đăng ký đề tài, phân công hội đồng, lịch bảo vệ, chấm điểm).

---

## 🚀 Tính năng chính

* **Sinh viên**

  * Đăng ký đề tài, nộp hồ sơ, theo dõi tiến độ.
  * Xem lịch bảo vệ, nhận thông báo kết quả.
* **Giảng viên**

  * Duyệt / điều phối đề tài, quản lý hướng dẫn.
  * Tham gia / chấm điểm hội đồng, ghi nhận nhận xét.
* **Quản trị khoa**

  * Tạo/phiên phân công hội đồng (Chủ tịch / Thư ký / Phản biện).
  * Sắp lịch theo phiên, quản lý phòng & phòng tránh xung đột.
* **Hệ thống**

  * Báo cáo, thống kê tổng hợp.
  * Ràng buộc nghiệp vụ: tránh trùng lịch giảng viên, tránh tham gia hội đồng cho đề tài mình hướng dẫn, v.v.

---

## 🗂️ Mô hình tổng thể hệ thống

> ![Mô hình tổng thể hệ thống](docs/overview-diagram.png)

*Hình minh họa: Vai trò người dùng, luồng chức năng chính (đăng ký → duyệt → phân công → bảo vệ → chấm điểm).*

---

## 🧩 Kiến trúc & Công nghệ

| Tầng        | Công nghệ                                             |
| ----------- | ----------------------------------------------------- |
| Backend API | ASP.NET Core 8 (C#), Entity Framework Core, Swagger   |
| Frontend    | React + TypeScript + Vite, TailwindCSS, Framer Motion |
| CSDL        | SQL Server                                            |
| Giao tiếp   | JSON over HTTP (Fetch API / Axios)                    |
| Công cụ     | GitHub, VS Code, Docker (tùy chọn)                    |

*Sơ đồ kiến trúc có thể xem tại* `docs/architecture.png`.

---

## 📁 Cấu trúc thư mục (tóm tắt)

```
dnu-thesis-system/
├─ ThesisManagement.Api/        # Backend ASP.NET Core 8
│  ├─ Controllers/              # REST controllers
│  ├─ DTOs/                     # DTOs và ApiResponse<T>
│  └─ Services/                 # Business logic
└─ thesis-frontend/             # Frontend React + TypeScript + Vite
   ├─ src/pages/                # Trang (admin, lecturer, student)
   ├─ src/components/           # UI components
   ├─ src/api/                  # API clients (e.g. committeeAssignmentApi)
   └─ src/context/              # Auth, Toast, Theme
```

---

## ⚙️ Cài đặt & Chạy nhanh

**Yêu cầu:** Node.js ≥ 18, npm, .NET SDK 8.0, SQL Server (hoặc Docker SQL Server).

```bash
# Clone repo
git clone https://github.com/huuhuy2910/dnu-thesis-system.git
cd dnu-thesis-system

# Frontend
cd thesis-frontend
npm install
npm run dev         # server dev trên Vite

# Backend
cd ../ThesisManagement.Api
dotnet restore
dotnet run          # API chạy ở môi trường Development (ví dụ: https://localhost:5145)
```

> Lưu ý: frontend sử dụng proxy (vite.config.ts) hoặc `VITE_API_BASE_URL` trong `.env` để gọi API.

---

## 🔐 Cấu hình môi trường (.env)

**Frontend** (`thesis-frontend/.env`):

```bash
VITE_API_BASE_URL=http://localhost:5145/api
VITE_APP_NAME=DNU Thesis System
```

**Backend** (`appsettings.Development.json`): cấu hình kết nối SQL Server, CORS, logging.

---

## 📡 API tiêu biểu (ví dụ JSON)

**Endpoint:** `GET /api/CommitteeAssignment/student-defense/{studentCode}`

**Response mẫu:**

```json
{
  "success": true,
  "data": {
    "studentCode": "STU005",
    "topicCode": "TOP2025_005_AI",
    "title": "Hệ thống dự đoán điểm học tập",
    "committee": {
      "committeeCode": "COM20251023001",
      "name": "HỘI ĐỒNG 1",
      "defenseDate": "2025-10-30T00:00:00",
      "room": "302 - GD1",
      "session": 1,
      "startTime": "08:45:00",
      "endTime": "09:30:00",
      "members": [
        { "name": "Phan Đức Anh", "role": "Chủ tịch" }
      ]
    }
  }
}
```

Frontend gọi qua `committeeAssignmentApi.getStudentDefense(studentCode)` để hiển thị lịch bảo vệ.


---

## 🖥️ Giao diện Chính Theo Từng Vai Trò

> *Minh họa các giao diện chính của hệ thống: Trang chủ, Quản trị viên, Giảng viên và Sinh viên.*

---

### 🏠 Trang Giới Thiệu Chính

> Trang chủ hoặc màn hình đăng nhập của hệ thống.

<p align="center">
  <img src="https://github.com/user-attachments/assets/a3d5f49c-5992-4c12-b908-41ee777b1827" alt="Homepage" width="900"/>
</p>

---

### 🧭 Giao Diện Quản Trị Viên (Admin)

> Dashboard quản trị viên — quản lý đề tài, hội đồng, phân công và thống kê.

<p align="center">
  <img src="https://github.com/user-attachments/assets/c6cad2af-3840-4315-ab61-4b5fd5da6768" alt="Admin Dashboard" width="900"/>
</p>

---

### 👨‍🏫 Giao Diện Giảng Viên (Lecturer)

> Dashboard giảng viên — xem lịch hội đồng, duyệt đề tài và chấm điểm sinh viên.

<p align="center">
  <img src="https://github.com/user-attachments/assets/362a218d-be74-4290-ad61-001860a6f560" alt="Lecturer Dashboard" width="900"/>
</p>

---

### 🎓 Giao Diện Sinh Viên (Student)

> Dashboard sinh viên — theo dõi tiến độ, xem lịch bảo vệ và thông tin hội đồng.

<p align="center">
  <img src="https://github.com/user-attachments/assets/ed0d2bdf-0933-4c24-ad68-468e70ea5293" alt="Student Dashboard" width="900"/>
</p>

---

✅ *Các giao diện trên được thiết kế trực quan, nhất quán và thân thiện với từng vai trò người dùng.*

---

## ✅ Lộ trình phát triển (Roadmap rút gọn)

* [ ] ===Phân quyền chi tiết theo chức năng (RBAC)
* [ ] Đồng bộ thông báo & email (real-time)
* [ ] Lập lịch tự động: xử lý xung đột phòng & giảng viên
* [ ] Báo cáo nâng cao & xuất dữ liệu (Excel/PDF)
* [ ] Thêm unit/integration tests, CI/CD

---

## 🤝 Đóng góp

Rất hoan nghênh mọi đóng góp:

1. Fork repository và tạo branch từ `main`.
2. Thực hiện thay đổi, viết mô tả commit rõ ràng.
3. Mở Pull Request với mô tả chi tiết, kèm ảnh chụp (nếu có).

**Quy ước code:**

* Frontend: TypeScript strict mode.
* Backend: API trả về theo `ApiResponse<T>`.

---

## 📬 Liên hệ

* [nguyenhuuhuy489@gmail.com](mailto:nguyenhuuhuy489@gmail.com)
* [nguyenbinh041104@gmail.com](mailto:nguyenbinh041104@gmail.com)

Hoặc mở issue trên GitHub nếu phát hiện lỗi hoặc cần tính năng.

---

© 2025 — Hệ thống Quản lý Đồ Án Tốt Nghiệp — FIT, Đại học Đại Nam
