import genToken from "../config/token.js";
import User from "../models/user.model.js";

// Register User
export const Userregister = async (req, res) => {
    try {
        const { name, email } = req.body;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                password: ""
            });
        }

        const token = await genToken(user._id);

        return res.status(200).json({
            token,
            user
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};


// Login User
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        if (user.password !== password) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        const token = await genToken(user._id);

        return res.status(200).json({
            token,
            user
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};


// Logout User
export const logOut = async (req, res) => {
    try {
        return res.status(200).json({
            message: "Logout Successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};