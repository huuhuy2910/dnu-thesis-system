# 📋 Hệ Thống Activity Logging - Hướng Dẫn Sử Dụng

## 🎯 Tổng Quan

Hệ thống ghi log tự động đã được tích hợp vào ThesisManagement API để theo dõi tất cả các hoạt động quan trọng trong hệ thống.

## 🔧 Cách Hoạt Động

### 1. **Auto-Logging trong EF Core**

- Tự động phát hiện INSERT/UPDATE/DELETE khi SaveChangesAsync()
- Ghi log chi tiết: Old Value, New Value, User thực hiện, Timestamp, IP Address, Device Info
- **Không cần** code thêm gì trong controller!

### 2. **Các Loại Log Được Ghi**

#### 📝 CREATE (INSERT)

```json
{
  "actionType": "CREATE",
  "oldValue": null,
  "newValue": "{ ... dữ liệu mới được tạo ... }",
  "actionDescription": "Tạo mới đề tài"
}
```

#### ✏️ UPDATE

```json
{
  "actionType": "UPDATE",
  "oldValue": "{ 'Title': 'Old Title', 'Status': 'Draft' }",
  "newValue": "{ 'Title': 'New Title', 'Status': 'Approved' }",
  "actionDescription": "Cập nhật đề tài - Thay đổi: Title, Status"
}
```

#### ❌ DELETE

```json
{
  "actionType": "DELETE",
  "oldValue": "{ ... dữ liệu bị xóa ... }",
  "newValue": null,
  "actionDescription": "Xóa đề tài"
}
```

#### 🔐 LOGIN

```json
{
  "actionType": "LOGIN",
  "actionDescription": "Đăng nhập thành công vào hệ thống",
  "module": "Authentication"
}
```

## 🚀 Cách Sử Dụng

### Frontend - Gửi Thông Tin User qua Headers

Sau khi login thành công, frontend **BẮT BUỘC** gửi thông tin user trong headers của mọi request:

```javascript
// Sau khi login thành công
const loginResponse = await api.post("/Auth/login", { username, password });
const { userCode, role, data } = loginResponse.data;

// Lưu vào localStorage hoặc state management
localStorage.setItem("userId", data.userID);
localStorage.setItem("userCode", userCode);
localStorage.setItem("userRole", role);

// ✅ GỬI TRONG TẤT CẢ CÁC REQUEST SAU ĐÓ
axios.defaults.headers.common["X-User-ID"] = data.userID;
axios.defaults.headers.common["X-User-Code"] = userCode;
axios.defaults.headers.common["X-User-Role"] = role;
```

#### Ví Dụ với Axios

```javascript
// Setup axios interceptor
axios.interceptors.request.use((config) => {
  const userId = localStorage.getItem("userId");
  const userCode = localStorage.getItem("userCode");
  const userRole = localStorage.getItem("userRole");

  if (userId) config.headers["X-User-ID"] = userId;
  if (userCode) config.headers["X-User-Code"] = userCode;
  if (userRole) config.headers["X-User-Role"] = userRole;

  return config;
});
```

#### Ví Dụ với Fetch

```javascript
fetch("/api/Topics/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-User-ID": userId,
    "X-User-Code": userCode,
    "X-User-Role": userRole,
  },
  body: JSON.stringify(topicData),
});
```

### Backend - Tự Động Hoàn Toàn

Không cần làm gì thêm! Khi bạn gọi:

```csharp
await _uow.Topics.AddAsync(newTopic);
await _uow.SaveChangesAsync(); // ✅ Auto log CREATE
```

```csharp
topic.Status = "Approved";
_uow.Topics.Update(topic);
await _uow.SaveChangesAsync(); // ✅ Auto log UPDATE
```

```csharp
_uow.Topics.Remove(topic);
await _uow.SaveChangesAsync(); // ✅ Auto log DELETE
```

## 📊 Xem Log qua API

### 1. Lấy tất cả logs (có phân trang)

```
GET /SystemActivityLogs/get-list?page=1&pageSize=20
```

### 2. Lọc theo entity

```
GET /SystemActivityLogs/get-list?EntityName=Topic
```

### 3. Lọc theo hành động

```
GET /SystemActivityLogs/get-list?ActionType=UPDATE
```

### 4. Lọc theo người dùng

```
GET /SystemActivityLogs/get-list?UserCode=STU20230001
```

### 5. Lọc theo module

```
GET /SystemActivityLogs/get-list?Module=Topic
```

### 6. Lọc theo thời gian

```
GET /SystemActivityLogs/get-list?PerformedFrom=2025-01-01&PerformedTo=2025-12-31
```

### 7. Thống kê theo action type

```
GET /SystemActivityLogs/statistics/by-action
```

Response:

```json
{
  "success": true,
  "data": [
    { "actionType": "CREATE", "count": 156 },
    { "actionType": "UPDATE", "count": 89 },
    { "actionType": "DELETE", "count": 12 },
    { "actionType": "LOGIN", "count": 450 }
  ]
}
```

### 8. Thống kê theo module

```
GET /SystemActivityLogs/statistics/by-module
```

### 9. Thống kê top users

```
GET /SystemActivityLogs/statistics/top-users?top=10
```

### 10. Thống kê hoạt động gần đây

```
GET /SystemActivityLogs/statistics/recent-activities?hours=24
```

## 🔍 Chi Tiết Các Trường

| Trường            | Mô Tả                | Ví Dụ                                             |
| ----------------- | -------------------- | ------------------------------------------------- |
| EntityName        | Tên bảng bị tác động | "Topic", "StudentProfile", "ProgressSubmission"   |
| EntityID          | Code của bản ghi     | "TOP20250120001", "STU20230001"                   |
| ActionType        | Loại hành động       | CREATE, UPDATE, DELETE, LOGIN, LOGOUT             |
| ActionDescription | Mô tả chi tiết       | "Cập nhật điểm bảo vệ từ 7.5 lên 8.0"             |
| OldValue          | Giá trị cũ (JSON)    | `{"Title":"Old","Status":"Draft"}`                |
| NewValue          | Giá trị mới (JSON)   | `{"Title":"New","Status":"Approved"}`             |
| UserID            | ID người thực hiện   | 123                                               |
| UserCode          | Mã người dùng        | "LEC001", "STU20230001"                           |
| UserRole          | Vai trò              | "Student", "Lecturer", "Admin"                    |
| IPAddress         | IP thực hiện         | "192.168.1.100"                                   |
| DeviceInfo        | Thiết bị + Browser   | "Chrome on Windows 10"                            |
| Module            | Phân hệ              | "Topic", "Milestone", "Defense", "Authentication" |
| PerformedAt       | Thời gian (UTC)      | "2025-10-20T10:30:45Z"                            |
| Status            | Trạng thái           | SUCCESS, FAILED, PENDING                          |

## 🎨 Các Module Được Phân Loại

- **User**: User, StudentProfile, LecturerProfile
- **Topic**: Topic, CatalogTopic, TopicLecturer, TopicTag
- **Milestone**: ProgressMilestone, ProgressSubmission, MilestoneTemplate
- **Committee**: Committee, CommitteeMember, CommitteeSession, CommitteeTag
- **Defense**: DefenseAssignment, DefenseScore
- **Submission**: SubmissionFile
- **Department**: Department
- **Catalog**: Tag, CatalogTopicTag, LecturerTag
- **Authentication**: Login, Logout

## ⚠️ Lưu Ý Quan Trọng

### 1. **Frontend PHẢI gửi headers**

Nếu không gửi `X-User-ID`, `X-User-Code`, `X-User-Role`, log sẽ ghi là "SYSTEM" hoặc "Unknown"

### 2. **Log không ảnh hưởng performance**

- Log được thực hiện ASYNC sau khi transaction chính thành công
- Nếu log fail, không làm gián đoạn logic nghiệp vụ

### 3. **Dữ liệu nhạy cảm**

- Password không được log (đã filter)
- OldValue/NewValue giới hạn độ sâu 3 levels để tránh circular reference

### 4. **Không log bản thân SystemActivityLog**

- Tránh infinite loop

## 🛠️ Troubleshooting

### Log không có UserID/UserCode?

**Nguyên nhân**: Frontend chưa gửi headers
**Giải pháp**: Kiểm tra axios interceptor hoặc fetch headers

### Log ghi "SYSTEM" thay vì user thực tế?

**Nguyên nhân**: Headers không được gửi hoặc middleware chưa extract đúng
**Giải pháp**:

1. Check browser DevTools > Network > Headers
2. Đảm bảo `X-User-ID`, `X-User-Code`, `X-User-Role` có trong request

### OldValue/NewValue là null?

**Nguyên nhân**: Bình thường với CREATE (no old) hoặc DELETE (no new)
**Giải pháp**: Không cần sửa, đây là behavior đúng

## 📈 Best Practices

1. **Luôn gửi user headers** sau khi login
2. **Logout** nên clear headers: `delete axios.defaults.headers.common['X-User-ID']`
3. **Định kỳ archive logs** nếu bảng quá lớn (>1M records)
4. **Index đã được tạo** trên các trường: EntityName, ActionType, UserCode, PerformedAt, Module

## 🎉 Kết Luận

Hệ thống logging đã sẵn sàng! Chỉ cần:

1. ✅ Frontend gửi user headers
2. ✅ Backend tự động log mọi thứ
3. ✅ Xem log qua API hoặc query database trực tiếp

Happy logging! 🚀
