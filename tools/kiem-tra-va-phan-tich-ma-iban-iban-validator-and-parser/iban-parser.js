document.addEventListener('DOMContentLoaded', function() {
    
    // --- KHAI BÁO CƠ SỞ DỮ LIỆU ---
    // Từ điển độ dài chuẩn IBAN của các quốc gia (ISO 13616)
    const ibanLengths = {
        'AL': 28, 'AD': 24, 'AT': 20, 'AZ': 28, 'BH': 22, 'BY': 28, 'BE': 16, 'BA': 20, 'BR': 29,
        'BG': 22, 'CR': 22, 'HR': 21, 'CY': 28, 'CZ': 24, 'DK': 18, 'DO': 22, 'SV': 28, 'EE': 20,
        'FO': 18, 'FI': 18, 'FR': 27, 'GE': 22, 'DE': 22, 'GI': 23, 'GR': 27, 'GL': 18, 'GT': 28,
        'HU': 28, 'IS': 26, 'IQ': 23, 'IE': 22, 'IL': 23, 'IT': 27, 'JO': 30, 'KZ': 20, 'XK': 20,
        'KW': 30, 'LV': 21, 'LB': 28, 'LI': 21, 'LT': 20, 'LU': 20, 'MK': 19, 'MT': 31, 'MR': 27,
        'MU': 30, 'MD': 24, 'MC': 27, 'ME': 22, 'NL': 18, 'NO': 15, 'PK': 24, 'PS': 29, 'PL': 28,
        'PT': 25, 'QA': 29, 'RO': 24, 'LC': 32, 'SM': 27, 'ST': 25, 'SA': 24, 'RS': 22, 'SC': 31,
        'SK': 24, 'SI': 19, 'ES': 24, 'SE': 24, 'CH': 21, 'TL': 23, 'TN': 24, 'TR': 26, 'UA': 29,
        'AE': 23, 'GB': 22, 'VG': 27, 'DZ': 24, 'AO': 25, 'BJ': 28, 'BF': 28, 'BI': 16, 'CM': 27,
        'CV': 25, 'CG': 27, 'CI': 28, 'DJ': 27, 'EG': 29, 'GA': 27, 'IR': 26, 'MG': 27, 'ML': 27,
        'MZ': 25, 'NI': 32, 'SN': 28, 'TG': 28, 'VN': 0 // VN chưa dùng IBAN chính thức
    };

    // Từ điển tên Quốc gia (Mẫu)
    const countryNames = {
        'GB': 'Vương Quốc Anh', 'FR': 'Pháp', 'DE': 'Đức', 'IT': 'Ý', 'ES': 'Tây Ban Nha',
        'CH': 'Thụy Sĩ', 'NL': 'Hà Lan', 'AE': 'UAE (Tiểu Vương Quốc Ả Rập)', 'US': 'Mỹ (Không dùng IBAN)',
        'VN': 'Việt Nam (Không dùng IBAN)', 'SG': 'Singapore (Không dùng IBAN)'
    };

    // --- Khai báo DOM ---
    const inputIban = document.getElementById('ibanp-input-number');
    const btnClear = document.getElementById('ibanp-btn-clear');
    
    const badgeStatus = document.getElementById('ibanp-status-badge');
    const detailsGrid = document.getElementById('ibanp-details-grid');
    const resultCard = document.getElementById('ibanp-result-card');
    const formatBox = document.getElementById('ibanp-format-box');
    
    const outCountry = document.getElementById('ibanp-out-country');
    const outCheckTag = document.getElementById('ibanp-out-check-tag');
    const outBban = document.getElementById('ibanp-out-bban');
    const outLength = document.getElementById('ibanp-out-length');
    const outMod97 = document.getElementById('ibanp-out-mod97');
    const outFormat = document.getElementById('ibanp-out-format');
    
    const btnCopy = document.querySelector('.ibanp-btn-copy');

    // --- THUẬT TOÁN XÁC THỰC IBAN (MOD 97-10) ---

    // Hàm tính modulo 97 cho một chuỗi số khổng lồ (JS không hỗ trợ tính trực tiếp số > 16 chữ số)
    function mod97(numericString) {
        let checksum = numericString.slice(0, 2);
        let fragment;
        for (let offset = 2; offset < numericString.length; offset += 7) {
            fragment = String(checksum) + numericString.substring(offset, offset + 7);
            checksum = parseInt(fragment, 10) % 97;
        }
        return checksum;
    }

    function isValidIBAN(iban) {
        // 1. Chuyển 4 ký tự đầu (Mã quốc gia + Check digits) ra đằng sau cùng
        const rearranged = iban.substring(4) + iban.substring(0, 4);
        
        // 2. Chuyển đổi toàn bộ chữ cái thành số (A=10, B=11... Z=35)
        let numericString = "";
        for (let i = 0; i < rearranged.length; i++) {
            const charCode = rearranged.charCodeAt(i);
            if (charCode >= 65 && charCode <= 90) { // A-Z
                numericString += (charCode - 55).toString();
            } else { // 0-9
                numericString += rearranged.charAt(i);
            }
        }
        
        // 3. Tính modulo 97. Nếu kết quả là 1 -> IBAN Hợp lệ.
        return mod97(numericString) === 1;
    }

    // --- Cập nhật UI State ---
    function setUIState(isValid, statusText, isError = false) {
        badgeStatus.innerText = statusText;
        if (isValid) {
            badgeStatus.className = "ibanp-badge active";
            detailsGrid.style.opacity = "1";
            detailsGrid.style.pointerEvents = "auto";
            resultCard.style.borderColor = "#111";
            formatBox.style.display = 'block';
        } else {
            badgeStatus.className = isError ? "ibanp-badge error" : "ibanp-badge";
            detailsGrid.style.opacity = "0.3";
            detailsGrid.style.pointerEvents = "none";
            resultCard.style.borderColor = isError ? "var(--clr-red)" : "#111";
            formatBox.style.display = 'none';
            
            // Xóa rỗng các trường
            outCountry.innerText = "--";
            outCheckTag.innerText = "--";
            outBban.innerText = "--";
            outLength.innerText = "-- ký tự";
            outMod97.innerText = "--";
            outMod97.className = "ibanp-detail-val";
            outFormat.value = "";
        }
    }

    // --- Logic phân tích chính ---
    function parseIBAN() {
        let rawInput = inputIban.value.trim().toUpperCase();

        if (!rawInput) {
            setUIState(false, "Chờ nhập IBAN...");
            return;
        }

        // Dọn dẹp: Bỏ mọi khoảng trắng và gạch ngang
        let cleaned = rawInput.replace(/[\s-]/g, "");

        // Kiểm tra cơ bản bằng Regex (Phải bắt đầu bằng 2 chữ cái, theo sau là 2 số, và chuỗi alphanumeric)
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(cleaned)) {
            setUIState(false, "❌ Sai cấu trúc cơ bản", true);
            return;
        }

        const countryCode = cleaned.substring(0, 2);
        const checkDigits = cleaned.substring(2, 4);
        const bban = cleaned.substring(4);
        const currentLength = cleaned.length;

        // Điền dữ liệu vào form
        const cName = countryNames[countryCode] || `Quốc gia (${countryCode})`;
        outCountry.innerText = `🌍 ${cName}`;
        outCheckTag.innerText = checkDigits;
        outBban.innerText = bban;

        // 1. Kiểm tra Độ dài
        const expectedLength = ibanLengths[countryCode];
        if (expectedLength) {
            if (currentLength === expectedLength) {
                outLength.innerHTML = `<span class="ibanp-text-green">✅ ${currentLength} (Chuẩn)</span>`;
            } else {
                outLength.innerHTML = `<span class="ibanp-text-red">❌ ${currentLength} (Lỗi, chuẩn là ${expectedLength})</span>`;
                outMod97.innerText = "Chưa kiểm tra (Do sai độ dài)";
                setUIState(false, "❌ Sai độ dài quốc gia", true);
                return;
            }
        } else {
            outLength.innerHTML = `${currentLength} (Không có dữ liệu chuẩn)`;
        }

        // 2. Chạy thuật toán MOD 97
        const isMod97Valid = isValidIBAN(cleaned);
        
        if (isMod97Valid) {
            outMod97.innerHTML = `<b class="ibanp-text-green">PASS (Kết quả dư 1)</b>`;
            
            // Tạo format in ấn (Print format: nhóm 4 ký tự 1 cụm)
            const printFormat = cleaned.match(/.{1,4}/g).join(' ');
            outFormat.value = printFormat;
            
            setUIState(true, "✅ IBAN Hợp Lệ");
        } else {
            outMod97.innerHTML = `<b class="ibanp-text-red">FAIL (Sai thuật toán)</b>`;
            setUIState(false, "❌ IBAN Giả mạo / Nhập sai", true);
        }
    }

    // --- Lắng nghe sự kiện ---
    inputIban.addEventListener('input', parseIBAN);

    btnClear.addEventListener('click', () => {
        inputIban.value = "";
        parseIBAN();
        inputIban.focus();
    });

    btnCopy.addEventListener('click', async () => {
        if (!outFormat.value) return;

        try {
            await navigator.clipboard.writeText(outFormat.value);
            const originalText = btnCopy.innerText;
            btnCopy.innerText = '✅ ĐÃ COPY';
            btnCopy.style.background = 'var(--clr-green)';
            btnCopy.style.color = '#111';
            
            setTimeout(() => {
                btnCopy.innerText = originalText;
                btnCopy.style.background = '#111';
                btnCopy.style.color = 'var(--clr-yellow)';
            }, 1500);
        } catch (err) {
            alert("Lỗi sao chép!");
        }
    });

});