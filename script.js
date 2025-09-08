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
                { text: `INSTRUCTION: Return only the edited image file with no additional text or description. USER_PROMPT: ${promptInput.value}` },
                {
                    inlineData: {
                        mimeType: uploadedImageType,
                        data: uploadedImageBase64
                    }
                }
            ]
        }],
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
            if (result.promptFeedback && result.promptFeedback.blockReason) {
                throw new Error(`Permintaan Anda diblokir karena: ${result.promptFeedback.blockReason}. Coba perintah lain.`);
            }
            throw new Error("API tidak memberikan respons yang valid.");
        }

        const candidate = result.candidates[0];
        const part = candidate.content?.parts?.[0];

        // --- LOGIKA BARU YANG LEBIH CERDAS ---

        // Prioritas 1: Cek apakah ada data gambar langsung (base64)
        if (part && part.inlineData && part.inlineData.data) {
            resultImage.src = `data:image/png;base64,${part.inlineData.data}`;
            resultImage.classList.remove('hidden');
            placeholderText.classList.add('hidden');
            hideError();
        
        // Prioritas 2: Jika tidak ada, cek apakah ada TEKS balasan
        } else if (part && part.text) {
            // Gunakan regular expression untuk mencari URL gambar di dalam teks
            const urlRegex = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|webp))/i;
            const match = part.text.match(urlRegex);

            // Jika URL ditemukan di dalam teks...
            if (match && match[0]) {
                const imageUrl = match[0];
                resultImage.src = imageUrl; // Langsung gunakan URL tersebut
                resultImage.classList.remove('hidden');
                placeholderText.classList.add('hidden');
                hideError();
            } else {
                // Jika tidak ada URL, berarti ini benar-benar pesan teks. Tampilkan sebagai error.
                showError(`AI merespons dengan pesan: "${part.text}"`);
            }
        
        // Prioritas 3: Fallback jika tidak ada data sama sekali
        } else {
            let reasonText = "Tidak dapat menemukan data gambar atau teks dalam respons API.";
            if (candidate.finishReason === "SAFETY") {
                reasonText = "Gambar tidak dapat dibuat karena melanggar kebijakan keamanan.";
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