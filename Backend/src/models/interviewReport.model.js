const mongoose = require("mongoose")

/**
 * job description Schema: string
 * resume text: string
 * self description: string
 * match score: number
 * technical questions:
 * 
 * [{
 * questions:""
 * intention:""
 * answer:""
 * }]
 * Behavioral questions:
 * [{
 * questions:""
 * intention:""
 * answer:""
 * }]
 * skills gap analysis: [{
 * skill:""
 * serity:{
 * type: string
 * enum:["low","medium","high"]
 * }
 * }]
 * preparation plan:[{
 * day: number
 * focus: string
 * tasks: string
 * }]
 */

const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required:[true, "Technical question is required"]
    },
    intention: {
        type: String,
        required:[true, "Intention is required"]
    },
    answer: {
        type: String,
        required:[true, "Answer is required"]
    }
},{
    _id: false
})

const behavioralQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required:[true, "Behavioral question is required"]
    },
    intention:{
        type:String,
        required:[true, "Intention is required"]
    },
    answer: {
        type: String,
        required:[true, "Answer is required"]
    }
},{
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill:{
        type: String,
        required:[true, "skill is required"]
    },
    severity: {
        type: String,
        enum: ["low", "medium", "high"],
        required:[true, "severity is required"]
    }
},{
    _id: false
})
 const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required:[true, "Day is required"]
    },
    focus: {
        type: String,
        required: [true, "Focus is required"]
    },
    tasks: {
        type: String,
        required: [true, "Tasks is required"]
    }
    },{
    _id: false
 })
 const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: [true, "Job description is required"],
    },
    resume:{
        type: String,
    },
    selfDescription:{
       type: String,
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema]
},{
    timestamps: true
})
const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);
module.exports = interviewReportModel

