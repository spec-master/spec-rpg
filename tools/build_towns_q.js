/* 마을 2~10 문제 은행 생성기 (오프라인 실행, 결과만 커밋)
 *   node tools/build_towns_q.js [/workspace/spec-rpg-ref/quiz]
 * 입력: pcie_townN.json / cxl_townN.json (전문가가 의역해 만든 문제; spec 원문 파일은 읽지 않음)
 * 출력: js/towns_q.js  — 공개 저장소이므로, 해설(expl)에 따옴표로 인용된 긴 원문 문장이 있으면
 *       인용 부분을 제거하고 정답 요약 + 절 번호로 대체한다(원문 인용을 저장소에 넣지 않기 위함). */
const fs = require("fs"), path = require("path");
const SRC = process.argv[2] || "/workspace/spec-rpg-ref/quiz";
const OUT = path.join(__dirname, "..", "js", "towns_q.js");
const ruleId = (p, r) => { if (p === "pcie") { const m = r.match(/^T(\d+)-R(\d+)/); return `p${m[1]}_${m[2]}`; } const m = r.match(/^t(\d+)-r(\d+)$/); return `c${m[1]}_${m[2]}`; };
const LONGQ = /[“"][^“”"]{18,}[”"]/;
let stripped = 0;
const out = {}, stats = {};
for (let t = 2; t <= 10; t++) {
  out[t] = []; stats[t] = { pcie: 0, cxl: 0, tags: {} };
  for (const p of ["pcie", "cxl"]) {
    const f = path.join(SRC, `${p}_town${t}.json`); if (!fs.existsSync(f)) continue;
    const arr = JSON.parse(fs.readFileSync(f, "utf8"));
    arr.forEach((q, i) => {
      if (q.town !== t) throw new Error("town mismatch " + q.id);
      if (!(q.choices.ko.length === 4 && q.choices.en.length === 4 && q.answer >= 0 && q.answer < 4)) throw new Error("bad choices " + q.id);
      let eko = q.expl.ko, een = q.expl.en;
      const ck = q.choices.ko[q.answer], ce = q.choices.en[q.answer];
      if (LONGQ.test(eko) || LONGQ.test(een)) {
        stripped++;
        eko = `정답 요지: ${ck}`;
        een = `Key point: ${ce}`;
      }
      const tag = q.tag === "공통" ? "C" : q.tag === "CXL" ? "X" : "P";
      const id = `${p[0]}${t}q${String(i + 1).padStart(2, "0")}`;
      out[t].push([id, ruleId(p, q.rule), q.diff, tag, q.q.ko, q.q.en, q.choices.ko, q.choices.en, q.answer, eko, een, q.ref || ""]);
      stats[t][p]++; stats[t].tags[q.tag] = (stats[t].tags[q.tag] || 0) + 1;
    });
  }
}
const body = "/* 자동 생성: tools/build_towns_q.js — 직접 수정하지 마세요.\n * 마을 2~10 문제 (PCIe 7.0 / CXL 4.0 전문가 의역 문제). 형식:\n * [id, rule, 난이도, tag(P=PCIe X=CXL C=공통), q.ko, q.en, choices.ko[4], choices.en[4], answer, expl.ko, expl.en, ref] */\n" +
  "var TOWN_Q = " + JSON.stringify(out) + ";\nif (typeof module !== \"undefined\") module.exports = TOWN_Q;\n";
fs.writeFileSync(OUT, body);
console.log("wrote", OUT, (body.length / 1024).toFixed(0) + "KB", "stripped quotes:", stripped);
console.log(JSON.stringify(stats));
