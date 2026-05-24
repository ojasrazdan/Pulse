import dotenv from "dotenv";
import Groq from "groq-sdk";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const parseForm = async (req) => {
  const form = formidable({ multiples: false });
  const [fields, files] = await form.parse(req);
  return { fields, files };
};

const createFallbackAnalysis = (transcript) => ({
  sentiment: "Neutral",
  summary: transcript,
  recommendedAction: "Review feedback manually",
  themes: ["General Feedback"],
  confidence: "Medium",
});

const safeParseJson = (raw) => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: "GROQ_API_KEY is not configured. Set it in Vercel Environment Variables or a local .env file.",
    });
  }

  try {
    const { fields, files } = await parseForm(req);
    const text = fields?.text?.toString()?.trim();
    const transcript = text || (files?.audio ? "Voice response received" : "");

    if (!transcript) {
      return res.status(400).json({ error: "No input provided" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are an AI analyst for employee leadership feedback.\n\nAnalyze the employee response and return ONLY valid JSON.\n\nFormat:\n{\n  \"sentiment\": \"\",\n  \"summary\": \"\",\n  \"recommendedAction\": \"\",\n  \"themes\": [],\n  \"confidence\": \"\"\n}\n\nSentiment should be: Positive, Neutral, or Negative.`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    const raw = completion?.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error("Groq returned no text content.");
    }

    let analysis = safeParseJson(raw);

    if (!analysis) {
      analysis = createFallbackAnalysis(transcript);
    }

    return res.status(200).json({ transcript, analysis });
  } catch (error) {
    console.error("API analyze error:", error);
    return res.status(500).json({ error: error?.message || "Analysis failed" });
  }
}
