import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });
const API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
const hasValidApiKey = API_KEY && !API_KEY.includes("your_gemini_api_key_here");

if (!hasValidApiKey) {
  console.error("ERROR: GEMINI_API_KEY is not set or is still the placeholder value. Create a .env file with GEMINI_API_KEY or set the environment variable.");
}

const cleanupFile = (filepath) => {
  fs.unlink(filepath, (err) => {
    if (err) {
      console.warn("Failed to remove temp file", filepath, err);
    }
  });
};

const parseJsonResponse = async (response, label = "API") => {
  try {
    const text = await response.text();
    if (!text) {
      console.warn(`${label} returned empty response`);
      return { json: null, raw: "" };
    }

    try {
      return { json: JSON.parse(text), raw: text };
    } catch (parseErr) {
      console.warn(`${label} returned non-JSON: ${text.substring(0, 200)}`);
      return { json: null, raw: text };
    }
  } catch (err) {
    console.error(`${label} response error:`, err.message);
    return { json: null, raw: "", error: err.message };
  }
};

app.post("/api/analyze", upload.single("audio"), async (req, res) => {
  try {
    if (!hasValidApiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is required and must be set to a valid value in .env or the environment." });
    }

    let transcriptText = req.body?.text || "";

    if (req.file && !transcriptText) {
      const audioPath = req.file.path;
      const audioBytes = fs.readFileSync(audioPath).toString("base64");
      const transcriptionResponse = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            encoding: "WEBM_OPUS",
            sampleRateHertz: 48000,
            languageCode: "en-US",
          },
          audio: {
            content: audioBytes,
          },
        }),
      });

      const { json: transcriptionData, raw: transcriptionRaw } = await parseJsonResponse(transcriptionResponse, "Speech-to-Text");
      cleanupFile(audioPath);

      if (!transcriptionResponse.ok) {
        const transError = transcriptionData?.error || transcriptionData;
        const serviceDisabled = transcriptionData?.error?.details?.some((detail) => detail?.reason === "SERVICE_DISABLED");
        const errorMessage =
          transcriptionData?.error?.message ||
          transcriptionData?.error ||
          transcriptionRaw ||
          `Speech-to-Text request failed with status ${transcriptionResponse.status}`;

        if (serviceDisabled) {
          return res.status(502).json({
            error: "Speech-to-Text is disabled for this project. Enable Cloud Speech-to-Text in the Google Cloud Console or submit a typed response instead.",
          });
        }

        return res.status(502).json({ error: errorMessage });
      }

      if (!transcriptionData) {
        return res.status(502).json({ error: "Speech-to-Text returned invalid or empty JSON. Enable the Speech-to-Text API or submit typed text." });
      }

      const recognition = transcriptionData.results?.[0]?.alternatives?.[0]?.transcript || "";
      transcriptText = recognition;
    }

    if (!transcriptText) {
      return res.status(400).json({ error: "No audio or text provided for analysis." });
    }

    const prompt = `You are an AI analyst for leadership feedback. Analyze the following response transcript and return a JSON object with keys: sentiment, summary, recommendedAction, themes, confidence.

Transcript:\n${transcriptText}\n\nReturn ONLY valid JSON.`;

    const completionResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 250,
        },
      }),
    });

    const { json: completionData, raw: completionRaw } = await parseJsonResponse(completionResponse, "Gemini");

    if (!completionResponse.ok) {
      const errorMessage =
        completionData?.error?.message ||
        completionData?.error ||
        completionRaw ||
        `AI generation request failed with status ${completionResponse.status}`;
      return res.status(completionResponse.status === 502 ? 502 : 500).json({ error: errorMessage });
    }

    const completionText =
      completionData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      completionData?.candidates?.[0]?.output ||
      completionData?.candidates?.[0]?.content ||
      completionData?.outputText ||
      completionData?.text ||
      completionRaw ||
      "";

    let analysis = { sentiment: "neutral", summary: "No summary available.", recommendedAction: "No action available.", themes: [], confidence: "medium" };

    try {
      // Remove markdown code fences first
      let cleanText = completionText
        .replace(/^```json\s*/gm, "")
        .replace(/^```\s*/gm, "")
        .replace(/```\s*$/gm, "");

      const jsonStart = cleanText.indexOf("{");
      const jsonEnd = cleanText.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
        const rawJson = cleanText.slice(jsonStart, jsonEnd + 1);
        try {
          const parsed = JSON.parse(rawJson);
          // Merge parsed data with defaults
          analysis = { ...analysis, ...parsed };
        } catch (innerErr) {
          console.warn("Failed to parse extracted JSON:", innerErr.message);
          analysis.summary = cleanText.substring(0, 500).trim();
        }
      } else {
        analysis.summary = cleanText.substring(0, 500).trim();
      }
    } catch (parseError) {
      console.warn("Fallback to raw text:", parseError.message);
      analysis.summary = completionText.substring(0, 500).trim();
    }

    return res.json({ transcript: transcriptText, analysis });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Analysis request failed." });
  }
});

const PORT = process.env.PORT || 5178;
app.listen(PORT, () => {
  console.log(`AI analysis backend listening on http://localhost:${PORT}`);
});
