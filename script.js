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

    // --- PERUBAHAN UTAMA ADA DI PAYLOAD INI ---
    const payload = {
        contents: [{
            parts: [
                // 1. Tambahkan instruksi sistem di depan prompt pengguna
                { text: `INSTRUCTION: Return only the edited image file with no additional text or description. USER_PROMPT: ${promptInput.value}` },
                {
                    inlineData: {
                        mimeType: uploadedImageType,
                        data: uploadedImageBase64
                    }
                }
            ]
        }],
        // 2. Tambahkan generationConfig untuk memaksa output gambar
        generationConfig: {
            "responseMimeType": "image/png"
        },
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
        
        if (!result.candidates || result.candidates.length === 0) {
            if(result.promptFeedback && result.promptFeedback.blockReason) {
                throw new Error(`Permintaan Anda diblokir karena: ${result.promptFeedback.blockReason}. Coba perintah lain.`);
            }
            throw new Error("API tidak memberikan respons yang valid.");
        }

        const candidate = result.candidates[0];
        const part = candidate.content?.parts?.[0];

        if (part && part.inlineData && part.inlineData.data) {
            resultImage.src = `data:image/png;base64,${part.inlineData.data}`;
            resultImage.classList.remove('hidden');
            placeholderText.classList.add('hidden');
            hideError();
        } else if (part && part.text) {
            showError(`AI merespons dengan pesan: "${part.text}"`);
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