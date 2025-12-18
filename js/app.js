/* js/app.js */
const SUBJECTS = ["물리", "화학", "생명", "지구", "융합", "인문-사회"];

// 특수문자 방지
function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}

// 데이터 불러오기
async function fetchData() {
    const res = await fetch("./manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error("manifest.json 파일을 찾을 수 없습니다.");
    return await res.json();
}

/** [메인 페이지] **/
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
            section.className = "subject-section";
            section.innerHTML = `<h2 class="subject-title">${sub}</h2><ul>` + 
                filtered.map(p => `
                    <li>
                        <span class="paper-id">[${p.id}]</span>
                        <a href="paper.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.title)}</a>
                    </li>
                `).join("") + `</ul>`;
            el.appendChild(section);
        });
    } catch (e) { el.innerHTML = `<p class="error">${e.message}</p>`; }
}

/** [상세 페이지] **/
async function initDetail() {
    const el = document.getElementById("paper-detail");
    if (!el) return;

    try {
        const id = new URLSearchParams(window.location.search).get("id");
        const data = await fetchData();
        // ID가 정확히 일치하는 항목을 찾음 (제목 꼬임 방지)
        const p = data.find(item => item.id === id);

        if (!p) { el.innerHTML = "<h2>보고서를 찾을 수 없습니다.</h2>"; return; }

        // 메타데이터 TXT 읽기
        let metaTxt = "불러오는 중...";
        try {
            const mRes = await fetch(encodeURI(p.meta));
            metaTxt = mRes.ok ? await mRes.text() : "메타데이터 파일을 읽을 수 없습니다.";
        } catch(err) { metaTxt = "파일 로드 오류 (경로를 확인하세요)"; }

        el.innerHTML = `
            <h2 class="detail-title">${escapeHtml(p.title)}</h2>
            <div class="meta-info">분류: ${p.subject} | ID: ${p.id}</div>
            
            <div class="abstract-box">
                <h4 style="margin:0 0 10px 0; color:#b31b1b;">Metadata (.txt)</h4>
                <pre style="white-space:pre-wrap; font-family:serif; line-height:1.6;">${escapeHtml(metaTxt)}</pre>
            </div>

            <div class="actions" style="margin-bottom:15px;">
                <a href="${encodeURI(p.pdf)}" download class="btn">PDF 다운로드</a>
                <a href="${encodeURI(p.pdf)}" target="_blank" style="margin-left:15px;">새 창에서 보기</a>
            </div>

            <iframe src="${encodeURI(p.pdf)}" width="100%" height="800px" style="border:1px solid #ccc;"></iframe>
        `;
    } catch (e) { el.innerHTML = `<p class="error">${e.message}</p>`; }
}

/** [랜덤 페이지] **/
async function initRandom() {
    const el = document.getElementById("random-container");
    if (!el) return;

    try {
        const data = await fetchData();
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const randomPicks = shuffled.slice(0, 3);
        const remainders = data.filter(p => !randomPicks.find(r => r.id === p.id));
        const total = [...randomPicks, ...remainders];

        let idx = 0;
        const load = () => {
            const chunk = total.slice(idx, idx + 5);
            chunk.forEach(p => {
                const d = document.createElement("div");
                d.className = "paper-item";
                d.innerHTML = `
                    <h3><a href="paper.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.title)}</a></h3>
                    <p class="meta">${p.subject}</p>
                    <p>${escapeHtml(p.abstract)}</p>
                `;
                el.appendChild(d);
            });
            idx += 5;
        };
        load();
        window.onscroll = () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 400) {
                if(idx < total.length) load();
            }
        };
    } catch (e) { console.error(e); }
}

document.addEventListener("DOMContentLoaded", () => {
    initMain();
    initDetail();
    initRandom();
});

