# 📘 English Title: Graduation Thesis Management and Defense Tracking System for IT Students at Dai Nam University

# 📗 Vietnamese Title: Hệ thống quản lý đăng ký, theo dõi tiến độ và bảo vệ đồ án tốt nghiệp cho sinh viên ngành CNTT – Trường Đại học Đại Nam

---

## 🇻🇳 Vietnamese Version

Hệ thống quản lý đăng ký, theo dõi tiến độ và bảo vệ đồ án tốt nghiệp cho sinh viên ngành Công nghệ thông tin - Trường Đại học Đại Nam.

> 📘 _Dự án được thực hiện cho học phần **Chuyển đổi số (Digital Transformation - DX)** và cũng là MVP(Minimum Viable Product) nền móng phục vụ xây dựng hệ thống đồ án tốt nghiệp hoàn chỉnh sau này._

### 👥 Thành viên nhóm

- Nguyễn Hữu Huy
- Nguyễn Thanh Bình

### 🚀 Mục tiêu hệ thống

- Cho phép sinh viên **đăng ký đề tài** tốt nghiệp và theo dõi quá trình thực hiện.
- Hỗ trợ giảng viên **phê duyệt đề tài**, **theo dõi tiến độ**, và **đánh giá kết quả**.
- Tạo lập và quản lý **hội đồng bảo vệ**, phân công vai trò như Chủ tịch, Thư ký, Phản biện.
- Gửi **thông báo tự động** đến sinh viên và giảng viên khi đến hạn.
- Quản lý **kết quả bảo vệ, điểm số, nhận xét** và thống kê toàn bộ dữ liệu.

### 🛠️ Công nghệ sử dụng

| Tầng hệ thống | Công nghệ                     |
| ------------- | ----------------------------- |
| Backend API   | ASP.NET Core 8 (RESTful API)  |
| Frontend      | ReactJS + TypeScript + Vite   |
| Database      | SQL Server                    |
| Giao tiếp     | Fetch API, JSON               |
| Công cụ       | Swagger, Git, GitHub, VS Code |

### 📂 Cấu trúc dự án

- `/backend` – API backend với ASP.NET Core 8
- `/frontend` – Giao diện web bằng React + TS
- `/docs` – Tài liệu thiết kế, CSDL, test case

---

## 🇺🇸 English Version

Graduation Thesis Management and Defense Tracking System for IT students at Dai Nam University.

> 🧩 _This project is developed for the **Digital Transformation (DX)** course and also serves as a foundational MVP(Minimum Viable Product) for the future Graduation Thesis Management System._

### 👥 Team Members

- Nguyen Huu Huy
- Nguyen Thanh Binh

### 🚀 System Objectives

- Allow students to **register thesis topics** and track their progress.
- Enable lecturers to **approve topics**, **monitor progress**, and **evaluate results**.
- Create and manage **defense committees**, assigning roles such as Chair, Secretary, Reviewer.
- Send **automatic reminders and notifications** to students and lecturers.
- Manage and store **defense outcomes, scores, feedback**, and statistics.

### 🛠️ Technologies Used

| Layer         | Technology                    |
| ------------- | ----------------------------- |
| Backend API   | ASP.NET Core 8 (RESTful API)  |
| Frontend      | ReactJS + TypeScript + Vite   |
| Database      | SQL Server                    |
| Communication | Fetch API, JSON               |
| Tools         | Swagger, Git, GitHub, VS Code |

### 📁 Project Structure

- `/backend` – Backend API built with ASP.NET Core 8
- `/frontend` – ReactJS + TypeScript web frontend
- `/docs` – Documentation, database, test cases

---

## ⚙️ Setup Instructions

### Requirements

- [.NET SDK 8](https://dotnet.microsoft.com/download)
- [Node.js (v18+)](https://nodejs.org/)
- [VS Code](https://code.visualstudio.com/)

### ▶️ Run Backend (.NET 8)

```bash
cd backend
dotnet restore
dotnet run
```

### ▶️ Run Frontend (React + TypeScript)

```bash
cd frontend
npm install
npm run dev
```

---

## 📄 License

Academic use only – reuse with proper credit.
