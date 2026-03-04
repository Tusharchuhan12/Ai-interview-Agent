import express from "express"
import dotenv from "dotenv"
import connectDb from "./config/connectDb.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import morgan from "morgan"

import authRouter from "./routes/auth.route.js"
import userRouter from "./routes/user.route.js"
import interviewRouter from "./routes/interview.route.js"
import paymentRouter from "./routes/payment.route.js"

dotenv.config()

const app = express()

// ✅ Middlewares
app.use(morgan("dev"))



app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://ai-interview-agent-zeta.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
}));



app.use(express.json())
app.use(cookieParser())

// ✅ Routes
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/payment", paymentRouter)

// ✅ Connect DB first, then start server
const PORT = process.env.PORT || 6000

connectDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
})