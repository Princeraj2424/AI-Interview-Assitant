const jwt = require("jsonwebtoken")
const blacklistModel = require("../models/blacklist.model")

async function authUser(req, res, next){
    const token = req.cookies.token

    if(!token){
        return res.status(401).json({
            message:"token is missing, authorization denied"
        })
    }

    try{
        const isTokenBlacklisted = await blacklistModel.findOne({ token })
        if (isTokenBlacklisted){
            return res.status(401).json({
                message: "Token is invalid"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()

    }catch(error){
        return res.status(401).json({
            message:"invalid token, authorization denied"
        })
    }
}

module.exports = {authUser}