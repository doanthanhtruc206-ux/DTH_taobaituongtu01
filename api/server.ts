import express from "express";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
app.use(express.json({ limit: "50mb" }));

// 1. API Endpoint: Extract
app.post("/api/extract", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType || "image/png",
            },
          },
          {
            text: "Extract all text and mathematical formulas from this image. Convert mathematical formulas to LaTeX enclosed in $ signs (for inline, e.g. $x^2$) and $$ (for block math). Only return the extracted text and formulas, do not provide any extra explanation in your response. Ensure all text matches exactly."
          }
        ]
      }
    });
    
    res.json({ text: response.text });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. API Endpoint: Generate Similar
app.post("/api/generate-similar", async (req, res) => {
  try {
    const { originalText, count, difficulty } = req.body;
    
    const prompt = `Based on the following mathematical exercises, generate ${count} similar problems. We need the difficulty level to be "${difficulty}" compared to the original level.
    
    Original text:
    ${originalText}
    
    Requirements:
    1. Return in Vietnamese since the user wants the problems in Vietnamese.
    2. Use LaTeX for math wrapped in $ for inline and $$ for block math.
    3. Format the result clearly. E.g., "Bài 1: ...", "Bài 2: ...". 
    4. DO NOT OUTPUT ANYTHING ELSE MINUS THE GENERATED PROBLEMS. Do not output the solution unless specifically asked.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });
    
    res.json({ text: response.text });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// QUAN TRỌNG: Xuất app ra để Vercel chạy thay vì dùng app.listen()
export default app;
