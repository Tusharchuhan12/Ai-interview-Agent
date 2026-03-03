import express from "express"
import { Userregister, logOut,loginUser } from "../controllers/auth.controller.js"

const authRouter = express.Router()


authRouter.post("/register", Userregister)
authRouter.post("/login", loginUser)
authRouter.get("/logout",logOut)


export default authRouter