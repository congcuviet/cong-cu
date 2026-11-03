document.addEventListener('DOMContentLoaded', async function() {
    const videoInput = document.getElementById('vrev-video-input');
    const videoName = document.getElementById('vrev-video-name');
    const iconVideo = document.getElementById('vrev-icon-video');
    
    const settingsBox = document.getElementById('vrev-settings');
    const previewSection = document.getElementById('vrev-preview-section');
    const videoPlayer = document.getElementById('vrev-player');
    const audioSelect = document.getElementById('vrev-audio-select');

    const btnStart = document.getElementById('vrev-btn-start');
    const statusBox = document.getElementById('vrev-status-box');
    const statusText = document.getElementById('vrev-status-text');
    const detailText = document.getElementById('vrev-detail-text');
    const progressFill = document.getElementById('vrev-progress-fill');

    let currentFile = null;
    let ffmpeg = null;
    let loadingInterval = null; // Biến tạo hiệu ứng chữ chạy

    // --- UPLOAD VIDEO ---
    videoInput.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            currentFile = e.target.files[0];
            iconVideo.innerText = "✅";
            videoName.innerText = currentFile.name;
            
            // Cảnh báo dung lượng/độ dài
            const sizeMB = currentFile.size / (1024 * 1024);
            if (sizeMB > 30) {
                alert("⚠️ Video khá nặng (" + sizeMB.toFixed(1) + "MB). Tua ngược tốn rất nhiều RAM. Nếu bị đứng, hãy thử với video ngắn hơn (dưới 15 giây)!");
            }

            videoPlayer.src = URL.createObjectURL(currentFile);
            previewSection.style.display = 'block';
            settingsBox.style.display = 'block';
            btnStart.disabled = false;
        }
    });

    // --- BẮT ĐẦU FFMPEG RENDER ---
    btnStart.addEventListener('click', async () => {
        if (!currentFile) return alert("Vui lòng tải video lên trước!");

        const audioMode = audioSelect.value;
        videoPlayer.pause();
        
        btnStart.disabled = true;
        statusBox.style.display = 'block';
        statusText.innerText = "Đang khởi tạo lõi FFmpeg Wasm...";
        progressFill.style.width = `2%`;
        progressFill.style.background = "var(--clr-magenta)"; 
        
        // Hiển thị thông báo cực kỳ rõ ràng để khách khỏi hoang mang
        detailText.innerHTML = `<span style="color: var(--clr-magenta);">⚠️ Thanh tiến độ sẽ <b>ĐỨNG YÊN</b> trong vài phút để nạp khung hình vào RAM. Máy yếu có thể hơi đơ. Vui lòng kiên nhẫn!</span>`;

        // Hiệu ứng chữ chạy (Loading dots) để khách biết web không bị treo
        let dots = 0;
        loadingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            let textDots = ".".repeat(dots);
            if (progressFill.style.width === "2%") {
                statusText.innerText = `Đang nạp toàn bộ video vào RAM${textDots}`;
            }
        }, 500);

        try {
            if (!ffmpeg) {
                const { createFFmpeg } = FFmpeg;
                ffmpeg = createFFmpeg({
                    corePath: 'https://congcuviet.com/wp-content/themes/bricks-child/tai-nguyen/ffmpeg-core.js',
                    log: true 
                });
                
                // TRACKING PROGRESS
                ffmpeg.setProgress(({ ratio }) => {
                    let p = Math.round(ratio * 100);
                    if (p < 0) p = 0;
                    if (p > 100) p = 100;
                    
                    // Chỉ khi nào nạp RAM xong (ratio nhích lên trên 2%) thì mới cập nhật số
                    if (p > 2) {
                        progressFill.style.width = `${p}%`;
                        statusText.innerText = `Đang Mã Hóa Tua Ngược: ${p}%`;
                        detailText.innerHTML = "Đang xuất file tốc độ cao...";
                    }
                });

                await ffmpeg.load();
            }

            const { fetchFile } = FFmpeg;
            const ext = currentFile.name.split('.').pop();
            const inputName = `input.${ext}`;
            const outputName = `output.mp4`; 

            ffmpeg.FS('writeFile', inputName, await fetchFile(currentFile));

            let ffmpegArgs = [];
            
            if (audioMode === 'mute') {
                ffmpegArgs = [
                    '-i', inputName,
                    '-vf', 'reverse',
                    '-an',
                    '-c:v', 'libx264',
                    '-preset', 'ultrafast',
                    outputName
                ];
            } else {
                ffmpegArgs = [
                    '-i', inputName,
                    '-vf', 'reverse',
                    '-af', 'areverse',
                    '-c:v', 'libx264',
                    '-preset', 'ultrafast',
                    '-c:a', 'aac',
                    outputName
                ];
            }

            // BẮT ĐẦU CHẠY - Bước này sẽ đứng rất lâu nếu video dài
            await ffmpeg.run(...ffmpegArgs);

            // Khi chạy xong, ép thanh progress lên 100%
            progressFill.style.width = `100%`;
            clearInterval(loadingInterval);
            statusText.innerText = "Hoàn tất! Đang đóng gói file...";
            
            const data = ffmpeg.FS('readFile', outputName);
            if (data.length === 0) throw new Error("File rỗng.");

            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            let baseName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.'));
            if (!baseName) baseName = currentFile.name;
            
            a.download = `${baseName}_reversed_congcuviet.mp4`;
            a.click();
            URL.revokeObjectURL(url);

            ffmpeg.FS('unlink', inputName);
            ffmpeg.FS('unlink', outputName);

            statusText.innerText = `🎉 Tuyệt vời! Video tua ngược đã được tải xuống.`;
            detailText.innerHTML = "Cảm ơn bạn đã kiên nhẫn chờ đợi!";

        } catch (error) {
            console.error("Lỗi Đảo Ngược Video:", error);
            clearInterval(loadingInterval);
            statusText.innerText = "❌ Xảy ra lỗi. Khả năng cao do TRÀN RAM!";
            detailText.innerHTML = "Video của bạn quá dài hoặc độ phân giải quá cao khiến trình duyệt bị quá tải. Hãy thử dùng công cụ cắt video ngắn lại (dưới 15 giây) và thử lại.";
            progressFill.style.background = "var(--clr-danger)";
        } finally {
            btnStart.disabled = false;
        }
    });
});