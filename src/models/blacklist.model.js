const mongoose = require('mongoose')

const blacklistTokenSchema = new mongoose.Schema({
    token:{
        type : String,
        required :[true , "token is required to blacklist"] 
    }
},{
    timestamps :true
})

const blacklistModelSchema = mongoose.model("blacklistToken", blacklistTokenSchema)

module.exports = blacklistModelSchema

