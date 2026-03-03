import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:false
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required: false
    },
    credits:{
        type:Number,
        default:100
    }

}, {timestamps:true})

const User = mongoose.model("User" , userSchema)

export default User