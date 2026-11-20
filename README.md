# autoclick

Userscript Tampermonkey giúp MUSE bấm **OK** hoặc **Hủy** ngay trên trang xác nhận công ca của Insite. Hộp thoại hiển thị nguyên văn câu hỏi và số ca do Insite cung cấp.

## Cài trên Chrome

1. Mở [bản cài cho Tampermonkey](https://raw.githubusercontent.com/nnnluv7/autoclick/main/muse-xac-nhan-cong.user.js) trong trình duyệt có Tampermonkey rồi chọn **Install**.
2. Nếu Chrome yêu cầu, mở phần quản lý tiện ích Tampermonkey và bật **Allow User Scripts**.
3. Nếu hộp thoại Chrome cũ đang mở, chọn **Hủy**. Tải lại [trang xác nhận công ca](https://newinsite.thegioididong.com/office/xac-nhan-congca).

## Dùng với MUSE

Chọn danh sách ca như thường lệ rồi yêu cầu MUSE bấm **Xác nhận công**. Hộp thoại **Xác nhận công ca** xuất hiện ngay trên trang. MUSE có thể đọc số ca và bấm **OK** để tiếp tục, hoặc **Hủy** để dừng. Phím **Esc** cũng hủy thao tác.

Nếu số ca hoặc bảng ca thay đổi trước khi Insite xử lý lựa chọn, script yêu cầu xem lại câu hỏi. Khi tên nút hoặc câu hỏi khác với mẫu hỗ trợ, Chrome xử lý hộp thoại gốc của trang.
