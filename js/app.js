/* js/app.js - 최종 수정 및 문법 오류 교정본 */
const SUBJECTS = ["물리", "화학", "생명", "지구", "융합", "인문-사회"];

function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}

// 데이터 로드 함수
async function fetchData() {
    console.log("manifest.json 로딩 시도...");
    try {
        const res = await fetch("./manifest.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`파일을 찾을 수 없음 (HTTP ${res.status})`);
        const data = await res.json();
        return data;
    } catch (e) {
        console.error("데이터 로드 에러:", e);
        throw e;
    }
}

// 게시글 하나를 만드는 HTML 템플릿 (자색 디자인 적용)
function createEntryHTML(p) {
    return `
        <div class="paper-entry">
            <div class="entry-subject">[${p.subject}]</div>
            <h3><a href="paper.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.title)}</a></h3>
            <p class="entry-abstract"><strong>Abstract:</strong> ${escapeHtml(p.abstract)}</p>
        </div>
    `;
}

/** [1] 메인 페이지 초기화 **/
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
                // 섹션 제목 (arXiv 스타일)
                section.innerHTML = `<div style="background:#f4f4f4; border-left:5px solid #b31b1b; padding:8px 12px; font-weight:bold; margin:40px 0 30px 0; font-size:18px;">${sub}</div>`;
                
                filtered.forEach(p => {
                    section.innerHTML += createEntryHTML(p);
                });
                el.appendChild(section);
            });
        };
        render(data);

        // 검색 기능
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
            searchInput.oninput = (e) => {
                const q = e.target.value.toLowerCase();
                render(data.filter(p => p.title.toLowerCase().includes(q) || p.abstract.toLowerCase().includes(q)));
            };
        }
    } catch (e) {
        el.innerHTML = `<p style="color:red; padding:20px;">데이터 로딩 실패: ${e.message}</p>`;
    }
}

/** [2] 상세 페이지 초기화 **/
async function initDetail() {
    const el = document.getElementById("paper-detail");
    if (!el) return;

    try {
        const id = new URLSearchParams(window.location.search).get("id");
        const data = await fetchData();
        const p = data.find(item => item.id === id);

        if (!p) { el.innerHTML = "<h2>게시글을 찾을 수 없습니다.</h2>"; return; }

        let metaTxt = "Loading metadata...";
        try {
            const mRes = await fetch(encodeURI(p.meta));
            metaTxt = mRes.ok ? await mRes.text() : "메타데이터 파일이 없습니다.";
        } catch(err) { metaTxt = "메타데이터 로드 중 오류 발생."; }

        el.innerHTML = `
            <h2 style="border-bottom:3px solid #b31b1b; padding-bottom:10px; color:#0000ff; font-size:26px;">${escapeHtml(p.title)}</h2>
            <div style="color:#666; margin-bottom:15px;">Subject: ${p.subject} | ID: ${p.id}</div>
            <div class="meta-box" style="background:#f9f9f9; border:1px solid #ddd; padding:20px; margin:20px 0;">
                <pre style="white-space:pre-wrap; font-family:serif; font-size:15px; margin:0;">${escapeHtml(metaTxt)}</pre>
            </div>
            <iframe src="${encodeURI(p.pdf)}" width="100%" height="900px" style="border:1px solid #ccc;"></iframe>
        `;
    } catch (e) {
        el.innerHTML = `<p style="color:red">${e.message}</p>`;
    }
}

/** [3] 랜덤 페이지 초기화 **/
async function initRandom() {
    const el = document.getElementById("random-container");
    if (!el) return;

    try {
        const data = await fetchData();
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        let idx = 0;

        const loadMore = () => {
            const chunk = shuffled.slice(idx, idx + 5);
            chunk.forEach(p => {
                const div = document.createElement("div");
                div.innerHTML = createEntryHTML(p);
                el.appendChild(div);
            });
            idx += 5;
        };

        loadMore(); // 초기 로딩

        window.onscroll = () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 400) {
                if (idx < shuffled.length) loadMore();
            }
        };
    } catch (e) {
        console.error("랜덤 로딩 에러:", e);
    }
}

// 모든 페이지 공통 초기화 호출
window.addEventListener("DOMContentLoaded", () => {
    initMain();
    initDetail();
    initRandom();
});
/* 코드 끝 - 이 줄까지 모두 복사하세요 */
