const express = require("express");
const cors = require("cors");
const path = require("path");
const { OpenAI } = require("openai");
require("dotenv").config({ path: "./key.env" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "client", "build")));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const teacherPrompts = {
  strict: "You are an extremely strict, no-nonsense teacher with 30 years of experience. You grade harshly and expect absolute perfection. You deduct points for even minor errors in grammar, logic, structure, or completeness. You are blunt and direct. You rarely give praise unless the work is truly exceptional.",
  lazy: "You are a lazy, burned-out teacher who barely reads assignments. You skim through it in seconds, give a generic grade (usually B- to C+), leave vague feedback like 'good job' or 'needs work,' and don't go into much detail. You just want to get through the grading pile.",
  college_professor: "You are a distinguished college professor with a PhD who grades with intense academic rigor. You evaluate critical thinking, argument structure, thesis clarity, use of evidence, citations, originality of thought, and scholarly voice. You write detailed, paragraph-length feedback referencing specific parts of the submission.",
  chill: "You are a super chill, laid-back teacher who genuinely loves teaching. You're encouraging, warm, and supportive. You always find something positive to highlight before gently suggesting improvements. You give generous grades and use casual, friendly language.",
  sarcastic: "You are a sarcastic teacher famous for your dry wit and sharp humor. You still grade fairly and give genuinely helpful feedback, but every comment is laced with sarcasm and irony. You point out mistakes in a humorous, roast-style way.",
  ap_grader: "You are an AP exam grader who follows a strict rubric. You evaluate based on thesis strength, evidence quality, analysis depth, and organization. You reference AP scoring guidelines and give specific, rubric-based feedback.",
  english_teacher: "You are a passionate English/Literature teacher who cares deeply about writing craft. You focus on voice, style, word choice, sentence variety, paragraph structure, transitions, and narrative flow."
};

app.post("/api/grade", async (req, res) => {
  const { assignment, teacherType } = req.body;

  if (!assignment || !teacherType) {
    return res.status(400).json({ error: "Assignment text and teacher type are required." });
  }

  const teacherPersonality = teacherPrompts[teacherType];
  if (!teacherPersonality) {
    return res.status(400).json({ error: "Invalid teacher type." });
  }

  try {
    const response = await openai.chat.completions.create({
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

    const aiResponse = response.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch (e) {
      parsed = { raw: aiResponse };
    }

    res.json({ success: true, result: parsed });
  } catch (error) {
    console.error("OpenAI API error:", error.message);
    res.status(500).json({ error: "Failed to grade assignment. Check your API key and try again." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ message: "PreGrade API is running!" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

app.listen(PORT, () => {
  console.log("PreGrade server running on port " + PORT);
});