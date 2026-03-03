import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";


export const analyzeResume = async (req, res) => {
  let filepath;

  try {

    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }

    filepath = req.file.path;

    const fileBuffer = await fs.promises.readFile(filepath);
    const uint8Array = new Uint8Array(fileBuffer);

    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let resumeText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      resumeText += content.items.map(i => i.str).join(" ") + "\n";
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

    if (!aiResponse) {
      return res.status(500).json({
        message: "AI response empty"
      });
    }

    const cleanResponse = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
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
    console.error("Resume analysis error:", error.message);

    return res.status(500).json({
      message: "Resume analysis failed"
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

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const projectText =
      Array.isArray(projects) && projects.length
        ? projects.join(", ")
        : "None";

    const skillsText =
      Array.isArray(skills) && skills.length
        ? skills.join(", ")
        : "None";

    const safeResume = resumeText?.trim() || "None";

    const messages = [
      {
        role: "system",
        content: `
You are a professional interviewer.
Generate exactly 5 interview questions.
15-25 words per question.
One question per line.
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

    const questionsArray = aiResponse
      .split("\n")
      .map(q => q.trim())
      .filter(Boolean)
      .slice(0, 5);

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: questionsArray.map((q, index) => ({
        question: q,
        difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
        timeLimit: [60, 60, 90, 90, 120][index]
      }))
    });

    return res.json({
      interviewId: interview._id,
      userName: user.name,
      questions: interview.questions
    });

  } catch (error) {
    console.error(error);
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



export const getMyInterviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const interviews = await Interview.find({ user: userId });

    res.status(200).json({
      success: true,
      interviews,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};