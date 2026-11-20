# autoclick

Userscript Tampermonkey cho trang xác nhận công ca của Insite.

## Cài đặt hoặc cập nhật

1. Mở [bản cài cho Tampermonkey](https://raw.githubusercontent.com/nnnluv7/autoclick/main/muse-xac-nhan-cong.user.js) trong trình duyệt có Tampermonkey và chọn **Install** hoặc **Update**.
2. Nếu Chrome yêu cầu quyền chạy script, bật **Allow User Scripts** trong phần quản lý tiện ích Tampermonkey.
3. Sau khi xử lý xong các chỉnh sửa chưa lưu, tải lại [trang xác nhận công ca](https://newinsite.thegioididong.com/office/xac-nhan-congca). Bản 1.1 hiển thị **Tự OK khi bấm Xác nhận công** ở góc dưới trang.

## Xác nhận một lượt

Kiểm tra ngày, siêu thị và các lựa chọn trong cột **Đi làm?**. Khi người dùng hoặc MUSE bấm **Xác nhận công**, script trả lời **OK** cho câu hỏi chấm công của Insite ngay trong lượt bấm đó. Số ca lấy từ câu hỏi thực tế. Insite xử lý các lựa chọn đang có trong biểu mẫu.

Dòng **Đã bấm OK cho … ca** cho biết script đã trả lời hộp thoại. Để kiểm tra kết quả lưu, đọc phản hồi của Insite và đối chiếu trạng thái của dòng ca vừa sửa.

## Biểu mẫu còn mở bằng bản 1.0

Giữ tab đang có chỉnh sửa chưa lưu. Trong hộp trắng **Xác nhận công ca** của bản 1.0, nút được chọn mặc định là **Hủy**. Nút Hủy bên trong hộp này đóng khung của userscript. Trước khi gửi, kiểm tra trực tiếp lựa chọn **Có**, **Không** hoặc **Chưa XN** ở các dòng cần xử lý.
