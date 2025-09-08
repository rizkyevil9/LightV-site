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
    hideError(); // Sembunyikan error lama sebelum memulai permintaan baru
    resultImage.classList.add('hidden'); // Sembunyikan gambar hasil lama
    placeholderText.classList.remove('hidden'); // Tampilkan placeholder lagi

    // PENTING: Ganti dengan API Key Anda yang sebenarnya
    const apiKey = "AIzaSyBA3d4XreZ_u0arABPI-eJXO55roSaNfrw"; 
    const model = "gemini-1.5-flash";
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
         // Tambahkan konfigurasi keamanan untuk mengurangi pemblokiran yang tidak perlu
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
            throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // 1. Cek apakah ada kandidat respons
        if (!result.candidates || result.candidates.length === 0) {
            // Cek apakah permintaan diblokir karena prompt
            if(result.promptFeedback && result.promptFeedback.blockReason) {
                throw new Error(`Permintaan Anda diblokir karena: ${result.promptFeedback.blockReason}. Coba perintah lain.`);
            }
            throw new Error("API tidak memberikan respons yang valid.");
        }

        const candidate = result.candidates[0];
        const part = candidate.content?.parts?.[0];

        // 2. Cek apakah respons berisi DATA GAMBAR (inlineData)
        if (part && part.inlineData && part.inlineData.data) {
            resultImage.src = `data:image/png;base64,${part.inlineData.data}`;
            resultImage.classList.remove('hidden');
            placeholderText.classList.add('hidden');
            hideError();
        // 3. ATAU, cek apakah respons berisi TEKS
        } else if (part && part.text) {
             // Jika API merespons dengan teks, itu adalah penjelasan mengapa gambar tidak dibuat.
             // Tampilkan teks ini sebagai error agar lebih informatif.
            showError(`AI merespons dengan pesan: "${part.text}"`);
        // 4. Jika tidak keduanya, cek alasan lain seperti kebijakan keamanan
        } else {
            let reasonText = "Tidak dapat menemukan data gambar dalam respons API.";
            if (candidate.finishReason === "SAFETY") {
                reasonText = "Gambar tidak dapat dibuat karena melanggar kebijakan keamanan. Silakan coba perintah atau gambar lain.";
            } else if (candidate.finishReason) {
                 reasonText = `Proses dihentikan karena: ${candidate.finishReason}.`;
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