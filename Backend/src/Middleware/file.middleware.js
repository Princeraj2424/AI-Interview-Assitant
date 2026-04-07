const multer = require("multer")


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    },
    fileFilter: (_req, file, callback) => {
        const isPdfMime = file.mimetype === "application/pdf"
        const isPdfName = String(file.originalname || "").toLowerCase().endsWith(".pdf")

        if (isPdfMime || isPdfName) {
            return callback(null, true)
        }

        return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "resume"))
    }
})

const uploadResume = upload.single("resume")

module.exports = { uploadResume }