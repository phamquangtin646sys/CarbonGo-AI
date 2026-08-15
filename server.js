import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ Chưa có GEMINI_API_KEY trong file .env");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `
Bạn là CarbonBot, trợ lý giáo dục của website CarbonGo.
Đối tượng chính là học sinh và cộng đồng Việt Nam.

Nhiệm vụ:
- Giải thích tín chỉ carbon, CO2e, MRV, ETS, thị trường carbon,
  giảm phát thải, hấp thụ carbon và Net Zero bằng tiếng Việt dễ hiểu.
- Ưu tiên ví dụ gần gũi với học sinh.
- Nếu câu hỏi liên quan đến quy định, giá tín chỉ, thị trường hoặc
  thông tin mới nhất, hãy nói rõ rằng thông tin có thể thay đổi và
  khuyến khích người dùng kiểm tra nguồn chính thức.
- Không bịa số liệu, giá carbon, quy định pháp luật hoặc nguồn tin.
- Không đưa lời khuyên đầu tư tài chính.
- Khi không chắc chắn, hãy nói rõ giới hạn của mình.
- Trả lời thân thiện, rõ ràng, phù hợp học sinh; có thể dùng emoji vừa phải.
`;

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Chưa cấu hình GEMINI_API_KEY trong file .env."
      });
    }

    const messages = Array.isArray(req.body.messages)
      ? req.body.messages
      : [];

    const history = messages
      .filter(m =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
      )
      .slice(-12);

    if (!history.length) {
      return res.status(400).json({ error: "Chưa có câu hỏi." });
    }

    const contents = history.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.slice(0, 4000) }]
    }));

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.4,
        maxOutputTokens: 700
      }
    });

    res.json({
      reply: response.text || "Mình chưa tạo được câu trả lời."
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    const status = error?.status || 500;
    const message = String(error?.message || "");

    if (status === 429 || /quota|rate.?limit|resource.?exhausted/i.test(message)) {
      return res.status(429).json({
        error: "Gemini đang đạt giới hạn miễn phí. Bạn hãy thử lại sau một lúc."
      });
    }

    if (status === 401 || status === 403 || /api.?key|permission|unauthenticated/i.test(message)) {
      return res.status(status).json({
        error: "Gemini API key chưa đúng hoặc chưa được cấp quyền."
      });
    }

    res.status(status).json({
      error: "Không thể kết nối Gemini lúc này."
    });
  }
});

app.get("/*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌱 CarbonGo đang chạy tại http://localhost:${PORT}`);
});
