/* LTSSM 문제 은행 3 — 저전력 / 특수 state (PCIe 7.0) */
var LTSSM_Q3 = [
/* ---------- L0s ---------- */
["l0s","s1",1,"Flit Mode(예: 64/128 GT/s)에서 L0s는?","지원되지 않는다","기본 절전 방식이다","Rx만 지원","Tx만 지원","L0s is not supported in Flit Mode. Flit에서는 L0p와 L1을 쓴다."],
["l0s","s1",2,"L0s의 특징으로 옳은 것은?","Tx와 Rx가 따로 들어가 한 방향만 L0s일 수 있다","항상 양방향 동시","Recovery를 거쳐 진입","LinkUp=0b","L0s는 Tx_L0s / Rx_L0s substate가 분리되어 한쪽 방향만 L0s일 수 있다."],
["l0s","s1",2,"L0에서 EIOS를 받고 Rx가 L0s를 구현했으며 L1/L2 지시가 없으면?","Rx만 Rx_L0s로","Recovery","Detect","L1","상대 Tx가 L0s로 들어갔다는 뜻이므로 내 Rx만 L0s로 간다. Rx가 L0s 미구현이면 Recovery."],
["l0s","s2",2,"Tx_L0s.Entry에서 하는 일은?","EIOS(Q) 송신 후 Electrical Idle, TTX-IDLE-MIN 후 Tx_L0s.Idle","TS1 16개 송신","FTS 송신","SDS 송신","EIOSQ를 보내고 EI로 들어가며 최소 TTX-IDLE-MIN(20 ns) 뒤 Idle."],
["l0s","s2",3,"TTX-IDLE-MIN 값은?","20 ns (min)","8 ns","800 ns","2 µs","Electrical Idle 최소 시간 TTX-IDLE-MIN = 20 ns. TTX-IDLE-SET-TO-IDLE = 8 ns max."],
["l0s","s3",2,"L0s 탈출 시 Tx가 보내는 것은?","합의된 N_FTS개의 FTS (Extended Synch면 4096)","TS1 1024개","EIOS 8개","Beacon","Tx_L0s.FTS에서 N_FTS개 FTS를 보내고 반드시 L0로 돌아간다. Recovery를 거치지 않는다."],
["l0s","s3",3,"128b/130b에서 Tx_L0s.FTS의 마지막에 보내는 것은?","EIEOSQ + SDS","SKP 1개","TS2","EIOS","128b/130b는 FTS 앞에 EIEOSQ, 끝에 EIEOSQ+SDS. 8b/10b는 끝에 SKP 1개."],
["l0s","s3",3,"Tx_L0s.FTS에서 FTS 앞에 SKP를 넣을 수 있나?","안 된다 (Extended Synch 예외)","항상 넣어야 한다","Gen7에서만","1024개마다","FTS 앞에 SKP를 넣으면 안 된다(Extended Synch 예외)."],
["l0s","s4",2,"Rx_L0s.FTS에서 정해진 시간 안에 lock을 못 하면(N_FTS timeout)?","Recovery","Detect","L1","Rx_L0s.Idle","Rx가 N_FTS timeout 안에 SKP(8b/10b)/SDS(128b/130b)를 못 받으면 Recovery로 간다."],
["l0s","s5",2,"Non-Flit TS1 Symbol 3이 담는 값은?","N_FTS (0–255)","Link 번호","Lane 번호","Data Rate","Symbol 3 = N_FTS. Flit Mode에서는 이 자리가 EFM_CNTL1로 쓰인다."],

/* ---------- L1 ---------- */
["l1","a1",1,"LTSSM L1의 substate는?","L1.Entry, L1.Idle","L1.1, L1.2","L1.0, L1.1, L1.2","L1.Active, L1.Exit","LTSSM substate는 L1.Entry/L1.Idle뿐. L1.1/L1.2는 L1.Idle 동안의 L1 PM Substates."],
["l1","a1",2,"L1.Idle에 들어가거나 나올 때 L1 PM Substate는?","L1.0이어야 한다","L1.2","L1.1","상관없음","L1.Idle 진입·탈출 시 L1 PM Substate는 L1.0이어야 한다."],
["l1","a2",2,"L1.Entry에서 L1.Idle로 가는 조건은?","모든 Tx가 Electrical Idle에 들어가 TTX-IDLE-MIN 경과","TS1 8개 수신","12 ms 경과","CLKREQ# assert","L1.Entry: 모든 구성 Tx를 EI로, DC 공통모드 규격 유지, TTX-IDLE-MIN 뒤 L1.Idle."],
["l1","a3",1,"L1에서 L0로 돌아가는 경로는?","L1 → Recovery → L0","L1 → L0 직행 (FTS)","L1 → Detect → L0","L1 → Configuration → L0","L1 탈출은 Recovery를 거친다. FTS로 바로 L0에 가는 것은 L0s."],
["l1","a3",3,"2.5 GT/s가 아닐 때 L1.Idle에서 Recovery로 가기 전 최소 체류 시간은?","40 ns","20 ns","2 ms","100 ms","EI exit나 지시가 있어도 비-2.5 GT/s면 L1.Idle에 최소 40 ns 머문 뒤 Recovery."],
["l1","a4",2,"L1.1/L1.2 진입·탈출에 쓰는 신호는?","CLKREQ# (양방향 open-drain)","WAKE#","PERST#","Beacon","L1 PM Substates는 CLKREQ#로 들어가고 나온다. EI exit 감지가 요구되지 않는다."],
["l1","a4",2,"L1.1과 L1.2의 차이는?","L1.2는 Refclk을 끄고 공통모드도 유지하지 않는다","L1.1이 더 깊다","L1.2는 TLP 전송 가능","차이 없음","L1.1은 공통모드 유지, L1.2는 Refclk off·공통모드 off까지 가능해 더 깊고 탈출이 느리다."],
["l1","a4",3,"ASPM L1.2를 지원하는 Port에 필요한 기능은?","LTR (Latency Tolerance Reporting)","MSI-X","ECRC","ARI","ASPM L1.2 진입은 LTR 임계 비교가 들어가므로 LTR 지원이 필요하다."],
["l1","a5",3,"L1.2의 TPOWER_OFF(CLKREQ# deassert → L1.2.Idle)의 최대값은?","2 µs","4 µs","100 ns","3100 µs","TPOWER_OFF max 2 µs, TL1.2 최소 체류 4 µs, TPOWER_ON은 0–3100 µs 프로그래밍."],
["l1","a5",3,"L1.2에서 CLKREQ#가 inactive로 유지되어야 하는 최소 시간 TL1.2는?","4 µs","2 µs","40 ns","1 ms","TL1.2 = 4 µs(min)."],
["l1","a6",3,"Upstream Port가 CLKREQ#를 deassert해도 되는 시점은?","Link가 L1.0에 들어간 이후","L0에서 언제든","Detect 중","Recovery 중","USP는 Link가 L1.0에 들어가기 전에 CLKREQ#를 deassert하면 안 된다."],

/* ---------- L2 ---------- */
["l2","b1",1,"L2의 substate는?","L2.Idle, L2.TransmitWake","L2.Entry, L2.Exit","L2.1, L2.2","없음","L2.Idle과 L2.TransmitWake(Upstream Port만)."],
["l2","b1",2,"L2의 특징은?","주 전원을 제거할 수 있는 깊은 절전, Beacon/WAKE#로 깨움","TLP 전송 가능","Recovery로 바로 탈출","Flit 전용","L2는 main power 제거가 가능한 깊은 절전. 깨우면 Detect부터 다시 시작한다."],
["l2","b2",2,"Beacon을 보낼 수 있는 방향은?","Upstream Port에서 Root 방향으로만","Downstream Port만","양방향","Retimer만","Beacon은 Upstream(Root 쪽)으로만 보낸다. Downstream Port는 수신 측이다."],
["l2","b3",2,"L2.Idle의 Downstream Port가 Beacon을 받으면?","main power 복구 후 Detect","Recovery","L0","L1","Downstream Port는 Beacon 수신 또는 지시가 있으면 Detect로 간다(그 전에 main power 복구)."],
["l2","b3",3,"Switch의 Downstream Port가 Beacon을 받았고 Upstream Port가 L2.Idle이면?","Upstream Port를 L2.TransmitWake로 보내 위로 전달","무시","Hot Reset","Disabled","Switch는 아래에서 받은 웨이크를 위로 전달하기 위해 Upstream을 L2.TransmitWake로 보낸다."],
["l2","b4",3,"L2.Idle의 Upstream Lane이 Detect로 가는 조건은?","predetermined Lane set에서 EI exit (multi-Lane이면 ≥2 Lane)","Beacon 송신","TS1 수신","12 ms 경과","predetermined set은 Lane 0이 될 수 있는 Lane을 포함하고 multi-Lane이면 2 Lane 이상."],
["l2","b5",2,"L2.Idle에서 Receiver가 ZRX-DC를 만족해야 하는 시한은?","1 ms 이내","12 ms 이내","2 µs 이내","요구 없음","L2.Idle: 모든 Receiver는 1 ms 안에 2.5 GT/s ZRX-DC를 만족, Tx는 TTX-IDLE-MIN 이상 EI."],
["l2","b2",3,"L2.TransmitWake에서 최소한 Beacon을 보내야 하는 Lane은?","Lane 0","모든 Lane","가장 높은 번호 Lane","Lane 15","적어도 Lane 0에 Beacon을 보낸다. Root 방향 Receiver에서 EI exit를 보면 Detect."],

/* ---------- Disabled ---------- */
["dis","x1",1,"Disabled로 들어가는 경로가 아닌 것은?","L0s의 FTS timeout","소프트웨어 Link Disable","Configuration에서 Disable_Link_Request TS1 2연속 수신","Recovery.Idle에서 Disable 지시","Disabled는 소프트웨어 Link Disable이나 상대의 Disable_Link_Request TS로 들어간다. FTS timeout은 Recovery."],
["dis","x2",2,"Disabled 진입 시 각 Lane이 보내는 Disable_Link_Request TS1 개수는?","16–32개, 그 뒤 EIOSQ → Electrical Idle","8개","2개","1024개","TS1 16~32개 후 EIOSQ를 보내고 Electrical Idle. ‘8개면 충분’은 오답."],
["dis","x3",2,"Disabled 진입 시 LinkUp에 대한 권장 사항은?","EIOS 교환을 기다리지 말고 진입 시 Clear 권장","1b로 유지","Detect 후 Clear","정의되지 않음","표준은 Disabled 진입 시 LinkUp을 Clear하는 것을 권장한다."],
["dis","x4",2,"Disabled Upstream Port가 아무 Lane에서 Electrical Idle exit를 보면?","Detect","Recovery","L0","Polling","USP는 EI exit 시 Detect. EIOS를 못 받으면 2 ms 후 Detect."],
["dis","x4",2,"Disabled Downstream Port가 빠져나오는 조건은?","소프트웨어가 Link Disable을 0b로 되돌리는 등 지시 → Detect","2 ms 후 자동으로","Beacon 수신","TS1 8개 수신","DSP는 지시가 있어야 Detect로 나간다."],
["dis","x5",3,"1b/1b TS1의 Training Control에서 Disable Link 요청 인코딩은?","0010b","0001b","0100b","1000b","1b/1b는 4비트 인코딩: 0001b Hot Reset, 0010b Disable Link, 0100b Loopback, 1000b Compliance Receive."],
["dis","x5",2,"8b/10b·128b/130b TS1 Training Control에서 Disable_Link_Request 비트는?","bit 1","bit 0","bit 2","bit 4","bit 0 Hot_Reset, bit 1 Disable_Link, bit 2 Loopback, bit 3 Disable Scrambling, bit 4 Compliance_Receive."],

/* ---------- Loopback ---------- */
["lb","lb1",1,"Loopback의 역할 구분은?","Lead와 Follower","Host와 Device","Master와 Slave","USP만","Loopback은 테스트용이다. Lead가 패턴을 보내고 Follower가 받은 그대로 되돌려 보낸다."],
["lb","lb1",2,"Loopback.Entry에서 LinkUp은?","0b","1b 유지","소프트웨어가 결정","Gen에 따라 다름","Loopback.Entry에서 LinkUp=0b. 수신 TS의 Link/Lane 번호도 무시한다."],
["lb","lb2",2,"Follower가 Loopback으로 들어가는 조건은?","Loopback_Request가 주장된 TS1 2연속 수신","TS1 8연속","EIOS 수신","Beacon 수신","Loopback_Request TS1을 2개 연속 받으면 Follower로 Loopback에 들어간다."],
["lb","lb3",1,"Loopback.Active에서 Follower가 하는 일은?","받은 심볼을 그대로 되돌려 보낸다","TLP를 처리한다","Credit을 반환한다","EQ를 수행한다","Follower는 수신 심볼을 echo해 Lead가 비교·측정할 수 있게 한다."],
["lb","lb4",3,"Loopback.Entry에서 Active 진입에 실패하면?","구현 정의 timeout(100 ms 미만) 후 Loopback.Exit","24 ms 후 Detect","무한 대기","Recovery","표준은 ‘implementation specific timeout of less than 100 ms’만 정한다(하한 없음)."],
["lb","lb5",2,"Loopback.Exit 다음 state는?","Detect (양쪽 모두)","L0","Recovery","Polling","Loopback.Exit 후 양쪽 모두 Detect로 간다."],
["lb","lb5",3,"2.5 GT/s 초과를 지원하는 Lead가 Loopback.Exit에서 보내는 것은?","EIOS 8연속 후 Electrical Idle 2 ms","EIOS 1개","TS1 16개","SKP 8개","2.5-only Port는 EIOS 1개, 그 이상 지원 Port는 현재 속도와 무관하게 EIOS 8연속. 그 후 EI 2 ms."],
["lb","lb6",3,"Loopback.Entry에서 속도를 바꿀 때 Lead의 절차는?","TS1 16개 + EIOSQ 후 EI 1 ms 동안 새 속도로 전환","Recovery.Speed로 이동","Detect로 이동","속도 변경 불가","Loopback 진입 중 속도 변경: 16 TS1 + EIOSQ + 1 ms EI 동안 새 속도(64/128 포함)로 전환."],
["lb","lb6",2,"8b/10b·128b/130b TS1에서 Loopback_Request 비트는?","Training Control bit 2","bit 0","bit 1","bit 7","Training Control bit 2 = Loopback. 1b/1b는 0100b 인코딩."],

/* ---------- Hot Reset ---------- */
["hr","h1",1,"Hot Reset을 요청하는 방법은?","Hot_Reset_Request가 주장된 TS1을 구성된 Link/Lane 번호로 송신","PERST# 신호","Config Write 하나","EIOS 송신","개시 측은 모든 Lane에서 Hot_Reset_Request TS1을 보낸다. PERST#는 Fundamental Reset."],
["hr","h1",2,"보통 Hot Reset을 개시하는 쪽과 Upstream Port가 진입하는 곳은?","Downstream Port가 개시, USP는 Recovery.Idle에서 TS1을 받아 진입","USP가 개시","Retimer가 개시","Detect에서만 진입","DSP(예: 소프트웨어 Secondary Bus Reset)가 개시하고, USP는 Recovery.Idle에서 Hot Reset TS1을 받아 들어간다."],
["hr","h2",1,"Hot Reset TS1을 몇 개 연속 받으면 LinkUp=0b가 되나?","2연속","8연속","16연속","1024개","Hot Reset은 2연속. 8연속은 다른 핸드셰이크 조건이다."],
["hr","h2",2,"Hot Reset 이후 다음 state는(유지 지시가 없을 때)?","Detect","L0","Recovery","Polling","2연속 수신 후 LinkUp=0b, 상위가 유지를 지시하지 않으면 Detect."],
["hr","h3",2,"Hot Reset TS1 2연속을 못 받으면?","2 ms timeout 후 Detect","24 ms 후 Recovery","영원히 대기","즉시 L0","2 ms timeout → Detect."],
["hr","h3",3,"Hot Reset을 유지하는 동안 2연속 Hot Reset TS1을 다시 받으면?","2 ms 타이머를 리셋하고 Hot Reset 유지","즉시 Detect","무시","Recovery","유지 중 2연속 수신은 2 ms 타이머를 리셋한다. 이걸 빠뜨리면 오답."],
["hr","h4",3,"Switch Upstream Port가 Hot Reset을 받으면?","구성된 Downstream Port들을 가능한 한 빨리 Hot Reset으로 보낸다","무시한다","자기만 리셋","Disabled로 간다","Hot Reset은 Switch 아래로 전파된다."],
["hr","h5",2,"Hot Reset으로 LinkUp=0b가 되면 Data Link Layer는?","DL_Inactive(DL_Down)로 간다","DL_Active 유지","DL_Init","영향 없음","LinkUp=0b → DLL은 DL_Inactive/DL_Down. 링크는 Detect부터 다시 올라간다."],
["hr","h5",3,"1b/1b TS1 Training Control의 Hot Reset 인코딩은?","0001b","0010b","0100b","1100b","0001b Hot Reset, 0010b Disable Link, 0100b Loopback_Request, 1000b Compliance_Receive_Request."],
/* ---------- 보강: 규칙당 최소 2문제 ---------- */
["cxl","cxl4",2,"CXL 4.0의 128 GT/s Flit 배치는?","64 GT/s(CXL 3.x)와 같은 256B 배치(FEC·CRC 포함)","새 512B Flit","68B Flit","PCIe와 완전히 다른 전용 프레임","CXL 4.0은 PCIe 7.0 PHY로 속도만 128 GT/s로 올리고 Flit 배치는 64 GT/s와 같다."],
["cxl","cxl2",2,"CXL Flex Bus 링크가 Detect 직후 처음 L0에 오를 때의 속도는?","2.5 GT/s (CXL 트래픽은 8 GT/s 이상 L0에서)","8 GT/s","32 GT/s","128 GT/s","학습은 2.5 GT/s에서 시작하고, 이후 속도를 올려 8 GT/s 이상 L0에서 CXL 트래픽이 흐른다."],

["cfg","cfg7",2,"Configuration에서 상위 계층이 Loopback을 지시하면 TS1에 무엇을 실어 보내나?","Loopback 비트(Training Control)","Hot Reset 비트","Disable 비트","Compliance 비트","Configuration.Linkwidth.Start에서 Loopback 지시 → Loopback 비트가 주장된 TS1을 보내고 Loopback으로 간다. Disable도 같은 방식(Disable 비트)."],
["cxl","cxl3",2,"CXL 4.0의 Modified TS에 새로 생긴 retimer 관련 비트는?","Retimer3/Retimer4 CXL Aware","Retimer Present만","Retimer Count 8비트","없음","4.0은 optional retimer를 최대 4개로 늘리면서 Retimer3/4 CXL Aware 비트를 더했다. 3.2는 1~2개."],
["cxl","cxl5",3,"CXL Sync Header bypass가 해당되는 속도는?","8/16/32 GT/s만 (64/128의 1b/1b엔 없음)","모든 속도","64/128 GT/s만","2.5 GT/s만","Sync Header bypass는 128b/130b의 sync header를 생략하는 최적화라 1b/1b(64/128 GT/s)에는 적용되지 않는다."],
["l0","l01",1,"L0 진입 시 LinkUp 값은?","1b","0b","소프트웨어 결정","Gen에 따라 다름","Configuration.Idle을 통해 L0에 들어오면 LinkUp=1b가 되고 DLL이 초기화를 시작한다."],
["l0","l04",2,"L0에서 L2로 가는 경우의 공통점은(L1과 같이)?","상위 계층 지시 후 EIOS 교환으로 진입","TS1 1024개 교환","Recovery 경유","FTS 교환","L1/L2 모두 상위 지시(PM handshake) 뒤 EIOS를 받고 EIOSQ를 보내 들어간다."],
["l0p","lp2",2,"x16 링크가 L0p로 갈 수 있는 최소 폭은?","x1","x4","x8","폭 변경 불가","L0p는 각 방향 최소 1 Lane 활성, x1부터 구성 폭까지."],
["l0p","lp4",2,"L0p 상태에서 Recovery에 들어가면 폭은?","Configuration에서 정한 폭으로 돌아간다","L0p 폭 유지","x1로 고정","Detect 필요","Recovery에 들어가면 Lane은 구성 폭으로 복귀한다."],
["l0s","s4",2,"Rx_L0s.FTS에서 L0로 가는 신호(128b/130b)는?","SDS Ordered Set 수신","SKP 1개","TS2","EIOS","Rx는 8b/10b면 SKP, 128b/130b면 SDS를 받고 L0로 간다."],
["l0s","s5",3,"Flit Mode TS1 Symbol 3 자리에는?","EFM_CNTL1","N_FTS","Link Number","Rate ID","Flit Mode에서는 L0s가 없으므로 N_FTS 자리가 EFM_CNTL1로 쓰인다."],
["l1","a2",2,"L1.Entry에서 Tx 공통모드 전압은?","DC 공통모드 규격을 유지한다","끈다","Beacon 레벨","정의 없음","L1.Entry는 Tx를 EI로 보내되 DC 공통모드 전압은 규격 범위로 유지(L1.2는 예외)."],
["l1","a6",2,"L1.Idle에 들어가거나 나올 때 CLKREQ#를 쓰는 PM Substate는?","L1.0이어야 하고, L1.1/L1.2 전이는 그 뒤 CLKREQ#로","항상 L1.2","CLKREQ# 미사용","WAKE#로","USP는 Link가 L1.0에 들어가기 전에 CLKREQ#를 deassert하면 안 된다."],
["l2","b4",2,"L2.Idle의 USP가 EI exit를 보고 가는 state는?","Detect","L0","Recovery","Polling","USP는 predetermined Lane set에서 EI exit을 보면 Detect."],
["l2","b5",3,"L2.Idle에서 Tx가 유지해야 하는 것은?","Electrical Idle 최소 TTX-IDLE-MIN","TS1 연속 송신","SKP 주기 송신","공통모드 off 금지","Tx는 TTX-IDLE-MIN 이상 EI. Rx는 1 ms 안에 ZRX-DC."],
["dis","x1",2,"Configuration에서 Disabled로 가는 조건은?","Disable_Link_Request TS1 2연속 수신 또는 상위 지시","24 ms timeout","EIOS 수신","Beacon","TS1 2연속(Disable 비트) 수신 또는 상위 계층 지시."],
["dis","x2",3,"Disabled 진입 후 TS1을 보낸 뒤 순서는?","EIOSQ 송신 → Electrical Idle","곧바로 Detect","TS2 송신","SDS 송신","TS1 16~32 → EIOSQ → EI."],
["dis","x3",3,"Disabled에서 LinkUp을 Clear하면 DLL은?","DL_Down(DL_Inactive)으로","DL_Active 유지","DL_Init","영향 없음","LinkUp=0b는 DLL에 Link 끊김을 알린다."],
["lb","lb2",2,"Loopback Follower가 될 수 있는 경로는?","Configuration/Recovery에서 Loopback 비트 TS1 2연속 수신","L1에서 Beacon","Detect에서 직접","Disabled에서","Loopback 요청 TS1 2연속 수신 시 Follower로 Loopback.Entry."],
["lb","lb3",2,"Loopback.Active에서 Lead가 끝내려면?","EIOS 송신으로 Loopback.Exit","Hot Reset TS1","TS2 송신","24 ms 대기","Lead가 EIOS를 보내고 Exit, Follower도 EIOS를 받으면 Exit."],
["lb","lb4",3,"Loopback.Entry 실패 timeout의 표준 하한은?","정해져 있지 않다 (100 ms 미만만 규정)","24 ms","2 ms","12 ms","‘less than 100 ms’만 규정, 하한 없음."],
["hr","h4",2,"Hot Reset이 Switch 아래 장치까지 리셋되는 이유는?","Switch USP가 Downstream Port로 Hot Reset을 전파","PERST# 연결","Config 재시작","Beacon","Switch USP는 Hot Reset을 받으면 하위 Downstream Port들을 가능한 빨리 Hot Reset으로 보낸다."]
];
if (typeof module !== "undefined") module.exports = LTSSM_Q3;
