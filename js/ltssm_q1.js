/* LTSSM 문제 은행 1/2 — PCIe 7.0 Base (7.0-1.0-PUB) 기준. 정답은 항상 첫 번째 보기(게임에서 섞음).
 * [state, rule, 난이도, 질문, 정답, 오답1, 오답2, 오답3, 해설] */
var LTSSM_Q1 = [
/* ---------- Detect ---------- */
["det","det1",1,"리셋 후 LTSSM이 가장 먼저 들어가는 substate는?","Detect.Quiet","Detect.Active","Polling.Active","Configuration.Linkwidth.Start","전원 인가·Fundamental Reset·훈련 실패 후에는 Detect.Quiet부터 다시 시작한다."],
["det","det1",2,"Detect.Quiet에 들어갈 때 LinkUp 값은?","0b (Link Down)","1b","직전 값 유지","소프트웨어가 결정","Detect.Quiet 진입 시 LinkUp=0b가 되고, Flit Mode·속도 변경·EQ 관련 변수들도 리셋된다."],
["det","det1",3,"Detect.Quiet 진입 시 리셋되는 것이 아닌 것은?","Config Space의 Vendor ID","Equalization 성공/완료 비트","Flit_Mode_Enabled","directed_speed_change","EQ 완료 비트, Flit Mode 변수, directed_speed_change, upconfigure_capable, L0p 관련 비트 등이 모두 리셋된다. 그래서 Detect를 거치면 EQ도 다시 한다."],
["det","det2",1,"Detect.Quiet에서 Detect.Active로 가는 조건은?","12 ms timeout 또는 아무 Lane에서 Electrical Idle Exit 감지","24 ms timeout","TS1 8개 연속 수신","소프트웨어 명령만","12 ms가 지나거나, 그 전에 어느 Lane이든 Electrical Idle Exit가 보이면 Detect.Active로 간다."],
["det","det2",2,"‘Detect.Quiet timeout은 24 ms’라는 말이 틀린 이유는?","Detect.Quiet는 12 ms이고, 24 ms는 Polling.Active·RcvrLock 등의 값이다","Detect.Quiet는 48 ms다","Detect.Quiet에는 timeout이 없다","Detect.Quiet는 2 ms다","Detect.Quiet = 12 ms. 24 ms는 Polling.Active, Configuration.Linkwidth.Start, Recovery.RcvrLock, DSP EQ Phase 1 등에 나온다."],
["det","det3",2,"2.5 GT/s가 아닌 속도로 Detect.Quiet에 들어오면?","최소 1 ms 머무르며 2.5 GT/s로 주파수를 바꾼다","그 속도로 바로 Polling","즉시 Detect.Active","Recovery.Speed로 간다","Detect는 항상 2.5 GT/s Receiver Detection으로 돌아온다. 비-2.5 진입이면 최소 1 ms 체류하며 주파수를 2.5 GT/s로 바꾼다."],
["det","det3",3,"Detect.Quiet 진입 후 Receiver가 2.5 GT/s ZRX-DC를 만족해야 하는 시한은?","1 ms 이내","12 ms 이내","100 µs 이내","48 ms 이내","모든 Receiver는 진입 후 1 ms 안에 2.5 GT/s의 ZRX-DC(DC 종단 임피던스)를 만족해야 한다."],
["det","det4",1,"Detect.Active에서 모든 unconfigured Lane의 Receiver가 감지되면?","Polling","Detect.Quiet","Configuration","L0","전 Lane 감지 성공 → Polling. 하나도 감지되지 않으면 Detect.Quiet로 돌아간다."],
["det","det4",1,"Detect.Active에서 어떤 Lane에서도 Receiver를 감지하지 못하면?","Detect.Quiet","Polling","Disabled","Hot Reset","미감지 → Detect.Quiet로 돌아가 다시 12 ms를 기다린다."],
["det","det5",2,"Detect.Active에서 일부 Lane만 Receiver가 감지되면?","12 ms 기다려 다시 검사, 결과가 같으면 그 Lane들로 Polling","즉시 감지된 Lane으로 Polling","즉시 Detect.Quiet","소프트웨어 인터럽트 발생","부분 감지면 12 ms 후 재검사한다. 같으면 감지된 Lane만으로 Polling, 결과가 다르면 Detect.Quiet."],
["det","det5",3,"Detect.Active에서 Polling으로 가지 못하는 Lane은?","Electrical Idle로 남긴다 (EIOS 송신 불필요)","EIOS를 8개 보낸다","Compliance Pattern을 보낸다","TS1을 계속 보낸다","Polling에 참여하지 못하는 Lane은 Electrical Idle로 남긴다. EIOS를 보낼 필요는 없다."],
["det","det6",1,"Receiver Detection의 원리는?","Tx가 공통모드 전압을 바꿨을 때 충전 시간으로 상대 Rx 종단 유무를 판단","상대가 보낸 TS1 수신","Config 레지스터 읽기","기준 클럭 감지","Rx의 종단 저항(termination)이 있으면 충전 시간이 달라진다. 아직 Ordered Set 교환 전이므로 전기적으로만 판단한다."],
["det","det6",3,"Hot Reset을 마치고 Detect.Quiet로 들어온 Downstream Port에 강력 권장되는 것은?","Detect.Active로 가기 전 2 ms 대기","즉시 Detect.Active","12 ms 동안 TS1 송신","EQ 재수행 요청","Hot Reset에서 들어왔다면 DSP는 Detect.Active로 가기 전 2 ms 대기가 strongly recommended다."],

/* ---------- Polling ---------- */
["pol","pol1",1,"Polling.Active에서 송신하는 Ordered Set은?","TS1 (Link/Lane 번호 = PAD)","TS2 (구성된 번호)","EIOS","FTS","Receiver를 감지한 모든 Lane에서 Link·Lane 번호가 PAD인 TS1을 보낸다. 아직 번호가 없기 때문이다."],
["pol","pol1",2,"Polling 단계의 TS에서 광고할 수 있는 최고 속도는?","32.0 GT/s까지 (64/128은 아직 광고 불가)","128.0 GT/s","64.0 GT/s","2.5 GT/s만","Polling에서는 2.5~32.0 GT/s만 광고한다. 64.0/128.0 코드는 Flit Mode 협상(Configuration.Complete) 이후에 쓴다."],
["pol","pol2",1,"Polling.Active → Polling.Configuration 정상 exit 조건은?","TS1 1024개 이상 송신 + 감지된 모든 Lane에서 PAD TS1/TS2 8연속 수신","TS1 16개 송신","TS2 8개 송신","12 ms 경과","1024개 이상 TS1을 보내고, 감지된 모든 Lane에서 Link/Lane=PAD인 TS1 또는 TS2를 8개 연속 받아야 한다."],
["pol","pol2",2,"Polling.Active에서 ‘8연속 수신’에 해당하는 조건은?","Link/Lane=PAD인 TS1 또는 TS2를 연속 8개","SKP 8개","EIOS 8개","FTS 8개","TS1이든 TS2든 PAD 번호로 8개 연속이면 된다. ‘8연속 수신 + 16(또는 1024) 송신’ 패턴은 LTSSM 곳곳에 나온다."],
["pol","pol3",1,"Polling.Active의 timeout 값은?","24 ms","12 ms","48 ms","2 ms","Polling.Active는 24 ms. 만료 시 Configuration / Compliance / Detect 중 하나로 갈린다."],
["pol","pol3",2,"Polling.Active 24 ms timeout 시 다음 state 후보가 아닌 것은?","Recovery","Polling.Configuration","Polling.Compliance","Detect","timeout 분기는 Polling.Configuration(일부 Lane 성공 + predetermined Lane EI exit), Polling.Compliance, Detect 세 갈래다. Recovery로는 가지 않는다."],
["pol","pol3",3,"24 ms timeout 시 Polling.Compliance로 가는 경우는?","predetermined Lane에서 EI exit가 없거나 Compliance_Receive_Request TS1을 8개 받았을 때","모든 Lane이 8연속 TS를 받았을 때","Lane 극성이 뒤집혔을 때","Flit Mode가 지원될 때","predetermined Lane set에서 EI exit를 못 보면(측정 장비가 붙었다고 봄) 또는 Compliance_Receive_Request TS1 8개를 받으면 Compliance로 간다."],
["pol","pol4",2,"Polling.Compliance에 대한 설명으로 옳은 것은?","Compliance Pattern을 보내는 측정용 state로, 전체 timeout이 명시되어 있지 않다","24 ms 후 반드시 Detect","TLP를 보낼 수 있다","Flit Mode에서만 존재","Compliance는 로드보드/측정용이다. 전체 timeout이 없어서 실장에서 ‘Compliance에 갇힌 Link’로 오해받기 쉽다."],
["pol","pol4",3,"Polling.Compliance에서 Enter Compliance가 0b가 되고 조건이 맞으면?","Polling.Active로 복귀 (directed면 Detect)","L0로 간다","Recovery로 간다","Configuration으로 간다","Enter Compliance가 0b가 되면 Polling.Active로 돌아가고, ‘directed’된 경우엔 Detect로 간다."],
["pol","pol5",1,"Polling.Configuration에서 송신하는 것은?","TS2 (Link/Lane=PAD)","TS1 (구성 번호)","IDLE Flit","SDS","Polling.Configuration에서는 PAD 번호의 TS2를 보낸다."],
["pol","pol5",2,"Polling.Configuration → Configuration 조건은?","PAD TS2 8연속 수신 + TS2 1개 수신 후 TS2 16개 송신","TS1 1024개 송신","TS2 2개 수신","24 ms 경과","8연속 수신 + 16개 송신 패턴. 이때 필요하면 Lane 극성(polarity)도 반전한다."],
["pol","pol5",2,"Polling.Configuration의 timeout과 다음 state는?","48 ms → Detect","24 ms → Detect","12 ms → Polling.Active","2 ms → Configuration","Polling.Configuration은 48 ms가 지나면 Detect로 간다."],
["pol","pol5",3,"Lane 극성(polarity) 반전은 어느 substate에서 처리하나?","Polling.Configuration","Detect.Active","Recovery.Idle","L0","Polling.Configuration에서 필요하면 Lane Polarity를 반전한다(Transmit Margin은 000b로 리셋)."],
["pol","pol6",2,"Polling.Speed substate에 대해 옳은 것은?","도달 불가(unreachable) — 속도 변경은 L0 이후 Recovery에서만","64 GT/s로 바꾸는 곳","Gen3 EQ를 하는 곳","Compliance 다음 단계","표준이 ‘unreachable’이라고 명시한다. 링크는 2.5 GT/s로 L0에 오른 뒤 Recovery로 속도를 바꾼다."],
["pol","pol6",1,"Gen7을 지원하는 두 장치가 처음 L0에 오를 때의 속도는?","2.5 GT/s","128.0 GT/s","32.0 GT/s","64.0 GT/s","항상 2.5 GT/s L0까지 올라간 뒤 Recovery로 속도를 높인다."],

/* ---------- Configuration ---------- */
["cfg","cfg1",1,"Configuration substate의 순서로 옳은 것은?","Linkwidth.Start → Linkwidth.Accept → Lanenum.Accept/Wait → Complete → Idle","Idle → Complete → Linkwidth.Start","Lanenum.Wait → Linkwidth.Start → Idle","Start → Idle → Complete","Link 번호(Linkwidth) → Lane 번호(Lanenum) → Complete(TS2 확인) → Idle → L0."],
["cfg","cfg1",2,"Configuration 상태에서의 데이터 속도는?","2.5 GT/s","협상된 최고 속도","8.0 GT/s","32.0 GT/s","Configuration은 아직 2.5 GT/s다. Configuration.Idle 다음은 2.5 GT/s L0이다."],
["cfg","cfg2",1,"Configuration.Linkwidth.Start에서 먼저 non-PAD Link 번호를 보내는 쪽은?","Downstream Port (DSP)","Upstream Port (USP)","Retimer","소프트웨어","DSP가 Link 번호를 골라 TS1에 실어 보내고(Lane=PAD), USP가 같은 번호를 에코한다."],
["cfg","cfg2",2,"Configuration.Linkwidth.Start의 timeout은?","24 ms → Detect","2 ms → Detect","48 ms → Polling","12 ms → Detect","Linkwidth.Start는 24 ms. 2 ms는 Accept/Wait/Complete/Idle 쪽 값이다."],
["cfg","cfg2",3,"Crosslink(양쪽 역할 미정)에서 USP/DSP 역할을 정할 때 쓰는 타이머는?","Tcrosslink (무작위 값)","REPLAY_TIMER","N_FTS timer","TPOWER_ON","Crosslink 지원 시 Linkwidth.Start에서 Tcrosslink라는 무작위 시간으로 역할을 결정한다."],
["cfg","cfg3",2,"Configuration.Linkwidth.Accept에서 DSP가 하는 일은?","Lane 번호를 부여한 TS1 송신","Link 번호를 PAD로 되돌림","TS2 16개 송신","Flit Mode 결정","USP가 Link 번호를 에코하면 Accept로 오고, DSP가 각 Lane에 Lane 번호를 부여한다."],
["cfg","cfg3",2,"Configuration.Linkwidth.Accept의 timeout은?","2 ms → Detect","24 ms → Detect","48 ms → Detect","timeout 없음","Accept에서 유효한 Link를 못 만들면 2 ms 후 Detect."],
["cfg","cfg4",2,"Lane Reversal(Lane 역순 배선)은 어디서 처리되나?","Configuration Lanenum 단계(번호 재부여)","Detect","Polling.Compliance","L0p","Lanenum.Accept/Wait에서 Lane 번호 일치·폭 축소·reversal을 확정한다."],
["cfg","cfg4",3,"Configuration.Lanenum.Accept의 ms 단위 timeout은?","명시된 ms timeout이 없다","2 ms","24 ms","12 ms","Lanenum.Accept에는 명시된 timeout이 없다(구성 불가면 Detect). Lanenum.Wait는 2 ms."],
["cfg","cfg4",3,"Configuration.Lanenum.Wait의 timeout은?","2 ms → Detect","24 ms → Detect","48 ms → Detect","1 ms → L0","번호에 변화가 없거나 전 Lane PAD면 2 ms 후 Detect."],
["cfg","cfg5",1,"Configuration.Complete에서 송신하는 것은?","구성된 Link/Lane 번호의 TS2","PAD TS1","EIOS","IDLE Flit","Complete에서는 확정된 번호로 TS2를 교환한다."],
["cfg","cfg5",2,"Flit Mode 사용 여부가 확정되는 곳은?","Configuration.Complete","Polling.Active","Detect.Active","Recovery.Speed","Complete에서 양측이 요구 비트를 맞추면 Flit_Mode_Enabled=1b. Polling에서 확정되는 것이 아니다."],
["cfg","cfg5",3,"Configuration.Complete → Idle 조건은?","일치하는 TS2 8연속 수신 + TS2 16개 송신","TS1 1024개 송신","TS2 2개 수신","12 ms 경과","전형적인 8연속 수신 + 16개 송신 패턴. timeout은 2 ms."],
["cfg","cfg5",3,"L0p 사용 가능(L0p_capable)은 어떻게 정해지나?","Configuration.Complete에서 TS2의 L0p Capability 비트를 양측이 1b로 교환","Detect에서 전압으로","L0에서 소프트웨어만으로","Polling.Compliance에서","TS2(Symbol 4 bit 6, Link Upconfigure와 공용)로 양측이 L0p를 지원하면 L0p_capable=1b."],
["cfg","cfg6",2,"Configuration.Idle을 성공적으로 마치면?","2.5 GT/s L0로 진입, LinkUp=1b","최고 속도 L0","Recovery.Speed","Detect","Configuration.Idle 다음은 2.5 GT/s L0. 여기서 LinkUp=1b가 된다."],
["cfg","cfg6",3,"Configuration.Idle에서 1b/1b·Flit일 때 보내는 것은?","SDS(해당 시) 후 IDLE Flit","Idle Symbol (8b/10b)만","TS1","EIOS","8b/10b면 Idle Symbol, Flit/1b/1b면 SDS 후 IDLE Flit을 보낸다."],
["cfg","cfg6",3,"Configuration.Idle timeout(최소 2 ms) 시 idle_to_rlock_transitioned < FFh이면?","Recovery.RcvrLock","Detect","Polling","L0","itr<FFh이면 Recovery.RcvrLock으로 재시도, itr=FFh이면 Detect."],
["cfg","cfg7",2,"Configuration에서 Disable_Link_Request TS1을 2연속 받으면?","Disabled로 갈 수 있다","Loopback으로 간다","무시한다","L2로 간다","Disable_Link_Request / Loopback_Request가 주장된 TS1 2연속 수신 → Disabled / Loopback."]
];
if (typeof module !== "undefined") module.exports = LTSSM_Q1;
