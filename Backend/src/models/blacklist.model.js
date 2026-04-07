const mongoose = require('mongoose')

const blacklistTokenSchema = new mongoose.Schema({
    token:{
        type : String,
        required :[true , "token is required to blacklist"] 
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        expires: 0
    }
},{
    timestamps :true
})

const blacklistModelSchema = mongoose.model("blacklistToken", blacklistTokenSchema)

module.exports = blacklistModelSchema

