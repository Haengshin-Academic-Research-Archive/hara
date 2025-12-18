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

async function initMain() {
    const el = document.getElementById("content-area");
    if (!el) return;
    try {
        const data = await fetchData();
        const render = (items) => {
            el.innerHTML = "";
            SUBJECTS.forEach(sub => {
                const filtered = items.filter(p => p.subject === sub);
                if (!filtered.length) return;
                const section = document.createElement("section");
                section.innerHTML = `<div class="subject-title">${sub}</div><ul style="padding:10px 0; list-style:none;">` + 
                    filtered.map(p => `<li style="margin:8px 0;"><span style="color:#b31b1b; font-weight:bold;">[${p.id}]</span> <a href="paper.html?id=${encodeURIComponent(p.id)}" style="color:#004b87; text-decoration:none;">${escapeHtml(p.title)}</a></li>`).join("") + "</ul>";
                el.appendChild(section);
            });
        };
        render(data);
        document.getElementById("search-input").oninput = (e) => {
            const q = e.target.value.toLowerCase();
            render(data.filter(p => p.title.toLowerCase().includes(q)));
        };
    } catch (e) { el.innerHTML = `<p style="color:red">${e.message}</p>`; }
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
                d.className = "paper-item-discovery";
                d.innerHTML = `<div class="meta">arXiv:hangshin/${p.id} [${p.subject}]</div><h3><a href="paper.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.title)}</a></h3><p class="abstract-preview">${escapeHtml(p.abstract)}</p>`;
                el.appendChild(d);
            });
            idx += 5;
        };
        load();
        window.onscroll = () => { if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 400) if(idx < list.length) load(); };
    } catch (e) { console.error(e); }
}

window.addEventListener("DOMContentLoaded", () => { initMain(); initDetail(); initRandom(); });
