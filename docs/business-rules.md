1. Giá sản phẩm luôn được đọc từ database.
2. Frontend không được quyết định tổng tiền.
3. Mỗi email chỉ thuộc một tài khoản.
4. Mỗi product có một slug duy nhất.
5. Customer chỉ xem được đơn hàng của chính mình.
6. Chỉ webhook hợp lệ mới được đánh dấu thanh toán thành công.
7. Một webhook không được xử lý hai lần.
8. Đơn hàng phải giữ snapshot tên và giá sản phẩm.
9. Không cho phép tồn kho âm.
10. Trạng thái đơn hàng chỉ được thay đổi theo transition hợp lệ.