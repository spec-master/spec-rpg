# SPEC 몬스터 골드 — PCIe/CXL 학습 RPG (프로토타입)

포켓몬 골드 스타일 2D RPG로 PCIe/CXL spec을 공부하는 웹 게임. 빌드 없음, 외부 의존성 없음(오프라인 동작).

## 실행
- 로컬: `python3 -m http.server 8000` → http://localhost:8000
- iPhone: GitHub Pages 등 https에 올린 뒤 Safari → 공유 → **홈 화면에 추가** (PWA, 오프라인 캐시)

## 조작
- 터치: D-pad 이동 · A 대화/선택 · B/START 메뉴 · 보기는 직접 탭해도 됨
- 키보드: 방향키/WASD · Z/Enter/Space = A · X/Esc = B · Shift/M = START

## 구조
```
index.html            화면/컨트롤 레이아웃, PWA 메타태그
style.css             GBC풍 UI
manifest.webmanifest  PWA 매니페스트
sw.js                 오프라인 캐시 (파일 수정 시 VERSION 올리기)
icons/                앱 아이콘 (180/192/512)
js/data.js            ★ 데이터: 장, spec 도감(개념), 기술, 아이템, 몬스터, 문제 은행
js/engine.js          엔진: 렌더링, 입력, 대화, 메뉴, 전투, 성장, 저장
js/story.js           맵, NPC, 트레이너, 관장, 스토리 스크립트
```

## 문제 추가
`js/data.js`의 `SPEC.QUESTIONS`에 추가:
```js
{ id: "c3_99", ch: 3, d: 2, concept: "bar", q: "질문", c: ["보기1","보기2","보기3","보기4"], a: 1, e: "해설" }
```
- `ch`: 장(1~7) — 해당 장 지역 풀숲/관장에서 출제
- `d`: 난이도 1~3 — Lv1-2는 ★, Lv3-5는 ★★까지, Lv6+는 ★★★까지 출제
- `concept`: `SPEC.CONCEPTS`의 id — 처음 만나면 도감에 등록됨

## 성장 규칙 (spec 이해도 = Link 성장)
- LTSSM: Detect(시작) → Polling(박사의 Receiver Detect) → Configuration(Configuration 학습 + 첫 승리) → L0(1장 관장)
- Gen 속도: L0 이후, 레벨 + 개념 학습 필요 (Gen2: 세대별 속도, Gen3: Equalization + 128b/130b, Gen6: PAM4 + FLIT)
- Link 폭: Configuration 학습 후 Lv3 x2 / Lv5 x4 / Lv8 x8 / Lv12 x16
- 기술: 레벨 + 관련 개념 학습 둘 다 충족해야 습득
- 저장: localStorage `specrpg_save_v1`
