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
style.css             GBC풍 UI (전투 시 질문+4지선다가 스크롤 없이 보이는 레이아웃)
manifest.webmanifest  PWA 매니페스트
sw.js                 오프라인 캐시 (파일 수정 시 VERSION 올리기)
icons/                앱 아이콘 (180/192/512)
js/data.js            데이터: 장, spec 도감(개념), 기술, 아이템, 2장~ 몬스터·문제
js/ltssm_q1~q3.js     ★ 1번 마을 LTSSM 문제 은행 (PCIe 7.0 / CXL 4.0 공통, 188문제)
js/ltssm.js           ★ LTSSM state·규칙·배지·몬스터·업적 정의, 구 저장 이주
js/ltssm_ui.js        몬스터 체형 스프라이트, 16x16 배지, 팝업/팡파레/토스트
js/engine.js          엔진: 렌더링, 입력, 대화, 메뉴, 전투, 성장, 저장
js/story.js           맵, NPC, 트레이너, 관장, 스토리 스크립트
```

## 1번 마을 (LTSSM) 구조
- PCIe 마을(허브) ← 서: Detect 초원(북: Polling 숲) / 동: Configuration 협곡(+CXL Flex Bus) → Recovery 동굴(+EQ) / 남: Power 호수(L0·L0p·L0s·L1·L2) / 북: 시련의 탑(Disabled·Loopback·Hot Reset)
- 풀숲(`,` `v` `:`)에서 state별 몬스터와 조우 → 그 state의 문제 출제
- 규칙: 규칙 문제를 2번 맞히면 습득. state의 규칙을 모두 습득하면 state 배지 (14종)
- LTSSM 진행: Detect 배지 → Polling, Polling 배지 → Configuration, Configuration 배지 → L0(2.5 GT/s)
- Gen: Recovery 배지(Gen2+), Equalization 배지(Gen3+), L0p 배지(Gen6/7, Flit) + 레벨
- 관장: Lv10 + 핵심 배지(Detect·Polling·Configuration·Recovery·L0) → 승리 시 LTSSM 마스터 배지, 2장 해금
- 출제 가중치: 미습득 규칙 ×4, 몬스터 집중 규칙 ×3, 처음 보는 문제 ×3, 직전에 틀린 문제 ×5, 마스터(3연속 정답) ×0.4
- 콤보(3연속 정답부터 보너스 XP, 5연속부터 공격 +15%), 퍼펙트 배틀 XP +30%, 업적 18종 + 칭호

## 문제 추가 (LTSSM)
`js/ltssm_q*.js` 배열에 `[state, rule, 난이도, 질문, 정답, 오답1, 오답2, 오답3, 해설]` 추가 (정답은 항상 첫 칸, 화면에서 섞임).
`rule`은 `js/ltssm.js`의 STATES[].rules에 정의된 id여야 한다 (로드 시 검사). 문제 id는 규칙+질문 해시라 순서를 바꿔도 기록이 유지된다.

## 문제 추가 (2장~)
`js/data.js`의 `SPEC.QUESTIONS`에 추가:
```js
{ id: "c3_99", ch: 3, d: 2, concept: "bar", q: "질문", c: ["보기1","보기2","보기3","보기4"], a: 1, e: "해설" }
```

## 저장
- localStorage `specrpg_save_v1`, 상태 `ver: 2`. 구버전 저장은 불러올 때 레벨·배지·문제 기록을 유지한 채 마을로 이주(안내 표시)

## 저장 코드 (기기 간 이어하기, 서버 없음)
- 메뉴 → **저장 코드 내보내기**: `SPEC1.` + base64url([압축flag][CRC32][deflate-raw JSON]) 코드, 복사 / 공유 링크(`#save=코드`)
- 타이틀 또는 메뉴 → **저장 코드 불러오기**: 붙여넣기 → 체크섬·구조 검증 → 요약 확인 후 덮어쓰기
- 공유 링크로 열면 타이틀에 「🔗 링크의 저장 코드 불러오기」가 뜸
- 압축 해제는 CompressionStream 필요(iOS 16.4+)

## 랭킹 (GitHub Issues + Actions, 비밀값 없음)
- 점수 = Lv×100 + 관장 배지×500 + state 배지×200 + 습득 규칙×15 + 도감×30 + 정답×10 + (10문제 이상 답하면) 정확도%×5
- 메뉴 → 랭킹 → 점수 제출: 닉네임(2~12자, 한글/영문/숫자/_/-) → GitHub 이슈 작성 페이지로 이동(로그인 필요) → Create
- `.github/workflows/leaderboard.yml` + `scripts/lb-submit.js`가 저장 코드를 다시 디코드·검증해 점수를 재계산하고
  `data/leaderboard.json`을 갱신, 이슈에 결과를 댓글로 달고 닫음 (GitHub 계정당 1개 기록, 최고점 유지, 10분 제한, 닉네임 중복 방지)
- 랭킹 보기: raw.githubusercontent.com의 leaderboard.json을 읽어 TOP 20 + 내 순위 표시
- 백엔드 교체: `js/online.js`의 `LB_ADAPTERS`에 어댑터 추가 후 `LB_CONFIG.adapter` 변경 (`disabled` = '준비 중')
