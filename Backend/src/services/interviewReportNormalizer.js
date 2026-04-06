function clampScore(value){
    const num = Number(value)
    if (!Number.isFinite(num)) return 70
    return Math.max(0, Math.min(100, Math.round(num)))
}

function ensureMin(items, min, factory){
    const list = Array.isArray(items) ? [...items] : []
    while (list.length < min) {
        list.push(factory(list.length + 1))
    }
    return list
}

function normalizeQuestionSet(items, defaults){
    const mapped = (Array.isArray(items) ? items : []).map((item) => {
        if (item && typeof item === "object") {
            const question = String(item.question || item.prompt || "").trim()
            return {
                question,
                intention: String(item.intention || defaults.intention).trim(),
                answer: String(item.answer || defaults.answer).trim()
            }
        }

        const question = String(item || "").trim()
        return {
            question,
            intention: defaults.intention,
            answer: defaults.answer
        }
    }).filter((item) => item.question)

    return ensureMin(mapped, 5, (n) => ({
        question: `${defaults.prefix} ${n}`,
        intention: defaults.intention,
        answer: defaults.answer
    }))
}

function normalizeSkillGaps(items){
    const mapped = (Array.isArray(items) ? items : []).map((item) => {
        if (item && typeof item === "object") {
            const severity = String(item.severity || "medium").toLowerCase()
            return {
                skill: String(item.skill || "").trim(),
                severity: ["low", "medium", "high"].includes(severity) ? severity : "medium"
            }
        }

        const raw = String(item || "").trim()
        const rawLower = raw.toLowerCase()
        const severity = rawLower.includes("high") ? "high" : rawLower.includes("low") ? "low" : "medium"
        return {
            skill: raw,
            severity
        }
    }).filter((item) => item.skill)

    return ensureMin(mapped, 3, (n) => ({
        skill: `Skill gap ${n}`,
        severity: "medium"
    }))
}

function normalizePreparationPlan(items){
    const mapped = (Array.isArray(items) ? items : []).map((item, index) => {
        if (item && typeof item === "object") {
            const day = Number(item.day)
            return {
                day: Number.isFinite(day) && day > 0 ? Math.floor(day) : index + 1,
                focus: String(item.focus || "Interview preparation").trim(),
                tasks: String(item.tasks || "Practice and revise core topics.").trim()
            }
        }

        const raw = String(item || "").trim()
        const dayMatch = raw.match(/day\s*(\d+)/i)
        const day = dayMatch ? Number(dayMatch[1]) : index + 1
        const stripped = raw.replace(/day\s*\d+\s*[:.-]?\s*/i, "").trim()
        const [focusPart, ...taskParts] = stripped.split(".")
        const focus = (focusPart || "Interview preparation").trim()
        const tasks = (taskParts.join(".").trim() || stripped || "Practice and revise core topics.").trim()

        return {
            day,
            focus,
            tasks
        }
    }).filter((item) => item.focus && item.tasks)

    return ensureMin(mapped, 5, (n) => ({
        day: n,
        focus: `Preparation focus ${n}`,
        tasks: "Revise concepts, practice mock questions, and summarize learnings."
    }))
}

function normalizeInterviewReport(raw){
    return {
        matchScore: clampScore(raw?.matchScore),
        technicalQuestions: normalizeQuestionSet(raw?.technicalQuestions, {
            prefix: "Technical question",
            intention: "Assess technical depth and practical implementation skills.",
            answer: "Explain concepts clearly, include trade-offs, and provide a practical example."
        }),
        behavioralQuestions: normalizeQuestionSet(raw?.behavioralQuestions, {
            prefix: "Behavioral question",
            intention: "Assess communication, ownership, and collaboration.",
            answer: "Use a concise STAR response with measurable impact."
        }),
        skillGaps: normalizeSkillGaps(raw?.skillGaps),
        preparationPlan: normalizePreparationPlan(raw?.preparationPlan)
    }
}

module.exports = { normalizeInterviewReport }