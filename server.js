import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

if (!process.env.GROQ_API_KEY) {
  console.error("ERROR: GROQ_API_KEY is not set. Add it to .env or the environment before running the backend.");
}

app.post("/api/analyze", upload.single("audio"), async (req, res) => {
  try {
    let transcript = "";

    // TEXT INPUT
    if (req.body.text) {
      transcript = req.body.text;
    }

    // AUDIO INPUT
    else if (req.file) {
      transcript = "Voice response received";
    }

    if (!transcript) {
      return res.status(400).json({
        error: "No input provided",
      });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
You are an AI analyst for employee leadership feedback.

Analyze the employee response and return ONLY valid JSON.

Format:
{
  "sentiment": "",
  "summary": "",
  "recommendedAction": "",
  "themes": [],
  "confidence": ""
}

Sentiment should be:
Positive, Neutral, or Negative.
          `,
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

    let analysis;

    try {
      analysis = JSON.parse(raw);
    } catch (err) {
      console.warn("Groq returned non-JSON content, falling back to summary.", raw);
      analysis = {
        sentiment: "Neutral",
        summary: transcript,
        recommendedAction: "Review feedback manually",
        themes: ["General Feedback"],
        confidence: "Medium",
      };
    }

    res.json({
      transcript,
      analysis,
    });
  } catch (error) {
    console.error("Groq analysis error:", error);

    res.status(500).json({
      error: error?.message || "Analysis failed",
    });
  }
});

const PORT = process.env.PORT || 5178;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});