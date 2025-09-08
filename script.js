// Hapus semua kode lama Anda di script.js dan ganti dengan ini.

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

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showError('Tipe file tidak valid. Harap unggah PNG, JPG, atau WEBP.');
        return;
    }

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

        const uploadLabel = document.querySelector('label[for="image-upload"]');
        imageUpload.disabled = true;

        if (uploadLabel) {
            uploadLabel.style.cursor = 'not-allowed';
            uploadLabel.style.backgroundColor = '#2d3748';
            uploadLabel.style.borderColor = '#4a5568';
            
            const textElement = uploadLabel.querySelector('span.text-sm');
            if(textElement) {
               textElement.textContent = 'Gambar berhasil diunggah';
            }
        }
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
    hideError();
    resultImage.classList.add('hidden');
    placeholderText.classList.remove('hidden');

    const apiKey = "AIzaSyBA3d4XreZ_u0arABPI-eJXO55roSaNfrw"; // Ganti dengan API Key Anda
    const model = "gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [
                { text: `INSTRUCTION: Return only the edited image file with no additional text or description. If you must return a URL, return ONLY the URL and nothing else. USER_PROMPT: ${promptInput.value}` },
                {
                    inlineData: {
                        mimeType: uploadedImageType,
                        data: uploadedImageBase64
                    }
                }
            ]
        }],
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const specificError = errorData?.error?.message || `HTTP error! status: ${response.status}`;
            throw new Error(specificError);
        }

        const result = await response.json();
        
        if (!result.candidates || result.candidates.length === 0) {
            if (result.promptFeedback && result.promptFeedback.blockReason) {
                throw new Error(`Permintaan Anda diblokir karena: ${result.promptFeedback.blockReason}. Coba perintah lain.`);
            }
            throw new Error("API tidak memberikan respons kandidat yang valid.");
        }

        const candidate = result.candidates[0];
        const part = candidate.content?.parts?.[0];

        let imageFound = false;

        // **PRIORITAS 1: Cek apakah ada data gambar langsung (base64)**
        if (part && part.inlineData && part.inlineData.data) {
            resultImage.src = `data:image/png;base64,${part.inlineData.data}`;
            imageFound = true;
        
        // **PRIORITAS 2: Jika tidak ada, cek apakah ada URL gambar di dalam TEKS balasan**
        } else if (part && part.text) {
            // Regex untuk menemukan URL gambar (http/https, diakhiri .png/jpg/jpeg/webp, bisa di dalam kurung markdown)
            const urlRegex = /(https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp))/i;
            const match = part.text.match(urlRegex);

            // Jika URL ditemukan di dalam teks...
            if (match && match[0]) {
                resultImage.src = match[0]; // Langsung gunakan URL yang ditemukan
                imageFound = true;
            }
        }
        
        // Logika Tampilan Hasil
        if (imageFound) {
            resultImage.classList.remove('hidden');
            placeholderText.classList.add('hidden');
            hideError();
        } else {
            // Jika tidak ada gambar sama sekali, tampilkan pesan error
            let reasonText = "Tidak dapat menemukan data gambar atau URL dalam respons API.";
            if (candidate.finishReason === "SAFETY") {
                reasonText = "Gambar tidak dapat dibuat karena melanggar kebijakan keamanan.";
            } else if (candidate.finishReason) {
                reasonText = `Proses dihentikan karena: ${candidate.finishReason}.`;
            }
            // Jika ada teks balasan dari AI, tampilkan itu sebagai alasan
            if (part && part.text) {
                 reasonText = `AI merespons dengan pesan: "${part.text}"`;
            }
            showError(reasonText);
        }

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        showError(`Terjadi kesalahan: ${error.message}`);
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
