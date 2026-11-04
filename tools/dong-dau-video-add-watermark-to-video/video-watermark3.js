document.addEventListener('DOMContentLoaded', async function() {
    const videoInput = document.getElementById('vwm-video-input');
    const imageInput = document.getElementById('vwm-image-input');
    
    const videoName = document.getElementById('vwm-video-name');
    const imageName = document.getElementById('vwm-image-name');
    const iconVideo = document.getElementById('vwm-icon-video');
    const iconImage = document.getElementById('vwm-icon-image');
    
    const settingsBox = document.getElementById('vwm-settings');
    const previewSection = document.getElementById('vwm-preview-section');
    
    // UI Chuyển Đổi Text / Image
    const radios = document.getElementsByName('vwm_mode');
    const areaImage = document.getElementById('vwm-area-image');
    const areaText = document.getElementById('vwm-area-text');
    const textInput = document.getElementById('vwm-text-input');
    const textColor = document.getElementById('vwm-text-color');

    // UI Cài Đặt Sliders
    const positionSelect = document.getElementById('vwm-position-select');
    const qualitySelect = document.getElementById('vwm-quality-select');
    const sizeSlider = document.getElementById('vwm-size-slider');
    const sizeText = document.getElementById('vwm-size-text');
    const opacitySlider = document.getElementById('vwm-opacity-slider');
    const opacityText = document.getElementById('vwm-opacity-text');
    const mxSlider = document.getElementById('vwm-mx-slider');
    const mxText = document.getElementById('vwm-mx-text');
    const mySlider = document.getElementById('vwm-my-slider');
    const myText = document.getElementById('vwm-my-text');

    const btnStart = document.getElementById('vwm-btn-start');
    const statusBox = document.getElementById('vwm-status-box');
    const statusText = document.getElementById('vwm-status-text');
    const detailText = document.getElementById('vwm-detail-text');
    const progressFill = document.getElementById('vwm-progress-fill');

    // --- BIẾN PHỤC VỤ CANVAS PREVIEW & TRACKING ---
    const canvas = document.getElementById('vwm-preview-canvas');
    const ctx = canvas.getContext('2d');
    const hiddenVideo = document.createElement('video'); 
    let wmImageObj = new Image(); 

    let videoFile = null;
    let imageFile = null;
    let ffmpeg = null;
    let videoNativeWidth = 0; 
    let videoDuration = 0; // Biến lưu độ dài chuẩn xác của video
    let currentMode = 'image';

    // ==========================================
    // CANVAS MAGIC: BIẾN TEXT / SVG THÀNH ẢNH
    // ==========================================
    function createTextPNG(text, color) {
        return new Promise((resolve) => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const fontSize = 100; // Vẽ to cho nét
            tempCtx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
            const metrics = tempCtx.measureText(text);
            tempCanvas.width = metrics.width + 40; 
            tempCanvas.height = fontSize + 40; 
            tempCtx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
            tempCtx.fillStyle = color;
            tempCtx.textBaseline = 'top';
            tempCtx.fillText(text, 20, 20);
            tempCanvas.toBlob(blob => resolve(blob), 'image/png');
        });
    }

    function convertSvgToPng(file) {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width || 800;
                tempCanvas.height = img.height || 800;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, 0, 0);
                tempCanvas.toBlob(blob => {
                    URL.revokeObjectURL(url);
                    resolve(blob);
                }, 'image/png');
            };
            img.src = url;
        });
    }

    // ==========================================
    // HỆ THỐNG PREVIEW REAL-TIME (SIÊU NHANH)
    // ==========================================
    async function updateWatermarkSource() {
        if (currentMode === 'text' && textInput.value.trim() !== '') {
            const blob = await createTextPNG(textInput.value.trim(), textColor.value);
            wmImageObj.src = URL.createObjectURL(blob);
        } else if (currentMode === 'image' && imageFile) {
            if (imageFile.type === 'image/svg+xml') {
                const blob = await convertSvgToPng(imageFile);
                wmImageObj.src = URL.createObjectURL(blob);
            } else {
                wmImageObj.src = URL.createObjectURL(imageFile);
            }
        }
    }

    wmImageObj.onload = drawPreview;

    function drawPreview() {
        if (!videoFile || videoNativeWidth === 0) return;

        canvas.width = videoNativeWidth;
        canvas.height = hiddenVideo.videoHeight;
        ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);

        if (!wmImageObj.src) return;

        const pos = positionSelect.value;
        const sizePercent = parseInt(sizeSlider.value);
        const opacityVal = parseInt(opacitySlider.value) / 100;
        const mx = parseInt(mxSlider.value);
        const my = parseInt(mySlider.value);

        let wmWidth = Math.round(canvas.width * (sizePercent / 100));
        if (wmWidth < 50) wmWidth = 50; 
        let wmHeight = wmWidth * (wmImageObj.height / wmImageObj.width);

        let x = 0, y = 0;
        const W = canvas.width, H = canvas.height;
        const w = wmWidth, h = wmHeight;

        if(pos === 'tl') { x = mx; y = my; }
        else if(pos === 'tc') { x = (W-w)/2; y = my; }
        else if(pos === 'tr') { x = W-w-mx; y = my; }
        else if(pos === 'cl') { x = mx; y = (H-h)/2; }
        else if(pos === 'c') { x = (W-w)/2; y = (H-h)/2; }
        else if(pos === 'cr') { x = W-w-mx; y = (H-h)/2; }
        else if(pos === 'bl') { x = mx; y = H-h-my; }
        else if(pos === 'bc') { x = (W-w)/2; y = H-h-my; }
        else if(pos === 'br') { x = W-w-mx; y = H-h-my; }

        ctx.globalAlpha = opacityVal; 
        ctx.drawImage(wmImageObj, x, y, w, h);
        ctx.globalAlpha = 1.0; 
    }

    // --- LẮNG NGHE SỰ KIỆN ĐỂ VẼ LẠI PREVIEW ---
    [sizeSlider, opacitySlider, mxSlider, mySlider, positionSelect].forEach(el => {
        el.addEventListener('input', drawPreview);
    });

    sizeSlider.addEventListener('input', (e) => sizeText.innerText = e.target.value);
    opacitySlider.addEventListener('input', (e) => opacityText.innerText = e.target.value);
    mxSlider.addEventListener('input', (e) => mxText.innerText = e.target.value);
    mySlider.addEventListener('input', (e) => myText.innerText = e.target.value);

    textInput.addEventListener('input', () => { checkUnlockSettings(); updateWatermarkSource(); });
    textColor.addEventListener('input', updateWatermarkSource);

    // --- CHUYỂN ĐỔI CHẾ ĐỘ ---
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentMode = e.target.value;
            if (currentMode === 'image') {
                areaImage.style.display = 'block';
                areaText.style.display = 'none';
            } else {
                areaImage.style.display = 'none';
                areaText.style.display = 'block';
            }
            checkUnlockSettings();
            updateWatermarkSource();
        });
    });

    function checkUnlockSettings() {
        if (!videoFile) {
            settingsBox.style.display = 'none';
            btnStart.disabled = true;
            return;
        }

        if (currentMode === 'image' && imageFile) {
            settingsBox.style.display = 'block';
            btnStart.disabled = false;
        } else if (currentMode === 'text' && textInput.value.trim() !== '') {
            settingsBox.style.display = 'block';
            btnStart.disabled = false;
        } else {
            btnStart.disabled = true;
        }
    }

    // --- UPLOAD VIDEO ---
    videoInput.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            videoFile = e.target.files[0];
            iconVideo.innerText = "✅";
            videoName.innerText = videoFile.name;
            
            const fileURL = URL.createObjectURL(videoFile);
            hiddenVideo.src = fileURL;
            hiddenVideo.preload = 'metadata';
            
            hiddenVideo.onloadedmetadata = () => {
                videoNativeWidth = hiddenVideo.videoWidth; 
                videoDuration = hiddenVideo.duration; // Lưu lại thời lượng chuẩn
                hiddenVideo.currentTime = Math.min(1.0, hiddenVideo.duration / 2); 
            };

            hiddenVideo.onseeked = () => {
                previewSection.style.display = 'block';
                checkUnlockSettings();
                drawPreview(); 
            };
        }
    });

    // --- UPLOAD ẢNH LOGO ---
    imageInput.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            imageFile = e.target.files[0];
            iconImage.innerText = "✅";
            imageName.innerText = imageFile.name;
            document.getElementById('vwm-box-image').style.background = "var(--clr-yellow)";
            checkUnlockSettings();
            updateWatermarkSource(); 
        }
    });

    // --- BẮT ĐẦU FFMPEG RENDER ---
    btnStart.addEventListener('click', async () => {
        if (!videoFile) return;
        if (currentMode === 'image' && !imageFile) return;
        if (currentMode === 'text' && textInput.value.trim() === '') return;

        const pos = positionSelect.value;
        const sizePercent = parseInt(sizeSlider.value);
        const opacityVal = parseInt(opacitySlider.value) / 100;
        const mx = parseInt(mxSlider.value);
        const my = parseInt(mySlider.value);
        const quality = qualitySelect.value;
        
        btnStart.disabled = true;
        statusBox.style.display = 'block';
        statusText.innerText = "Đang khởi tạo thuật toán đóng dấu...";
        progressFill.style.width = `2%`;
        progressFill.style.background = "var(--clr-aqua)"; 
        detailText.innerText = "";

        try {
            // Bước 1: Lấy file Watermark cuối cùng (Blob)
            let watermarkBlob = null;
            if (currentMode === 'text') {
                statusText.innerText = "Đang vẽ ảnh PNG từ chữ...";
                watermarkBlob = await createTextPNG(textInput.value.trim(), textColor.value);
            } else {
                if (imageFile.type === 'image/svg+xml') {
                    statusText.innerText = "Đang chuyển ảnh vector SVG...";
                    watermarkBlob = await convertSvgToPng(imageFile);
                } else {
                    watermarkBlob = imageFile;
                }
            }

            // Bước 2: Nạp FFmpeg và dùng HYBRID TRACKER
            let highestP = 0; 
            if (!ffmpeg) {
                const { createFFmpeg } = FFmpeg;
                ffmpeg = createFFmpeg({
                    corePath: 'https://congcuviet.com/wp-content/themes/bricks-child/tai-nguyen/ffmpeg-core.js',
                    logger: ({ message }) => {
                        console.log(message);
                        // Bắt log thời gian giống console của bác
                        if (message.includes('time=')) {
                            const match = message.match(/time=\s*(\d{2}):(\d{2}):(\d+\.?\d*)/);
                            if (match && videoDuration > 0) {
                                const h = parseInt(match[1]);
                                const m = parseInt(match[2]);
                                const s = parseFloat(match[3]);
                                
                                const currentTime = (h * 3600) + (m * 60) + s;
                                let p = Math.round((currentTime / videoDuration) * 100);
                                
                                if (p > 100) p = 100;
                                if (p < 0) p = 0;
                                
                                // Cập nhật progress bar nếu % mới lớn hơn % cũ
                                if (p > highestP) {
                                    highestP = p;
                                    if (p > 2) {
                                        progressFill.style.width = `${p}%`;
                                        statusText.innerText = `Đang Mã Hóa Video (Render): ${p}%`;
                                    }
                                }
                            }
                        }
                    }
                });
                
                await ffmpeg.load();
            }

            statusText.innerText = "Đang nạp file vào bộ nhớ ảo...";
            const { fetchFile } = FFmpeg;
            
            const inputVid = `video.${videoFile.name.split('.').pop()}`;
            const inputWm = `watermark.png`;
            const outputName = `output.mp4`; 

            ffmpeg.FS('writeFile', inputVid, await fetchFile(videoFile));
            ffmpeg.FS('writeFile', inputWm, await fetchFile(watermarkBlob));

            // Bước 3: Toán học tọa độ
            let wmWidth = Math.round(videoNativeWidth * (sizePercent / 100));
            if (wmWidth < 50) wmWidth = 50; 

            let posStr = "";
            if(pos === 'tl') posStr = `${mx}:${my}`;
            else if(pos === 'tc') posStr = `(W-w)/2:${my}`;
            else if(pos === 'tr') posStr = `W-w-${mx}:${my}`;
            else if(pos === 'cl') posStr = `${mx}:(H-h)/2`;
            else if(pos === 'c') posStr = `(W-w)/2:(H-h)/2`;
            else if(pos === 'cr') posStr = `W-w-${mx}:(H-h)/2`;
            else if(pos === 'bl') posStr = `${mx}:H-h-${my}`;
            else if(pos === 'bc') posStr = `(W-w)/2:H-h-${my}`;
            else if(pos === 'br') posStr = `W-w-${mx}:H-h-${my}`;

            // Bước 4: Filter FFmpeg
            let filterComplex = `[1:v]scale=${wmWidth}:-1[scaled];`;
            if (opacityVal < 1.0) {
                filterComplex += `[scaled]format=rgba,colorchannelmixer=aa=${opacityVal}[wm];[0:v][wm]overlay=${posStr}[vout]`;
            } else {
                filterComplex += `[0:v][scaled]overlay=${posStr}[vout]`;
            }
            
            let ffmpegArgs = [
                '-i', inputVid,
                '-i', inputWm,
                '-filter_complex', filterComplex,
                '-map', '[vout]',
                '-map', '0:a?', 
                '-c:a', 'copy' 
            ];

            if (quality === 'high') {
                ffmpegArgs.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '18');
            } else {
                ffmpegArgs.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24');
            }
            
            // Tối ưu hóa đóng gói MP4
            ffmpegArgs.push('-movflags', '+faststart'); 
            
            ffmpegArgs.push(outputName);

            await ffmpeg.run(...ffmpegArgs);

            // Xuất File
            progressFill.style.width = `100%`;
            statusText.innerText = "Hoàn tất! Đang đóng gói file...";
            
            const data = ffmpeg.FS('readFile', outputName);
            if (data.length === 0) throw new Error("File xuất ra rỗng.");

            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            let baseName = videoFile.name.substring(0, videoFile.name.lastIndexOf('.'));
            if (!baseName) baseName = videoFile.name;
            a.download = `${baseName}_watermark_congcuviet.mp4`;
            a.click();
            URL.revokeObjectURL(url);

            ffmpeg.FS('unlink', inputVid);
            ffmpeg.FS('unlink', inputWm);
            ffmpeg.FS('unlink', outputName);

            statusText.innerText = `🎉 Tuyệt vời! Video có logo/text đã được tải xuống.`;
            detailText.innerText = "Tất cả quá trình đều chạy Offline 100% bảo mật tuyệt đối.";

        } catch (error) {
            console.error("Lỗi Đóng Dấu:", error);
            statusText.innerText = "❌ Xảy ra sự cố khi render.";
            progressFill.style.background = "var(--clr-danger)";
        } finally {
            btnStart.disabled = false;
        }
    });
});