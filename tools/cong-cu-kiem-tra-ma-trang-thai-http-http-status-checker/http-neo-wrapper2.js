document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. TỪ ĐIỂN MÃ TRẠNG THÁI HTTP
    // ==========================================
    const httpStatusDict = {
        200: { text: "OK", desc: "Thành công. Máy chủ đã tiếp nhận và xử lý yêu cầu hợp lệ." },
        201: { text: "Created", desc: "Thành công. Yêu cầu đã được thực hiện và một tài nguyên mới đã được tạo." },
        204: { text: "No Content", desc: "Thành công. Máy chủ xử lý thành công nhưng không có nội dung nào được trả về." },
        
        301: { text: "Moved Permanently", desc: "Chuyển hướng vĩnh viễn. URL này đã được chuyển sang một địa chỉ mới (Thường dùng cho SEO)." },
        302: { text: "Found / Moved Temporarily", desc: "Chuyển hướng tạm thời. URL này đang tạm thời trỏ sang một địa chỉ khác." },
        304: { text: "Not Modified", desc: "Không có thay đổi. Trình duyệt có thể sử dụng bản lưu cache trước đó." },
        
        400: { text: "Bad Request", desc: "Lỗi cú pháp. Máy chủ không thể hiểu yêu cầu do cú pháp không hợp lệ." },
        401: { text: "Unauthorized", desc: "Lỗi phân quyền. Yêu cầu cần có xác thực thông tin đăng nhập." },
        403: { text: "Forbidden", desc: "Bị cấm. Bạn không có quyền truy cập vào thư mục hoặc liên kết này." },
        404: { text: "Not Found", desc: "Không tìm thấy. Đường dẫn hoặc trang web này không tồn tại trên máy chủ." },
        405: { text: "Method Not Allowed", desc: "Phương thức không được cho phép (Ví dụ dùng GET thay vì POST)." },
        429: { text: "Too Many Requests", desc: "Gửi quá nhiều yêu cầu. Đã vượt quá giới hạn truy cập (Rate limit)." },
        
        500: { text: "Internal Server Error", desc: "Lỗi máy chủ nội bộ. Có lỗi xảy ra trong mã nguồn hoặc cấu hình server." },
        502: { text: "Bad Gateway", desc: "Cổng kết nối tồi. Server hoạt động như một gateway nhận phản hồi lỗi từ upstream server." },
        503: { text: "Service Unavailable", desc: "Dịch vụ không khả dụng. Máy chủ đang quá tải hoặc đang bảo trì." },
        504: { text: "Gateway Timeout", desc: "Hết thời gian chờ. Máy chủ không nhận được phản hồi kịp thời từ upstream server." }
    };

    const getStatusInfo = (code) => {
        if (httpStatusDict[code]) return httpStatusDict[code];
        if (code >= 200 && code < 300) return { text: "Success", desc: "Phản hồi thành công từ máy chủ." };
        if (code >= 300 && code < 400) return { text: "Redirection", desc: "Thông điệp chuyển hướng URL." };
        if (code >= 400 && code < 500) return { text: "Client Error", desc: "Lỗi phát sinh từ phía trình duyệt hoặc yêu cầu gửi đi." };
        if (code >= 500 && code < 600) return { text: "Server Error", desc: "Lỗi phát sinh từ hệ thống máy chủ." };
        return { text: "Unknown", desc: "Mã trạng thái không xác định." };
    };

    // ==========================================
    // 2. DOM ELEMENTS
    // ==========================================
    const btnCheck = document.getElementById('btnCheckHttp');
    const inpUrl = document.getElementById('inpUrl');
    const errorBox = document.getElementById('httpError');
    const resultSec = document.getElementById('httpResult');
    
    const btnText = document.getElementById('btnText');
    const btnLoading = document.getElementById('btnLoading');
    
    const resBoxWrap = document.getElementById('resBoxWrap');
    const resStatusCode = document.getElementById('resStatusCode');
    const resStatusText = document.getElementById('resStatusText');
    const resStatusDesc = document.getElementById('resStatusDesc');
    const resPing = document.getElementById('resPing');
    const resTargetUrl = document.getElementById('resTargetUrl');

    // ==========================================
    // 3. LOGIC XỬ LÝ FETCH & CẬP NHẬT UI
    // ==========================================
    btnCheck.addEventListener('click', async () => {
        // Reset UI
        errorBox.classList.add('hidden');
        resultSec.classList.add('hidden');
        resBoxWrap.classList.remove('status-success', 'status-redirect', 'status-client-err', 'status-server-err', 'status-unknown');

        let urlStr = inpUrl.value.trim();

        // BẪY LỖI: Bỏ trống
        if (!urlStr) {
            errorBox.innerText = "⚠️ Lỗi: Vui lòng nhập địa chỉ URL cần kiểm tra.";
            errorBox.classList.remove('hidden');
            return;
        }

        // Tự động thêm https:// nếu thiếu
        if (!/^https?:\/\//i.test(urlStr)) {
            urlStr = 'https://' + urlStr;
            inpUrl.value = urlStr;
        }

        // Kích hoạt trạng thái Loading
        btnCheck.disabled = true;
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');

        const startTime = performance.now();

        try {
            // Thay proxy allorigins bằng corsproxy.io (Mạnh và ổn định hơn, không bị bọc JSON)
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(urlStr)}`;
            
            // Gọi fetch và bắt trực tiếp status từ response của proxy
            const response = await fetch(proxyUrl, {
                method: 'GET',
                // Chặn redirect tự động để có thể bắt được mã 301, 302 nếu trình duyệt hỗ trợ qua proxy
                redirect: 'manual' 
            });
            
            const endTime = performance.now();
            const pingTime = Math.round(endTime - startTime);

            // Bắt mã trạng thái
            let code = response.status;
            
            // Fix trường hợp CORS chặn redirect manual (thường trả về 0)
            if (code === 0) {
                 code = 301; // Giả định redirect nếu trình duyệt giấu status 0 do Opaque response
            }

            // Gán dữ liệu vào UI
            const info = getStatusInfo(code);
            resStatusCode.innerText = code;
            resStatusText.innerText = info.text;
            resStatusDesc.innerText = info.desc;
            resPing.innerText = pingTime;
            resTargetUrl.innerText = urlStr;

            // Phân loại màu sắc
            if (code >= 200 && code < 300) resBoxWrap.classList.add('status-success');
            else if (code >= 300 && code < 400) resBoxWrap.classList.add('status-redirect');
            else if (code >= 400 && code < 500) resBoxWrap.classList.add('status-client-err');
            else if (code >= 500 && code < 600) resBoxWrap.classList.add('status-server-err');
            else resBoxWrap.classList.add('status-unknown');

            // Render
            resultSec.classList.remove('hidden');
            setTimeout(() => {
                resultSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (error) {
            errorBox.innerText = "🚨 Không thể truy cập URL này. Tên miền không tồn tại, máy chủ từ chối kết nối ẩn danh hoặc chặn CORS chặn nghiêm ngặt.";
            errorBox.classList.remove('hidden');
        } finally {
            resetBtn();
        }
    });

    const resetBtn = () => {
        btnCheck.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    };
});