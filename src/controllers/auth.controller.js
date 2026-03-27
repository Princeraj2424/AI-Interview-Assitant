const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

/**
 * @name registerUserController
 * @description register a new user,expects username, emails and the password in the request body
 * @access public
 */

//user registration controller
async function registerUserController(req, res){
    try {
        const {username, email, password} = req.body
        if(!username || !email || !password){
            return res.status(400).json({
                message:"provide username email and password"
            })
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or:[{username},{email}]
        })

        if(isUserAlreadyExists){
            return res.status(400).json({
                message:"account already exists with the provided username or email"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await userModel.create({
            username,
            email,
            password: hashedPassword
        })

        const token = jwt.sign({
            id: user._id,
            username: user.username
        }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        })

        res.cookie("token", token, { httpOnly: true })

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
        return res.status(500).json({ message: "internal server error" })
    }
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access public
 */
async function loginUserController(req, res){
    try {
        const {email , password} = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "provide email and password" })
        }

        const user = await userModel.findOne({email})
        if (!user){
            return res.status(400).json({
                message:"invalid email or password"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if(!isPasswordValid){
            return res.status(400).json({
                message:"invalid email or password"
            })
        }

        const token = jwt.sign({
            id: user._id,
            username: user.username
        },process.env.JWT_SECRET, {
            expiresIn: "7d"
        })

        res.cookie("token", token, { httpOnly: true })

        return res.status(200).json({
            message: "User loggedin successfully",
            user:{
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
        return res.status(500).json({ message: "internal server error" })
    }
}

module.exports = { registerUserController, loginUserController }