import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API endpoints
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
