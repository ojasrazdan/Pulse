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
      model: "llama3-70b-8192",
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

    const raw = completion.choices[0].message.content;

    let analysis;

    try {
      analysis = JSON.parse(raw);
    } catch (err) {
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
    console.error(error);

    res.status(500).json({
      error: "Analysis failed",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});