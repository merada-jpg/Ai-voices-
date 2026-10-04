import { GoogleGenAI } from "@google/genai";

const VOICES = new Set(["Puck","Kore","Charon","Fenrir","Zephyr"]);
const MODEL = "gemini-3.8-flash-tts";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: "GEMINI_API_KEY ما راهيش مضبوطة في السيرفر." });
    return;
  }

  try {
    const { text, voice = "Puck", rate = 1, pitch = 1 } = req.body || {};
    const cleanText = String(text || "").trim();

    if (!cleanText) {
      res.status(400).json({ error: "اكتب النص قبل ما تولّد الصوت." });
      return;
    }

    if (cleanText.length > 5000) {
      res.status(400).json({ error: "النص طويل بزاف. الحد الأقصى هو 5000 حرف." });
      return;
    }

    if (!VOICES.has(voice)) {
      res.status(400).json({ error: "الصوت المختار غير متوفر." });
      return;
    }

    const safeRate = Math.min(1.5, Math.max(0.75, Number(rate) || 1));
    const safePitch = Math.min(1.3, Math.max(0.7, Number(pitch) || 1));

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
            style: `Clear, warm, authentic Algerian Arabic (white Darija) speaker from Algiers. Natural conversational cadence, ${pitchHint}, speaking at a ${safeRate}x requested pace. Preserve the exact words and Algerian pronunciation.`,
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

    const data = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData?.data
    )?.inlineData?.data;

    if (!data) {
      res.status(502).json({ error: "Gemini ما رجّعش ملف صوتي." });
      return;
    }

    const audio = Buffer.from(data, "base64");
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", audio.length);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(audio);
  } catch (error) {
    console.error("Gemini TTS error:", error);
    res.status(500).json({
      error: "ما قدرناش نولّدو الصوت دابا. جرّب من جديد.",
    });
  }
}