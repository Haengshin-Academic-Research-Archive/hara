/* js/app.js - HARA 통합 스크립트 */
console.log("HARA app.js 로드됨 - 실행 시작");

const SUBJECTS = ["물리", "화학", "생명", "지구", "융합", "인문-사회"];

// HTML 특수문자 치환
function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}

// 데이터 로드 (manifest.json)
async function fetchData() {
    console.log("manifest.json 데이터 가져오는 중...");
    try {
        const res = await fetch("./manifest.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`manifest.json 로드 실패 (HTTP ${res.status})`);
        const data = await res.json();
        console.log("데이터 로드 완료:", data);
        return data;
    } catch (e) {
        console.error("데이터 로드 중 에러 발생:", e);
        throw e;
    }
}

/** [메인 페이지] **/
async function initMain() {
    const contentArea = document.getElementById("content-area");
    if (!contentArea) return;
    console.log("메인 페이지 초기화 중...");

    try {
        const data = await fetchData();
        contentArea.innerHTML = "";

        SUBJECTS.forEach(sub => {
            const filtered = data.filter(p => p.subject === sub);
            if (filtered.length === 0) return;

            const section = document.createElement("section");
            section.className = "subject-section";
            let html = `<div class="subject-title" style="border-left:5px solid #b31b1b; padding-left:10px; background:#f4f4f4; font-weight:bold; margin-top:25px;">${sub}</div><ul>`;
            
            filtered.forEach(p => {
                html += `<li><a href="paper.html?id=${encodeURIComponent(p.id)}" style="text-decoration:none; color:#004b87;">${escapeHtml(p.title)}</a></li>`;
            });
            section.innerHTML = html + "</ul>";
            contentArea.appendChild(section);
        });
    } catch (e) {
        contentArea.innerHTML = `<p style="color:red">데이터 로드 실패: ${e.message}</p>`;
    }
}

/** [상세 페이지] **/
async function initDetail() {
    const detailArea = document.getElementById("paper-detail");
    if (!detailArea) return;
    console.log("상세 페이지 초기화 중...");

    try {
        const id = new URLSearchParams(window.location.search).get("id");
        if (!id) throw new Error("ID가 없습니다.");

        const data = await fetchData();
        const p = data.find(item => item.id === id);
        if (!p) throw new Error("해당 게시글을 찾을 수 없습니다.");

        // 메타데이터 TXT 읽기
        let metaTxt = "메타데이터를 읽어오는 중...";
        try {
            const mRes = await fetch(encodeURI(p.meta));
            metaTxt = mRes.ok ? await mRes.text() : "파일을 찾을 수 없습니다.";
        } catch(err) { metaTxt = "로드 실패 (보안 정책 확인 필요)"; }

        detailArea.innerHTML = `
            <h2 style="border-bottom:2px solid #b31b1b; padding-bottom:10px;">${escapeHtml(p.title)}</h2>
            <div style="background:#f9f9f9; padding:20px; border:1px solid #ddd; margin:20px 0;">
                <pre style="white-space:pre-wrap; font-family:serif;">${escapeHtml(metaTxt)}</pre>
            </div>
            <div style="margin-bottom:15px;">
                <a href="${encodeURI(p.pdf)}" download style="background:#b31b1b; color:white; padding:10px 20px; text-decoration:none; font-weight:bold; border-radius:3px;">PDF 다운로드</a>
            </div>
            <iframe src="${encodeURI(p.pdf)}" width="100%" height="900px" style="border:1px solid #ccc;"></iframe>
        `;
    } catch (e) {
        detailArea.innerHTML = `<p style="color:red">${e.message}</p>`;
    }
}

/** [랜덤 페이지] **/
async function initRandom() {
    const container = document.getElementById("random-container");
    if (!container) return;
    console.log("랜덤 페이지 초기화 중...");

    try {
        const data = await fetchData();
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const list = [...shuffled.slice(0, 3), ...data.filter(p => !shuffled.slice(0, 3).includes(p))];

        let idx = 0;
        const load = () => {
            const chunk = list.slice(idx, idx + 5);
            chunk.forEach(p => {
                const d = document.createElement("div");
                d.style = "margin-bottom:40px; border-bottom:1px solid #eee; padding-bottom:20px;";
                d.innerHTML = `<h3><a href="paper.html?id=${encodeURIComponent(p.id)}" style="color:#004b87;">${escapeHtml(p.title)}</a></h3><p>${escapeHtml(p.abstract)}</p>`;
                container.appendChild(d);
            });
            idx += 5;
        };
        load();
        window.onscroll = () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 400) load();
        };
    } catch (e) { console.error(e); }
}

// DOM 로드 후 실행
document.addEventListener("DOMContentLoaded", () => {
    initMain();
    initDetail();
    initRandom();
});

