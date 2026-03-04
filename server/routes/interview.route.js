import express from "express"

import { upload } from "../middlewares/multer.js"
import { analyzeResume,  generateQuestion,submitAnswer,finishInterview ,} from "../controllers/interview.controller.js"




const interviewRouter = express.Router()

interviewRouter.post("/resume",upload.single("resume"),analyzeResume)
interviewRouter.post("/generate-questions",generateQuestion)
 interviewRouter.post("/submit-answer",submitAnswer)
interviewRouter.post("/finish",finishInterview)


// interviewRouter.get("/report/:id",isAuth,getInterviewReport)



export default interviewRouter