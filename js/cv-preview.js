document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const downloadButtons = document.querySelectorAll('.cv-preview-link');
    if (downloadButtons.length === 0) return;

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        })[character]);
    }

    function collectCvData() {
        const skills = [...document.querySelectorAll('.competency-item')].map((item) => {
            const name = item.querySelector('.competency-label')?.textContent.trim() ?? '';
            const rawValue = item.querySelector('.competency-level')?.dataset.targetWidth ?? '0%';
            const value = /^\d{1,3}%$/.test(rawValue) ? rawValue : '0%';
            return { name: escapeHtml(name), value };
        }).filter((skill) => skill.name);

        const services = [...document.querySelectorAll('.offering-card')].map((card) => ({
            name: escapeHtml(card.querySelector('.offering-title')?.textContent.trim() ?? ''),
            description: escapeHtml(card.querySelector('.offering-copy')?.textContent.trim() ?? '')
        })).filter((service) => service.name);

        const projects = [...document.querySelectorAll('.portfolio-item')].map((card) => ({
            title: escapeHtml(card.querySelector('.portfolio-title')?.textContent.trim() ?? ''),
            category: escapeHtml(card.querySelector('.portfolio-category')?.textContent.trim() ?? '')
        })).filter((project, index, items) => (
            project.title && items.findIndex((item) => item.title === project.title) === index
        ));

        return {
            name: escapeHtml(document.querySelector('.profile-name')?.textContent.trim() ?? 'Iako Latsabidze'),
            title: escapeHtml(document.querySelector('.intro-heading')?.textContent.replace(/\s+/g, ' ').trim() ?? 'Frontend Developer'),
            bio: escapeHtml(document.querySelector('.profile-biography')?.textContent.trim() ?? ''),
            skills,
            services,
            projects
        };
    }

    function createCvMarkup(data) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name} - Resume</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            padding: 30px 15px;
            background: #F4F6F8;
            color: #2D3748;
            font-family: 'Poppins', sans-serif;
            line-height: 1.6;
        }
        button { font: inherit; }
        button:focus-visible { outline: 3px solid #FFB477; outline-offset: 3px; }
        .preview-toolbar,
        .resume-sheet { max-width: 850px; margin-inline: auto; }
        .preview-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
            padding: 14px 28px;
            border-radius: 10px;
            background: #1E1E1E;
            color: #FFFFFF;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
        .preview-title,
        .preview-actions { display: flex; align-items: center; gap: 10px; }
        .preview-title { font-size: 14px; font-weight: 500; }
        .preview-button {
            padding: 8px 16px;
            border: 1px solid #4A5568;
            border-radius: 6px;
            background: transparent;
            color: #CBD5E0;
            cursor: pointer;
        }
        .preview-button.is-primary {
            border-color: #FD6F00;
            background: #FD6F00;
            color: #FFFFFF;
            font-weight: 600;
        }
        .preview-button:hover { border-color: #FFFFFF; color: #FFFFFF; }
        .preview-button.is-primary:hover { border-color: #E06200; background: #E06200; }
        .resume-sheet {
            padding: 50px 60px;
            border-radius: 12px;
            background: #FFFFFF;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
        }
        .resume-heading-block {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid #FD6F00;
        }
        .resume-name { color: #1E1E1E; font-size: 32px; line-height: 1.2; }
        .resume-role { margin-top: 4px; color: #FD6F00; font-size: 18px; font-weight: 600; }
        .resume-contact-details { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 12px; color: #718096; font-size: 13px; }
        .resume-section { margin-bottom: 25px; }
        .resume-section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            color: #1E1E1E;
            font-size: 18px;
            text-transform: uppercase;
        }
        .resume-section-title::after { content: ''; flex: 1; height: 1px; background: #E2E8F0; }
        .resume-biography { color: #4A5568; font-size: 14px; line-height: 1.7; }
        .resume-skills-grid,
        .resume-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px 24px; }
        .resume-skill-info { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; font-weight: 500; }
        .resume-bar-track { height: 8px; overflow: hidden; border-radius: 4px; background: #EDF2F7; }
        .resume-bar-fill { height: 100%; border-radius: 4px; background: #FD6F00; }
        .resume-card { padding: 14px; border: 1px solid #E2E8F0; border-radius: 8px; background: #F8FAFC; }
        .resume-card h3 { color: #1E1E1E; font-size: 14px; }
        .resume-card p { margin-top: 4px; color: #718096; font-size: 12px; }
        @media (max-width: 640px) {
            body { padding: 15px 10px; }
            .preview-toolbar { align-items: stretch; flex-direction: column; padding: 14px; }
            .preview-title,
            .preview-actions { flex-wrap: wrap; }
            .resume-sheet { padding: 30px 22px; }
            .resume-skills-grid,
            .resume-grid { grid-template-columns: 1fr; }
        }
        @media print {
            body { padding: 0; background: #FFFFFF; }
            .preview-toolbar { display: none; }
            .resume-sheet { max-width: none; padding: 20px 30px; box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="preview-toolbar">
        <div class="preview-title">
            <span>${data.name} &bull; Document Preview</span>
        </div>
        <div class="preview-actions">
            <button class="preview-button" id="dismissResumePreview" type="button">Close</button>
            <button class="preview-button is-primary" id="printResumePreview" type="button">Download / Print PDF</button>
        </div>
    </div>

    <main class="resume-sheet">
        <header class="resume-heading-block">
            <h1 class="resume-name">${data.name}</h1>
            <p class="resume-role">${data.title}</p>
            <div class="resume-contact-details">
                <span>Portfolio Showcase</span>
                <span>Contact via Web Form</span>
                <span>Responsive Web &amp; UI/UX</span>
            </div>
        </header>

        <section class="resume-section">
            <h2 class="resume-section-title">About Me / Summary</h2>
            <p class="resume-biography">${data.bio || 'Dedicated developer creating modern digital experiences.'}</p>
        </section>

        <section class="resume-section">
            <h2 class="resume-section-title">Technical Skills &amp; Expertise</h2>
            <div class="resume-skills-grid">
                ${data.skills.map((skill) => `
                    <div>
                        <div class="resume-skill-info"><span>${skill.name}</span><span>${skill.value}</span></div>
                        <div class="resume-bar-track"><div class="resume-bar-fill" style="width: ${skill.value}"></div></div>
                    </div>
                `).join('')}
            </div>
        </section>

        <section class="resume-section">
            <h2 class="resume-section-title">Services &amp; Capabilities</h2>
            <div class="resume-grid">
                ${data.services.map((service) => `
                    <article class="resume-card"><h3>${service.name}</h3><p>${service.description}</p></article>
                `).join('')}
            </div>
        </section>

        <section class="resume-section">
            <h2 class="resume-section-title">Featured Projects</h2>
            <div class="resume-grid">
                ${data.projects.map((project) => `
                    <article class="resume-card"><h3>${project.title}</h3><p>${project.category}</p></article>
                `).join('')}
            </div>
        </section>
    </main>

    <script>
        document.getElementById('dismissResumePreview').addEventListener('click', () => window.close());
        document.getElementById('printResumePreview').addEventListener('click', () => window.print());
    <\/script>
</body>
</html>`;
    }

    function openCvPreview(event) {
        event.preventDefault();

        const cvBlob = new Blob([createCvMarkup(collectCvData())], {
            type: 'text/html;charset=utf-8'
        });
        const previewUrl = URL.createObjectURL(cvBlob);
        const previewWindow = window.open(previewUrl, '_blank');

        if (previewWindow) {
            previewWindow.opener = null;
            window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60000);
        } else {
            URL.revokeObjectURL(previewUrl);
            window.location.href = event.currentTarget.href;
        }
    }

    downloadButtons.forEach((button) => button.addEventListener('click', openCvPreview));
});
