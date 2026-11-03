document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('rev-file-input');
    const filenameDisplay = document.getElementById('rev-filename');
    const workspace = document.getElementById('rev-workspace');
    const loadingBox = document.getElementById('rev-loading');
    
    const btnPlay = document.getElementById('rev-btn-play');
    const btnDownload = document.getElementById('rev-btn-download');
    
    const audioElement = document.getElementById('rev-audio-element');
    const waveAnim = document.getElementById('rev-wave');
    const statusText = document.getElementById('rev-status-text');

    let currentFile = null;
    let reversedAudioUrl = null;

    // 1. Lắng nghe khi chọn file
    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        currentFile = file;
        filenameDisplay.innerText = file.name;
        
        // Cập nhật UI
        workspace.style.display = 'none';
        loadingBox.style.display = 'flex';
        
        // Đảm bảo audio element dừng nếu đang phát file cũ
        audioElement.pause();
        btnPlay.innerHTML = "▶️ Nghe Thử";
        waveAnim.classList.remove('playing');

        // Delay nhẹ 100ms để trình duyệt kịp render màn hình Loading
        setTimeout(() => {
            processReversedAudio(file);
        }, 100);
    });

    // Hàm xử lý đảo ngược âm thanh
    async function processReversedAudio(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            // Tạo một AudioBuffer mới trống rỗng với cùng thông số
            const reversedBuffer = audioCtx.createBuffer(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );

            // Đảo ngược từng kênh âm thanh (Trái / Phải)
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                const channelData = audioBuffer.getChannelData(i);
                const reversedData = reversedBuffer.getChannelData(i);
                
                // Copy dữ liệu sang buffer mới và sử dụng hàm reverse() cực nhanh của Float32Array
                reversedData.set(channelData);
                reversedData.reverse();
            }

            // Chuyển AudioBuffer đã đảo ngược thành Blob (WAV)
            const wavBlob = audioBufferToWav(reversedBuffer);
            
            // Dọn dẹp URL cũ nếu có để tránh tràn RAM
            if (reversedAudioUrl) {
                URL.revokeObjectURL(reversedAudioUrl);
            }
            
            reversedAudioUrl = URL.createObjectURL(wavBlob);
            
            // Gán vào thẻ Audio ẩn để nghe thử
            audioElement.src = reversedAudioUrl;

            // Chuyển giao diện sang trạng thái sẵn sàng
            loadingBox.style.display = 'none';
            workspace.style.display = 'block';
            statusText.innerText = "Sẵn sàng phát...";

        } catch (err) {
            console.error(err);
            alert("❌ Có lỗi xảy ra khi giải mã file âm thanh. File có thể bị hỏng hoặc định dạng không hỗ trợ!");
            loadingBox.style.display = 'none';
            filenameDisplay.innerText = "Chưa có file nào được chọn...";
        }
    }

    // 2. Nút Nghe Thử
    btnPlay.addEventListener('click', function() {
        if (!reversedAudioUrl) return;

        if (audioElement.paused) {
            audioElement.play();
            btnPlay.innerHTML = "⏸ Tạm Dừng";
            waveAnim.classList.add('playing');
            statusText.innerText = "Đang phát âm thanh đảo ngược...";
        } else {
            audioElement.pause();
            btnPlay.innerHTML = "▶️ Tiếp Tục";
            waveAnim.classList.remove('playing');
            statusText.innerText = "Đã tạm dừng";
        }
    });

    // Tự động tắt sóng âm khi kết thúc
    audioElement.addEventListener('ended', () => {
        btnPlay.innerHTML = "▶️ Nghe Thử";
        waveAnim.classList.remove('playing');
        statusText.innerText = "Đã phát xong";
    });

    // 3. Nút Tải Xuống
    btnDownload.addEventListener('click', function() {
        if (!reversedAudioUrl || !currentFile) return;

        const a = document.createElement('a');
        a.href = reversedAudioUrl;
        
        // Tạo tên file: ten-goc-reversed.wav
        const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || currentFile.name;
        a.download = `${originalName}-reversed.wav`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // Hàm chuyển đổi AudioBuffer sang WAV (Cần thiết để tạo file âm thanh chuẩn)
    function audioBufferToWav(buffer) {
        const numOfChan = buffer.numberOfChannels;
        const length = buffer.length * numOfChan * 2 + 44;
        const outBuffer = new ArrayBuffer(length);
        const view = new DataView(outBuffer);
        const channels = [];
        let offset = 0;
        let pos = 0;

        function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
        function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }

        // RIFF chunk descriptor
        setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); 
        // FMT sub-chunk
        setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
        setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan); 
        setUint16(numOfChan * 2); setUint16(16); 
        // Data sub-chunk
        setUint32(0x61746164); setUint32(length - pos - 4); 

        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        while (pos < length) {
            for (let i = 0; i < numOfChan; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }
        return new Blob([outBuffer], { type: "audio/wav" });
    }
});