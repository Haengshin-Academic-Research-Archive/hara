/* ==========================================================================
   HARA (Hangshin Academic Research Archive) 통합 제어 스크립트
   ========================================================================== */

const SUBJECTS = ["물리", "화학", "생명", "지구", "융합", "인문-사회"];

/**
 * 0. 공통 유틸리티 함수
 */
function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;"
    }[m]));
}

async function fetchData() {
    // manifest.json을 가져옵니다.
    const res = await fetch("manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error("데이터를 불러오지 못했습니다.");
    return await res.json();
}

/**
 * 1. 메인 페이지 (index.html) 로직
 */
async function initMain() {
    const contentArea = document.getElementById("content-area");
    if (!contentArea) return;

    try {
        const data = await fetchData();

        const render = (items) => {
            contentArea.innerHTML = "";
            SUBJECTS.forEach(sub => {
                const filtered = items.filter(p => p.subject === sub);
                if (filtered.length === 0) return;

                const section = document.createElement("section");
                section.className = "subject-section";
                let html = `<div class="subject-title">${sub}</div><ul style="list-style:none; padding:0;">`;
                
                filtered.forEach(p => {
                    html += `
                        <li class="paper-item">
                            <span class="paper-id">[${p.id.split('_')[0]}]</span>
                            <a href="paper.html?id=${encodeURIComponent(p.id)}" class="paper-title">${escapeHtml(p.title)}</a>
                        </li>
                    `;
                });
                html += `</ul>`;
                section.innerHTML = html;
                contentArea.appendChild(section);
            });
        };

        render(data);

        // 검색 기능
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                const q = e.target.value.toLowerCase();
                const filtered = data.filter(p => 
                    p.title.toLowerCase().includes(q) || 
                    p.abstract.toLowerCase().includes(q)
                );
                render(filtered);
            });
        }
    } catch (e) {
        contentArea.innerHTML = `<p class="error">${e.message}</p>`;
    }
}

/**
 * 2. 상세 페이지 (paper.html) 로직
 */
async function initDetail() {
    const detailArea = document.getElementById("paper-detail");
    if (!detailArea) return;

    try {
        const id = new URLSearchParams(window.location.search).get("id");
        if (!id) throw new Error("보고서 ID가 없습니다.");

        const data = await fetchData();
        const p = data.find(item => item.id === id);
        if (!p) throw new Error("해당 보고서를 찾을 수 없습니다.");

        // 메타데이터 TXT 파일 직접 읽어오기
        let metaContent = "불러오는 중...";
        try {
            const metaRes = await fetch(p.meta);
            metaContent = metaRes.ok ? await metaRes.text() : "메타데이터 파일을 읽을 수 없습니다.";
        } catch (err) {
            metaContent = "파일 시스템 제한으로 인해 로컬에서는 TXT를 읽을 수 없습니다. 서버(GitHub Pages 등)에 올려주세요.";
        }

        detailArea.innerHTML = `
            <div class="detail-header" style="border-bottom: 2px solid #b31b1b; margin-bottom: 20px; padding-bottom: 10px;">
                <h2 style="margin:0; font-size:28px;">${escapeHtml(p.title)}</h2>
                <div style="color:#666; font-size:14px; margin-top:10px;">
                    분류: <b>${escapeHtml(p.subject)}</b> | ID: ${escapeHtml(p.id)}
                </div>
            </div>
            
            <div class="meta-section" style="background:#f9f9f9; border:1px solid #ccc; padding:20px; margin-bottom:20px;">
                <h3 style="margin-top:0; font-size:16px; border-bottom:1px solid #ddd; padding-bottom:5px;">Metadata Info (.txt)</h3>
                <pre style="white-space:pre-wrap; font-family:serif; line-height:1.6; font-size:15px; color:#333;">${escapeHtml(metaContent)}</pre>
            </div>

            <div class="pdf-actions" style="margin-bottom:15px; display:flex; gap:15px; align-items:center;">
                <a href="${p.pdf}" download class="btn" style="background:#b31b1b; color:white; padding:10px 20px; text-decoration:none; font-weight:bold; border-radius:3px;">PDF 다운로드</a>
                <a href="${p.pdf}" target="_blank" style="font-size:14px; color:#004b87;">전체 화면 보기</a>
            </div>
            
            <div class="pdf-container">
                <iframe src="${p.pdf}" width="100%" height="900px" style="border:1px solid #ccc;"></iframe>
            </div>
        `;
    } catch (e) {
        detailArea.innerHTML = `<div class="error"><h3>오류</h3><p>${e.message}</p></div>`;
    }
}

/**
 * 3. 랜덤 Discovery 페이지 (random.html) 로직
 */
async function initRandom() {
    const container = document.getElementById("random-container");
    if (!container) return;

    try {
        const data = await fetchData();
        let displayList = [];

        // 1. 처음 3개는 랜덤 추출
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const randomPicks = shuffled.slice(0, 3);
        displayList.push(...randomPicks);

        // 2. 나머지는 원래 순서대로 (중복 제거)
        const remainders = data.filter(p => !randomPicks.find(r => r.id === p.id));
        displayList.push(...remainders);

        let currentIndex = 0;
        const BATCH_SIZE = 5;

        const loadMore = () => {
            const fragment = document.createDocumentFragment();
            const nextBatch = displayList.slice(currentIndex, currentIndex + BATCH_SIZE);
            
            nextBatch.forEach(p => {
                const div = document.createElement("div");
                div.className = "paper-item";
                div.style = "margin-bottom:50px; border-bottom:1px solid #eee; padding-bottom:30px;";
                div.innerHTML = `
                    <h3 style="margin-bottom:5px;"><a href="paper.html?id=${encodeURIComponent(p.id)}" class="paper-title" style="font-size:20px;">${escapeHtml(p.title)}</a></h3>
                    <div style="font-size:13px; color:#666; margin-bottom:10px;">분류: ${p.subject}</div>
                    <p style="font-size:15px; color:#444; line-height:1.6;">${escapeHtml(p.abstract)}</p>
                    <a href="paper.html?id=${encodeURIComponent(p.id)}" style="color:#b31b1b; font-size:14px; font-weight:bold;">상세 정보 확인 및 PDF 보기 →</a>
                `;
                fragment.appendChild(div);
            });

            container.appendChild(fragment);
            currentIndex += BATCH_SIZE;
        };

        // 초기 로드
        loadMore();

        // 무한 스크롤 로직
        window.addEventListener("scroll", () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
                if (currentIndex < displayList.length) {
                    loadMore();
                }
            }
        });

    } catch (e) {
        container.innerHTML = `<p class="error">${e.message}</p>`;
    }
}

/**
 * 페이지 로드 시 현재 페이지에 맞는 함수 실행
 */
window.addEventListener("DOMContentLoaded", () => {
    initMain();
    initDetail();
    initRandom();
});