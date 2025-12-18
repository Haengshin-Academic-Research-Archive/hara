const SUBJECTS = ["물리", "화학", "생명", "지구", "융합", "인문-사회"];

function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}

// 깃허브 서버에서 공백이나 한글 경로 문제를 해결하기 위한 인코딩 함수
function fixPath(path) {
    if (!path) return "";
    // 경로에 포함된 공백을 %20으로 변환하고, 한글을 인코딩함
    return encodeURI(path);
}

async function fetchData() {
    try {
        const res = await fetch("manifest.json", { cache: "no-store" });
        if (!res.ok) throw new Error("manifest.json 로드 실패");
        return await res.json();
    } catch (e) {
        console.error(e);
        throw e;
    }
}

/** [1] 메인 페이지 **/
async function initMain() {
    const contentArea = document.getElementById("content-area");
    if (!contentArea) return;

    try {
        const data = await fetchData();
        const render = (items) => {
            contentArea.innerHTML = "";
            SUBJECTS.forEach(sub => {
                const filtered = items.filter(p => p.subject === sub);
                if (!filtered.length) return;
                let html = `<section class="subject-section"><div class="subject-title" style="border-left:5px solid #b31b1b; padding-left:10px; background:#f4f4f4; font-weight:bold; margin-top:20px;">${sub}</div><ul>`;
                filtered.forEach(p => {
                    html += `<li><a href="paper.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.title)}</a></li>`;
                });
                contentArea.innerHTML += html + "</ul></section>";
            });
        };
        render(data);
    } catch (e) {
        contentArea.innerHTML = `<p style="color:red">데이터 로드 실패: ${e.message}</p>`;
    }
}

/** [2] 상세 페이지 - 핵심 수정 부분 **/
async function initDetail() {
    const detailArea = document.getElementById("paper-detail");
    if (!detailArea) return;

    try {
        const id = new URLSearchParams(window.location.search).get("id");
        if (!id) return;

        const data = await fetchData();
        const p = data.find(item => item.id === id);

        if (!p) {
            detailArea.innerHTML = "<h2>보고서를 찾을 수 없습니다.</h2>";
            return;
        }

        // 경로 수정 적용
        const metaPath = fixPath(p.meta);
        const pdfPath = fixPath(p.pdf);

        let metaTxt = "메타데이터를 읽어오는 중...";
        try {
            const mRes = await fetch(metaPath);
            if (mRes.ok) {
                metaTxt = await mRes.text();
            } else {
                metaTxt = `파일을 찾을 수 없습니다. (경로 확인: ${p.meta})`;
            }
        } catch(err) {
            metaTxt = "메타데이터 로드 중 네트워크 오류 발생.";
        }

        detailArea.innerHTML = `
            <div style="margin-bottom:30px;">
                <h2 style="font-size:24px; border-bottom:2px solid #b31b1b; padding-bottom:10px;">${escapeHtml(p.title)}</h2>
                <p style="color:#666;">분류: ${p.subject} | 파일: ${escapeHtml(p.pdf.split('/').pop())}</p>
            </div>

            <div style="background:#fdfdfd; border:1px solid #ddd; padding:20px; margin-bottom:20px;">
                <h4 style="margin-top:0; color:#b31b1b;">Abstract & Metadata</h4>
                <pre style="white-space:pre-wrap; font-family:serif; line-height:1.6; color:#333;">${escapeHtml(metaTxt)}</pre>
            </div>

            <div style="margin-bottom:15px;">
                <a href="${pdfPath}" download class="btn" style="background:#b31b1b; color:white; padding:10px 20px; text-decoration:none; font-weight:bold; display:inline-block;">PDF 다운로드</a>
                <a href="${pdfPath}" target="_blank" style="margin-left:15px; font-size:14px; color:#004b87;">새 창에서 열기</a>
            </div>

            <iframe src="${pdfPath}" width="100%" height="800px" style="border:1px solid #ccc;"></iframe>
        `;
    } catch (e) {
        detailArea.innerHTML = `<p style="color:red">오류: ${e.message}</p>`;
    }
}

/** [3] 랜덤 페이지 **/
async function initRandom() {
    const container = document.getElementById("random-container");
    if (!container) return;

    try {
        const data = await fetchData();
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const randomPicks = shuffled.slice(0, 3);
        const remainders = data.filter(p => !randomPicks.find(r => r.id === p.id));
        const totalList = [...randomPicks, ...remainders];

        let i = 0;
        const load = () => {
            const chunk = totalList.slice(i, i + 5);
            chunk.forEach(p => {
                const d = document.createElement("div");
                d.style = "margin-bottom:30px; border-bottom:1px solid #eee; padding-bottom:20px;";
                d.innerHTML = `
                    <h3><a href="paper.html?id=${encodeURIComponent(p.id)}" style="text-decoration:none; color:#004b87;">${escapeHtml(p.title)}</a></h3>
                    <p style="color:#666; font-size:13px;">${p.subject}</p>
                    <p style="font-size:14px;">${escapeHtml(p.abstract)}</p>
                `;
                container.appendChild(d);
            });
            i += 5;
        };
        load();
        window.onscroll = () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 400) {
                if(i < totalList.length) load();
            }
        };
    } catch (e) { console.error(e); }
}

window.addEventListener("DOMContentLoaded", () => {
    initMain();
    initDetail();
    initRandom();
});
