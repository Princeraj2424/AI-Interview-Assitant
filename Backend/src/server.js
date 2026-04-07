require("dotenv").config()
const app = require("./app")
const connectToDB = require("./config/database")
const mongoose = require("mongoose")

const PORT = Number(process.env.PORT) || 3000

if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured")
}

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured")
}

let server

async function bootstrap() {
    await connectToDB()
    server = app.listen(PORT, () => {
        console.log(`server is running on port ${PORT}`)
    })
}

async function shutdown(signal) {
    console.log(`received ${signal}, shutting down gracefully`)
    if (server) {
        server.close()
    }

    try {
        await mongoose.connection.close()
    } catch (error) {
        console.error("error while closing database connection", error)
    }

    process.exit(0)
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Promise Rejection:", reason)
})
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error)
})

bootstrap().catch((error) => {
    console.error("failed to start server", error)
    process.exit(1)
})
