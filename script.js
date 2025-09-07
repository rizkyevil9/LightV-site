const imageUpload = document.getElementById('image-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const promptInput = document.getElementById('prompt-input');
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const resultContainer = document.getElementById('result-container');
const resultImage = document.getElementById('result-image');
const placeholderText = document.getElementById('placeholder-text');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

let uploadedImageBase64 = null;
let uploadedImageType = null;

// --- Event Listeners ---
imageUpload.addEventListener('change', handleImageUpload);
generateBtn.addEventListener('click', generateImage);

// --- Functions ---
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validasi tipe file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showError('Tipe file tidak valid. Harap unggah PNG, JPG, atau WEBP.');
        return;
    }

    // Validasi ukuran file (misal, 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('Ukuran file terlalu besar. Maksimal 10MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreviewContainer.classList.remove('hidden');
        
        uploadedImageBase64 = e.target.result.split(',')[1];
        uploadedImageType = file.type;
        hideError();

        // === PERBAIKAN DI SINI ===
        // 1. Dapatkan elemen label di sini, setelah gambar di-load
        const uploadLabel = document.querySelector('label[for="image-upload"]');

        // 2. Nonaktifkan input file
        imageUpload.disabled = true;

        // 3. Ubah tampilan label (pastikan uploadLabel tidak null)
        if (uploadLabel) {
            uploadLabel.style.cursor = 'not-allowed';
            uploadLabel.style.backgroundColor = '#2d3748'; // Warna lebih gelap untuk kontras
            uploadLabel.style.borderColor = '#4a5568';
            
            // Mengubah teks di dalam label
            const textElement = uploadLabel.querySelector('span.text-sm');
            if(textElement) {
               textElement.textContent = 'Gambar berhasil diunggah';
            }
        }
        // ========================
    };
    reader.readAsDataURL(file);
}

async function generateImage() {
    if (!uploadedImageBase64) {
        showError('Harap unggah gambar terlebih dahulu.');
        return;
    }
    if (!promptInput.value.trim()) {
        showError('Harap masukkan perintah editan.');
        return;
    }

    setLoading(true);

    // Ganti dengan API Key Anda jika menjalankannya secara lokal
    const apiKey = "AIzaSyCCosvHjETtQHp05m_v7MuyLvS_YaW5LN8"; 
    const model = "gemini-1.5-flash"; // Model yang lebih baru dan direkomendasikan
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [
                { text: promptInput.value },
                {
                    inlineData: {
                        mimeType: uploadedImageType,
                        data: uploadedImageBase64
                    }
                }
            ]
        }],
    };
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Memberikan pesan error yang lebih informatif
            throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Pengecekan respons yang lebih aman
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const base64Data = part?.inlineData?.data;

        if (base64Data) {
            resultImage.src = `data:image/png;base64,${base64Data}`;
            resultImage.classList.remove('hidden');
            placeholderText.classList.add('hidden');
            hideError();
        } else {
            // Cek alasan kenapa gambar tidak dibuat (misal: kebijakan keamanan)
            const finishReason = result?.candidates?.[0]?.finishReason;
            let reasonText = "Tidak dapat menemukan data gambar dalam respons API.";
            if (finishReason === "SAFETY") {
                reasonText = "Gambar tidak dapat dibuat karena melanggar kebijakan keamanan. Silakan coba perintah atau gambar lain.";
            } else if (finishReason === "RECITATION") {
                 reasonText = "Respons diblokir karena terkait sumber yang ada. Coba perintah lain.";
            } else if (result?.promptFeedback?.blockReason) {
                reasonText = `Permintaan diblokir karena: ${result.promptFeedback.blockReason}. Coba perintah lain.`;
            }
            showError(reasonText);
            resultImage.classList.add('hidden');
            placeholderText.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        showError(`Terjadi kesalahan: ${error.message}`);
        resultImage.classList.add('hidden');
        placeholderText.classList.remove('hidden');
    } finally {
        setLoading(false);
    }
}

function setLoading(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true;
        loading.classList.remove('hidden');
        resultContainer.classList.add('hidden');
    } else {
        generateBtn.disabled = false;
        loading.classList.add('hidden');
        resultContainer.classList.remove('hidden');
    }
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}
