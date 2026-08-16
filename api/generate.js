const ALLOWED_MODELS = new Set([
  "zimage",
  "flux",
  "seedream5",
  "nanobanana-2",
  "gptimage"
]);

const ALLOWED_SIZES = new Set([
  "1024x1024",
  "1024x1280",
  "1280x720",
  "720x1280",
  "1536x1024"
]);

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function sizeToDimensions(size) {
  const [width, height] = size.split("x").map(Number);
  return { width, height };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, {
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.POLLINATIONS_API_KEY;

  if (!apiKey) {
    return sendJson(res, 500, {
      error:
        "POLLINATIONS_API_KEY belum tersedia di Vercel Environment Variables."
    });
  }

  try {
    const body = req.body || {};

    const prompt =
      typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";

    const model = ALLOWED_MODELS.has(body.model)
      ? body.model
      : "zimage";

    const size = ALLOWED_SIZES.has(body.size)
      ? body.size
      : "1024x1024";

    if (prompt.length < 2) {
      return sendJson(res, 400, {
        error: "Prompt tidak valid."
      });
    }

    if (prompt.length > 4000) {
      return sendJson(res, 400, {
        error: "Prompt terlalu panjang."
      });
    }

    const { width, height } = sizeToDimensions(size);

    const url = new URL(
      `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}`
    );

    url.searchParams.set("model", model);
    url.searchParams.set("width", String(width));
    url.searchParams.set("height", String(height));
    url.searchParams.set("nologo", "true");

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*"
      }
    });

    const contentType =
      upstream.headers.get("content-type") || "";

    if (!upstream.ok) {
      const errorText = await upstream.text();

      let detail = errorText.trim();

      try {
        const parsed = JSON.parse(detail);

        detail =
          parsed?.error?.message ||
          parsed?.error ||
          detail;
      } catch (_) {}

      if (upstream.status === 401) {
        detail =
          "API key Pollinations tidak valid atau tidak diterima.";
      }

      if (upstream.status === 402) {
        detail =
          "Pollen/budget Pollinations tidak mencukupi untuk request ini.";
      }

      if (upstream.status === 429) {
        detail =
          "Rate limit tercapai. Tunggu sebentar lalu coba lagi.";
      }

      return sendJson(res, 502, {
        error:
          detail ||
          `Pollinations HTTP ${upstream.status}`,
        upstreamStatus: upstream.status
      });
    }

    if (!contentType.startsWith("image/")) {
      const text = await upstream.text();

      return sendJson(res, 502, {
        error:
          "Pollinations tidak mengembalikan file gambar.",
        upstreamResponse: text.slice(0, 500)
      });
    }

    const buffer = Buffer.from(
      await upstream.arrayBuffer()
    );

    const mime =
      contentType.split(";")[0] ||
      "image/jpeg";

    const image =
      `data:${mime};base64,${buffer.toString("base64")}`;

    return sendJson(res, 200, {
      image
    });

  } catch (error) {
    console.error("generate.js error:", error);

    return sendJson(res, 500, {
      error:
        error?.message ||
        "Internal server error"
    });
  }
};
