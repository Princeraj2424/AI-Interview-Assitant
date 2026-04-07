const mongoose = require("mongoose")

async function connectToDB (){
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("connected to database")
    }

    catch(err){
        console.log("error connecting to database",err)
        throw err
    }

}
module.exports = connectToDB
