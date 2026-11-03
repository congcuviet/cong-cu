document.addEventListener('DOMContentLoaded', async function() {
    const fileInput = document.getElementById('vres-file-input');
    const filenameDisplay = document.getElementById('vres-filename');
    
    const settingsBox = document.getElementById('vres-settings');
    const inputW = document.getElementById('vres-width');
    const inputH = document.getElementById('vres-height');
    const modeSelect = document.getElementById('vres-mode');
    
    // Các phần tử Preview
    const previewContainer = document.getElementById('vres-preview-container');
    const previewFrame = document.getElementById('vres-preview-frame');
    const previewVideo = document.getElementById('vres-preview-video');
    
    const btnStart = document.getElementById('vres-btn-start');
    
    const statusBox = document.getElementById('vres-status-box');
    const statusText = document.getElementById('vres-status-text');
    const detailText = document.getElementById('vres-detail-text');
    const progressFill = document.getElementById('vres-progress-fill');

    let videoFile = null;
    let ffmpeg = null;
    let videoDuration = 0;

    // 1. Hàm tính toán và cập nhật mô phỏng Preview
    function updatePreview() {
        if (!videoFile) return;

        let targetW = parseInt(inputW.value) || 1280;
        let targetH = parseInt(inputH.value) || 720;
        const mode = modeSelect.value;

        // Kích thước tối đa của khung chứa Preview (đã trừ padding)
        const containerW = previewContainer.clientWidth - 20; 
        const containerH = previewContainer.clientHeight - 20;

        const targetRatio = targetW / targetH;
        const containerRatio = containerW / containerH;

        let frameW, frameH;

        // Tính toán để khung đen (đại diện cho video sau khi render) luôn nằm gọn trong màn hình
        if (targetRatio > containerRatio) {
            frameW = containerW;
            frameH = containerW / targetRatio;
        } else {
            frameH = containerH;
            frameW = containerH * targetRatio;
        }

        // Áp dụng kích thước cho khung đen
        previewFrame.style.width = `${frameW}px`;
        previewFrame.style.height = `${frameH}px`;

        // Mô phỏng chính xác thuật toán FFmpeg bằng object-fit của CSS
        if (mode === 'pad') {
            previewVideo.style.objectFit = 'contain';
        } else if (mode === 'crop') {
            previewVideo.style.objectFit = 'cover';
        } else if (mode === 'stretch') {
            previewVideo.style.objectFit = 'fill';
        }
    }

    // Lắng nghe sự thay đổi thông số để update Preview Real-time
    inputW.addEventListener('input', updatePreview);
    inputH.addEventListener('input', updatePreview);
    modeSelect.addEventListener('change', updatePreview);
    window.addEventListener('resize', updatePreview); // Update khi xoay ngang/dọc điện thoại

    // 2. Nạp file & Hiển thị UI
    fileInput.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            videoFile = e.target.files[0];
            filenameDisplay.innerText = videoFile.name;
            
            settingsBox.style.display = 'block';
            btnStart.disabled = false;

            const fileURL = URL.createObjectURL(videoFile);
            
            // Setup Video Preview
            previewVideo.src = fileURL;
            previewVideo.onloadedmetadata = () => {
                videoDuration = previewVideo.duration;
                // Tua đến giây thứ 1 để lấy một khung hình hiển thị (tránh bị đen nếu video bắt đầu từ màu đen)
                previewVideo.currentTime = Math.min(1, videoDuration / 2);
                updatePreview(); // Gọi ngay lần đầu
            };
        }
    });

    // 3. Bắt đầu Render FFmpeg
    btnStart.addEventListener('click', async () => {
        if (!videoFile) return alert("Vui lòng tải video lên trước!");

        // ÉP CHUẨN SỐ CHẴN cho codec mp4 libx264
        let targetW = parseInt(inputW.value) || 1280;
        let targetH = parseInt(inputH.value) || 720;
        
        targetW = targetW % 2 !== 0 ? targetW - 1 : targetW;
        targetH = targetH % 2 !== 0 ? targetH - 1 : targetH;
        inputW.value = targetW;
        inputH.value = targetH;

        const resizeMode = modeSelect.value;

        // Khóa UI
        btnStart.disabled = true;
        statusBox.style.display = 'block';
        statusText.innerText = "Đang khởi tạo FFmpeg Engine...";
        progressFill.style.width = `2%`;
        progressFill.style.background = "var(--clr-lavender)"; 
        detailText.innerText = "";

        try {
            if (!ffmpeg) {
                const { createFFmpeg } = FFmpeg;
                ffmpeg = createFFmpeg({
                    corePath: 'https://congcuviet.com/wp-content/themes/bricks-child/tai-nguyen/ffmpeg-core.js',
                    logger: ({ message }) => {
                        console.log(message);
                        
                        if (message.includes('time=')) {
                            const match = message.match(/time=\s*(\d{2}):(\d{2}):(\d+\.?\d*)/);
                            if (match && videoDuration > 0) {
                                const h = parseInt(match[1]);
                                const m = parseInt(match[2]);
                                const s = parseFloat(match[3]);
                                
                                const currentTime = (h * 3600) + (m * 60) + s;
                                let p = Math.round((currentTime / videoDuration) * 100);
                                if (p > 100) p = 100;
                                
                                progressFill.style.width = `${p}%`;
                                statusText.innerText = `Đang Đổi Kích Thước: ${p}%`;
                                detailText.innerText = `Đã xử lý: ${currentTime.toFixed(1)}s / ${videoDuration.toFixed(1)}s`;
                            }
                        }
                    }
                });
                
                statusText.innerText = "Đang tải thư viện FFmpeg (chỉ tải lần đầu)...";
                await ffmpeg.load();
            }

            statusText.innerText = "Đang nạp file vào bộ nhớ...";
            const { fetchFile } = FFmpeg;

            const ext = videoFile.name.split('.').pop();
            const inputName = `input.${ext}`;
            const outputName = `output.mp4`;

            ffmpeg.FS('writeFile', inputName, await fetchFile(videoFile));

            statusText.innerText = `Bắt đầu Resize video về ${targetW}x${targetH}...`;

            // THUẬT TOÁN FILTER DỰA TRÊN CHẾ ĐỘ NGƯỜI DÙNG CHỌN
            let filterStr = "";
            
            if (resizeMode === 'pad') {
                filterStr = `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`;
            } else if (resizeMode === 'crop') {
                filterStr = `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}`;
            } else if (resizeMode === 'stretch') {
                filterStr = `scale=${targetW}:${targetH}`;
            }

            await ffmpeg.run(
                '-i', inputName,
                '-vf', filterStr,
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-c:a', 'copy', 
                outputName
            );

            statusText.innerText = "Hoàn tất! Đang đóng gói file...";
            const data = ffmpeg.FS('readFile', outputName);
            
            if (data.length === 0) {
                throw new Error("Lỗi Render: File xuất ra 0KB.");
            }

            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            let baseName = videoFile.name.substring(0, videoFile.name.lastIndexOf('.'));
            if (!baseName) baseName = videoFile.name;
            
            a.download = `${baseName}_${targetW}x${targetH}_congcuviet.mp4`;
            a.click();
            URL.revokeObjectURL(url);

            ffmpeg.FS('unlink', inputName);
            ffmpeg.FS('unlink', outputName);

            statusText.innerText = `🎉 Xong! Video đã được điều chỉnh và tải xuống thành công.`;
            detailText.innerText = "";
            progressFill.style.width = `100%`;

        } catch (error) {
            console.error("Lỗi Đổi Kích Thước Video:", error);
            statusText.innerText = "❌ Xảy ra sự cố khi xử lý video.";
            detailText.innerText = "Vui lòng xem log tại F12 (Console) để biết thêm chi tiết.";
            progressFill.style.background = "var(--clr-danger)";
        } finally {
            btnStart.disabled = false;
        }
    });
});