const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:[true, "Username is already exists"]
    },
    email:{
        type:String,
        required :true,
        unique:[true, "Email is already exists"]
    },
    password:{
        type:String,
        required:true
    }
})

const userModel =  mongoose.model("Users", userSchema)
module.exports = userModel