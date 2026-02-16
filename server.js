const express = require("express");
const cors = require("cors");
const path = require("path");
const { OpenAI } = require("openai");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
require("dotenv").config({ path: "./key.env" });

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "pregrade-secret-key-change-this";
const REQUESTS_PER_HOUR = 3;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "client", "build")));

// Database setup
const dbPath = process.env.DB_PATH || path.join(__dirname, "pregrade.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Auth middleware
function authenticate(req, res, next) {
  var authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not logged in." });
  }
  var token = authHeader.split(" ")[1];
  try {
    var decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

// Rate limit check
function checkRateLimit(req, res, next) {
  var userId = req.userId;
  var oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  var row = db.prepare("SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND created_at > ?").get(userId, oneHourAgo);
  var remaining = REQUESTS_PER_HOUR - row.count;
  if (remaining <= 0) {
    return res.status(429).json({
      error: "You've used all 3 grades this hour. Try again later.",
      remaining: 0
    });
  }
  req.remaining = remaining;
  next();
}

// Signup
app.post("/api/signup", function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  var existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Username already taken." });
  }

  var hashed = bcrypt.hashSync(password, 10);
  var result = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username.toLowerCase(), hashed);

  var token = jwt.sign({ userId: result.lastInsertRowid, username: username.toLowerCase() }, JWT_SECRET, { expiresIn: "7d" });

  res.json({
    success: true,
    token: token,
    username: username.toLowerCase()
  });
});

// Login
app.post("/api/login", function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  var user = db.prepare("SELECT * FROM users WHERE username = ?").get(username.toLowerCase());
  if (!user) {
    return res.status(400).json({ error: "Invalid username or password." });
  }

  var valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: "Invalid username or password." });
  }

  var token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

  res.json({
    success: true,
    token: token,
    username: user.username
  });
});

// Check remaining requests
app.get("/api/remaining", authenticate, function(req, res) {
  var oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  var row = db.prepare("SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND created_at > ?").get(req.userId, oneHourAgo);
  var remaining = REQUESTS_PER_HOUR - row.count;
  console.log("SENDING REMAINING: " + remaining + " | Row count: " + row.count);
  res.json({ remaining: Math.max(0, remaining), limit: REQUESTS_PER_HOUR });
});

// Teacher prompts
var teacherPrompts = {
  strict: "You are an extremely strict, no-nonsense teacher with 30 years of experience. You grade harshly and expect absolute perfection. You deduct points for even minor errors in grammar, logic, structure, or completeness. You are blunt and direct. You rarely give praise unless the work is truly exceptional.",
  lazy: "You are a lazy, burned-out teacher who barely reads assignments. You skim through it in seconds, give a generic grade (usually B- to C+), leave vague feedback like 'good job' or 'needs work,' and don't go into much detail. You just want to get through the grading pile.",
  college_professor: "You are a distinguished college professor with a PhD who grades with intense academic rigor. You evaluate critical thinking, argument structure, thesis clarity, use of evidence, citations, originality of thought, and scholarly voice. You write detailed, paragraph-length feedback referencing specific parts of the submission.",
  chill: "You are a super chill, laid-back teacher who genuinely loves teaching. You're encouraging, warm, and supportive. You always find something positive to highlight before gently suggesting improvements. You give generous grades and use casual, friendly language.",
  sarcastic: "You are a sarcastic teacher famous for your dry wit and sharp humor. You still grade fairly and give genuinely helpful feedback, but every comment is laced with sarcasm and irony. You point out mistakes in a humorous, roast-style way.",
  ap_grader: "You are an AP exam grader who follows a strict rubric. You evaluate based on thesis strength, evidence quality, analysis depth, and organization. You reference AP scoring guidelines and give specific, rubric-based feedback.",
  english_teacher: "You are a passionate English/Literature teacher who cares deeply about writing craft. You focus on voice, style, word choice, sentence variety, paragraph structure, transitions, and narrative flow."
};

// Grade endpoint with auth and rate limit
app.post("/api/grade", authenticate, checkRateLimit, async function(req, res) {
  var assignment = req.body.assignment;
  var teacherType = req.body.teacherType;

  if (!assignment || !teacherType) {
    return res.status(400).json({ error: "Assignment text and teacher type are required." });
  }

  var teacherPersonality = teacherPrompts[teacherType];
  if (!teacherPersonality) {
    return res.status(400).json({ error: "Invalid teacher type." });
  }

  try {
    var response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: teacherPersonality + '\n\nYou are grading a student\'s assignment. Provide an extremely detailed and thorough evaluation. You must respond in the following JSON format ONLY, with no extra text outside the JSON:\n{\n  "grade": "Letter grade (e.g. A+, B-, C, etc.)",\n  "score": "Numeric score out of 100",\n  "summary": "A 1-2 sentence overall summary of your impression of this work",\n  "feedback": "Your detailed multi-paragraph feedback as this teacher personality. Be thorough and specific. Reference specific parts of the student\'s writing. This should be at least 3-4 paragraphs long.",\n  "strengths": [\n    "Specific strength 1 with explanation",\n    "Specific strength 2 with explanation",\n    "Specific strength 3 with explanation"\n  ],\n  "pointsLost": [\n    { "category": "Category name", "reason": "Detailed explanation of why points were lost with specific examples from the text", "amount": "How many points deducted (number only)" }\n  ],\n  "suggestions": [\n    {\n      "title": "Short title for this suggestion",\n      "detail": "A detailed 2-3 sentence explanation of exactly how to implement this improvement"\n    }\n  ],\n  "rewriteExample": "Take the weakest sentence or paragraph from the student\'s work and rewrite it to show them what an improved version looks like."\n}\n\nMake sure to provide at least 3 strengths, 3-5 points lost items, and 3-5 detailed suggestions. The feedback field should be multiple paragraphs. Be thorough.'
        },
        {
          role: "user",
          content: "Please grade the following student assignment:\n\n" + assignment
        }
      ],
      temperature: 0.8,
      max_tokens: 3000,
    });

    // Log the request for rate limiting
    db.prepare("INSERT INTO requests (user_id) VALUES (?)").run(req.userId);
    console.log("RATE DEBUG - User: " + req.userId + " | DB: " + dbPath);
    console.log("RATE DEBUG - ENV DB_PATH: " + process.env.DB_PATH);

    var aiResponse = response.choices[0].message.content;
    var parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch (e) {
      parsed = { raw: aiResponse };
    }

    var oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    var row = db.prepare("SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND created_at > ?").get(req.userId, oneHourAgo);
    var remaining = REQUESTS_PER_HOUR - row.count;

    res.json({ success: true, result: parsed, remaining: Math.max(0, remaining) });
  } catch (error) {
    console.error("OpenAI API error:", error.message);
    res.status(500).json({ error: "Failed to grade assignment. Try again later." });
  }
});

app.get("/api/health", function(req, res) {
  res.json({ message: "PreGrade API is running!" });
});

app.get("*", function(req, res) {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

app.listen(PORT, function() {
  console.log("PreGrade server running on port " + PORT);
});
