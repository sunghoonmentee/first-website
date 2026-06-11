/**
 * 영단어 마스터 - 프록시 서버
 *
 * 역할: Anthropic API 키를 서버에서만 보관하고,
 *       프론트엔드는 이 서버를 통해서만 AI API를 호출합니다.
 *
 * 실행 방법:
 *   1. npm install express dotenv cors
 *   2. .env 파일에 ANTHROPIC_API_KEY=sk-ant-... 입력
 *   3. node server.js
 *   4. 브라우저에서 http://localhost:3000 접속
 */

require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" })); // 필요 시 배포 도메인으로 변경
app.use(express.static("public")); // index.html / style.css / script.js 를 public/ 폴더에 위치

// ── AI 프록시 엔드포인트 ──────────────────────────────
app.post("/api/recommend", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
        return res.status(400).json({ error: "유효하지 않은 요청입니다." });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "서버에 API 키가 설정되지 않았습니다." });
    }

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method:  "POST",
            headers: {
                "Content-Type":      "application/json",
                "x-api-key":         apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model:      "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages:   [{ role: "user", content: prompt }],
            }),
        });

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error("Anthropic API 오류:", err);
        res.status(502).json({ error: "AI 서버 연결에 실패했습니다." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));
