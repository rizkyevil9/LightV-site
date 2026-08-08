const MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGIN || "*").trim();
  const allowOrigin = allowed === "*" || allowed === origin ? (origin || "*") : allowed;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(data, status, origin, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin, env)
    }
  });
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function buildPrompt({ mode, preserve, identity, extra }) {
  const strictness = preserve >= 94
    ? "Preserve image 0 extremely strictly. Keep the same camera angle, crop, framing, pose, body position, perspective, background, environment, lighting direction, shadows, color grading, effects, props and composition. Do not redesign the scene and do not add or remove background objects."
    : preserve >= 82
      ? "Preserve image 0 closely: keep the same pose, framing, camera angle, background, lighting, effects, props and overall composition. Avoid changing anything unrelated to the main character."
      : "Use image 0 as the strong scene, pose, composition, lighting and effects reference. Keep the overall scene recognizably the same.";

  const sourceInstruction = mode === "skinsheet"
    ? "Image 1 is a character skinsheet/texture reference. Reconstruct the character faithfully from its colors, clothing/skin patterns, hair/helmet details and distinctive visual features, then use that reconstructed character to replace the main character/person in image 0."
    : "Image 1 is the replacement character/person reference. Replace the main character/person in image 0 with the subject from image 1.";

  const identityInstruction = identity
    ? "Preserve the replacement character identity and distinctive appearance as strongly as possible: face shape when visible, hairstyle, hair color, skin tone, clothing, accessories, body features and signature colors."
    : "Use the general appearance of the subject from image 1 while allowing small appearance adaptations to fit the scene.";

  const compositionInstruction = "The replacement must inherit the exact pose and placement of the original main character in image 0, including limb positions and viewing direction when possible. Match the reference scene's rendering quality, depth of field, reflections, rim light, particles, glow and post-processing. Change only the main character. Do not create a side-by-side collage, duplicate character, split screen, before/after layout, text, watermark or UI.";

  const extraInstruction = extra ? `Additional user instruction: ${extra}` : "";

  return [strictness, sourceInstruction, identityInstruction, compositionInstruction, extraInstruction]
    .filter(Boolean)
    .join(" ");
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405, origin, env);
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/generate") {
      return json({ error: "Not found." }, 404, origin, env);
    }

    try {
      const incoming = await request.formData();
      const reference = incoming.get("reference");
      const character = incoming.get("character");

      if (!(reference instanceof File) || !(character instanceof File)) {
        return json({ error: "Dua gambar wajib diupload." }, 400, origin, env);
      }
      for (const file of [reference, character]) {
        if (!ALLOWED_TYPES.has(file.type)) {
          return json({ error: "Format gambar harus PNG, JPG, atau WebP." }, 400, origin, env);
        }
        if (file.size > MAX_INPUT_BYTES) {
          return json({ error: "Ukuran tiap gambar maksimal 12 MB." }, 400, origin, env);
        }
      }

      const mode = incoming.get("mode") === "skinsheet" ? "skinsheet" : "person";
      const preserve = clampNumber(incoming.get("preserve"), 60, 100, 90);
      const identity = incoming.get("identity") !== "0";
      const extra = String(incoming.get("extra_prompt") || "").slice(0, 500).trim();
      const width = Math.round(clampNumber(incoming.get("width"), 256, 1920, 1024));
      const height = Math.round(clampNumber(incoming.get("height"), 256, 1920, 1024));
      const prompt = buildPrompt({ mode, preserve, identity, extra });

      const modelForm = new FormData();
      modelForm.append("input_image_0", reference, reference.name || "reference.png");
      modelForm.append("input_image_1", character, character.name || "character.png");
      modelForm.append("prompt", prompt);
      modelForm.append("width", String(width));
      modelForm.append("height", String(height));
      modelForm.append("guidance", preserve >= 90 ? "4.5" : preserve >= 78 ? "4.0" : "3.5");
      modelForm.append("seed", String(Math.floor(Math.random() * 2147483647)));

      const serialized = new Response(modelForm);
      const result = await env.AI.run(MODEL, {
        multipart: {
          body: serialized.body,
          contentType: serialized.headers.get("content-type")
        }
      });

      if (!result?.image) {
        return json({ error: "Model tidak mengembalikan gambar. Coba lagi." }, 502, origin, env);
      }

      return json({
        image: `data:image/jpeg;base64,${result.image}`,
        model: MODEL
      }, 200, origin, env);
    } catch (error) {
      console.error(error);
      const message = String(error?.message || error || "Unknown error");
      const friendly = message.includes("capacity") || message.includes("3040")
        ? "Model sedang penuh. Coba generate lagi beberapa saat kemudian."
        : "Generate gagal di backend. Periksa log Worker atau kuota Workers AI.";
      return json({ error: friendly }, 500, origin, env);
    }
  }
};
