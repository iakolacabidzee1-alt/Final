(() => {
    'use strict';

    const pick = (selector, scope = document) => scope.querySelector(selector);
    const pickMany = (selector, scope = document) => [...scope.querySelectorAll(selector)];

    const encodeText = (value) => String(value).replace(/[&<>'"]/g, (symbol) => {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[symbol];
    });

    class ResumeSnapshot {
        readText(selector, fallback = '') {
            const value = pick(selector)?.textContent.replace(/\s+/g, ' ').trim();
            return encodeText(value || fallback);
        }

        readSkills() {
            return pickMany('.competency-item').map((item) => {
                const label = pick('.competency-label', item)?.textContent.trim() || '';
                const storedValue = pick('.competency-level', item)?.dataset.targetWidth || '0%';
                const percentage = /^\d{1,3}%$/.test(storedValue) ? storedValue : '0%';
                return { label: encodeText(label), percentage };
            }).filter((item) => item.label);
        }

        readServices() {
            return pickMany('.offering-card').map((card) => {
                return {
                    title: encodeText(pick('.offering-title', card)?.textContent.trim() || ''),
                    detail: encodeText(pick('.offering-copy', card)?.textContent.replace(/\s+/g, ' ').trim() || '')
                };
            }).filter((item) => item.title);
        }

        readProjects() {
            const knownTitles = new Set();

            return pickMany('.portfolio-item').reduce((items, card) => {
                const title = pick('.portfolio-title', card)?.textContent.trim() || '';
                if (!title || knownTitles.has(title)) return items;

                knownTitles.add(title);
                items.push({
                    title: encodeText(title),
                    category: encodeText(pick('.portfolio-category', card)?.textContent.trim() || '')
                });
                return items;
            }, []);
        }

        capture() {
            return {
                name: this.readText('.profile-name', 'Iako Latsabidze'),
                role: this.readText('.intro-heading', 'Frontend Developer'),
                profile: this.readText('.profile-biography', 'Junior Frontend Developer creating responsive web interfaces.'),
                skills: this.readSkills(),
                services: this.readServices(),
                projects: this.readProjects()
            };
        }
    }

    class ResumeWorkspace {
        constructor(launchers) {
            this.launchers = launchers;
            this.snapshot = new ResumeSnapshot();
        }

        connect() {
            this.launchers.forEach((launcher) => {
                launcher.addEventListener('click', (event) => this.open(event));
            });
        }

        compose(data) {
            const skillItems = data.skills.map((skill) => {
                return '<li class="skill-tile"><span class="skill-value">' + skill.percentage + '</span><strong>' + skill.label + '</strong></li>';
            }).join('');

            const serviceItems = data.services.map((service, index) => {
                const number = String(index + 1).padStart(2, '0');
                return '<article class="service-entry"><span class="entry-number">' + number + '</span><div><h3>' + service.title + '</h3><p>' + service.detail + '</p></div></article>';
            }).join('');

            const projectItems = data.projects.map((project) => {
                return '<li class="project-entry"><span>' + project.category + '</span><strong>' + project.title + '</strong></li>';
            }).join('');

            return [
                '<!DOCTYPE html>',
                '<html lang="en">',
                '<head>',
                '<meta charset="UTF-8">',
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
                '<title>' + data.name + ' | Professional Resume</title>',
                '<style>',
                '* { box-sizing: border-box; margin: 0; padding: 0; }',
                ':root { --accent: #E85D04; --accent-deep: #B94700; --ink: #191919; --muted: #69645F; --paper: #FCFBF8; --line: #D9D4CE; }',
                'body { min-height: 100vh; padding: 28px 16px 50px; background: #D8D5CF; color: var(--ink); font-family: Arial, Helvetica, sans-serif; line-height: 1.55; }',
                'button { font: inherit; }',
                'button:focus-visible { outline: 3px solid #F2A060; outline-offset: 3px; }',
                '.workspace-bar, .resume-document { width: min(1080px, 100%); margin-inline: auto; }',
                '.workspace-bar { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 14px; padding: 12px 14px 12px 18px; border: 1px solid #BBB5AE; border-radius: 12px; background: rgba(252, 251, 248, 0.92); box-shadow: 0 8px 24px rgba(32, 29, 26, 0.09); }',
                '.workspace-name { display: grid; gap: 2px; }',
                '.workspace-name span { color: var(--accent-deep); font-size: 10px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }',
                '.workspace-name strong { font-size: 13px; }',
                '.workspace-actions { display: flex; gap: 8px; }',
                '.workspace-control { min-height: 40px; padding: 8px 14px; border: 1px solid #BDB7B0; border-radius: 7px; background: #FFFFFF; color: var(--ink); font-size: 12px; font-weight: 700; cursor: pointer; transition: 160ms ease; }',
                '.workspace-control:hover { border-color: #77716B; transform: translateY(-1px); }',
                '.workspace-control.primary { border-color: var(--accent); background: var(--accent); color: #FFFFFF; }',
                '.workspace-control.primary:hover { border-color: var(--accent-deep); background: var(--accent-deep); }',
                '.resume-document { overflow: hidden; border-top: 9px solid var(--accent); background: var(--paper); box-shadow: 0 22px 60px rgba(41, 36, 31, 0.16); }',
                '.identity-band { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 32px; padding: 50px 56px 38px; border-bottom: 1px solid var(--line); }',
                '.identity-kicker { margin-bottom: 9px; color: var(--accent-deep); font-size: 11px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; }',
                '.identity-name { max-width: 650px; font-size: clamp(38px, 6vw, 68px); line-height: 0.98; letter-spacing: -0.045em; }',
                '.identity-role { margin-top: 14px; color: var(--muted); font-size: 17px; font-weight: 700; }',
                '.identity-stamp { width: 120px; padding: 16px; border: 1px solid var(--ink); text-align: center; }',
                '.identity-stamp strong, .identity-stamp span { display: block; }',
                '.identity-stamp strong { color: var(--accent); font-size: 30px; line-height: 1; }',
                '.identity-stamp span { margin-top: 7px; color: var(--muted); font-size: 9px; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase; }',
                '.resume-matrix { display: grid; grid-template-columns: minmax(0, 1fr) 330px; }',
                '.main-column { padding: 42px 46px 50px 56px; }',
                '.side-column { padding: 42px 34px 50px; border-left: 1px solid var(--line); background: #F3F0EB; }',
                '.resume-section + .resume-section { margin-top: 38px; }',
                '.section-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; }',
                '.section-heading::before { content: ""; width: 24px; height: 3px; background: var(--accent); }',
                '.profile-copy { color: #4E4945; font-size: 13px; line-height: 1.8; }',
                '.service-list { border-bottom: 1px solid var(--line); }',
                '.service-entry { display: grid; grid-template-columns: 38px 1fr; gap: 14px; padding-block: 16px; border-top: 1px solid var(--line); break-inside: avoid; }',
                '.entry-number { color: var(--accent); font-size: 11px; font-weight: 800; }',
                '.service-entry h3 { font-size: 14px; line-height: 1.35; }',
                '.service-entry p { margin-top: 5px; color: var(--muted); font-size: 11px; line-height: 1.65; }',
                '.skill-tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; list-style: none; }',
                '.skill-tile { min-height: 110px; padding: 14px; border: 1px solid #D5CFC8; background: #FCFBF8; }',
                '.skill-value { display: block; margin-bottom: 22px; color: var(--accent); font-size: 25px; font-weight: 800; line-height: 1; }',
                '.skill-tile strong { display: block; font-size: 10px; line-height: 1.4; }',
                '.project-list { display: grid; list-style: none; }',
                '.project-entry { padding-block: 13px; border-top: 1px solid #D5CFC8; break-inside: avoid; }',
                '.project-entry:last-child { border-bottom: 1px solid #D5CFC8; }',
                '.project-entry span { display: block; margin-bottom: 3px; color: var(--accent-deep); font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }',
                '.project-entry strong { display: block; font-size: 12px; line-height: 1.4; }',
                '.availability-card { margin-top: 34px; padding: 18px; background: var(--ink); color: #FFFFFF; }',
                '.availability-card span { color: #C9C3BC; font-size: 9px; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase; }',
                '.availability-card strong { display: block; margin-top: 7px; font-size: 13px; }',
                '@media (max-width: 700px) {',
                'body { padding: 10px 7px 28px; }',
                '.workspace-bar { align-items: stretch; flex-direction: column; }',
                '.workspace-actions { display: grid; grid-template-columns: 1fr 1fr; }',
                '.identity-band { grid-template-columns: 1fr; padding: 34px 24px 28px; }',
                '.identity-stamp { width: 100%; text-align: left; }',
                '.resume-matrix { grid-template-columns: 1fr; }',
                '.main-column, .side-column { padding: 30px 24px; }',
                '.side-column { border-top: 1px solid var(--line); border-left: 0; }',
                '}',
                '@media print {',
                '@page { size: A4; margin: 0; }',
                'body { padding: 0; background: #FFFFFF; }',
                '.workspace-bar { display: none; }',
                '.resume-document { width: 100%; box-shadow: none; }',
                '.identity-band { padding: 34px 38px 28px; }',
                '.main-column { padding: 30px 28px 34px 38px; }',
                '.side-column { padding: 30px 25px 34px; }',
                '}',
                '</style>',
                '</head>',
                '<body>',
                '<header class="workspace-bar">',
                '<div class="workspace-name"><span>Portfolio document</span><strong>' + data.name + ' — resume preview</strong></div>',
                '<div class="workspace-actions">',
                '<button class="workspace-control" id="leaveWorkspace" type="button">Return to portfolio</button>',
                '<button class="workspace-control primary" id="exportWorkspace" type="button">Print or save PDF</button>',
                '</div>',
                '</header>',
                '<main class="resume-document">',
                '<header class="identity-band">',
                '<div>',
                '<p class="identity-kicker">Junior Frontend Developer</p>',
                '<h1 class="identity-name">' + data.name + '</h1>',
                '<p class="identity-role">' + data.role + '</p>',
                '</div>',
                '<div class="identity-stamp"><strong>01</strong><span>Portfolio resume<br>Tbilisi, Georgia</span></div>',
                '</header>',
                '<div class="resume-matrix">',
                '<div class="main-column">',
                '<section class="resume-section"><h2 class="section-heading">Profile</h2><p class="profile-copy">' + data.profile + '</p></section>',
                '<section class="resume-section"><h2 class="section-heading">Frontend services</h2><div class="service-list">' + serviceItems + '</div></section>',
                '</div>',
                '<aside class="side-column">',
                '<section class="resume-section"><h2 class="section-heading">Skills</h2><ul class="skill-tiles">' + skillItems + '</ul></section>',
                '<section class="resume-section"><h2 class="section-heading">Selected work</h2><ul class="project-list">' + projectItems + '</ul></section>',
                '<div class="availability-card"><span>Contact</span><strong>Available through the portfolio contact form</strong></div>',
                '</aside>',
                '</div>',
                '</main>',
                '<script>',
                'document.getElementById("leaveWorkspace").addEventListener("click", function () { window.close(); });',
                'document.getElementById("exportWorkspace").addEventListener("click", function () { window.print(); });',
                '<\/script>',
                '</body>',
                '</html>'
            ].join('');
        }

        open(event) {
            event.preventDefault();

            const fallback = event.currentTarget.href;
            const preview = window.open('', '_blank');

            if (!preview) {
                window.location.assign(fallback);
                return;
            }

            preview.opener = null;
            preview.document.open();
            preview.document.write(this.compose(this.snapshot.capture()));
            preview.document.close();
        }
    }

    const startResumeWorkspace = () => {
        const launchers = pickMany('.cv-preview-link');
        if (launchers.length > 0) new ResumeWorkspace(launchers).connect();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startResumeWorkspace, { once: true });
    } else {
        startResumeWorkspace();
    }
})();
