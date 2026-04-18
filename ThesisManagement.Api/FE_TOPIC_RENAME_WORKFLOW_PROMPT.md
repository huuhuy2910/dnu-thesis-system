# Prompt cho AI FE: Workflow đổi tên đề tài

Bạn là AI FE làm việc trong dự án ThesisManagement. Nhiệm vụ của bạn là xây dựng popup "Đơn xin đổi đề tài" và tích hợp đúng các API workflow mới ở backend.

## Mục tiêu

- Hiển thị danh sách/chi tiết đơn xin đổi tên đề tài trong popup.
- Cho phép tạo mới, cập nhật, xóa, duyệt/từ chối và sinh file Word mẫu.
- Không tự suy diễn endpoint ngoài danh sách bên dưới.
- Không ghép thêm prefix host vào URL tuyệt đối hoặc URL Mega/backend-proxy đã hoàn chỉnh.
- Với URL tương đối, chỉ prefix bằng base URL của backend theo chuẩn hiện có của FE.

## Base API

- Base route: `/api/workflows/topic-rename-requests`
- Tất cả response đều bọc trong `ApiResponse<T>`.
- Khi đọc dữ liệu, ưu tiên `data` và `totalCount` trong envelope nếu có.

## API phải dùng

### 1) Lấy danh sách

- `GET /api/workflows/topic-rename-requests/get-list`
- Query params từ `TopicRenameRequestFilter`:
  - `topicID`
  - `topicCode`
  - `status`
  - `requestedByUserCode`
  - `reviewedByUserCode`
  - `oldTitle`
  - `newTitle`
  - các field phân trang/sort kế thừa từ `BaseFilter`

Dùng cho:

- bảng danh sách trong popup
- filter nhanh theo mã đề tài, trạng thái, người tạo, người duyệt

### 2) Lấy chi tiết

- `GET /api/workflows/topic-rename-requests/get-detail/{id}`

Response `TopicRenameRequestDetailDto` có:

- `request`
- `templateData`
- `files`
- `history`

Dùng cho:

- tab chi tiết
- tab lịch sử
- khu vực tải file template

### 3) Lấy dữ liệu mặc định để tạo mới

- `GET /api/workflows/topic-rename-requests/get-create`

Response là `TopicRenameRequestCreateDto` rỗng để FE dựng form tạo mới.

### 4) Tạo mới

- `POST /api/workflows/topic-rename-requests/create`
- Body `TopicRenameRequestCreateDto`:
  - `topicID` hoặc `topicCode`
  - `newTitle`
  - `reason`

Yêu cầu FE:

- Cho phép nhập một trong hai cách định danh đề tài: `topicID` hoặc `topicCode`.
- Không cho submit nếu thiếu cả hai.
- Sau khi tạo thành công, refresh list và mở lại detail.

### 5) Lấy dữ liệu để sửa

- `GET /api/workflows/topic-rename-requests/get-update/{id}`

Response `TopicRenameRequestUpdateDto` dùng để prefill form sửa.

### 6) Cập nhật

- `PUT /api/workflows/topic-rename-requests/update/{id}`
- Body `TopicRenameRequestUpdateDto`:
  - `newTitle`
  - `reason`

Chỉ cho sửa khi trạng thái là `Pending` hoặc `Rejected`.
Nếu backend trả lỗi trạng thái, FE phải hiện message rõ ràng.

### 7) Xóa

- `DELETE /api/workflows/topic-rename-requests/delete/{id}`

Dùng cho:

- xóa request ở trạng thái cho phép
- sau xóa, remove item khỏi list ngay hoặc reload list

### 8) Duyệt / từ chối

- `POST /api/workflows/topic-rename-requests/{id}/review`
- Body `TopicRenameRequestReviewDto`:
  - `action`: `Approve` hoặc `Reject`
  - `comment`: tùy chọn

Quy tắc UI:

- Chỉ hiển thị nút duyệt/từ chối cho role được phép.
- Khi duyệt/từ chối, luôn có confirm dialog.
- Nếu `action=Approve`, detail phải phản ánh tên đề tài mới và trạng thái đã áp dụng.

### 9) Sinh file Word mẫu

- `POST /api/workflows/topic-rename-requests/{id}/generate-template`
- Query optional: `placeOfBirth`

Response `TopicRenameRequestFileReadDto` có:

- `fileUrl`
- `fileName`
- `fileType`
- `storageProvider`
- các metadata file khác

Quy tắc FE:

- Sau khi sinh file, hiển thị nút tải xuống ngay.
- Không suy diễn đường dẫn file nếu `fileUrl` đã là URL hoàn chỉnh.
- Nếu `fileUrl` là relative, chỉ prefix theo base URL backend hiện tại.

### 10) Tải file template

- `GET /api/workflows/topic-rename-requests/{id}/download-template`

Đây là endpoint trả file stream trực tiếp.
FE cần:

- mở tab mới hoặc trigger download file
- không gọi qua JSON parser

## Trạng thái hiển thị

Dùng badge rõ ràng cho các trạng thái request:

- `Pending`
- `Approved`
- `Rejected`
- các trạng thái khác nếu backend trả về

Gợi ý màu:

- Pending: vàng
- Approved: xanh
- Rejected: đỏ
- Unknown: xám

## Bố cục popup đề xuất

Popup cần là modal lớn, có thể scroll, tối ưu cho cả desktop và màn hình nhỏ.

### 1) Header

- Tiêu đề: `Đơn xin đổi đề tài`
- Subheader nhỏ: mã request, trạng thái, ngày tạo
- Góc phải: badge trạng thái
- Nút đóng modal

### 2) Khu thông tin tổng quan

Hiển thị 2 cột:

- Cột trái: thông tin sinh viên/giảng viên
- Cột phải: thông tin đề tài cũ/mới

Các field nên có:

- Mã request
- Mã đề tài
- Tên đề tài hiện tại
- Tên đề tài mới
- Lý do đổi
- Người tạo
- Vai trò người tạo
- Người duyệt
- Vai trò người duyệt
- Thời gian tạo
- Thời gian duyệt
- Thời gian áp dụng

### 3) Khối dữ liệu template

Hiển thị preview các dữ liệu sẽ điền vào file Word:

- Họ tên sinh viên
- Ngày sinh
- Nơi sinh
- Mã sinh viên
- Khóa/Năm nhập học
- Lớp
- Ngành
- Số điện thoại
- Email
- Tên đề tài hiện tại
- Người hướng dẫn
- Tên đề tài mới
- Lý do
- Khoa/Bộ môn

Nếu `placeOfBirth` trống, hiển thị placeholder `Chưa có` thay vì để trống hoàn toàn.

### 4) Danh sách file

- Hiển thị file đã sinh, file đính kèm, file hiện tại.
- Mỗi file có nút `Tải xuống`.
- Nếu có nhiều file, đánh dấu file current.

### 5) Lịch sử đổi tên

- Render timeline hoặc table nhỏ.
- Có các cột tối thiểu:
  - thời gian hiệu lực
  - tên cũ
  - tên mới
  - loại thay đổi
  - người thực hiện
  - người phê duyệt
  - ghi chú

### 6) Footer action bar

Nút theo ngữ cảnh:

- `Tạo mới`
- `Cập nhật`
- `Xóa`
- `Duyệt`
- `Từ chối`
- `Sinh file Word`
- `Tải file Word`
- `Đóng`

Quy tắc:

- Không hiển thị mọi nút cùng lúc.
- Chỉ render action hợp lệ theo trạng thái và role.
- Disable nút trong lúc loading.

## Hành vi UI

- Khi mở popup ở chế độ `create`, gọi `get-create`.
- Khi mở popup ở chế độ `edit`, gọi `get-update/{id}`.
- Khi mở popup ở chế độ `detail`, gọi `get-detail/{id}`.
- Khi mở popup ở chế độ `review`, gọi `get-detail/{id}` trước, rồi mới render action.
- Khi vừa tạo/cập nhật/duyệt, refresh `get-detail/{id}` và danh sách.
- Hiển thị loading state rõ ràng cho từng khối, không khóa toàn bộ popup nếu chỉ đang tải file.
- Có confirm dialog trước `delete`, `approve`, `reject`.

## Xử lý lỗi

- Nếu backend trả `404`, hiển thị "Không tìm thấy đơn xin đổi đề tài".
- Nếu backend trả `400`, hiển thị lỗi validate ngay dưới field liên quan.
- Nếu backend trả `403`, ẩn action và hiển thị thông báo không đủ quyền.
- Nếu lỗi tải file, hiển thị fallback link hoặc toast lỗi.

## Quy tắc kỹ thuật cho FE

- Luôn dùng đúng envelope `ApiResponse<T>`.
- Không giả định `data` là object phẳng nếu response đã bọc thêm `totalCount`.
- Không hard-code status text nếu backend đã có value chuẩn.
- Không tự thêm domain khi `fileUrl` đã là absolute URL.
- Không tự đổi route hoặc suffix của endpoint.
- Giữ popup và form theo cấu trúc hiện có của dự án, nhưng ưu tiên một layout rõ, gọn, dễ thao tác.

## Kết quả mong đợi

Sau khi áp dụng prompt này, FE AI phải tạo được:

- một popup modal cho workflow đổi tên đề tài
- form tạo/sửa/duyệt đúng DTO
- danh sách request kèm filter
- chi tiết request kèm file và lịch sử
- nút sinh/tải template Word
- xử lý URL file đúng với hạ tầng storage hiện tại
