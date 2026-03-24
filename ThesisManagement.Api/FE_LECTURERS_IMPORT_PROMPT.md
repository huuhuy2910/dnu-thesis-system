# FE AI Prompt - Sua Luong Import Giang Vien (Backend Tu Dong Dong Bo LecturerTags)

Ban la frontend engineer, nhiem vu la sua man hinh import giang vien hien co de dung luong backend moi.

## Ket luan nghiep vu backend hien tai

- Import module lecturers da tu dong dong bo LecturerTags trong cung luong import.
- FE KHONG can goi nhieu API LecturerTags/create cho tung dong nua.
- FE chi can upload file import qua DataExchange API.

## API import giang vien

- Method: POST
- URL: /api/DataExchange/import/lecturers
- Content-Type: multipart/form-data
- Form fields:
  - file: bat buoc (.xlsx, .csv, .json)
  - format: tuy chon (xlsx | csv | json)

## Quy tac dong bo LecturerTags khi import

- Neu cot tagCodes co trong file, backend se dong bo tags cua giang vien theo danh sach tagCodes.
- Backend se them lien ket moi, xoa lien ket khong con trong danh sach, giu lien ket hop le.
- Neu co bat ky tagCode khong ton tai, dong import bi loi.
- Khi loi do tagCode khong ton tai, dong do khong ghi LecturerProfile/LecturerTags.
- Ho tro cot assignedByUserCode (tuy chon): neu co thi phai ton tai UserCode trong he thong.

## Cac truong file import lecturers ho tro hien tai

- lecturerCode (tuy chon)
- departmentCode (tuy chon)
- fullName (tuy chon)
- degree (tuy chon)
- email (tuy chon)
- phoneNumber (tuy chon)
- guideQuota (tuy chon)
- defenseQuota (tuy chon)
- currentGuidingCount (tuy chon)
- gender (tuy chon)
- dateOfBirth (tuy chon, nen dung yyyy-MM-dd)
- address (tuy chon)
- notes (tuy chon)
- tagCodes (tuy chon, phan tach bang , ; |)
- assignedByUserCode (tuy chon, chi dung khi can luu nguoi gan tag)

## Luu y ve user khi import lecturers

- He thong tu dong dam bao co User cho giang vien.
- UserCode duoc dong bo theo lecturerCode.
- Mat khau khoi tao hash theo lecturerCode.
- userCode trong file import neu co khong duoc backend su dung de ghi de.

## Yeu cau sua UI import

1. Giu layout trang import giang vien hien co.
2. Cap nhat helper text tren UI:
  - "Import giang vien da tu dong dong bo tags theo cot tagCodes."
3. Bo workflow FE goi hang loat LecturerTags/create sau import.
4. Hien thi ro ket qua tong hop:
  - so dong tao moi
  - so dong cap nhat
  - so dong loi
  - chi tiet loi theo row
5. O phan huong dan template, bo sung cot tagCodes va assignedByUserCode.

## Mapping cot FE -> backend

- ma giang vien -> lecturerCode
- ma khoa -> departmentCode
- ho ten -> fullName
- hoc vi -> degree
- email -> email
- dien thoai -> phoneNumber
- chi tieu huong dan -> guideQuota
- chi tieu hoi dong -> defenseQuota
- so luong dang huong dan -> currentGuidingCount
- gioi tinh -> gender
- ngay sinh -> dateOfBirth
- dia chi -> address
- ghi chu -> notes
- danh sach ma tag -> tagCodes
- user gan tag -> assignedByUserCode

## Vi du file CSV import lecturers

lecturerCode,departmentCode,fullName,degree,email,phoneNumber,guideQuota,defenseQuota,currentGuidingCount,gender,dateOfBirth,address,notes,tagCodes,assignedByUserCode
GV001,IT,Nguyen Van A,TS,a@dnu.edu.vn,0901000001,12,8,3,Nam,1980-05-20,Da Nang,Chuyen nganh AI,AI;ML,ADMIN001
GV002,SE,Tran Thi B,ThS,b@dnu.edu.vn,0901000002,10,6,1,Nu,1987-10-11,Da Nang,,SE;DATA,

## Response can render tren FE

- module
- format
- totalRows
- createdCount
- updatedCount
- failedCount
- errors[]
