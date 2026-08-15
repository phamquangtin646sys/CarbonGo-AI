# CarbonGo + Gemini

Bản CarbonGo dùng Google Gemini API qua SDK chính thức `@google/genai`.

## Chạy trên Windows

```bash
npm install
```

Copy `.env.example` thành `.env`, rồi điền:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash-lite
PORT=3000
```

Sau đó:

```bash
npm start
```

Mở:

http://localhost:3000

Không đưa API key vào `public/index.html` và không đăng file `.env` lên GitHub.
