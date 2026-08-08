const $ = (id) => document.getElementById(id);

const state = {
  referenceFile: null,
  characterFile: null,
  mode: "person",
  lastResultUrl: null,
  referenceAspect: 1
};

const referenceInput = $("referenceInput");
const characterInput = $("characterInput");
const referenceDrop = $("referenceDrop");
const characterDrop = $("characterDrop");
const referencePreview = $("referencePreview");
const characterPreview = $("characterPreview");
const changeReference = $("changeReference");
const changeCharacter = $("changeCharacter");
const generateBtn = $("generateBtn");
const generateText = $("generateText");
const preserveRange = $("preserveRange");
const preserveValue = $("preserveValue");
const extraPrompt = $("extraPrompt");
const promptCount = $("promptCount");
const consentCheck = $("consentCheck");
const preserveIdentity = $("preserveIdentity");
const resultStage = $("resultStage");
const resultEmpty = $("resultEmpty");
const resultImage = $("resultImage");
const resultActions = $("resultActions");
const loader = $("loader");
const statusBox = $("statusBox");
const downloadBtn = $("downloadBtn");
const regenerateBtn = $("regenerateBtn");

function updateGenerateState() {
  generateBtn.disabled = !(state.referenceFile && state.characterFile && consentCheck.checked);
}

function setStatus(message = "", type = "") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`.trim();
}

function setLoading(value) {
  loader.classList.toggle("active", value);
  generateBtn.disabled = value || !(state.referenceFile && state.characterFile && consentCheck.checked);
  generateText.textContent = value ? "Generating..." : "Generate Image";
}

async function readImageDimensions(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function resizeForModel(file, maxSide = 500) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Gagal memproses gambar.")), "image/png", 0.95);
  });
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" });
}

function outputSizeFromAspect(aspect) {
  const max = 1280;
  const min = 640;
  let width, height;
  if (aspect >= 1) {
    width = max;
    height = Math.round(max / aspect);
  } else {
    height = max;
    width = Math.round(max * aspect);
  }
  width = Math.max(min, Math.min(1920, Math.round(width / 64) * 64));
  height = Math.max(min, Math.min(1920, Math.round(height / 64) * 64));
  return { width, height };
}

async function useFile(file, kind) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    setStatus("Format gambar harus PNG, JPG, atau WebP.", "error");
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    setStatus("Ukuran gambar maksimal 12 MB.", "error");
    return;
  }

  const previewUrl = URL.createObjectURL(file);
  if (kind === "reference") {
    if (referencePreview.dataset.url) URL.revokeObjectURL(referencePreview.dataset.url);
    referencePreview.dataset.url = previewUrl;
    referencePreview.src = previewUrl;
    referenceDrop.classList.add("has-image");
    state.referenceFile = file;
    const dimensions = await readImageDimensions(file);
    state.referenceAspect = dimensions.width / dimensions.height;
  } else {
    if (characterPreview.dataset.url) URL.revokeObjectURL(characterPreview.dataset.url);
    characterPreview.dataset.url = previewUrl;
    characterPreview.src = previewUrl;
    characterDrop.classList.add("has-image");
    state.characterFile = file;
  }
  setStatus("");
  updateGenerateState();
}

function bindDropZone(zone, input, kind) {
  input.addEventListener("change", () => useFile(input.files?.[0], kind));
  ["dragenter", "dragover"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add("dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.remove("dragging");
    });
  });
  zone.addEventListener("drop", (event) => useFile(event.dataTransfer.files?.[0], kind));
}

bindDropZone(referenceDrop, referenceInput, "reference");
bindDropZone(characterDrop, characterInput, "character");

changeReference.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  referenceInput.click();
});
changeCharacter.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  characterInput.click();
});

$("modeControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-mode]");
  if (!button) return;
  $("modeControl").querySelectorAll("button").forEach((b) => b.classList.remove("active"));
  button.classList.add("active");
  state.mode = button.dataset.mode;
});

preserveRange.addEventListener("input", () => {
  preserveValue.textContent = `${preserveRange.value}%`;
});
extraPrompt.addEventListener("input", () => {
  promptCount.textContent = extraPrompt.value.length;
});
consentCheck.addEventListener("change", updateGenerateState);

async function generate() {
  const apiUrl = window.REFORGE_CONFIG?.API_URL;
  if (!apiUrl || apiUrl.includes("YOUR-WORKER")) {
    setStatus("Atur API_URL di config.js terlebih dahulu setelah Worker di-deploy.", "error");
    return;
  }
  if (!state.referenceFile || !state.characterFile || !consentCheck.checked) return;

  try {
    setStatus("");
    setLoading(true);
    resultActions.classList.remove("visible");

    const [reference, character] = await Promise.all([
      resizeForModel(state.referenceFile),
      resizeForModel(state.characterFile)
    ]);
    const { width, height } = outputSizeFromAspect(state.referenceAspect);

    const form = new FormData();
    form.append("reference", reference);
    form.append("character", character);
    form.append("mode", state.mode);
    form.append("preserve", preserveRange.value);
    form.append("identity", preserveIdentity.checked ? "1" : "0");
    form.append("extra_prompt", extraPrompt.value.trim());
    form.append("width", String(width));
    form.append("height", String(height));

    const response = await fetch(apiUrl, { method: "POST", body: form });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Request gagal (${response.status}).`);
    if (!payload.image) throw new Error("Backend tidak mengembalikan gambar.");

    if (state.lastResultUrl?.startsWith("blob:")) URL.revokeObjectURL(state.lastResultUrl);
    state.lastResultUrl = payload.image;
    resultImage.src = payload.image;
    resultStage.classList.add("has-result");
    resultEmpty.style.display = "none";
    resultActions.classList.add("visible");
    setStatus("Selesai. Coba Generate ulang jika ingin variasi lain.", "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Terjadi kesalahan saat generate.", "error");
  } finally {
    setLoading(false);
  }
}

generateBtn.addEventListener("click", generate);
regenerateBtn.addEventListener("click", generate);

downloadBtn.addEventListener("click", async () => {
  if (!resultImage.src) return;
  try {
    const response = await fetch(resultImage.src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reforge-ai-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    window.open(resultImage.src, "_blank", "noopener,noreferrer");
  }
});
