// File: script.js - Versi Generator Caption

const imageUpload = document.getElementById('image-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const promptInput = document.getElementById('prompt-input');
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const resultContainer = document.getElementById('result-container');
const resultText = document.getElementById('result-text'); 
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

let uploadedImageBase64 = null;
let uploadedImageType = null;

imageUpload.addEventListener('change', handleImageUpload);
generateBtn.addEventListener('click', generateImage);

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

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
        const uploadLabel = document.querySelector('label[for="image-upload"]');
        imageUpload.disabled = true;
        if (uploadLabel) {
            uploadLabel.style.cursor = 'not-allowed';
            uploadLabel.style.backgroundColor = '#2d3748';
            uploadLabel.querySelector('span.text-sm').textContent = 'Gambar berhasil diunggah';
        }
    };
    reader.readAsDataURL(file);
}

async function generateImage() {
    if (!uploadedImageBase64) {
        showError('Harap unggah gambar terlebih dahulu.');
        return;
    }

    setLoading(true);
    hideError();
    resultText.textContent = "";

    const apiKey = "AIzaSyBA3d4XreZ_u0arABPI-eJXO55roSaNfrw"; // Ganti dengan API Key Anda
    const model = "gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // --- PERUBAHAN UTAMA ADA DI SINI ---
    const captionStyle = promptInput.value.trim();
    
    // Prompt ini secara spesifik meminta AI untuk menjadi manajer media sosial
    let finalPrompt = `You are a professional social media manager. Analyze the uploaded image and generate 3 creative and engaging caption options for an Instagram post. Make sure to include relevant and popular hashtags for each option. The response should be well-formatted.`;

    // Jika pengguna memasukkan gaya, tambahkan ke prompt
    if (captionStyle) {
        finalPrompt += ` The user has requested a specific style: "${captionStyle}". Please adhere to this style.`;
    }

    const payload = {
        contents: [{
            parts: [
                { text: finalPrompt },
                { inlineData: { mimeType: uploadedImageType, data: uploadedImageBase64 } }
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
            throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        if (part && part.text) {
            resultText.textContent = part.text;
            hideError();
        } else {
            let reasonText = "API tidak memberikan respons teks yang valid.";
            if (candidate?.finishReason) {
                reasonText += ` Alasan: ${candidate.finishReason}`;
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
