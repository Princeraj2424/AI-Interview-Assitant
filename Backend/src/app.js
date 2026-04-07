const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const multer = require("multer")

const app = express()

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

app.use(helmet())
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
}))

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        return callback(new Error("Not allowed by CORS"))
    },
    credentials: true
}))
app.use(cookieParser())

app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))

const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true, message: "Service is healthy" })
})

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" })
})

app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "Resume PDF must be 3MB or smaller." })
        }

        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({ message: "Only PDF resume files are allowed." })
        }

        return res.status(400).json({ message: "Invalid file upload." })
    }

    const statusCode = error?.status || 500
    const message = statusCode === 500 ? "Internal server error" : error.message
    res.status(statusCode).json({ message })
})


module.exports = app