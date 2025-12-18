const SUBJECTS = ["물리", "화학", "생명", "지구", "융합", "인문-사회"];

function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}

async function fetchData() {
    const res = await fetch("./manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error("manifest.json 로드 실패");
    return await res.json();
}

/** [메인 페이지] 리스트 구분 방식 적용 **/
async function initMain() {
    const el = document.getElementById("content-area");
    if (!el) return;
    try {
        const data = await fetchData();
        el.innerHTML = "";
        SUBJECTS.forEach(sub => {
            const filtered = data.filter(p => p.subject === sub);
            if (!filtered.length) return;

            const section = document.createElement("section");
            section.innerHTML = `<div style="background:#f4f4f4; border-left:5px solid #b31b1b; padding:5px 12px; font-weight:bold; margin:30px 0 15px 0;">${sub}</div>`;
            
            filtered.forEach(p => {
                const item = document.createElement("div");
                item.className = "paper-entry";
                item.innerHTML = `
                    <div class="entry-meta">arXiv:hangshin/${p.id} [${p.subject}]</div>
                    <h3><a href="paper.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.title)}</a></h3>
                    <p class="entry-abstract">${escapeHtml(p.abstract)}</p>
                `;
                section.appendChild(item);
            });
            el.appendChild(section);
        });
    } catch (e) { el.innerHTML = `<p style="color:red">${e.message}</p>`; }
}

/** [랜덤 페이지] 리스트 구분 방식 적용 **/
async function initRandom() {
    const el = document.getElementById("random-container");
    if (!el) return;
    try {
        const data = await fetchData();
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const list = [...shuffled.slice(0, 3), ...data.filter(p => !shuffled.slice(0, 3).includes(p))];
        let idx = 0;
        const load = () => {
            const chunk = list.slice(idx, idx + 5);
            chunk.forEach(p => {
                const d = document.createElement("div");
                d.className = "paper-entry";
                d.innerHTML = `
                    <div class="entry-meta">arXiv:hangshin/${p.id} [${p.subject}]</div>
                    <h3><a href="paper.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.title)}</a></h3>
                    <p class="entry-abstract">${escapeHtml(p.abstract)}</p>
                `;
                el.appendChild(d);
            });
            idx += 5;
        };
        load();
        window.onscroll = () => { if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 400) if(idx < list.length) load(); };
    } catch (e) { console.error(e); }
}

async function initDetail() {
    const el = document.getElementById("paper-detail");
    if (!el) return;
    try {
        const id = new URLSearchParams(window.location.search).get("id");
        const data = await fetchData();
        const p = data.find(item => item.id === id);
        if (!p) { el.innerHTML = "<h2>Not Found</h2>"; return; }
        let metaTxt = "Loading...";
        try {
            const mRes = await fetch(encodeURI(p.meta));
            metaTxt = mRes.ok ? await mRes.text() : "Metadata missing";
        } catch(err) { metaTxt = "Load error"; }
        el.innerHTML = `<h2 style="border-bottom:3px solid #b31b1b; padding-bottom:10px;">${escapeHtml(p.title)}</h2><div class="meta-box"><pre>${escapeHtml(metaTxt)}</pre></div><iframe src="${encodeURI(p.pdf)}" width="100%" height="900px"></iframe>`;
    } catch (e) { el.innerHTML = `<p style="color:red">${e.message}</p>`; }
}

window.addEventListener("DOMContentLoaded", () => { initMain(); initDetail(); initRandom(); });
