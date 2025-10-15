const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const btn = document.getElementById("generateBtn");
const result = document.getElementById("result");
const loading = document.getElementById("loading");

let selectedFile = null;

// === Ganti ini dengan token kamu ===
const HF_TOKEN = "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"; // contoh: "hf_abcd1234xyz"

// upload handler
input.addEventListener("change", () => {
  const file = input.files[0];
  if (!file) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
  };
  reader.readAsDataURL(file);
  btn.disabled = false;
});

btn.addEventListener("click", async () => {
  if (!selectedFile) return;

  result.classList.add("hidden");
  loading.classList.remove("hidden");
  btn.disabled = true;

  const blob = await selectedFile.arrayBuffer();

  const response = await fetch(
    "https://cors-anywhere.huggingface.co/api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
    {
      headers: { 
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/octet-stream"
      },
      method: "POST",
      body: blob,
    }
  );

  const data = await response.json();
  loading.classList.add("hidden");
  btn.disabled = false;

  if (data.error) {
    result.innerHTML = `<p>Terjadi kesalahan: ${data.error}</p>`;
    result.classList.remove("hidden");
    return;
  }

  const text = data[0]?.generated_text || "Tidak bisa mengenali gambar.";
  result.innerHTML = `<h3>Prompt:</h3><p>${text}</p>`;
  result.classList.remove("hidden");
});
