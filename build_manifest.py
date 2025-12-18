import os, json, re

META_ROOT = "meta data"
PAPER_ROOT = "paper"

def safe_id(s: str) -> str:
    # 파일명 기반 id (공백/특수문자 정리)
    s = re.sub(r"\.txt$", "", s)
    s = s.strip()
    s = re.sub(r"\s+", "_", s)
    return s

def parse_txt(path: str) -> dict:
    # txt 키: 제목/구분/초록 (한글)
    data = {"제목": "", "구분": "", "초록": ""}
    with open(path, "r", encoding="utf-8") as f:
        for line in f.read().splitlines():
            if ":" not in line:
                continue
            k, v = line.split(":", 1)
            k = k.strip()
            v = v.strip()
            if k in data:
                data[k] = v
    return data

manifest = []

for subject in os.listdir(META_ROOT):
    subject_dir = os.path.join(META_ROOT, subject)
    if not os.path.isdir(subject_dir):
        continue

    for fname in sorted(os.listdir(subject_dir)):
        if not fname.endswith(".txt"):
            continue

        meta_path = os.path.join(subject_dir, fname)
        meta = parse_txt(meta_path)

        base_name = fname[:-4]  # .txt 제거
        pdf_path = os.path.join(PAPER_ROOT, subject, base_name + ".pdf")

        manifest.append({
            "id": safe_id(base_name),
            "title": meta["제목"] or base_name,
            "subject": meta["구분"] or subject,
            "abstract": meta["초록"],
            "meta": meta_path.replace("\\", "/"),
            "pdf": pdf_path.replace("\\", "/")
        })

with open("manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"✅ manifest.json 생성 완료: {len(manifest)}개")
