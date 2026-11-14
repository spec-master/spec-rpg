/* =========================================================
 * 마을 2~10 정의 (데이터만 — 브라우저 + Node 공용)
 * 각 마을: families(배지 단위 = 규칙 묶음) · rules(도감 항목 = 전문가 rule group) · 몬스터(규칙마다 1종)
 * 새 마을 추가: TOWNS에 항목을 넣고 tools/build_towns_q.js로 문제를 생성하면 된다.
 * ========================================================= */
(function () {
  "use strict";
  const isNode = typeof window === "undefined";
  const SPEC = isNode ? require("./ltssm.js") : window.SPEC;
  const TQ = isNode ? require("./towns_q.js") : window.TOWN_Q;
  const LT = SPEC.LTSSM;

  /* 규칙 제목: [ko, en, 몬스터 이름 키워드] */
  const R = {
    // ---- 2 PHY / Flit ----
    p2_1: ["PAM4 시그널링", "PAM4 signaling", "PAM4"], p2_2: ["인코딩 8b/10b·128b/130b·1b/1b", "Encodings 8b/10b·128b/130b·1b/1b", "인코딩"], p2_3: ["Flit 구조와 타입", "Flit layout and types", "Flit"],
    p2_4: ["FEC / ECC", "FEC / ECC", "FEC"], p2_5: ["Flit CRC", "Flit CRC", "CRC"], p2_6: ["Precoding", "Precoding", "프리코드"], p2_7: ["스크램블링", "Scrambling", "스크램블"], p2_8: ["Framing·Ordered Set·SKP", "Framing, Ordered Sets, SKP", "SKP"],
    c2_1: ["Flex Bus PHY와 CXL 모드 전환", "Flex Bus PHY and CXL mode switch", "Flex"], c2_2: ["CXL 속도·폭·신호", "CXL speeds, widths, signaling", "x2"], c2_3: ["68B vs 256B 선택", "Choosing 68B vs 256B", "68B"],
    c2_4: ["68B flit과 Protocol ID", "68B flit and Protocol ID", "PID"], c2_5: ["Standard 256B flit 헤더", "Standard 256B flit header", "256B"], c2_6: ["Latency-optimized 256B flit", "Latency-optimized 256B flit", "LOpt"],
    c2_7: ["ARB/MUX와 vLSM", "ARB/MUX and vLSMs", "ARB"], c2_8: ["ALMP 형식과 동작", "ALMP format and behavior", "ALMP"], c2_9: ["저지연·대역폭 옵션", "Low-latency and bandwidth options", "Bypass"],
    // ---- 3 DLL ----
    p3_1: ["DLCMSM과 DL_Up/DL_Down", "DLCMSM and DL_Up/DL_Down", "DL_Up"], p3_2: ["DLLP 형식과 타입", "DLLP format and types", "DLLP"], p3_3: ["Ack/Nak (Non-Flit·Flit)", "Ack/Nak (Non-Flit, Flit)", "Ack"],
    p3_4: ["Retry Buffer와 Replay", "Retry buffer and replay", "Replay"], p3_5: ["Sequence Number", "Sequence Number", "Seq"], p3_6: ["LCRC와 nullify", "LCRC and nullify", "LCRC"],
    p3_7: ["Flow Control 초기화", "Flow Control init", "InitFC"], p3_8: ["UpdateFC·Scaled FC", "UpdateFC and Scaled FC", "Credit"],
    c3_1: ["CXL.io Link Layer = PCIe DLL", "CXL.io link layer reuses PCIe DLL", "IO링크"], c3_2: ["재전송 계층 (68B LLR vs 256B PHY)", "Which layer retries (68B LLR vs 256B PHY)", "Retry"],
    c3_3: ["LLR 기본: LLRB·seq·ACK", "LLR basics: LLRB, seq, ACK", "LLRB"], c3_4: ["LLR control flit과 RETRY", "LLR control flits and RETRY", "RETRY"], c3_5: ["LLR 상태 머신과 TIMEOUT", "LLR state machines and TIMEOUT", "Timeout"],
    c3_6: ["CXL.cachemem CRC-16", "CXL.cachemem CRC-16", "CRC16"], c3_7: ["256B PHY retry 버퍼", "256B PHY retry buffer", "PHYretry"], c3_8: ["Viral·Poison용 CRC 오염", "CRC corruption for Viral/Poison", "Poison"],
    c3_9: ["LLCRD와 Link Layer 초기화", "LLCRD and link-layer init", "LLCRD"],
    // ---- 4 TL ----
    p4_1: ["트랜잭션 종류와 Posted/NP", "Transaction types, Posted/NP", "Posted"], p4_2: ["Non-Flit TLP 헤더", "Non-Flit TLP header", "Header"], p4_3: ["Flit Mode TLP 헤더", "Flit Mode TLP header", "OHC"],
    p4_4: ["라우팅", "Routing", "Route"], p4_5: ["Byte Enables", "Byte Enables", "BE"], p4_6: ["Ordering", "Ordering", "Order"], p4_7: ["Completion", "Completions", "Cpl"], p4_8: ["TL Flow Control과 Attr", "TL flow control and Attr", "Attr"],
    c4_1: ["CXL.io TL = PCIe TL 기반", "CXL.io TL builds on PCIe TL", "IO-TL"], c4_2: ["INTx 규칙", "INTx rules", "INTx"], c4_3: ["CXL PM VDM", "CXL PM VDMs", "VDM"],
    c4_4: ["Error VDM·필수 PCIe 옵션", "Error VDM, required PCIe options", "ErrVDM"], c4_5: ["ATS Memory Type 표시", "Memory type on ATS", "MemType"], c4_6: ["PBR TLP Header (PTH)", "PBR TLP Header (PTH)", "PTH"],
    c4_7: ["VendPrefixL0 (LD-ID·PBR-ID)", "VendPrefixL0 (LD-ID, PBR-ID)", "Prefix"], c4_8: ["Flit 안의 CXL.io TLP 배치", "Placing CXL.io TLPs in flits", "Slot"], c4_9: ["Bundled·Streamlined Port, CDL", "Bundled/Streamlined Ports, CDL", "Bundle"],
    // ---- 5 CXL 디바이스 ----
    p5_1: ["TL과 coherency 속성", "TL and coherency attributes", "Coh"], p5_2: ["Alternate Protocol Negotiation", "Alternate Protocol Negotiation", "APN"], p5_3: ["Modified TS 사용과 상태", "Modified TS usage and status", "ModTS"],
    p5_4: ["DVSEC 메커니즘", "DVSEC mechanism", "DVSEC"], p5_5: ["Alternate Protocol Ext Capability", "Alternate Protocol Extended Capability", "AltCap"], p5_6: ["Flit Mode 공통 기반", "Shared Flit Mode basis", "FlitBase"], p5_7: ["Base spec 속 [CXL]", "[CXL] in the Base spec", "Ref"],
    c5_1: ["Type 1/2/3와 프로토콜 조합", "Type 1/2/3 and protocol sets", "Type"], c5_2: ["HDM과 coherence 모델", "HDM and coherence models", "HDM"], c5_3: ["Bias 기반 coherency", "Bias-based coherency", "Bias"],
    c5_4: ["CXL.cache 채널", "CXL.cache channels", "Channel"], c5_5: ["D2H 요청 (RdShared·DirtyEvict…)", "D2H requests (RdShared, DirtyEvict…)", "D2H"], c5_6: ["H2D Snoop과 응답", "H2D snoops and responses", "Snoop"],
    c5_7: ["CXL.mem M2S/S2M·BI 채널", "CXL.mem M2S/S2M and BI channels", "M2S"], c5_8: ["CXL.mem opcode·Metadata", "CXL.mem opcodes and metadata", "MemRd"],
    // ---- 6 Config ----
    p6_1: ["CAM·ECAM·공간 구조", "CAM, ECAM, space layout", "CAM"], p6_2: ["ECAM 주소 매핑", "ECAM address mapping", "ECAM"], p6_3: ["BAR 크기와 배치", "BAR sizing and layout", "BAR"],
    p6_4: ["Type 0/1 헤더와 bridge window", "Type 0/1 headers, bridge windows", "Type1"], p6_5: ["PCI Capability 리스트", "PCI Capability list", "CapList"], p6_6: ["Extended Capability", "Extended Capabilities", "ExtCap"],
    p6_7: ["DVSEC 일반", "DVSEC in config space", "DVSEC"], p6_8: ["Enumeration 규칙·레지스터 타입", "Enumeration rules, register types", "RW1C"],
    c6_1: ["CXL DVSEC 기본 규칙", "CXL DVSEC basics", "VID1E98"], c6_2: ["CXL 디바이스 식별", "Identifying a CXL device", "Ident"], c6_3: ["DVSEC CXL Capability 비트", "DVSEC CXL Capability bits", "Capable"],
    c6_4: ["GPF·MLD·Locator DVSEC", "GPF, MLD, Register Locator DVSEC", "Locator"], c6_5: ["Component Register 위치", "Locating Component Registers", "RegBlk"], c6_6: ["HDM Decoder", "HDM Decoders", "Decoder"],
    c6_7: ["Decoder Commit·Lock", "Decoder commit and lock", "Commit"], c6_8: ["RCD 모드·Host Bridge", "RCD mode, Host Bridge", "RCD"],
    // ---- 7 Power ----
    p7_1: ["Function D-state", "Function D-states", "D3"], p7_2: ["L-state vs D-state", "L-states vs D-states", "Lstate"], p7_3: ["ASPM L0s·L1", "ASPM L0s and L1", "ASPM"], p7_4: ["ASPM L0p", "ASPM L0p", "L0p"],
    p7_5: ["L1 PM Substates", "L1 PM Substates", "L1.2"], p7_6: ["PME와 PME_Turn_Off", "PME and PME_Turn_Off", "PME"], p7_7: ["LTR", "Latency Tolerance Reporting", "LTR"], p7_8: ["CLKREQ#·Clock PM", "CLKREQ# and Clock PM", "CLKREQ"],
    c7_1: ["CXL PM 구조와 L-state", "CXL PM structure and L-states", "PMblk"], c7_2: ["PM VDM·PMREQ", "PM VDMs and PMREQ", "PMREQ"], c7_3: ["PM 진입 단계", "PM entry phases", "Phase"],
    c7_4: ["CXL.io·cachemem PM 차이", "CXL.io vs cachemem PM", "IO-PM"], c7_5: ["ALMP", "ALMP", "ALMP"], c7_6: ["256B Flit L0p 협상", "L0p negotiation in 256B Flit", "L0p"],
    c7_7: ["GPF (Global Persistent Flush)", "GPF (Global Persistent Flush)", "GPF"], c7_8: ["GPF 타이머·Sx 전환", "GPF timeouts and Sx", "Sx"],
    // ---- 8 RAS ----
    p8_1: ["오류 분류", "Error classification", "Fatal"], p8_2: ["ERR_COR/NONFATAL/FATAL 메시지", "ERR_COR/NONFATAL/FATAL messages", "ERR"], p8_3: ["Advisory Non-Fatal", "Advisory Non-Fatal", "Advisory"],
    p8_4: ["AER 레지스터", "AER registers", "AER"], p8_5: ["ECRC", "ECRC", "ECRC"], p8_6: ["DPC", "Downstream Port Containment", "DPC"], p8_7: ["Surprise Down", "Surprise Down", "Surprise"], p8_8: ["Flit Error Logging", "Flit Error Logging", "FlitLog"],
    c8_1: ["CXL RAS 기능 표", "CXL RAS feature table", "RAS"], c8_2: ["CXL 프로토콜·링크 오류 보고", "CXL protocol/link error reporting", "Report"], c8_3: ["메모리 오류·Poison", "Memory errors and poison", "Poison"],
    c8_4: ["Error record와 reset", "Error records and resets", "Record"], c8_5: ["CXL.cachemem Isolation", "CXL.cachemem Isolation", "Isolate"], c8_6: ["Viral 발생·해제", "Viral raise and clear", "Viral"],
    c8_7: ["Switch·MLD의 Viral 전파", "Viral in switches and MLDs", "VCS"], c8_8: ["Link Layer의 Viral·Poison 표시", "Link-layer Viral/Poison signaling", "LDvec"],
    // ---- 9 Switch / Pooling / Fabric ----
    p9_1: ["Switch 구조 (vPPB)", "Switch architecture (vPPB)", "vPPB"], p9_2: ["Switch 라우팅 3종", "Three switch routing methods", "Route"], p9_3: ["Switch Config 전달 규칙", "Config forwarding rules", "CfgFwd"],
    p9_4: ["ACS", "Access Control Services", "ACS"], p9_5: ["P2P Redirect·Egress Control", "P2P redirect, egress control", "P2P"], p9_6: ["Multicast", "Multicast", "MCast"], p9_7: ["Hot-Plug", "Hot-Plug", "HotPlug"], p9_8: ["Implicit Message 라우팅", "Implicit message routing", "Implicit"],
    c9_1: ["Single·Multiple VCS", "Single and Multiple VCS", "VCS"], c9_2: ["vPPB bind/unbind", "vPPB bind/unbind", "Bind"], c9_3: ["MLD와 LD-ID", "MLD and LD-ID", "MLD"],
    c9_4: ["Pooled vs Shared FAM", "Pooled vs Shared FAM", "FAM"], c9_5: ["Multi-Headed Device", "Multi-Headed Devices", "MHD"], c9_6: ["VCS 안 라우팅·Type 2 확장", "Routing in a VCS, Type 2 scaling", "Scale"],
    c9_7: ["Fabric Manager·FM API", "Fabric Manager and FM API", "FM"], c9_8: ["PBR Fabric", "PBR fabric", "PBR"], c9_9: ["G-FAM (GFD)", "G-FAM devices (GFD)", "GFD"],
    // ---- 10 Security / Virtualization ----
    p10_1: ["IDE 개요·Link/Selective", "IDE overview, Link/Selective", "IDE"], p10_2: ["IDE_KM·SPDM", "IDE_KM and SPDM", "SPDM"], p10_3: ["TLP의 IDE 표시·실패 처리", "IDE in TLPs, failure handling", "MAC"],
    p10_4: ["TDISP (TEE-I/O)", "TDISP (TEE-I/O)", "TDISP"], p10_5: ["SR-IOV PF/VF", "SR-IOV PF/VF", "SR-IOV"], p10_6: ["VF RID·BAR", "VF RID and BARs", "VF"], p10_7: ["ATS", "Address Translation Services", "ATS"], p10_8: ["PRI", "Page Request Interface", "PRI"],
    c10_1: ["CXL IDE 보호 범위", "CXL IDE protection scope", "IDE"], c10_2: ["CXL.io IDE", "CXL.io IDE", "IO-IDE"], c10_3: ["CXL.cachemem IDE 암호·MAC", "CXL.cachemem IDE cipher and MAC", "AES"],
    c10_4: ["Containment·Skid 모드", "Containment and Skid modes", "Skid"], c10_5: ["키 전환·Insecure", "Key switch and Insecure state", "Key"], c10_6: ["CIKMA·CXL_IDE_KM", "CIKMA and CXL_IDE_KM", "CIKMA"],
    c10_7: ["CXL TSP 목적·범위", "CXL TSP purpose and scope", "TSP"], c10_8: ["TE State·메모리 암호화", "TE State and memory encryption", "TE"], c10_9: ["MLD vs SR-IOV", "MLD vs SR-IOV", "MLD"]
  };

  /* 배지/몬스터 팔레트 */
  const SHAPES = ["circle", "hex", "square", "drop", "octagon", "diamond", "shield", "pentagon", "tri", "moon", "cloud", "medal"];
  const SYMS = ["pulse", "grid", "fork", "cycle", "bars", "link", "half", "fts", "loop", "bolt", "radar", "zzz", "link_f", "bars_f", "plug"];
  const PLANS = ["blob", "bug", "bird", "serpent", "golem", "crystal", "cat", "turtle", "bat", "shroom", "ghost", "jelly", "fish", "dragon"];
  const CREATURE = { blob: ["슬라임", "Slime"], bug: ["딱정이", "Beetle"], bird: ["버드", "Bird"], serpent: ["스네이크", "Snake"], golem: ["골렘", "Golem"], crystal: ["크리스탈", "Crystal"], cat: ["캣", "Cat"],
    turtle: ["거북", "Turtle"], bat: ["박쥐", "Bat"], shroom: ["버섯", "Shroom"], ghost: ["고스트", "Ghost"], jelly: ["해파리", "Jelly"], fish: ["피시", "Fish"], dragon: ["드레이크", "Drake"] };
  const PATS = ["none", "spots", "stripes", "diamonds", "hexes", "panel", "facet"];
  const ACCS = ["none", "antenna", "crest", "goggles", "horn", "spark", "bell", "fang", "dish", "fin", "jet", "beacon", "bolt", "zzz"];

  /* 마을: fams = [id, ko, en, tag, plan, color, color2, [rules], intro ko, intro en] */
  const TOWNS = [
    { n: 2, id: "phy", ko: "Flit 항구", en: "Flit Harbor", topic: ["PHY · Flit", "PHY · Flit"], gymLv: 16, tint: "rgba(80,160,255,0.10)", field: ["meadow", "lake", "desert"],
      leader: ["Flit 관장 파도", "Flit Leader Wave"], color: "#3aa0ff", color2: "#14508a",
      fams: [
        ["t2pam", "PAM4 신호", "PAM4 Signals", "PCIe", "jelly", "#40b8ff", "#145a8a", ["p2_1", "p2_2", "p2_6", "p2_7"], "64 GT/s부터 PAM4·1b/1b. 인코딩·프리코딩·스크램블링.", "PAM4 and 1b/1b from 64 GT/s; encodings, precoding, scrambling."],
        ["t2flit", "Flit·FEC", "Flit & FEC", "PCIe", "crystal", "#60e0e0", "#107070", ["p2_3", "p2_4", "p2_5", "p2_8"], "256B Flit 구조, FEC·CRC, Ordered Set·SKP.", "256B Flit layout, FEC/CRC, Ordered Sets and SKP."],
        ["t2flex", "Flex Bus PHY", "Flex Bus PHY", "CXL", "fish", "#c070f0", "#5a2a8a", ["c2_1", "c2_2", "c2_3", "c2_9"], "CXL은 PCIe 전기 규격 위에 logical PHY만 다르게. 68B/256B 선택.", "CXL reuses PCIe electricals; only the logical PHY differs. 68B vs 256B."],
        ["t2arb", "ARB/MUX", "ARB/MUX", "CXL", "bat", "#a080ff", "#40308a", ["c2_4", "c2_5", "c2_6", "c2_7", "c2_8"], "68B·256B flit 헤더, ARB/MUX와 vLSM, ALMP.", "68B/256B flit headers, ARB/MUX and vLSMs, ALMPs."]
      ],
      lines: { guide: ["여기는 Flit 항구! 64 GT/s부터는 PAM4와 256B Flit이 기본이야.", "PCIe와 CXL 모두 같은 PCIe 7.0 PHY 전기 규격을 쓰지만, CXL은 ARB/MUX로 .io/.cache/.mem을 섞어 보내지."],
        guideEn: ["Welcome to Flit Harbor! From 64 GT/s, PAM4 and 256B Flits are the default.", "PCIe and CXL share the PCIe 7.0 electrical PHY, but CXL mixes .io/.cache/.mem through the ARB/MUX."],
        sage: ["공통점: 둘 다 256B Flit + FEC + CRC.", "차이점: CXL은 68B Flit 모드가 있고, Protocol ID로 어떤 프로토콜의 flit인지 구분해."],
        sageEn: ["Same: both use 256B Flits with FEC and CRC.", "Different: CXL also has a 68B Flit mode and tags each flit with a Protocol ID."] } },
    { n: 3, id: "dll", ko: "Replay 마을", en: "Replay Village", topic: ["Data Link Layer", "Data Link Layer"], gymLv: 22, tint: "rgba(255,200,80,0.08)", field: ["forest", "meadow", "cave"],
      leader: ["Replay 관장 에코", "Replay Leader Echo"], color: "#f0a030", color2: "#8a5010",
      fams: [
        ["t3ack", "Ack/Nak", "Ack/Nak", "PCIe", "bird", "#f0c040", "#9a6a10", ["p3_1", "p3_2", "p3_3", "p3_4"], "DL_Up/Down, DLLP, Ack/Nak과 Replay.", "DL_Up/Down, DLLPs, Ack/Nak and replay."],
        ["t3fc", "Seq·LCRC·FC", "Seq, LCRC & FC", "PCIe", "golem", "#e08040", "#7a3a10", ["p3_5", "p3_6", "p3_7", "p3_8"], "Sequence Number, LCRC, Flow Control credit.", "Sequence numbers, LCRC, flow-control credits."],
        ["t3llr", "LLR", "Link-Level Retry", "CXL", "turtle", "#70d090", "#1e6a3e", ["c3_1", "c3_2", "c3_3", "c3_4", "c3_5"], "CXL.io는 PCIe DLL 재사용, 68B cachemem은 LLR로 재전송.", "CXL.io reuses the PCIe DLL; 68B cachemem retries via LLR."],
        ["t3crc", "CRC·PHY Retry", "CRC & PHY Retry", "CXL", "ghost", "#b8b0ff", "#4a40a0", ["c3_6", "c3_7", "c3_8", "c3_9"], "CRC-16, 256B PHY retry, Viral·Poison CRC, LLCRD.", "CRC-16, 256B PHY retry, viral/poison CRC, LLCRD."]
      ],
      lines: { guide: ["Replay 마을에 온 걸 환영해! 데이터 링크 계층은 한 구간의 신뢰성을 책임져.", "Ack/Nak, Sequence Number, LCRC, Flow Control credit을 익혀라."],
        guideEn: ["Welcome to Replay Village! The Data Link Layer keeps one hop reliable.", "Master Ack/Nak, sequence numbers, LCRC and flow-control credits."],
        sage: ["공통점: CXL.io는 PCIe DLL을 그대로 쓴다.", "차이점: CXL.cache/.mem은 68B에서 LLR, 256B에서는 PHY 계층 retry로 재전송한다."],
        sageEn: ["Same: CXL.io reuses the PCIe DLL as-is.", "Different: CXL.cache/.mem retry via LLR in 68B, and via PHY-level retry in 256B."] } },
    { n: 4, id: "tl", ko: "Transaction 시티", en: "Transaction City", topic: ["Transaction Layer", "Transaction Layer"], gymLv: 28, tint: "rgba(255,120,120,0.07)", field: ["meadow", "desert", "forest"],
      leader: ["TLP 관장 루트", "TLP Leader Route"], color: "#ff6050", color2: "#8a2010",
      fams: [
        ["t4hdr", "TLP 헤더", "TLP Headers", "PCIe", "serpent", "#ff8060", "#8a2a10", ["p4_1", "p4_2", "p4_3", "p4_4"], "Posted/NP, Non-Flit·Flit 헤더, 라우팅.", "Posted/NP, Non-Flit and Flit headers, routing."],
        ["t4ord", "Ordering·Cpl", "Ordering & Cpl", "PCIe", "cat", "#ffb060", "#8a5010", ["p4_5", "p4_6", "p4_7", "p4_8"], "Byte Enable, Ordering, Completion, TL FC.", "Byte enables, ordering, completions, TL flow control."],
        ["t4io", "CXL.io TL", "CXL.io TL", "CXL", "fish", "#e070c0", "#7a2060", ["c4_1", "c4_2", "c4_3", "c4_4", "c4_5"], "CXL.io는 PCIe TL 기반 + INTx·PM/Error VDM·ATS 표시.", "CXL.io builds on the PCIe TL plus INTx, PM/Error VDMs, ATS hints."],
        ["t4pbr", "PBR·Flit 배치", "PBR & Flit slots", "CXL", "dragon", "#c060ff", "#5a208a", ["c4_6", "c4_7", "c4_8", "c4_9"], "PTH, VendPrefixL0, flit 안 TLP 배치, Bundled Port.", "PTH, VendPrefixL0, TLP placement in flits, Bundled Ports."]
      ],
      lines: { guide: ["Transaction 시티! TLP는 Memory/IO/Config/Message 네 가지 공간을 오간다.", "Posted는 Completion이 없고, Non-Posted는 Completion을 기다린다."],
        guideEn: ["Transaction City! TLPs travel across Memory, I/O, Config and Message spaces.", "Posted requests get no Completion; Non-Posted ones wait for one."],
        sage: ["공통점: CXL.io TLP는 PCIe TLP 형식을 그대로 쓴다.", "차이점: CXL Fabric에서는 PBR 헤더(PTH)나 VendPrefixL0로 LD-ID·PBR-ID를 실어 나른다."],
        sageEn: ["Same: CXL.io TLPs use the PCIe TLP format.", "Different: in CXL fabrics, a PTH or VendPrefixL0 carries LD-ID/PBR-ID."] } },
    { n: 5, id: "dev", ko: "Coherence 만", en: "Coherence Bay", topic: ["CXL 디바이스 · .cache/.mem", "CXL devices · .cache/.mem"], gymLv: 34, tint: "rgba(190,110,255,0.09)", field: ["lake", "forest", "cave"],
      leader: ["Coherence 관장 미아", "Coherence Leader Mia"], color: "#b060ff", color2: "#50208a",
      fams: [
        ["t5apn", "APN·Modified TS", "APN & Modified TS", "PCIe", "bird", "#80c0ff", "#204a8a", ["p5_1", "p5_2", "p5_3"], "PCIe 쪽에서 본 Alternate Protocol 협상.", "Alternate Protocol Negotiation as seen from PCIe."],
        ["t5cap", "DVSEC·Flit 기반", "DVSEC & Flit basis", "PCIe", "shroom", "#90e070", "#3a7020", ["p5_4", "p5_5", "p5_6", "p5_7"], "DVSEC, Alt Protocol Capability, Flit 공통 기반.", "DVSEC, Alternate Protocol capability, shared Flit basis."],
        ["t5type", "Type·HDM·Bias", "Types, HDM & Bias", "CXL", "golem", "#c080ff", "#502a8a", ["c5_1", "c5_2", "c5_3"], "Type 1/2/3, HDM-H/D/DB, Host/Device Bias.", "Type 1/2/3, HDM-H/D/DB, host/device bias."],
        ["t5cache", "CXL.cache", "CXL.cache", "CXL", "cat", "#ff90c0", "#8a2a5a", ["c5_4", "c5_5", "c5_6"], "D2H/H2D 채널, RdShared·Snoop.", "D2H/H2D channels, RdShared, snoops."],
        ["t5mem", "CXL.mem", "CXL.mem", "CXL", "jelly", "#60e0b0", "#106a50", ["c5_7", "c5_8"], "M2S/S2M, BI 채널, MemRd·Metadata.", "M2S/S2M, BI channels, MemRd and metadata."]
      ],
      lines: { guide: ["Coherence 만에 왔구나. 여기서부터 CXL만의 세계, .cache와 .mem이다!", "Type 1은 .io+.cache, Type 2는 셋 다, Type 3는 .io+.mem."],
        guideEn: ["Welcome to Coherence Bay — CXL's own world of .cache and .mem!", "Type 1: .io+.cache. Type 2: all three. Type 3: .io+.mem."],
        sage: ["공통점: 모든 CXL 디바이스는 CXL.io(=PCIe 기반)를 반드시 가진다.", "차이점: PCIe에는 하드웨어 캐시 coherency 프로토콜이 없다. CXL.cache/.mem이 그 차이다."],
        sageEn: ["Same: every CXL device must implement CXL.io (PCIe-based).", "Different: PCIe has no hardware cache-coherency protocol; CXL.cache/.mem add it."] } },
    { n: 6, id: "cfg", ko: "Config 성", en: "Config Castle", topic: ["Config Space · DVSEC/HDM", "Config space · DVSEC/HDM"], gymLv: 40, tint: "rgba(120,200,120,0.08)", field: ["forest", "tower", "meadow"],
      leader: ["Config 관장 바르", "Config Leader Bar"], color: "#50c070", color2: "#1a6a30",
      fams: [
        ["t6ecam", "ECAM·BAR", "ECAM & BARs", "PCIe", "bug", "#70d060", "#2a6a20", ["p6_1", "p6_2", "p6_3", "p6_4"], "CAM/ECAM, BAR sizing, Type 0/1 헤더.", "CAM/ECAM, BAR sizing, Type 0/1 headers."],
        ["t6cap", "Capability", "Capabilities", "PCIe", "crystal", "#a0e0a0", "#2a6a3a", ["p6_5", "p6_6", "p6_7", "p6_8"], "Capability 리스트, Extended Cap, DVSEC, RW1C.", "Capability lists, extended caps, DVSEC, RW1C."],
        ["t6dvsec", "CXL DVSEC", "CXL DVSEC", "CXL", "golem", "#60c0a0", "#1a6a50", ["c6_1", "c6_2", "c6_3", "c6_4"], "Vendor ID 1E98h DVSEC들과 Capability 비트.", "Vendor-ID-1E98h DVSECs and capability bits."],
        ["t6hdm", "HDM Decoder", "HDM Decoders", "CXL", "turtle", "#40a0c0", "#14506a", ["c6_5", "c6_6", "c6_7", "c6_8"], "Register Locator, HDM Decoder commit, RCD.", "Register Locator, HDM decoder commit, RCD mode."]
      ],
      lines: { guide: ["Config 성! 4 KB Config Space와 Capability 사슬을 따라가 보자.", "BAR는 크기만큼 정렬되고, Extended Capability는 0x100부터 시작한다."],
        guideEn: ["Config Castle! Follow the 4 KB config space and its capability chains.", "BARs are size-aligned; extended capabilities start at 0x100."],
        sage: ["공통점: CXL 디바이스도 PCIe Config Space와 DVSEC 메커니즘을 쓴다.", "차이점: CXL은 DVSEC(Vendor ID 1E98h)로 능력을 알리고, HDM Decoder로 메모리 주소를 디코드한다."],
        sageEn: ["Same: CXL devices use PCIe config space and the DVSEC mechanism.", "Different: CXL advertises abilities via DVSECs (VID 1E98h) and decodes memory with HDM decoders."] } },
    { n: 7, id: "pwr", ko: "저전력 호숫가", en: "Low-Power Lakeside", topic: ["Power · ALMP/GPF", "Power · ALMP/GPF"], gymLv: 46, tint: "rgba(60,80,160,0.12)", field: ["lake", "meadow", "cave"],
      leader: ["Power 관장 루나", "Power Leader Luna"], color: "#f4d35e", color2: "#6a5a1a",
      fams: [
        ["t7d", "D/L-state·ASPM", "D/L-states & ASPM", "PCIe", "shroom", "#f4d35e", "#8a6a1a", ["p7_1", "p7_2", "p7_3", "p7_4"], "D0~D3cold, L-state, ASPM L0s/L1/L0p.", "D0–D3cold, L-states, ASPM L0s/L1/L0p."],
        ["t7l1", "L1 PM·LTR", "L1 PM & LTR", "PCIe", "ghost", "#ffa0c0", "#8a3a5a", ["p7_5", "p7_6", "p7_7", "p7_8"], "L1.1/L1.2, PME, LTR, CLKREQ#.", "L1.1/L1.2, PME, LTR, CLKREQ#."],
        ["t7pm", "CXL PM", "CXL PM", "CXL", "bat", "#b0a0ff", "#40308a", ["c7_1", "c7_2", "c7_3", "c7_4"], "PM VDM·PMREQ, PM 진입 phase.", "PM VDMs, PMREQ, PM entry phases."],
        ["t7gpf", "ALMP·GPF", "ALMP & GPF", "CXL", "dragon", "#ffd080", "#8a6010", ["c7_5", "c7_6", "c7_7", "c7_8"], "ALMP, 256B L0p 협상, Global Persistent Flush.", "ALMPs, 256B L0p negotiation, Global Persistent Flush."]
      ],
      lines: { guide: ["쉿… 저전력 호숫가에선 모두 L1.2로 꿀잠 중이야.", "D-state는 Function, L-state는 Link의 전력 상태라는 걸 잊지 마."],
        guideEn: ["Shh… everyone at the Lakeside is napping in L1.2.", "D-states are per Function; L-states are per Link."],
        sage: ["공통점: CXL.io는 PCIe PM(ASPM, D-state)을 따른다.", "차이점: CXL.cache/.mem 전력 관리는 ARB/MUX가 ALMP로 협상하고, 정전 대비 GPF가 있다."],
        sageEn: ["Same: CXL.io follows PCIe PM (ASPM, D-states).", "Different: CXL.cache/.mem PM is negotiated by the ARB/MUX with ALMPs, and GPF guards against power loss."] } },
    { n: 8, id: "ras", ko: "RAS 요새", en: "RAS Fortress", topic: ["RAS · Viral/Isolation", "RAS · Viral/Isolation"], gymLv: 52, tint: "rgba(200,60,60,0.10)", field: ["desert", "cave", "tower"],
      leader: ["RAS 관장 가드", "RAS Leader Guard"], color: "#e04040", color2: "#701010",
      fams: [
        ["t8aer", "AER", "AER", "PCIe", "golem", "#e06050", "#701a10", ["p8_1", "p8_2", "p8_3", "p8_4"], "오류 분류, ERR_* 메시지, Advisory, AER.", "Error classes, ERR_* messages, advisory errors, AER."],
        ["t8dpc", "ECRC·DPC", "ECRC & DPC", "PCIe", "bug", "#ff9060", "#8a3a10", ["p8_5", "p8_6", "p8_7", "p8_8"], "ECRC, DPC, Surprise Down, Flit Error Log.", "ECRC, DPC, surprise down, Flit error logging."],
        ["t8poi", "Poison·Error", "Poison & Errors", "CXL", "jelly", "#c06080", "#6a2040", ["c8_1", "c8_2", "c8_3", "c8_4"], "CXL RAS 표, 오류 보고, Poison, Error record.", "CXL RAS table, error reporting, poison, error records."],
        ["t8vir", "Viral·Isolation", "Viral & Isolation", "CXL", "ghost", "#a040c0", "#4a1060", ["c8_5", "c8_6", "c8_7", "c8_8"], "Isolation, Viral 발생·전파·해제.", "Isolation; raising, spreading and clearing Viral."]
      ],
      lines: { guide: ["RAS 요새: Reliability, Availability, Serviceability!", "Correctable은 하드웨어가 고치고, Uncorrectable은 Fatal과 Non-Fatal로 나뉜다."],
        guideEn: ["RAS Fortress: Reliability, Availability, Serviceability!", "Correctable errors are fixed by hardware; uncorrectable ones are Fatal or Non-Fatal."],
        sage: ["공통점: CXL.io 오류는 PCIe AER로 보고된다.", "차이점: CXL은 데이터 오염을 막는 Viral과, 링크를 끊어 격리하는 CXL.cachemem Isolation이 있다."],
        sageEn: ["Same: CXL.io errors are reported through PCIe AER.", "Different: CXL adds Viral to contain corruption and CXL.cachemem Isolation to cut off a bad link."] } },
    { n: 9, id: "fab", ko: "Fabric 메트로", en: "Fabric Metro", topic: ["Switch · Pooling · Fabric", "Switch · Pooling · Fabric"], gymLv: 58, tint: "rgba(80,220,200,0.08)", field: ["tower", "meadow", "desert"],
      leader: ["Fabric 관장 노드", "Fabric Leader Node"], color: "#30c0b0", color2: "#106050",
      fams: [
        ["t9sw", "Switch·ACS", "Switches & ACS", "PCIe", "serpent", "#40d0c0", "#106a60", ["p9_1", "p9_2", "p9_3", "p9_4"], "vPPB, 라우팅 3종, Config 규칙, ACS.", "vPPBs, three routing methods, config rules, ACS."],
        ["t9p2p", "P2P·Hot-Plug", "P2P & Hot-Plug", "PCIe", "bird", "#80e0ff", "#205a8a", ["p9_5", "p9_6", "p9_7", "p9_8"], "P2P Redirect, Multicast, Hot-Plug, Implicit 라우팅.", "P2P redirect, multicast, hot-plug, implicit routing."],
        ["t9pool", "VCS·Pooling", "VCS & Pooling", "CXL", "fish", "#60b0ff", "#1a4a8a", ["c9_1", "c9_2", "c9_3", "c9_4", "c9_5"], "VCS, vPPB bind, MLD, FAM, MHD.", "VCS, vPPB binding, MLDs, FAM, multi-headed devices."],
        ["t9fm", "FM·PBR·G-FAM", "FM, PBR & G-FAM", "CXL", "dragon", "#40e090", "#106a40", ["c9_6", "c9_7", "c9_8", "c9_9"], "Fabric Manager, PBR, GFD.", "Fabric Manager, PBR fabrics, GFDs."]
      ],
      lines: { guide: ["Fabric 메트로! 스위치는 가상 PCI-PCI Bridge들의 묶음이야.", "PCIe 스위치는 트리지만, CXL Fabric은 PBR로 트리를 넘어선다."],
        guideEn: ["Fabric Metro! A switch is a bundle of virtual PCI-to-PCI bridges.", "PCIe switches form trees; CXL fabrics go beyond trees with PBR."],
        sage: ["공통점: CXL 스위치도 PCIe 스위치처럼 vPPB로 계층을 보인다.", "차이점: CXL은 VCS·MLD로 한 디바이스 메모리를 여러 호스트가 나눠 쓰는 Pooling을 지원한다."],
        sageEn: ["Same: CXL switches expose a hierarchy of vPPBs just like PCIe.", "Different: CXL VCSs and MLDs let several hosts pool one device's memory."] } },
    { n: 10, id: "sec", ko: "Trusted 성채", en: "Trusted Citadel", topic: ["Security · IDE/TSP · SR-IOV vs MLD", "Security · IDE/TSP · SR-IOV vs MLD"], gymLv: 64, tint: "rgba(30,30,60,0.16)", field: ["tower", "cave", "forest"],
      leader: ["보안 관장 키퍼", "Security Leader Keeper"], color: "#8090ff", color2: "#202a8a",
      fams: [
        ["t10ide", "IDE·TDISP", "IDE & TDISP", "PCIe", "crystal", "#9090ff", "#2a2a8a", ["p10_1", "p10_2", "p10_3", "p10_4"], "Link/Selective IDE, IDE_KM, TDISP.", "Link/Selective IDE, IDE_KM, TDISP."],
        ["t10vf", "SR-IOV·ATS", "SR-IOV & ATS", "PCIe", "cat", "#ffc060", "#8a5a10", ["p10_5", "p10_6", "p10_7", "p10_8"], "PF/VF, VF RID·BAR, ATS, PRI.", "PF/VF, VF RID and BARs, ATS, PRI."],
        ["t10cide", "CXL IDE", "CXL IDE", "CXL", "golem", "#7080c0", "#202a5a", ["c10_1", "c10_2", "c10_3", "c10_4", "c10_5", "c10_6"], "CXL.io/cachemem IDE, Skid·Containment, CIKMA.", "CXL.io/cachemem IDE, skid/containment, CIKMA."],
        ["t10tsp", "TSP·MLD", "TSP & MLD", "CXL", "dragon", "#c060a0", "#5a1a4a", ["c10_7", "c10_8", "c10_9"], "TSP, TE State, MLD vs SR-IOV.", "TSP, TE State, MLD vs SR-IOV."]
      ],
      lines: { guide: ["Trusted 성채. 마지막 시험은 보안과 가상화다.", "IDE는 링크 위 데이터를 암호화·무결성 보호하고, TDISP는 TEE에 디바이스를 맡긴다."],
        guideEn: ["The Trusted Citadel. The last trial is security and virtualization.", "IDE encrypts and integrity-protects data on the link; TDISP hands devices to TEEs."],
        sage: ["공통점: CXL.io IDE는 PCIe IDE를 그대로 쓴다.", "차이점: SR-IOV는 VF를 호스트 SW가 PF로 구성하지만, CXL MLD는 LD-ID로 나뉘고 FM이 LD를 할당한다."],
        sageEn: ["Same: CXL.io IDE reuses PCIe IDE.", "Different: SR-IOV VFs are configured by host software through the PF, while CXL MLDs split by LD-ID and the FM assigns LDs."] } }
  ];

  /* ---------- 등록: STATES / RULES / LQ / LMON 확장 ---------- */
  const TAGN = { P: "PCIe", X: "CXL", C: "공통" };
  const h = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
  LT.STATES.forEach((s) => { s.town = 1; });
  LT.LMON.forEach((m) => { m.town = 1; });
  LT.LQ.forEach((q) => { q.town = 1; q.tag = q.tag || (q.fam === "cxl" ? "CXL/공통" : "PCIe"); });
  let si = 0;
  TOWNS.forEach((T) => {
    T.famIds = T.fams.map((f) => f[0]);
    T.fams.forEach(([id, ko, en, tag, plan, color, color2, rules, iko, ien], fi) => {
      const st = { id, town: T.n, name: ko, en, tag, core: true, color, color2, shape: SHAPES[(si * 5 + 1) % SHAPES.length], sym: SYMS[(si * 7 + 3) % SYMS.length], intro: iko, introEn: ien, rules: {}, rulesEn: {} };
      si++;
      rules.forEach((r) => { if (!R[r]) throw new Error("rule title missing " + r); st.rules[r] = R[r][0]; st.rulesEn[r] = R[r][1]; });
      LT.STATES.push(st);
      rules.forEach((r) => { LT.RULES[r] = { id: r, state: id, text: R[r][0], en: R[r][1] }; });
      // 몬스터: 규칙마다 1종 — 체형은 가족 공통, 색·무늬·장식은 규칙마다 다르게
      rules.forEach((r, ri) => {
        const k = h(r), hueK = [0, 0.18, -0.16, 0.3, -0.28, 0.1][ri % 6];
        const c1 = hueK >= 0 ? shadeHex(color, hueK) : shadeHex(color, hueK), c2 = shadeHex(color2, ri % 2 ? -0.15 : 0.05);
        const cr = CREATURE[plan];
        const mon = { id: "m_" + r, town: T.n, fam: id, ltssm: true, name: `${R[r][2]} ${cr[0]}`, en: `${R[r][2]} ${cr[1]}`, sub: R[r][0], subEn: R[r][1], plan,
          c1: rotHue(c1, (ri * 23 + (k % 17)) - 30), c2, pat: PATS[(k >> 3) % PATS.length], acc: ACCS[(ri * 3 + (k % 5)) % ACCS.length], rules: [r] };
        LT.LMON.push(mon);
      });
    });
    // 관장 3마리 (보스) + 마을 배지 정의
    const bplan = ["golem", "crystal", "dragon"];
    T.boss = [0, 1, 2].map((i) => {
      const f = T.fams[i === 2 ? T.fams.length - 1 : i];
      const m = { id: `b${T.n}_${i}`, town: T.n, fam: i === 2 ? null : f[0], ltssm: true, boss: true, name: i === 2 ? `${T.ko} 수호룡` : `${f[1]} 킹`, en: i === 2 ? `${T.en} Guardian` : `${f[2]} King`,
        sub: i === 2 ? "관장 에이스" : `관장 ${i + 1}번째`, subEn: i === 2 ? "Leader's ace" : `Leader #${i + 1}`, plan: bplan[i], c1: i === 2 ? T.color : f[5], c2: i === 2 ? T.color2 : f[6], pat: i === 1 ? "facet" : "stripes", acc: "crown" };
      LT.LMON.push(m); return m.id;
    });
    T.badge = { id: "g" + T.n, isMaster: true, name: T.ko + " 배지", en: T.en + " Badge", color: T.color, color2: T.color2,
      shape: ["medal", "shield", "hex", "octagon", "diamond", "pentagon", "drop", "medal", "shield"][T.n - 2], sym: ["crown", "link_f", "cycle", "fork", "grid", "moon", "plug", "loop", "radar"][T.n - 2] };
  });
  // 챔피언(최종 보스)
  const CHAMP = [
    { id: "champ_0", town: 11, fam: null, ltssm: true, boss: true, name: "PCIe 엠퍼러", en: "PCIe Emperor", sub: "최종 보스 1", subEn: "Final boss 1", plan: "golem", c1: "#4f78ff", c2: "#14206a", pat: "panel", acc: "crown" },
    { id: "champ_1", town: 11, fam: null, ltssm: true, boss: true, name: "CXL 엠프리스", en: "CXL Empress", sub: "최종 보스 2", subEn: "Final boss 2", plan: "crystal", c1: "#c070f0", c2: "#4a1a7a", pat: "facet", acc: "crown" },
    { id: "champ_2", town: 11, fam: null, ltssm: true, boss: true, name: "Spec 드래곤", en: "Spec Dragon", sub: "최종 보스 에이스", subEn: "Final ace", plan: "dragon", c1: "#ffd700", c2: "#8a5000", pat: "stripes", acc: "crown" }
  ];
  CHAMP.forEach((m) => LT.LMON.push(m));
  LT.LMON.forEach((m) => (SPEC.MONSTERS[m.id] = Object.assign({ hp: 18, atk: 6, ch: 1 }, SPEC.MONSTERS[m.id] || {}, m)));

  // 문제 등록
  Object.entries(TQ).forEach(([t, arr]) => arr.forEach(([id, rule, d, tg, qko, qen, cko, cen, a, eko, een, ref]) => {
    const rr = LT.RULES[rule]; if (!rr) throw new Error("unknown rule " + rule + " in " + id);
    const q = { id, town: +t, fam: rr.state, rule, d, tag: TAGN[tg], q: qko, c: cko, a, e: eko + (ref ? ` (${ref})` : ""), en: { q: qen, c: cen, e: een + (ref ? ` (${ref})` : "") }, ref };
    LT.LQ.push(q); (LT.LQ_BY_FAM[q.fam] = LT.LQ_BY_FAM[q.fam] || []).push(q);
  }));
  Object.keys(LT.RULES).forEach((r) => { if (!LT.LQ.some((q) => q.rule === r)) throw new Error("rule without question " + r); });

  LT.CHAMP_BADGE = { id: "champ", isMaster: true, name: "Spec 챔피언", en: "Spec Champion", color: "#ffd700", color2: "#8a4a00", shape: "star", sym: "crown" };
  LT.TOWNS = TOWNS; LT.CHAMP = CHAMP.map((m) => m.id); LT.TOWN_OF_STATE = {};
  LT.STATES.forEach((s) => (LT.TOWN_OF_STATE[s.id] = s.town));
  LT.GYM_BADGES = ["l0"].concat(TOWNS.map((T) => "g" + T.n), ["champ"]);
  LT.townDef = (n) => TOWNS.find((T) => T.n === n);
  LT.statesOfTown = (n) => LT.STATES.filter((s) => s.town === n);

  /* 색 유틸 */
  function shadeHex(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return "#" + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join(""); }
  function rotHue(hex, deg) {
    const n = parseInt(hex.slice(1), 16); let r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let hh = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; }
    hh = (hh + deg + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((hh / 60) % 2) - 1)), m = l - c / 2;
    const [r1, g1, b1] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
    return "#" + [r1, g1, b1].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
  }
  if (isNode) module.exports = SPEC;
})();
/* 기술: 개념 기반(구 2~3장) 기술을 새 마을 규칙 배지 조건으로 재배치 + 후반 기술 추가 */
(function () {
  const SPEC = typeof window === "undefined" ? require("./ltssm.js") : window.SPEC;
  const REQ = { acknak: [18, "t3ack", 2], updatefc: [20, "t3fc", 2], lcrc: [22, "t3fc", 3], posted: [24, "t4hdr", 2], fecfix: [14, "t2flit", 2], snoop: [30, "t5cache", 2], bisnp: [34, "t5mem", 2] };
  SPEC.MOVES.forEach((m) => { const r = REQ[m.id]; if (r) { m.lv = r[0]; m.req = { s: r[1], n: r[2] }; delete m.concept; } });
  if (!SPEC.MOVES.find((m) => m.id === "gpf")) SPEC.MOVES.push(
    { id: "gpf", name: "GPF 플러시", lv: 40, req: { s: "t7gpf", n: 2 }, power: 10, effect: "heal", heal: 0.5, desc: "정전 전에 캐시·버퍼를 영속 메모리로 밀어낸다. [정답 시 공격 + HP 50% 회복]", descEn: "Flushes caches to persistence before power loss. [hit + heal 50%]" },
    { id: "isolate", name: "Isolation 실드", lv: 46, req: { s: "t8vir", n: 2 }, power: 15, effect: "fec", desc: "문제 링크를 격리해 피해 확산을 막는다. [틀려도 받는 피해 절반]", descEn: "Isolates the faulty link. [half damage on a wrong answer]" },
    { id: "pbr", name: "PBR 라우팅", lv: 52, req: { s: "t9fm", n: 2 }, power: 10, effect: "lanes", desc: "트리를 넘어 PBR-ID로 직행. [위력 = 10 + Lane 보너스]", descEn: "Routes by PBR-ID beyond the tree. [power = 10 + lane bonus]" },
    { id: "ide", name: "IDE 암호화", lv: 58, req: { s: "t10cide", n: 2 }, power: 18, effect: "elim2", desc: "AES-GCM으로 링크를 보호한다. [오답 2개 제거 + 공격]", descEn: "Protects the link with AES-GCM. [removes 2 wrong choices + hit]" }
  );
  // 업적 추가 (검사 함수 test 포함)
  const LT = SPEC.LTSSM, gb = (P, n) => (P.badges || []).includes("g" + n);
  [["town2", "Flit 항구 정복", "2번 마을 관장 승리", "Flit 선장", (P) => gb(P, 2)], ["town5", "Coherence 정복", "5번 마을 관장 승리", "Coherent 마스터", (P) => gb(P, 5)],
   ["town8", "RAS 정복", "8번 마을 관장 승리", "불굴의 링크", (P) => gb(P, 8)], ["town10", "Trusted 정복", "10번 마을 관장 승리", "보안 수호자", (P) => gb(P, 10)],
   ["champion", "Spec 챔피언", "최종 보스 격파", "Spec 챔피언", (P) => (P.badges || []).includes("champ")],
   ["sb20", "배지 20개", "규칙 배지 20개 수집", "배지 수집왕", (P) => (P.sbadges || []).length >= 20],
   ["sb_all", "전 배지", "모든 규칙 배지 수집", "Spec 그랜드마스터", (P) => LT.STATES.every((s) => (P.sbadges || []).includes(s.id))],
   ["c1000", "정답 1000", "누적 정답 1000개", "Spec 현자", (P) => Object.values(P.seenQ || {}).reduce((a, v) => a + v.ok, 0) >= 1000]
  ].forEach(([id, name, desc, title, test]) => { if (!LT.ACH.find((a) => a.id === id)) LT.ACH.push({ id, name, desc, title, test }); });
})();
