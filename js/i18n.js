/* 영어 텍스트 (기술·아이템). UI 문구는 engine.js의 G.t(ko, en)로 처리. */
(function () {
  const S = window.SPEC;
  const MOVES = {
    rxdetect: "Senses the far Rx termination. [weak hit on a correct answer]",
    ts1: "Sends PAD TS1 to get bit/symbol lock. [hit on a correct answer]",
    width: "Grows with the negotiated link width (x1→x16). [power = 7 + lane bonus]",
    eq: "Tunes Tx presets in Phases 0–3. [removes 1 wrong choice + hit]",
    fts: "N_FTS FTSs bring L0s straight back to L0. [hit + heal 15%]",
    recov: "Retrains from RcvrLock without dropping the link. [one free retry on a wrong answer]",
    l0pw: "Keeps only the lanes it needs (Flit Mode). [half damage on a wrong answer]",
    echo: "The follower loops symbols back. [reflects half the damage you take]",
    apn: "Negotiates Flex Bus (CXL) with Modified TS1/TS2. [stronger on harder questions: 7 + 6×difficulty]",
    hotreset: "Resets the partner with Hot_Reset_Request TS1! [strong, but 1.5× damage on a wrong answer]",
    l1nap: "Releases CLKREQ# and drops common mode too (neither L1.1 nor L1.2 needs Refclk). [weak hit + heal 35%]",
    acknak: "On Nak, resend from the replay buffer. [one free retry on a wrong answer]",
    updatefc: "UpdateFC DLLPs return buffer credits. [heal 35% + weak hit]",
    lcrc: "32-bit LCRC catches errors. [stronger on harder questions]",
    posted: "Like MWr, never waits for a Completion. [strong, but 1.5× damage on a wrong answer]",
    fecfix: "FEC corrects PAM4 errors first. [half damage on a wrong answer]",
    snoop: "H2D snoop probes the cache line. [removes 2 wrong choices + hit]",
    bisnp: "BISnp invalidates host cache lines — CXL finisher. [very strong hit]"
  };
  S.MOVES.forEach((m) => { if (MOVES[m.id]) m.descEn = MOVES[m.id]; });
  const ITEMS = {
    fc_credit: ["Flow Control Credit", "[Heal 20 HP] Real: buffer space advertised by the receiver; a sender needs credits to send TLPs."],
    replay_buf: ["Replay Buffer", "[Battle: retry the next wrong answer without damage] Real: keeps copies of sent TLPs until Ack."],
    retimer: ["Retimer", "[Full heal] Real: a protocol-aware chip that fully regenerates the signal and joins LTSSM/EQ."],
    msix_table: ["MSI-X Table", "[Field: interrupt the professor for a hint] Real: per-vector address/data/mask table in a BAR."],
    bar_key: ["BAR Key", "[Legacy key item] Real: BARs define the address window a device decodes."]
  };
  Object.entries(ITEMS).forEach(([k, [n, d]]) => { if (S.ITEMS[k]) { S.ITEMS[k].en = n; S.ITEMS[k].descEn = d; } });
})();
