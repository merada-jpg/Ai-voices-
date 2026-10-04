import { GoogleGenAI } from "@google/genai";

const VOICES = new Set(["Puck", "Kore", "Charon", "Fenrir", "Zephyr"]);
const MODEL = "gemini-3.8-flash-tts";
const MAX_TEXT = 5000;

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const contentType = String(req.headers?.["content-type"] || "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    res.status(415).json({ error: "صيغة الطلب غير مدعومة." });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "خدمة الصوت ما راهيش مهيأة في السيرفر." });
    return;
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const cleanText = String(body.text || "").trim();
    const voice = String(body.voice || "Puck");
    const safePitch = clampNumber(body.pitch, 0.7, 1.3, 1);

    if (!cleanText) {
      res.status(400).json({ error: "اكتب النص قبل ما تولّد الصوت." });
      return;
    }

    if (cleanText.length > MAX_TEXT) {
      res.status(400).json({
        error: `النص طويل بزاف. الحد الأقصى هو ${MAX_TEXT} حرف.`,
      });
      return;
    }

    if (!VOICES.has(voice)) {
      res.status(400).json({ error: "الصوت المختار غير متوفر." });
      return;
    }

    const pitchHint = safePitch < 0.95
      ? "slightly lower-pitched"
      : safePitch > 1.05
        ? "slightly higher-pitched"
        : "natural pitch";

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{
        role: "user",
        parts: [{
          text: cleanText,
          speechMetadata: {
            style: `Clear, warm, authentic Algerian Arabic (white Darija) speaker from Algiers. Natural conversational cadence, ${pitchHint}. Preserve the exact words and Algerian pronunciation.`,
          },
        }],
      }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          languageCode: "ar-XA",
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData?.data
    )?.inlineData;

    if (!inlineData?.data) {
      res.status(502).json({ error: "Gemini ما رجّعش ملف صوتي." });
      return;
    }

    const audio = Buffer.from(inlineData.data, "base64");
    if (!audio.length) {
      res.status(502).json({ error: "ملف الصوت رجع فارغ." });
      return;
    }

    const upstreamMimeType = String(inlineData.mimeType || "").toLowerCase().split(";")[0].trim();
    const mimeType = new Set(["audio/wav", "audio/mpeg", "audio/ogg", "audio/webm"]).has(upstreamMimeType)
      ? upstreamMimeType
      : "audio/wav";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", audio.length);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).send(audio);
  } catch (error) {
    console.error("Gemini TTS error:", error?.name || "Error", error?.message || "Unknown error");
    res.status(500).json({
      error: "ما قدرناش نولّدو الصوت دابا. جرّب من جديد.",
    });
  }
}