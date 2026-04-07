const puppeteer = require("puppeteer")

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

function listItems(items = []) {
    return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
}

function projectItems(projects = []) {
    return projects.map((project) => `
    <div class="entry">
      <div class="entry-title">${escapeHtml(project.name)}</div>
      <p>${escapeHtml(project.description)}</p>
      <p><strong>Technologies:</strong> ${escapeHtml((project.technologies || []).join(", "))}</p>
        </div>
    `).join("")
}

function experienceItems(items = []) {
  return items.map((item) => `
    <div class="entry">
      <div class="entry-head">
        <div class="entry-title">${escapeHtml(item.role)}</div>
        <div class="entry-meta">${escapeHtml(item.duration)}</div>
      </div>
      <div class="entry-sub">${escapeHtml(item.organization)}</div>
      <ul>${listItems(item.highlights || [])}</ul>
    </div>
  `).join("")
}

function buildResumeHtml({ candidateName, generatedAt, score, data }) {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Calibri", "Segoe UI", Arial, sans-serif;
      color: #1f1f1f;
      margin: 0;
      padding: 0;
      background: #dce3e8;
    }
    .sheet {
      width: 820px;
      min-height: 1120px;
      margin: 8px auto;
      background: #fff;
      padding: 34px 44px;
      box-shadow: 0 0 0 1px #c8ced6;
    }
    .name {
      margin: 0;
      font-size: 36px;
      line-height: 1.1;
      letter-spacing: 0.1px;
      color: #111;
    }
    .role {
      margin-top: 4px;
      font-size: 22px;
      font-style: italic;
      color: #2e5f9a;
      line-height: 1.35;
      max-width: 700px;
    }
    .contact-row {
      margin-top: 14px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px 34px;
      font-size: 12px;
      color: #222;
      max-width: 540px;
    }
    .contact-item {
      position: relative;
      padding-left: 14px;
      line-height: 1.35;
    }
    .contact-item::before {
      content: "";
      position: absolute;
      left: 0;
      top: 6px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #111;
    }
    .score {
      margin-top: 12px;
      display: inline-block;
      font-size: 12px;
      color: #2f2f2f;
      border: 1px solid #ccd2da;
      border-radius: 3px;
      padding: 4px 10px;
      font-weight: 600;
    }
    .section {
      margin-top: 18px;
    }
    .section h3 {
      margin: 0 0 6px;
      font-size: 22px;
      line-height: 1;
      color: #1f3f6b;
      border-bottom: 3px solid #2e5f9a;
      padding-bottom: 5px;
      font-weight: 700;
    }
    p {
      margin: 0;
      line-height: 1.32;
      font-size: 13px;
    }
    ul {
      margin: 6px 0 0;
      padding-left: 18px;
    }
    li {
      margin-bottom: 3px;
      line-height: 1.26;
      font-size: 12px;
    }
    .entry {
      margin-bottom: 12px;
    }
    .entry-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 2px;
    }
    .entry-title {
      font-size: 14px;
      font-weight: 700;
    }
    .entry-meta {
      font-size: 12px;
      color: #666;
      white-space: nowrap;
    }
    .entry-sub {
      font-size: 13px;
      color: #333;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .skills-line {
      margin-bottom: 8px;
      font-size: 13px;
    }
    .skills-line strong {
      color: #111;
    }
    @media print {
      body { background: #fff; }
      .sheet {
        width: auto;
        min-height: auto;
        margin: 0;
        box-shadow: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header>
      <h1 class="name">${escapeHtml(candidateName)}</h1>
      <div class="role">${escapeHtml(data.targetJobTitle)}</div>
      <div class="contact-row">
        <span class="contact-item">Interview-based resume</span>
        <span class="contact-item">Fit score ${escapeHtml(score)}/100</span>
        <span class="contact-item">Generated ${escapeHtml(generatedAt)}</span>
        <span class="contact-item">ATS-friendly format</span>
      </div>
      <div class="score">Interview Fit: ${escapeHtml(score)}/100</div>
    </header>

    <section class="section">
      <h3>Professional Summary</h3>
      <p>${escapeHtml(data.summary)}</p>
    </section>

    <section class="section">
      <h3>Skills</h3>
      <p class="skills-line"><strong>Core:</strong> ${escapeHtml((data.skills || []).slice(0, 8).join(", "))}</p>
      ${(data.skills || []).length > 8 ? `<p class="skills-line"><strong>Additional:</strong> ${escapeHtml((data.skills || []).slice(8).join(", "))}</p>` : ""}
    </section>

    ${Array.isArray(data.professionalExperience) && data.professionalExperience.length ? `
    <section class="section">
      <h3>Professional Experience</h3>
      ${experienceItems(data.professionalExperience)}
    </section>
    ` : ""}

    <section class="section">
      <h3>Experience Highlights</h3>
      <ul>${listItems(data.experienceHighlights || [])}</ul>
    </section>

    <section class="section">
      <h3>Projects</h3>
      ${projectItems(data.projects || [])}
    </section>

    <section class="section">
      <h3>Education</h3>
      <ul>${listItems(data.education || [])}</ul>
    </section>

    <section class="section">
      <h3>Certifications</h3>
      <ul>${listItems((data.certifications || []).length ? data.certifications : ["No certifications provided"])}</ul>
    </section>
  </div>
</body>
</html>`
}

async function renderResumePdf({ candidateName, score, data }) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })

    try {
        const page = await browser.newPage()
        await page.setContent(buildResumeHtml({
            candidateName,
            generatedAt: new Date().toLocaleDateString("en-IN"),
            score,
            data
        }), { waitUntil: "networkidle0" })

        return await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "18mm", right: "14mm", bottom: "18mm", left: "14mm" }
        })
    } finally {
        await browser.close()
    }
}

module.exports = { renderResumePdf }