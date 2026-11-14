/* 1번 마을 전문가 리뷰 반영 (일회성): node tools/apply_town1_review.js <review.json> */
const fs = require("fs"), path = require("path");
const rev = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const files = ["ltssm_q1.js", "ltssm_q2.js", "ltssm_q3.js"].map((f) => path.join(__dirname, "..", "js", f));
const lines = files.map((f) => fs.readFileSync(f, "utf8").split("\n"));
const refs = []; // 전역 index → [fileIdx, lineIdx]
lines.forEach((L, fi) => L.forEach((ln, li) => { if (ln.startsWith('["')) refs.push([fi, li]); }));
let n = 0;
rev.forEach((r) => {
  const i = +r.id.slice(3) - 1, [fi, li] = refs[i];
  const raw = lines[fi][li], comma = raw.trimEnd().endsWith(",");
  const e = JSON.parse(raw.trimEnd().replace(/,$/, ""));
  const f = r.fix || {};
  if (f.q) { if (!e[9]) e[9] = e[3]; e[3] = f.q; } // e[9] = 문제 id용 원문(기록 유지)
  if (f.answer) e[4] = f.answer;
  if (f.wrong) { if (f.wrong.length !== 3) throw new Error("wrong!=3 " + r.id); e[5] = f.wrong[0]; e[6] = f.wrong[1]; e[7] = f.wrong[2]; }
  if (f.expl) e[8] = f.expl;
  if (new Set([e[4], e[5], e[6], e[7]]).size !== 4) throw new Error("dup choices " + r.id);
  lines[fi][li] = JSON.stringify(e) + (comma ? "," : "");
  n++;
});
files.forEach((f, fi) => fs.writeFileSync(f, lines[fi].join("\n")));
console.log("applied", n);
