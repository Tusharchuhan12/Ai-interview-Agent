import fs from "fs";
import pdfjsLib from "pdfjs-dist/build/pdf.js";
import { askAi } from "../services/openRouter.service.js";

import Interview from "../models/interview.model.js";


export const analyzeResume = async (req, res) => {
  let filepath;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Resume required"
      });
    }

    filepath = req.file.path;

    const fileBuffer = await fs.promises.readFile(filepath);
    const uint8Array = new Uint8Array(fileBuffer);

    const pdf = await pdfjsLib.getDocument({
      data: uint8Array
    }).promise;
    let resumeText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      resumeText += content.items.map(i => i.str).join(" ") + " ";
    }

    resumeText = resumeText.replace(/\s+/g, " ").trim();

    const messages = [
      {
        role: "system",
        content: `
Extract structured data from resume.

Return ONLY JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1"],
  "skills": ["skill1"]
}
`
      },
      {
        role: "user",
        content: resumeText || "Empty resume"
      }
    ];

    const aiResponse = await askAi(messages);

    if (!aiResponse?.trim()) {
      return res.status(500).json({
        message: "AI response empty"
      });
    }

    const cleanResponse = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/^\s*\d+\.\s*/gm, "")
      .trim();

    const parsed = JSON.parse(cleanResponse);

    return res.json({
      role: parsed.role || "",
      experience: parsed.experience || "",
      projects: parsed.projects || [],
      skills: parsed.skills || [],
      resumeText
    });

  } catch (error) {
    console.error("Resume analysis error:", error);

    return res.status(500).json({
      message: error?.message || "Resume analysis failed"
    });
  

  } finally {
    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
};

export const generateQuestion = async (req, res) => {
  try {
    let { role, experience, mode, resumeText, projects, skills } = req.body;

    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();

    if (!role || !experience || !mode) {
      return res.status(400).json({
        message: "Role, Experience and Mode are required."
      });
    }

    const safeResume = resumeText?.slice(0, 2000) || "None";

    const projectText =
      Array.isArray(projects) && projects.length
        ? projects.join(", ")
        : "None";

    const skillsText =
      Array.isArray(skills) && skills.length
        ? skills.join(", ")
        : "None";

    const messages = [
      {
        role: "system",
        content: `
You are a professional interviewer.

Generate exactly 5 interview questions.

Return ONLY JSON format:

{
  "questions": [
    "question 1",
    "question 2",
    "question 3",
    "question 4",
    "question 5"
  ]
}

Rules:
- No numbering
- No bullet points
- Each question 15-25 words
`
      },
      {
        role: "user",
        content: `
Role: ${role}
Experience: ${experience}
Mode: ${mode}
Projects: ${projectText}
Skills: ${skillsText}
Resume: ${safeResume}
`
      }
    ];

    const aiResponse = await askAi(messages);

    if (!aiResponse?.trim()) {
      return res.status(500).json({
        message: "AI returned empty response"
      });
    }

    console.log("RAW AI RESPONSE:", aiResponse);

    const cleaned = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return res.status(500).json({
        message: "AI returned invalid JSON format"
      });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return res.status(500).json({
        message: "Invalid questions format"
      });
    }

    const questionsArray = parsed.questions
      .map(q => q.trim())
      .filter(q => q.length > 15)
      .slice(0, 5);

    if (questionsArray.length < 5) {
      return res.status(500).json({
        message: "Failed to generate 5 questions"
      });
    }

    console.log("Creating Interview...");

    const newInterview = await Interview.create({
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: questionsArray.map(q => ({
        question: q,
        answer: "",
        score: 0,
        difficulty: "",
        timeLimit: 0,
        feedback: ""
      })),
      finalScore: 0,
      status: "Incompleted"
    });

    return res.json({
      interviewId: newInterview._id,
      questions: newInterview.questions
    });

  } catch (error) {
    console.error("Generate Question Error:", error.message);

    return res.status(500).json({
      message: "Interview generation failed"
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Save answer
    interview.questions[questionIndex].answer = answer;

    // Simple scoring logic (customize later with AI)
    const score = answer.length > 20 ? 10 : 5;
    interview.questions[questionIndex].score = score;

    await interview.save();

    res.json({
      message: "Answer submitted",
      questionScore: score
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Submit answer failed" });
  }
};

export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Calculate total score
    const totalScore = interview.questions.reduce(
      (acc, q) => acc + (q.score || 0),
      0
    );

    interview.totalScore = totalScore;
    interview.status = "completed";

    await interview.save();

    res.json({
      message: "Interview completed",
      totalScore,
      questions: interview.questions
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Finish interview failed" });
  }
};