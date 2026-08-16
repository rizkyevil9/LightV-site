const ALLOWED_MODELS = new Set([
  'zimage',
  'flux',
  'seedream5',
  'nanobanana-2',
  'gptimage',
  'kontext',
  'seedream',
  'seedream-pro',
  'nanobanana',
  'nanobanana-pro',
  'gptimage-large',
  'gpt-image-2',
  'klein',
  'nova-canvas'
]);

const ALLOWED_SIZES = new Set([
  '1024x1024',
  '1024x1280',
  '1280x720',
  '720x1280',
  '1536x1024'
]);

function json(res, status, body) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return json(res, 405, {
      error: 'Method not allowed'
    });
  }

  const apiKey = process.env.POLLINATIONS_API_KEY;

  if (!apiKey) {
    return json(res, 500, {
      error: 'POLLINATIONS_API_KEY belum diset di Vercel.'
    });
  }

  try {
    const body = req.body || {};

    const prompt = body.prompt;
    const model = body.model || 'zimage';
    const size = body.size || '1024x1024';

    if (
      typeof prompt !== 'string' ||
      prompt.trim().length < 2
    ) {
      return json(res, 400, {
        error: 'Prompt tidak valid.'
      });
    }

    const safeModel = ALLOWED_MODELS.has(model)
      ? model
      : 'zimage';

    const safeSize = ALLOWED_SIZES.has(size)
      ? size
      : '1024x1024';

    const response = await fetch(
      'https://gen.pollinations.ai/v1/images/generations',
      {
        method: 'POST',

        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          prompt: prompt.trim(),
          model: safeModel,
          n: 1,
          size: safeSize
        })
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!response.ok) {
      return json(res, 502, {
        error:
          data?.error?.message ||
          data?.error ||
          `Pollinations API HTTP ${response.status}`
      });
    }

    const result = data?.data?.[0];

    if (!result) {
      return json(res, 502, {
        error: 'Pollinations tidak mengembalikan data gambar.'
      });
    }

    if (result.b64_json) {
      return json(res, 200, {
        image: `data:image/png;base64,${result.b64_json}`
      });
    }

    if (result.url) {
      return json(res, 200, {
        image: result.url
      });
    }

    return json(res, 502, {
      error: 'Format gambar dari Pollinations tidak dikenali.'
    });

  } catch (error) {
    return json(res, 500, {
      error: error?.message || 'Internal server error'
    });
  }
};
