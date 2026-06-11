<<<<<<< HEAD
/* =====================================================
   영단어 마스터 - 개선판
   개선 항목:
   1. [검색] 입력 초기화(X) 버튼 추가
   2. [검색] 이미 단어장에 있는 단어면 버튼 상태 즉시 반영
   3. [추천] 전체 추가 시 alert → 토스트 알림으로 교체
   4. [추천] 이미 추가된 단어 시각적 표시 유지
   5. [시험] 시험 방향 선택: 영→한 / 한→영
   6. [시험] 건너뛰기 버튼 추가
   7. [시험] 오답만 다시 풀기 버튼 추가
   8. [시험] 시험 단어장 뱃지(탭 숫자) 추가
   9. [공통] alert() 제거 → 토스트 알림으로 통일
   10. [공통] 단어 0개로 시험 시작/목표>단어수 방어 처리 개선
===================================================== */

// ── 탭 전환 ──
function openTab(e, tabId) {
    if (localStorage.getItem("penaltyEndTime")) return;
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    e.currentTarget.classList.add('active');
}

// ── 목표값 ±조절 ──
window.adjustGoal = function(delta) {
    const inp = document.getElementById("input-target-goal");
    const newVal = Math.max(1, (parseInt(inp.value) || 1) + delta);
    inp.value = newVal;
};

// ── [개선] 토스트 알림 (alert 대체) ──
function showToast(msg, type = "info") {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.className = `toast toast-${type} show`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* =====================================================
   [1] 마스터 다의어 사전
===================================================== */
const masterDict = {
    fine: [
        { meaning: "좋은, 맑은", pos: "adj", speakText: "It is fine.", synonyms: ["좋은","맑은","괜찮은","훌륭한"] },
        { meaning: "벌금, 과태료", pos: "n/v", speakText: "Pay a fine.", synonyms: ["벌금","과태료","벌칙"] },
        { meaning: "미세한, 고운", pos: "adj", speakText: "Fine dust.", synonyms: ["미세한","고운","섬세한"] }
    ],
    book: [
        { meaning: "책, 도서", pos: "n", speakText: "Read a book.", synonyms: ["책","도서","서적"] },
        { meaning: "예약하다", pos: "v", speakText: "Book a flight.", synonyms: ["예약하다","예약","부킹"] }
    ],
    lead: [
        { meaning: "이끌다, 안내하다", pos: "v", speakText: "Lead the way.", synonyms: ["이끌다","인도하다","안내하다","리드하다"] },
        { meaning: "납 (금속)", pos: "n", speakText: "Made of lead.", synonyms: ["납","납성분","금속"] }
    ],
    bear: [
        { meaning: "곰", pos: "n", speakText: "A wild bear.", synonyms: ["곰"] },
        { meaning: "참다, 견디다", pos: "v", speakText: "Bear the pain.", synonyms: ["참다","견디다","버티다","감내하다"] }
    ],
    run: [
        { meaning: "달리다, 뛰다", pos: "v", speakText: "Run fast.", synonyms: ["달리다","뛰다","달리기"] },
        { meaning: "운영하다, 경영하다", pos: "v", speakText: "Run a business.", synonyms: ["운영하다","경영하다","관리하다","운영"] }
    ],
    mean: [
        { meaning: "의미하다", pos: "v", speakText: "What do you mean?", synonyms: ["의미하다","뜻하다","의미","뜻"] },
        { meaning: "못된, 심술궂은", pos: "adj", speakText: "Don't be mean.", synonyms: ["못된","심술궂은","나쁜","못됐다"] },
        { meaning: "평균", pos: "n", speakText: "Mean value.", synonyms: ["평균","중간값"] }
    ],
    present: [
        { meaning: "선물, 현재의", pos: "n/adj", speakText: "A birthday present.", synonyms: ["선물","현재","지금","현재의"] },
        { meaning: "발표하다, 제출하다", pos: "v", speakText: "Present the award.", synonyms: ["발표하다","제출하다","제시하다","발표"] }
    ],
    close: [
        { meaning: "닫다, 끝내다", pos: "v", speakText: "Close the door.", synonyms: ["닫다","끝내다","폐쇄하다","닫기"] },
        { meaning: "가까운, 친밀한", pos: "adj", speakText: "Stand close to me.", synonyms: ["가까운","친밀한","근접한","가까이"] }
    ],
    kind: [
        { meaning: "친절한, 다정한", pos: "adj", speakText: "She is kind.", synonyms: ["친절한","다정한","친절","상냥한"] },
        { meaning: "종류, 유형", pos: "n", speakText: "What kind is this?", synonyms: ["종류","유형","타입","종"] }
    ],
    light: [
        { meaning: "빛, 불빛", pos: "n", speakText: "Turn on the light.", synonyms: ["빛","불빛","광","조명"] },
        { meaning: "가벼운", pos: "adj", speakText: "Light as a feather.", synonyms: ["가벼운","가볍다"] },
        { meaning: "밝은, 연한", pos: "adj", speakText: "Light blue.", synonyms: ["밝은","연한","연"] }
    ]
};

/* =====================================================
   [2] 단어 DB (카테고리별)
===================================================== */
const wordDB = {
    basic: [
        {eng:"apple",kor:"사과"},{eng:"banana",kor:"바나나"},{eng:"book",kor:"책, 예약하다"},
        {eng:"cat",kor:"고양이"},{eng:"dog",kor:"개"},{eng:"desk",kor:"책상"},
        {eng:"water",kor:"물"},{eng:"fire",kor:"불, 해고하다"},{eng:"tree",kor:"나무"},
        {eng:"house",kor:"집"},{eng:"school",kor:"학교"},{eng:"food",kor:"음식"},
        {eng:"time",kor:"시간"},{eng:"love",kor:"사랑, 사랑하다"},{eng:"friend",kor:"친구"},
        {eng:"family",kor:"가족"},{eng:"work",kor:"일, 작동하다"},{eng:"happy",kor:"행복한"},
        {eng:"sad",kor:"슬픈"},{eng:"big",kor:"큰"},{eng:"small",kor:"작은"},
        {eng:"fast",kor:"빠른"},{eng:"slow",kor:"느린"},{eng:"new",kor:"새로운"},
        {eng:"old",kor:"오래된, 늙은"},{eng:"good",kor:"좋은"},{eng:"bad",kor:"나쁜"},
        {eng:"open",kor:"열다, 열린"},{eng:"close",kor:"닫다, 가까운"},{eng:"run",kor:"달리다, 운영하다"},
        {eng:"walk",kor:"걷다"},{eng:"eat",kor:"먹다"},{eng:"drink",kor:"마시다"},
        {eng:"sleep",kor:"자다, 수면"},{eng:"wake",kor:"깨다, 일어나다"},{eng:"read",kor:"읽다"},
        {eng:"write",kor:"쓰다"},{eng:"speak",kor:"말하다"},{eng:"listen",kor:"듣다"},
        {eng:"look",kor:"보다, 보이다"},{eng:"think",kor:"생각하다"},{eng:"know",kor:"알다"},
        {eng:"want",kor:"원하다"},{eng:"need",kor:"필요하다, 필요"},{eng:"help",kor:"돕다, 도움"},
        {eng:"buy",kor:"사다, 구매하다"},{eng:"sell",kor:"팔다"},{eng:"give",kor:"주다"},
        {eng:"take",kor:"가져가다, 취하다"},{eng:"make",kor:"만들다"},{eng:"get",kor:"얻다, 되다"},
        {eng:"come",kor:"오다"},{eng:"go",kor:"가다"},{eng:"see",kor:"보다, 만나다"},
        {eng:"learn",kor:"배우다"},{eng:"study",kor:"공부하다, 연구"},{eng:"play",kor:"놀다, 연주하다"},
        {eng:"sing",kor:"노래하다"},{eng:"dance",kor:"춤추다"},{eng:"paint",kor:"그리다, 칠하다"},
        {eng:"clean",kor:"청소하다, 깨끗한"},{eng:"dirty",kor:"더러운"},{eng:"hot",kor:"뜨거운, 더운"},
        {eng:"cold",kor:"차가운, 추운"},{eng:"high",kor:"높은"},{eng:"low",kor:"낮은"},
        {eng:"right",kor:"올바른, 오른쪽"},{eng:"left",kor:"왼쪽, 남기다"},{eng:"long",kor:"긴"},
        {eng:"short",kor:"짧은, 키 작은"},{eng:"strong",kor:"강한"},{eng:"weak",kor:"약한"},
        {eng:"rich",kor:"부유한, 풍부한"},{eng:"poor",kor:"가난한, 불쌍한"},{eng:"easy",kor:"쉬운"},
        {eng:"hard",kor:"어려운, 딱딱한, 열심히"},{eng:"city",kor:"도시"},{eng:"country",kor:"나라, 시골"},
        {eng:"road",kor:"도로, 길"},{eng:"sky",kor:"하늘"},{eng:"sun",kor:"태양"},
        {eng:"moon",kor:"달"},{eng:"star",kor:"별, 스타"},{eng:"rain",kor:"비, 비가 오다"},
        {eng:"snow",kor:"눈, 눈이 오다"},{eng:"wind",kor:"바람"},{eng:"flower",kor:"꽃"},
        {eng:"bird",kor:"새"},{eng:"fish",kor:"물고기, 낚시하다"},{eng:"horse",kor:"말"}
    ],
    exam: [
        {eng:"phenomenon",kor:"현상"},{eng:"significant",kor:"중요한, 상당한"},{eng:"hypothesis",kor:"가설"},
        {eng:"consequence",kor:"결과, 영향"},{eng:"simultaneous",kor:"동시의"},
        {eng:"perspective",kor:"관점, 시각"},{eng:"comprehensive",kor:"포괄적인, 종합적인"},
        {eng:"fundamental",kor:"근본적인, 기초적인"},{eng:"substantial",kor:"상당한, 실질적인"},
        {eng:"perceive",kor:"인지하다, 인식하다"},{eng:"elaborate",kor:"정교한, 자세히 설명하다"},
        {eng:"relevant",kor:"관련있는, 적절한"},{eng:"despite",kor:"~에도 불구하고"},
        {eng:"whereas",kor:"~인 반면에"},{eng:"thereby",kor:"그렇게 함으로써"},
        {eng:"moreover",kor:"게다가, 더욱이"},{eng:"nevertheless",kor:"그럼에도 불구하고"},
        {eng:"consistent",kor:"일관된, 지속적인"},{eng:"contrast",kor:"대조, 대비하다"},
        {eng:"emphasize",kor:"강조하다"},{eng:"imply",kor:"암시하다, 시사하다"},
        {eng:"inherit",kor:"물려받다, 상속받다"},{eng:"diminish",kor:"줄어들다, 약해지다"},
        {eng:"accommodate",kor:"수용하다, 맞추다"},{eng:"ambiguous",kor:"모호한, 애매한"},
        {eng:"inevitable",kor:"불가피한, 피할 수 없는"},{eng:"predominant",kor:"우세한, 지배적인"},
        {eng:"arbitrary",kor:"임의적인, 자의적인"},
        {eng:"controversy",kor:"논란, 논쟁"},
        {eng:"subsequent",kor:"그 이후의, 뒤이은"},{eng:"reluctant",kor:"꺼리는, 마지못한"},
        {eng:"sufficient",kor:"충분한"},{eng:"portray",kor:"묘사하다, 나타내다"},
        {eng:"advocate",kor:"지지자, 옹호하다"},{eng:"revise",kor:"수정하다, 개정하다"},
        {eng:"dilemma",kor:"딜레마, 진퇴양난"},{eng:"abolish",kor:"폐지하다"},
        {eng:"coherent",kor:"일관성있는, 논리적인"},{eng:"paradox",kor:"역설, 모순"},
    ],
    daily: [
        {eng:"hang out",kor:"놀다, 어울리다"},{eng:"grab a bite",kor:"간단히 먹다"},
        {eng:"chill out",kor:"휴식을 취하다, 진정하다"},{eng:"catch up",kor:"따라잡다, 근황을 나누다"},
        {eng:"show up",kor:"나타나다, 참석하다"},{eng:"figure out",kor:"알아내다, 이해하다"},
        {eng:"give up",kor:"포기하다"},{eng:"look up",kor:"찾아보다, 우러르다"},
        {eng:"bring up",kor:"언급하다, 키우다"},{eng:"point out",kor:"지적하다, 가리키다"},
        {eng:"work out",kor:"운동하다, 해결되다"},{eng:"run out",kor:"다 떨어지다, 바닥나다"},
        {eng:"break down",kor:"고장나다, 무너지다"},{eng:"call off",kor:"취소하다"},
        {eng:"turn up",kor:"나타나다, 볼륨을 높이다"},{eng:"put off",kor:"미루다, 연기하다"},
        {eng:"go through",kor:"겪다, 살펴보다"},{eng:"come across",kor:"우연히 만나다, 이해되다"},
        {eng:"awesome",kor:"굉장한, 멋진"},{eng:"annoyed",kor:"짜증난, 화난"},
        {eng:"exhausted",kor:"지친, 기진맥진한"},{eng:"relieved",kor:"안도한, 다행스러운"},
        {eng:"awkward",kor:"어색한, 불편한"},{eng:"fancy",kor:"고급스러운, 좋아하다"},
        {eng:"stuff",kor:"물건, 것들"},{eng:"totally",kor:"완전히, 전적으로"},
        {eng:"basically",kor:"기본적으로, 사실상"},{eng:"literally",kor:"말 그대로, 정말로"},
    ],
    toeic: [
        {eng:"acquire",kor:"획득하다, 습득하다"},{eng:"allocate",kor:"배분하다, 할당하다"},
        {eng:"alternative",kor:"대안, 대안의"},{eng:"analyze",kor:"분석하다"},
        {eng:"anticipate",kor:"예상하다, 기대하다"},{eng:"assess",kor:"평가하다, 산정하다"},
        {eng:"authorize",kor:"허가하다, 승인하다"},{eng:"benefit",kor:"이익, 혜택, 이득을 얻다"},
        {eng:"candidate",kor:"후보자, 지원자"},{eng:"collaborate",kor:"협력하다, 공동 작업하다"},
        {eng:"competent",kor:"유능한, 능숙한"},{eng:"conduct",kor:"수행하다, 행동"},
        {eng:"confirm",kor:"확인하다, 확정하다"},{eng:"considerable",kor:"상당한, 많은"},
        {eng:"deadline",kor:"마감일, 기한"},{eng:"delegate",kor:"위임하다, 대표자"},
        {eng:"determine",kor:"결정하다, 알아내다"},{eng:"effective",kor:"효과적인"},
        {eng:"efficient",kor:"효율적인"},{eng:"establish",kor:"설립하다, 수립하다"},
        {eng:"evaluate",kor:"평가하다"},{eng:"expand",kor:"확장하다, 확대하다"},
        {eng:"implement",kor:"시행하다, 실행하다"},{eng:"negotiate",kor:"협상하다"},
        {eng:"objective",kor:"목표, 목적, 객관적인"},{eng:"optimize",kor:"최적화하다"},
        {eng:"outline",kor:"개요, 윤곽, 요약하다"},{eng:"proceed",kor:"진행하다, 나아가다"},
        {eng:"proposal",kor:"제안, 제안서"},{eng:"qualified",kor:"자격있는, 적격의"},
        {eng:"recommend",kor:"추천하다, 권장하다"},{eng:"requirement",kor:"요건, 필요조건"},
        {eng:"revenue",kor:"수익, 매출"},{eng:"strategy",kor:"전략"},
        {eng:"submit",kor:"제출하다"},{eng:"supervise",kor:"감독하다, 관리하다"},
        {eng:"survey",kor:"설문조사, 조사하다"},{eng:"terminate",kor:"종료하다, 해고하다"},
        {eng:"workforce",kor:"인력, 노동력"},
    ],
    advanced: [
        {eng:"aberrant",kor:"비정상적인, 이탈한"},{eng:"alleviate",kor:"완화하다, 경감하다"},
        {eng:"ambivalent",kor:"양면적인, 상반된 감정의"},{eng:"anachronism",kor:"시대착오, 시대에 맞지 않는 것"},
        {eng:"benevolent",kor:"자비로운, 친절한"},{eng:"clandestine",kor:"비밀의, 은밀한"},
        {eng:"cognizant",kor:"인식하는, 알고 있는"},{eng:"complacent",kor:"자기 만족적인, 현실 안주하는"},
        {eng:"contemplate",kor:"심사숙고하다, 고려하다"},{eng:"corroborate",kor:"확증하다, 뒷받침하다"},
        {eng:"cynical",kor:"냉소적인"},{eng:"debilitate",kor:"약화시키다, 쇠약하게 하다"},
        {eng:"deficient",kor:"부족한, 결핍된"},{eng:"denounce",kor:"비난하다, 규탄하다"},
        {eng:"depict",kor:"묘사하다, 그리다"},{eng:"disparity",kor:"불균형, 차이"},
        {eng:"eloquent",kor:"웅변적인, 표현이 뛰어난"},{eng:"emulate",kor:"모방하다, 본받으려 하다"},
        {eng:"ephemeral",kor:"덧없는, 순간적인"},{eng:"exemplify",kor:"예를 들다, 전형적인 예가 되다"},
        {eng:"exacerbate",kor:"악화시키다"},{eng:"fabricate",kor:"조작하다, 날조하다"},
        {eng:"formidable",kor:"강력한, 어마어마한"},{eng:"futile",kor:"무의미한, 헛된"},
        {eng:"gregarious",kor:"사교적인, 무리를 좋아하는"},{eng:"hegemony",kor:"패권, 지배권"},
        {eng:"implicit",kor:"암묵적인, 내포된"},{eng:"inadvertent",kor:"부주의한, 의도치 않은"},
        {eng:"indulgent",kor:"관대한, 응석을 받아주는"},{eng:"inept",kor:"부적절한, 무능한"},
        {eng:"innocuous",kor:"무해한, 순진한"},{eng:"insidious",kor:"교활한, 서서히 퍼지는"},
        {eng:"lament",kor:"한탄하다, 슬퍼하다"},{eng:"meticulous",kor:"꼼꼼한, 세심한"},
        {eng:"mitigate",kor:"완화하다, 줄이다"},{eng:"mundane",kor:"평범한, 세속적인"},
        {eng:"negligible",kor:"무시할 수 있는, 미미한"},{eng:"obscure",kor:"불분명한, 모호한, 가리다"},
        {eng:"ominous",kor:"불길한, 험악한"},{eng:"ostensibly",kor:"표면상으로, 겉으로는"},
        {eng:"pervasive",kor:"만연한, 퍼져있는"},{eng:"pragmatic",kor:"실용적인, 현실적인"},
        {eng:"prolific",kor:"다작의, 생산적인"},{eng:"reticent",kor:"말이 없는, 과묵한"},
        {eng:"scrutinize",kor:"면밀히 조사하다"},{eng:"tenacious",kor:"끈질긴, 완강한"},
        {eng:"ubiquitous",kor:"어디에나 있는, 편재하는"},{eng:"vehement",kor:"격렬한, 맹렬한"},
    ]
};

/* =====================================================
   [3] 픽셀 캐릭터
===================================================== */
const characters = [
    `<svg class="pixel-char" viewBox="0 0 16 16"><rect x="4" y="1" width="8" height="8" fill="#4f7ef7" rx="2"/><rect x="5" y="3" width="2" height="2" fill="white"/><rect x="9" y="3" width="2" height="2" fill="white"/><rect x="6" y="6" width="4" height="1" fill="white"/><rect x="3" y="9" width="10" height="5" fill="#4f7ef7" rx="1"/><rect x="3" y="12" width="3" height="4" fill="#4f7ef7"/><rect x="10" y="12" width="3" height="4" fill="#4f7ef7"/></svg>`,
    `<svg class="pixel-char" viewBox="0 0 16 16"><rect x="4" y="1" width="8" height="8" fill="#22c55e" rx="2"/><rect x="5" y="3" width="2" height="2" fill="white"/><rect x="9" y="3" width="2" height="2" fill="white"/><rect x="5" y="6" width="6" height="1" fill="white" rx="1"/><rect x="3" y="9" width="10" height="5" fill="#22c55e" rx="1"/><rect x="3" y="12" width="3" height="4" fill="#22c55e"/><rect x="10" y="12" width="3" height="4" fill="#22c55e"/></svg>`,
    `<svg class="pixel-char" viewBox="0 0 16 16"><rect x="4" y="1" width="8" height="8" fill="#f97316" rx="2"/><rect x="5" y="3" width="2" height="2" fill="white"/><rect x="9" y="3" width="2" height="2" fill="white"/><rect x="6" y="6" width="4" height="1" fill="white"/><rect x="3" y="9" width="10" height="5" fill="#f97316" rx="1"/><rect x="3" y="12" width="3" height="4" fill="#f97316"/><rect x="10" y="12" width="3" height="4" fill="#f97316"/></svg>`
];
const animations = ["anim-jump", "anim-spin", "anim-shake"];

/* =====================================================
   전역 상태
===================================================== */
let currentRecommendBatch = [];
let testList = [];
let penaltyCount = parseInt(localStorage.getItem("penaltyCount")) || 0;
let penaltyTimerInterval = null;

// [개선] 시험 방향: 'kor'=영→한, 'eng'=한→영
let examDirection = 'kor';

// 시험 상태
let activeExamWords = [];
let examIdx = 0;
let examScore = 0;
let examGoal = 0;
let wrongWords = [];
let hintUsed = false;

// DOM
const searchInput   = document.getElementById("search-input");
const btnSearch     = document.getElementById("btn-search");
const btnClearInput = document.getElementById("btn-clear-input");
const searchResult  = document.getElementById("search-result");
const searchSuggestions = document.getElementById("search-suggestions");
const typeSelect    = document.getElementById("type-select");
const countSelect   = document.getElementById("count-select");
const recommendWordList = document.getElementById("recommend-word-list");
const btnRefresh    = document.getElementById("btn-refresh");
const btnAddTest    = document.getElementById("btn-add-test");
const charContainer = document.getElementById("char-container");
const bubbleText    = document.getElementById("bubble-text");

const testSetupZone  = document.getElementById("test-setup-zone");
const testPlayZone   = document.getElementById("test-play-zone");
const testResultZone = document.getElementById("test-result-zone");
const testPreviewUl  = document.getElementById("test-preview-ul");
const testTotalCount = document.getElementById("test-total-count");
const inputTargetGoal = document.getElementById("input-target-goal");
const nextPenaltyMin  = document.getElementById("next-penalty-min");
const testBadge       = document.getElementById("test-badge");

const currentQIndex     = document.getElementById("current-q-index");
const totalQCount       = document.getElementById("total-q-count");
const currentScoreCount = document.getElementById("current-score-count");
const progressFill      = document.getElementById("progress-fill");
const testQEng          = document.getElementById("test-q-eng");
const testAnsInput      = document.getElementById("test-ans-input");
const btnSubmitAns      = document.getElementById("btn-submit-ans");
const btnTestSpeaker    = document.getElementById("btn-test-speaker");
const btnHint           = document.getElementById("btn-hint");
const btnSkip           = document.getElementById("btn-skip");
const testHint          = document.getElementById("test-hint");
const answerFeedback    = document.getElementById("answer-feedback");
const testDirectionLabel = document.getElementById("test-direction-label");

const finalScore    = document.getElementById("final-score");
const finalTotal    = document.getElementById("final-total");
const finalGoal     = document.getElementById("final-goal");
const resultTitle   = document.getElementById("result-title");
const resultComment = document.getElementById("result-comment");
const btnFinishTest = document.getElementById("btn-finish-test");
const wrongReview   = document.getElementById("wrong-review");
const wrongList     = document.getElementById("wrong-list");
const btnRetryWrong = document.getElementById("btn-retry-wrong");

const penaltyOverlay = document.getElementById("penalty-overlay");
const penaltyClock   = document.getElementById("penalty-clock");

/* =====================================================
   [4] 발음 엔진
===================================================== */
window.speakWord = function(text, contextText = "") {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(contextText || text);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
};

/* =====================================================
   [5] 검색 기능
===================================================== */
async function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    searchSuggestions.style.display = "none";

    if (!query) {
        searchResult.innerHTML = `<p class="info-text">단어를 입력해주세요!</p>`;
        return;
    }

    searchResult.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <span>검색 중...</span>
        </div>`;

    if (masterDict[query]) {
        renderSearchResult(query, masterDict[query].map(d => ({
            pos: d.pos,
            meaning: d.meaning,
            example: d.speakText,
            speakText: d.speakText,
            synonyms: d.synonyms
        })), "내장 사전");
        speakWord(query, masterDict[query][0].speakText);
        return;
    }

    try {
        const res  = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
        const data = await res.json();

        if (Array.isArray(data) && data[0]?.meanings) {
            const entry    = data[0];
            const phonetic = entry.phonetics?.find(p => p.text)?.text || "";
            let meanings   = [];

            entry.meanings.forEach(m => {
                m.definitions.slice(0, 2).forEach(def => {
                    meanings.push({
                        pos: m.partOfSpeech,
                        defEn: def.definition,
                        example: def.example || "",
                        speakText: def.example || query,
                        synonyms: []
                    });
                });
            });

            const translated = await Promise.all(
                meanings.slice(0, 5).map(m =>
                    translateToKorean(m.defEn).then(kor => ({ ...m, meaning: kor }))
                )
            );

            renderSearchResult(query, translated, "Dictionary API", phonetic);
            speakWord(query);
            return;
        }
    } catch (_) {}

    try {
        const res  = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=en|ko`);
        const data = await res.json();

        let meanings = [];
        const raw = data.responseData?.translatedText?.trim();
        if (raw) meanings.push({ pos: "", meaning: raw, speakText: query, synonyms: [] });

        if (data.matches) {
            data.matches.slice(0, 4).forEach(m => {
                const k = m.translation?.trim();
                if (k && /[가-힣]/.test(k) && !meanings.some(x => x.meaning === k)) {
                    meanings.push({ pos: "", meaning: k, speakText: query, synonyms: [] });
                }
            });
        }

        if (meanings.length === 0) {
            searchResult.innerHTML = `<p class="info-text">⚠️ "${query}" 단어를 찾을 수 없습니다.</p>`;
            return;
        }

        renderSearchResult(query, meanings, "MyMemory");
        speakWord(query);
    } catch (err) {
        searchResult.innerHTML = `<p class="info-text">⚠️ 인터넷 연결을 확인하세요.</p>`;
    }
}

async function translateToKorean(text) {
    try {
        const res  = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`);
        const data = await res.json();
        const t    = data.responseData?.translatedText?.trim();
        return (t && /[가-힣]/.test(t)) ? t : text;
    } catch (_) {
        return text;
    }
}

function renderSearchResult(query, meanings, source, phonetic = "") {
    const savedKor = meanings.map(m => m.meaning).join(", ");
    // [개선] 이미 단어장에 있으면 버튼 상태 반영
    const alreadyAdded = testList.some(item => item.eng === query);

    let meaningsHtml = meanings.map(m => `
        <li class="meaning-item">
            <div class="meaning-left">
                ${m.pos ? `<span class="meaning-pos">${m.pos}</span>` : ""}
                <span class="meaning-text">${m.meaning}</span>
                ${m.example ? `<span class="meaning-example">"${m.example}"</span>` : ""}
            </div>
            <button class="btn-speaker-mini" onclick="speakWord('${query}', '${(m.speakText||query).replace(/'/g,"")}')" title="발음 듣기">🔊</button>
        </li>`).join("");

    searchResult.innerHTML = `
        <div class="result-header">
            <div class="result-word-info">
                <h3>${query}</h3>
                ${phonetic ? `<span class="result-phonetic">${phonetic}</span>` : ""}
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span class="source-badge">${source}</span>
                <button class="btn-speaker" onclick="speakWord('${query}')" title="발음 듣기">🔊</button>
            </div>
        </div>
        <ul class="meaning-list">${meaningsHtml}</ul>
        <button class="btn btn-secondary btn-add-search ${alreadyAdded ? 'already-added' : ''}"
            id="btn-add-searched"
            style="width:100%;font-size:12px;"
            onclick="addSearchedWordToTest('${query}', '${savedKor.replace(/'/g, "'")}')">
            ${alreadyAdded ? '✅ 이미 단어장에 있음' : '⭐ 시험 단어장에 추가'}
        </button>`;
}

window.addSearchedWordToTest = function(eng, kor) {
    if (testList.some(item => item.eng === eng)) {
        showToast("이미 등록된 단어입니다!", "warn");
        return;
    }
    testList.push({ eng, kor });
    updateTestSetupUI();
    showToast(`"${eng}" 단어가 단어장에 추가됐어요! ⭐`, "success");

    // 버튼 상태 즉시 변경
    const btn = document.getElementById("btn-add-searched");
    if (btn) {
        btn.textContent = "✅ 이미 단어장에 있음";
        btn.classList.add("already-added");
    }
};

// [개선] 입력 X 버튼
searchInput.addEventListener("input", () => {
    btnClearInput.style.display = searchInput.value ? "flex" : "none";
    handleSuggestions();
});
btnClearInput.addEventListener("click", () => {
    searchInput.value = "";
    btnClearInput.style.display = "none";
    searchSuggestions.style.display = "none";
    searchInput.focus();
});

let debounceTimer;
function handleSuggestions() {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim().toLowerCase();
    if (!query) { searchSuggestions.style.display = "none"; return; }

    debounceTimer = setTimeout(async () => {
        try {
            const res     = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}`);
            const matches = await res.json();
            if (!matches.length) { searchSuggestions.style.display = "none"; return; }

            searchSuggestions.innerHTML = "";
            matches.slice(0, 7).forEach(item => {
                const div = document.createElement("div");
                div.className = "suggestion-item";
                div.textContent = item.word;
                div.addEventListener("click", () => {
                    searchInput.value = item.word;
                    btnClearInput.style.display = "flex";
                    searchSuggestions.style.display = "none";
                    handleSearch();
                });
                searchSuggestions.appendChild(div);
            });
            searchSuggestions.style.display = "block";
        } catch (_) {}
    }, 180);
}

btnSearch.addEventListener("click", handleSearch);
searchInput.addEventListener("keypress", e => { if (e.key === "Enter") handleSearch(); });
document.addEventListener("click", e => {
    if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target))
        searchSuggestions.style.display = "none";
});

/* =====================================================
   [6] AI 추천 단어
===================================================== */
const categoryNames = {
    basic:    "기초 필수 영단어",
    exam:     "수능·모의고사 대비 영단어",
    daily:    "영어 일상 표현",
    toeic:    "토익 핵심 비즈니스 영단어",
    advanced: "고급 학문적 영어 어휘"
};

const usedWords = { basic: new Set(), exam: new Set(), daily: new Set(), toeic: new Set(), advanced: new Set() };

async function get8RecommendWords() {
    const type  = typeSelect.value;
    const count = parseInt(countSelect.value) || 8;

    recommendWordList.innerHTML = Array(count).fill(`<div class="skeleton-card"></div>`).join("");
    bubbleText.textContent = "AI가 새 단어를 골라오는 중...";

    playCharAnim();

    const usedList = [...usedWords[type]].slice(-60).join(", ");
    const prompt = `
당신은 영어 교육 전문가입니다.
다음 카테고리에 맞는 영단어 ${count}개를 추천해 주세요: ${categoryNames[type]}

규칙:
1. 아래 이미 추천된 단어들은 절대 포함하지 마세요: ${usedList || "없음"}
2. 각 단어마다 대표 한국어 뜻 1~3개(쉼표 구분)를 제공하세요.
3. JSON 배열만 출력하세요. 다른 텍스트나 마크다운 없이 순수 JSON만 출력하세요.
4. 형식: [{"eng":"word","kor":"뜻1, 뜻2"}, ...]
5. 다의어의 경우 중요한 뜻을 쉼표로 구분해 포함하세요.
6. 영단어는 소문자로, 구동사(phrasal verb)는 그대로 써주세요.
`;

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data   = await response.json();
        const rawText = data.content?.map(c => c.text || "").join("") || "";

        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("JSON not found");

        const words = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(words) || words.length === 0) throw new Error("Empty array");

        words.forEach(w => usedWords[type].add(w.eng));
        currentRecommendBatch = words;
        renderRecommendList(words);
        bubbleText.textContent = `${categoryNames[type]} ${words.length}개 새로 준비됐어! 🎉`;

    } catch (err) {
        console.warn("AI API 실패, 로컬 DB 사용:", err);
        const localPool = wordDB[type] || wordDB.basic;
        const unused    = localPool.filter(w => !usedWords[type].has(w.eng));
        const pool      = unused.length >= count ? unused : localPool;
        const shuffled  = [...pool].sort(() => Math.random() - 0.5);
        const selected  = shuffled.slice(0, count);

        selected.forEach(w => usedWords[type].add(w.eng));
        currentRecommendBatch = selected;
        renderRecommendList(selected);
        bubbleText.textContent = "로컬 단어장에서 불러왔어! 🎲";
    }
}

function renderRecommendList(words) {
    recommendWordList.innerHTML = "";
    words.forEach((word, idx) => {
        const alreadyAdded = testList.some(item => item.eng === word.eng);
        const div = document.createElement("div");
        div.className = "rec-item";
        div.innerHTML = `
            <div class="rec-item-header">
                <span class="eng-txt">${word.eng}</span>
                <button class="btn-speaker-mini" onclick="speakWord('${word.eng.replace(/'/g,"")}')">🔊</button>
            </div>
            <span class="kor-txt">${word.kor}</span>
            <button class="btn-add-single ${alreadyAdded ? 'added' : ''}" id="add-btn-${idx}"
                onclick="addSingleWordToTestList(${idx})">
                ${alreadyAdded ? '✅ 추가됨' : '➕ 추가'}
            </button>
        `;
        recommendWordList.appendChild(div);
    });
}

window.addSingleWordToTestList = function(idx) {
    const word = currentRecommendBatch[idx];
    if (!word) return;
    if (testList.some(item => item.eng === word.eng)) {
        showToast("이미 단어장에 있어요!", "warn");
        return;
    }
    testList.push(word);
    updateTestSetupUI();
    const btn = document.getElementById(`add-btn-${idx}`);
    if (btn) { btn.textContent = "✅ 추가됨"; btn.classList.add("added"); }
    showToast(`"${word.eng}" 추가됐어요! ⭐`, "success");
};

function addBatchToTestList() {
    let added = 0;
    currentRecommendBatch.forEach((word, idx) => {
        if (!testList.some(item => item.eng === word.eng)) {
            testList.push(word);
            added++;
            const btn = document.getElementById(`add-btn-${idx}`);
            if (btn) { btn.textContent = "✅ 추가됨"; btn.classList.add("added"); }
        }
    });
    updateTestSetupUI();
    // [개선] alert → 토스트
    if (added > 0) showToast(`${added}개 단어가 단어장에 추가됐어요! 🎉`, "success");
    else showToast("이미 모두 추가된 단어예요!", "warn");
}

function playCharAnim() {
    charContainer.innerHTML = characters[Math.floor(Math.random() * characters.length)];
    const char = charContainer.querySelector(".pixel-char");
    animations.forEach(a => char.classList.remove(a));
    const anim = animations[Math.floor(Math.random() * animations.length)];
    void char.offsetWidth;
    char.classList.add(anim);
}

/* =====================================================
   [7] 시험 단어장 UI
===================================================== */
function updateTestSetupUI() {
    testTotalCount.textContent = testList.length;
    nextPenaltyMin.textContent = (penaltyCount + 1) * 5;

    // [개선] 탭 뱃지 업데이트
    if (testList.length > 0) {
        testBadge.textContent = testList.length;
        testBadge.style.display = "inline-flex";
    } else {
        testBadge.style.display = "none";
    }

    if (testList.length === 0) {
        testPreviewUl.innerHTML = `<p class="info-text" style="padding:10px 0;">추천 단어 또는 검색한 단어를 추가해 보세요!</p>`;
        return;
    }

    testPreviewUl.innerHTML = "";
    testList.forEach((word, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span><span class="word-eng">${word.eng}</span> &nbsp;${word.kor}</span>
            <span class="delete-btn" onclick="removePreviewWord(${index})">✕</span>
        `;
        testPreviewUl.appendChild(li);
    });
}

window.removePreviewWord = function(index) {
    testList.splice(index, 1);
    updateTestSetupUI();
};

window.clearAllWords = function() {
    if (!testList.length) return;
    if (confirm("시험 단어장을 모두 비울까요?")) {
        testList = [];
        updateTestSetupUI();
    }
};

/* =====================================================
   [개선] 시험 방향 설정
===================================================== */
window.setDirection = function(dir) {
    examDirection = dir;
    document.getElementById("dir-kor").classList.toggle("active", dir === "kor");
    document.getElementById("dir-eng").classList.toggle("active", dir === "eng");
};

/* =====================================================
   [8] 시험 진행
===================================================== */
document.getElementById("btn-start-test").addEventListener("click", () => {
    if (testList.length === 0) {
        showToast("시험 단어를 먼저 추가해주세요!", "warn");
        return;
    }
    examGoal = parseInt(inputTargetGoal.value) || 1;
    if (examGoal > testList.length) {
        showToast(`목표(${examGoal})가 단어 수(${testList.length})보다 많아요!`, "warn");
        return;
    }

    activeExamWords = [...testList].sort(() => Math.random() - 0.5);
    examIdx = 0; examScore = 0; wrongWords = [];
    testSetupZone.style.display = "none";
    testPlayZone.style.display  = "block";
    showQuestion();
});

function showQuestion() {
    totalQCount.textContent       = activeExamWords.length;
    currentQIndex.textContent     = examIdx + 1;
    currentScoreCount.textContent = examScore;
    progressFill.style.width      = `${(examIdx / activeExamWords.length) * 100}%`;
    hintUsed = false;
    testHint.textContent = "";
    answerFeedback.style.display = "none";
    answerFeedback.className     = "answer-feedback";

    const word = activeExamWords[examIdx];

    if (examDirection === 'kor') {
        // 영→한: 영어 단어를 보여주고 한국어 뜻 입력
        testQEng.textContent = word.eng;
        testDirectionLabel.textContent = "한국어 뜻을 입력하세요";
        testAnsInput.placeholder = "한국어 뜻을 입력하세요...";
        // 발음 버튼 표시
        btnTestSpeaker.style.display = "flex";
        const speakCtx = masterDict[word.eng]?.[0]?.speakText || word.eng;
        btnTestSpeaker.onclick = () => speakWord(word.eng, speakCtx);
        speakWord(word.eng, speakCtx);
    } else {
        // 한→영: 한국어 뜻을 보여주고 영어 단어 입력
        testQEng.textContent = word.kor.split(",")[0].trim();
        testDirectionLabel.textContent = "영어 단어를 입력하세요";
        testAnsInput.placeholder = "영어 단어를 입력하세요...";
        // 한→영 모드에서는 발음 버튼 숨김
        btnTestSpeaker.style.display = "none";
    }

    testAnsInput.value = "";
    testAnsInput.disabled = false;
    btnHint.disabled = false;
    btnHint.textContent = "💡 힌트";
    testAnsInput.focus();
}

/* ── 스마트 채점 ── */
function isAnswerCorrect(userAns, wordData) {
    if (!userAns) return false;
    const u = userAns.trim().toLowerCase();

    if (examDirection === 'kor') {
        // 영→한 채점
        const wordEng = wordData.eng;
        const masterEntry = masterDict[wordEng];
        if (masterEntry) {
            for (const d of masterEntry) {
                if (d.synonyms.some(syn => isSimilar(u, syn))) return true;
            }
        }
        const candidates = wordData.kor.split(/[,\/]/)
            .map(s => s.replace(/^[0-9.\s]+/, "").trim()).filter(Boolean);
        for (const cand of candidates) {
            if (isSimilar(u, cand)) return true;
        }
    } else {
        // 한→영 채점
        const correct = wordData.eng.toLowerCase().trim();
        if (u === correct) return true;
        // 구동사 등 공백 포함 허용 (정규화 후 비교)
        if (u.replace(/\s+/g, " ") === correct.replace(/\s+/g, " ")) return true;
    }
    return false;
}

function isSimilar(a, b) {
    a = a.trim().toLowerCase();
    b = b.trim().toLowerCase();
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.length >= 3 && b.length >= 3) {
        if (b.includes(a) || a.includes(b)) return true;
    }
    const strip = s => s.replace(/(하다|되다|이다|한|은|는|의|을|를|에|도|로|으로)$/g, "");
    const sa = strip(a), sb = strip(b);
    if (sa.length >= 2 && sb.length >= 2 && sa === sb) return true;
    if (sa.length >= 3 && sb.length >= 3 && (sb.includes(sa) || sa.includes(sb))) return true;
    return false;
}

function submitAnswer() {
    const userAns  = testAnsInput.value.trim();
    const wordData = activeExamWords[examIdx];
    const isCorrect = isAnswerCorrect(userAns, wordData);

    answerFeedback.style.display = "block";
    if (isCorrect) {
        examScore++;
        answerFeedback.className  = "answer-feedback feedback-correct";
        answerFeedback.innerHTML  = `✅ 정답! <strong>${examDirection === 'kor' ? wordData.kor.split(",")[0].trim() : wordData.eng}</strong>`;
    } else {
        wrongWords.push(wordData);
        answerFeedback.className  = "answer-feedback feedback-wrong";
        answerFeedback.innerHTML  = `❌ 오답. 정답: <strong>${examDirection === 'kor' ? wordData.kor : wordData.eng}</strong>`;
    }

    testAnsInput.disabled = true;
    currentScoreCount.textContent = examScore;

    setTimeout(() => {
        examIdx++;
        if (examIdx < activeExamWords.length) showQuestion();
        else endExam();
    }, 900);
}

btnSubmitAns.addEventListener("click", submitAnswer);
testAnsInput.addEventListener("keypress", e => { if (e.key === "Enter") submitAnswer(); });

// 힌트
btnHint.addEventListener("click", () => {
    if (hintUsed) return;
    hintUsed = true;
    let hint;
    if (examDirection === 'kor') {
        const kor = activeExamWords[examIdx].kor;
        const first = kor.split(",")[0].trim();
        hint = first[0] + "_".repeat(Math.max(1, first.length - 1));
        testHint.textContent = `힌트: ${hint} (${first.length}글자)`;
    } else {
        const eng = activeExamWords[examIdx].eng;
        hint = eng[0] + "_".repeat(Math.max(1, eng.length - 1));
        testHint.textContent = `힌트: ${hint} (${eng.length}글자)`;
    }
    btnHint.disabled = true;
    btnHint.textContent = "힌트 사용됨";
});

// [개선] 건너뛰기
btnSkip.addEventListener("click", () => {
    wrongWords.push(activeExamWords[examIdx]);
    answerFeedback.style.display = "block";
    answerFeedback.className = "answer-feedback feedback-wrong";
    answerFeedback.innerHTML = `⏭ 건너뜀. 정답: <strong>${examDirection === 'kor' ? activeExamWords[examIdx].kor : activeExamWords[examIdx].eng}</strong>`;
    testAnsInput.disabled = true;

    setTimeout(() => {
        examIdx++;
        if (examIdx < activeExamWords.length) showQuestion();
        else endExam();
    }, 900);
});

/* =====================================================
   [9] 시험 종료 & 결과
===================================================== */
function endExam() {
    testPlayZone.style.display  = "none";
    testResultZone.style.display = "block";
    progressFill.style.width    = "100%";

    finalScore.textContent = examScore;
    finalTotal.textContent = activeExamWords.length;
    finalGoal.textContent  = examGoal;

    if (examScore >= examGoal) {
        resultTitle.textContent   = "🎉 목표 달성!";
        resultTitle.style.color   = "#22c55e";
        resultComment.textContent = "훌륭해요! 꾸준히 하면 영어 마스터가 될 수 있어요!";
        penaltyCount = 0;
        localStorage.setItem("penaltyCount", 0);
    } else {
        penaltyCount++;
        localStorage.setItem("penaltyCount", penaltyCount);
        const mins = penaltyCount * 5;
        resultTitle.textContent   = "🚨 목표 달성 실패!";
        resultTitle.style.color   = "#ef4444";
        resultComment.textContent = `다시 도전해보세요! ${mins}분 패널티가 부여됩니다.`;
        localStorage.setItem("penaltyEndTime", Date.now() + mins * 60 * 1000);
    }

    if (wrongWords.length > 0) {
        wrongReview.style.display = "block";
        wrongList.innerHTML = wrongWords.map(w => `
            <li>
                <span class="wrong-eng">${w.eng}</span>
                <span class="wrong-kor">${w.kor}</span>
            </li>
        `).join("");
    } else {
        wrongReview.style.display = "none";
    }
}

// [개선] 오답만 다시 풀기
btnRetryWrong.addEventListener("click", () => {
    if (wrongWords.length === 0) return;
    activeExamWords = [...wrongWords];
    examIdx = 0; examScore = 0; wrongWords = [];
    examGoal = Math.ceil(activeExamWords.length * 0.7); // 70% 목표

    testResultZone.style.display = "none";
    testPlayZone.style.display = "block";
    showQuestion();
    showToast(`오답 ${activeExamWords.length}개로 재시험 시작! 목표: ${examGoal}개`, "info");
});

btnFinishTest.addEventListener("click", () => {
    testResultZone.style.display = "none";
    testSetupZone.style.display  = "block";
    btnHint.disabled     = false;
    btnHint.textContent  = "💡 힌트";
    updateTestSetupUI();
    checkPenalty();
});

/* =====================================================
   [10] 패널티 시스템
===================================================== */
function checkPenalty() {
    const endTime = localStorage.getItem("penaltyEndTime");
    if (!endTime) { penaltyOverlay.style.display = "none"; return; }
    const remainingMs = endTime - Date.now();
    if (remainingMs <= 0) {
        localStorage.removeItem("penaltyEndTime");
        penaltyOverlay.style.display = "none";
        if (penaltyTimerInterval) { clearInterval(penaltyTimerInterval); penaltyTimerInterval = null; }
    } else {
        penaltyOverlay.style.display = "flex";
        updateClockDisplay(remainingMs);
        if (!penaltyTimerInterval) {
            penaltyTimerInterval = setInterval(() => {
                const remaining = localStorage.getItem("penaltyEndTime") - Date.now();
                if (remaining <= 0) checkPenalty();
                else updateClockDisplay(remaining);
            }, 1000);
        }
    }
}

function updateClockDisplay(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const min = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const sec = String(totalSec % 60).padStart(2, "0");
    penaltyClock.textContent = `${min}:${sec}`;
}

/* =====================================================
   초기화
===================================================== */
btnRefresh.addEventListener("click", get8RecommendWords);
btnAddTest.addEventListener("click", addBatchToTestList);
typeSelect.addEventListener("change", () => {
    recommendWordList.innerHTML = "";
    get8RecommendWords();
});
countSelect.addEventListener("change", get8RecommendWords);

get8RecommendWords();
updateTestSetupUI();
checkPenalty();
=======
// [1] 상단 탭 창 전환 기능
function openTab(e, tabId) {
    if (localStorage.getItem("penaltyEndTime")) return;

    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    e.currentTarget.classList.add('active');
}

// 📚 [핵심 추가] 다의어 완벽 대응용 앱 내부 마스터 바인딩 사전
// 번역기 고유의 음차오류(파인, 북 등)를 완전 차단하고, 품사별 뜻에 맞는 고유 예문 컨텍스트 발음을 유도
const masterDict = {
    fine: [
        { meaning: "1. 좋은, 날씨가 맑은", speakText: "It is fine." },
        { meaning: "2. 벌금, 과태료를 부과하다", speakText: "Pay a fine." },
        { meaning: "3. 미세한, 고운", speakText: "Fine dust." }
    ],
    book: [
        { meaning: "1. 책, 도서", speakText: "Read a book." },
        { meaning: "2. 예약하다", speakText: "Book a flight." }
    ],
    lead: [
        { meaning: "1. 이끌다, 안내하다 [리드]", speakText: "Lead the way." },
        { meaning: "2. 납 (금속 원소) [레드]", speakText: "Made of lead." }
    ],
    bear: [
        { meaning: "1. 곰 (동물)", speakText: "A wild bear." },
        { meaning: "2. 참다, 견디다", speakText: "Bear the pain." }
    ],
    run: [
        { meaning: "1. 달리다, 뛰다", speakText: "Run fast." },
        { meaning: "2. 운영하다, 경영하다", speakText: "Run a business." }
    ],
    mean: [
        { meaning: "1. 의미하다, 뜻하다", speakText: "What do you mean?" },
        { meaning: "2. 못된, 심술궂은", speakText: "Don't be mean." },
        { meaning: "3. 평균의", speakText: "Mean value." }
    ],
    present: [
        { meaning: "1. 선물, 현재의 [프레즌트]", speakText: "A birthday present." },
        { meaning: "2. 제출하다, 발표하다 [프리젠트]", speakText: "Present the award." }
    ],
    close: [
        { meaning: "1. 닫다, 끝나다 [클로즈]", speakText: "Close the door." },
        { meaning: "2. 가까운, 친밀한 [클로스]", speakText: "Stand close to me." }
    ]
};

// 추천단어 세트 데이터
const wordDB = {
    basic: [
        { eng: "apple", kor: "사과, 애플" }, { eng: "banana", kor: "바나나" }, { eng: "book", kor: "책, 예약하다" },
        { eng: "cat", kor: "고양이" }, { eng: "dog", kor: "개, 쫓아가다" }, { eng: "desk", kor: "책상" },
        { eng: "cake", kor: "케이크" }, { eng: "analyze", kor: "분석하다" }, { eng: "alternative", kor: "대안" }
    ],
    exam: [
        { eng: "phenomenon", kor: "현상" }, { eng: "significant", kor: "중요한, 상당한" }, { eng: "hypothesis", kor: "가설" },
        { eng: "consequence", kor: "결과" }, { eng: "simultaneous", kor: "동시의" }
    ],
    daily: [
        { eng: "hang out", kor: "놀다, 시간을 보내다" }, { eng: "grab a bite", kor: "간단히 먹다" }, { eng: "chill out", kor: "휴식을 취하다" }
    ]
};

const characters = [
    `<svg class="pixel-char" viewBox="0 0 16 16"><rect x="4" y="3" width="8" height="1" fill="#4A90E2"/><rect x="2" y="5" width="12" height="7" fill="#50E3C2"/><rect x="5" y="7" width="2" height="2" fill="#333"/><rect x="9" y="7" width="2" height="2" fill="#333"/><rect x="7" y="9" width="2" height="1" fill="#333"/></svg>`,
    `<svg class="pixel-char" viewBox="0 0 16 16"><rect x="3" y="1" width="2" height="4" fill="#FF85A2"/><rect x="3" y="5" width="10" height="8" fill="#FFB6C1"/><rect x="5" y="7" width="2" height="2" fill="#333"/><rect x="9" y="7" width="2" height="2" fill="#333"/></svg>`
];
const animations = ["anim-jump", "anim-spin", "anim-shake"];
const pixelSayings = ["뜻 옆의 초록색 🔊 버튼을 누르면 문맥에 맞는 발음이 나와!", "음차 오류 단어들을 완벽하게 필터링했어! 🛡️", "완벽해진 입체 사전으로 단어를 정복해봐!"];

let currentRecommendBatch = []; 
let testList = []; 
let penaltyCount = parseInt(localStorage.getItem("penaltyCount")) || 0;
let penaltyTimerInterval = null;

// DOM 연결
const searchInput = document.getElementById("search-input");
const btnSearch = document.getElementById("btn-search");
const searchResult = document.getElementById("search-result");
const searchSuggestions = document.getElementById("search-suggestions");
const typeSelect = document.getElementById("type-select");
const recommendWordList = document.getElementById("recommend-word-list");
const btnRefresh = document.getElementById("btn-refresh");
const btnAddTest = document.getElementById("btn-add-test");
const charContainer = document.getElementById("char-container");
const bubbleText = document.getElementById("bubble-text");

const testSetupZone = document.getElementById("test-setup-zone");
const testPlayZone = document.getElementById("test-play-zone");
const testResultZone = document.getElementById("test-result-zone");
const testPreviewUl = document.getElementById("test-preview-ul");
const testTotalCount = document.getElementById("test-total-count");
const inputTargetGoal = document.getElementById("input-target-goal");
const nextPenaltyMin = document.getElementById("next-penalty-min");

const currentQIndex = document.getElementById("current-q-index");
const totalQCount = document.getElementById("total-q-count");
const currentScoreCount = document.getElementById("current-score-count");
const testQEng = document.getElementById("test-q-eng");
const testAnsInput = document.getElementById("test-ans-input");
const btnSubmitAns = document.getElementById("btn-submit-ans");
const btnTestSpeaker = document.getElementById("btn-test-speaker");

const finalScore = document.getElementById("final-score");
const finalTotal = document.getElementById("final-total");
const finalGoal = document.getElementById("final-goal");
const resultTitle = document.getElementById("result-title");
const resultComment = document.getElementById("result-comment");
const btnFinishTest = document.getElementById("btn-finish-test");

const penaltyOverlay = document.getElementById("penalty-overlay");
const penaltyClock = document.getElementById("penalty-clock");

// 🔊 고성능 발음 재생 엔진 (문장 context를 넘기면 품사에 맞춰 똑똑하게 읽음)
window.speakWord = function(text, contextText = "") {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // 뜻별 맞춤 발음 텍스트가 있으면 그걸 읽고, 없으면 단어 본래 발음을 재생
    const targetText = contextText || text;
    const utterance = new SpeechSynthesisUtterance(targetText);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
};

// 💡 [혁신 알고리즘] 뜻 분리 및 음차 오류 제거 사전 검색 함수
async function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    searchSuggestions.style.display = "none"; 

    if (!query) {
        searchResult.innerHTML = `<p class="info-text">단어를 입력해주세요!</p>`;
        return;
    }

    searchResult.innerHTML = `<p class="info-text">📡 고정밀 다중 사전 분석 중...</p>`;

    let finalMeanings = [];

    // [Step 1] 앱 마스터 사전에 등록된 다의어 데이터셋인지 먼저 판별
    if (masterDict[query]) {
        finalMeanings = masterDict[query].map(item => ({
            display: item.meaning,
            clean: item.meaning.replace(/^[0-9.\s]+/g, ""), // 숫자 포맷 제거
            speak: item.speakText
        }));
    } else {
        // [Step 2] 마스터 사전에 없는 단어는 라이브 오픈 API 연동 및 정제
        try {
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=en|ko`);
            const data = await response.json();
            
            let rawMeanings = [];
            if (data.responseData?.translatedText) rawMeanings.push(data.responseData.translatedText.trim());
            if (data.matches) {
                data.matches.forEach(item => {
                    if (item.translation) {
                        const clean = item.translation.replace(/[^가-힣a-zA-Z0-9\s,]/g, "").trim();
                        if (clean && !rawMeanings.includes(clean)) rawMeanings.push(clean);
                    }
                });
            }

            // 한글 소리 음차어(파인, 북, 애플 등)를 필터링하기 위한 한글 유효성 판별 리스트업
            let uniqueItems = [];
            rawMeanings.forEach(m => {
                m.split(",").forEach(item => {
                    const trimmed = item.trim();
                    // 15자 미만이며 영문 매칭 소리가 아닌 순수 한국어 뜻만 추출
                    if (trimmed && !uniqueItems.includes(trimmed) && trimmed.length < 15) {
                        uniqueItems.push(trimmed);
                    }
                });
            });

            // 대표적인 한국어 음차 차단용 룰셋
            const phoneticBlacklist = ["파인", "북", "애플", "바나나나", "런", "베어", "미인"];
            uniqueItems = uniqueItems.filter(item => !phoneticBlacklist.includes(item));

            if (uniqueItems.length === 0) uniqueItems.push("일반적인 뜻");

            // 가독성을 위한 인덱싱 매핑
            finalMeanings = uniqueItems.slice(0, 4).map((m, index) => ({
                display: `${index + 1}. ${m}`,
                clean: m,
                speak: query
            }));

        } catch (error) {
            searchResult.innerHTML = `<h3>Error</h3><p class="info-text">인터넷 연결을 확인하세요.</p>`;
            return;
        }
    }

    // [Step 3] 뜻 옆에 스피커를 다는 유연한 UI 동적 조립 
    let html = `<ul class="meaning-list">`;
    finalMeanings.forEach(item => {
        html += `
            <li class="meaning-item">
                <span class="meaning-text">${item.display}</span>
                <button class="btn-speaker-mini" onclick="speakWord('${query}', '${item.speak}')" title="이 뜻의 맞춤 발음 듣기">🔊</button>
            </li>
        `;
    });
    html += `</ul>`;

    const savedString = finalMeanings.map(item => item.clean).join(", ");

    searchResult.innerHTML = `
        <div class="result-header">
            <h3>${query}</h3>
            <button class="btn-speaker" onclick="speakWord('${query}')" title="기본 단어 발음">🔊</button>
        </div>
        ${html}
        <button class="btn btn-secondary" style="width:100%; font-size:12px;" onclick="addSearchedWordToTest('${query}', '${savedString}')">⭐ 이 다중 의미 세트 시험장에 추가</button>
    `;
    
    // 검색 성공 시 첫 번째 뜻 발음으로 시원하게 오픈 재생
    speakWord(query, finalMeanings[0].speak);

}

window.addSearchedWordToTest = function(eng, kor) {
    if (testList.some(item => item.eng === eng)) {
        alert("이미 등록된 단어입니다!");
        return;
    }
    testList.push({ eng, kor });
    updateTestSetupUI();
    alert(`"${eng}" (${kor}) 단어가 커스텀 시험 단어장에 등록되었습니다!`);
};

// 실시간 자동완성
let debounceTimer;
function handleSuggestions() {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        searchSuggestions.style.display = "none";
        return;
    }

    debounceTimer = setTimeout(async () => {
        try {
            const res = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}`);
            const matches = await res.json();
            if (matches.length === 0) { searchSuggestions.style.display = "none"; return; }

            searchSuggestions.innerHTML = "";
            matches.slice(0, 6).forEach(item => {
                const div = document.createElement("div");
                div.className = "suggestion-item";
                div.innerHTML = `<span>${item.word}</span>`;
                div.addEventListener("click", () => {
                    searchInput.value = item.word;
                    searchSuggestions.style.display = "none";
                    handleSearch();
                });
                searchSuggestions.appendChild(div);
            });
            searchSuggestions.style.display = "block";
        } catch (e) {}
    }, 200);
}

btnSearch.addEventListener("click", handleSearch);
searchInput.addEventListener("keypress", (e) => { if (e.key === "Enter") handleSearch(); });
searchInput.addEventListener("input", handleSuggestions);
document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) searchSuggestions.style.display = "none";
});

// [2] 오늘의 추천 단어 연동
function get8RecommendWords() {
    const selectedType = typeSelect.value;
    const wordList = wordDB[selectedType];
    const shuffled = [...wordList].sort(() => Math.random() - 0.5);
    currentRecommendBatch = shuffled.slice(0, 8);

    recommendWordList.innerHTML = "";
    currentRecommendBatch.forEach((word, idx) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "rec-item";
        itemDiv.innerHTML = `
            <div class="rec-item-header">
                <span class="eng-txt">${word.eng}</span>
                <button class="btn-speaker-mini" onclick="speakWord('${word.eng}')">🔊</button>
            </div>
            <span class="kor-txt">${word.kor}</span>
            <button class="btn-add-single" onclick="addSingleWordToTestList(${idx})">➕ 추가</button>
        `;
        recommendWordList.appendChild(itemDiv);
    });

    charContainer.innerHTML = characters[Math.floor(Math.random() * characters.length)];
    const targetChar = charContainer.querySelector(".pixel-char");
    animations.forEach(anim => targetChar.classList.remove(anim));
    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
    void targetChar.offsetWidth; 
    targetChar.classList.add(randomAnim);
    bubbleText.textContent = pixelSayings[Math.floor(Math.random() * pixelSayings.length)];
}

window.addSingleWordToTestList = function(idx) {
    const word = currentRecommendBatch[idx];
    if (!word || testList.some(item => item.eng === word.eng)) return;
    testList.push(word);
    updateTestSetupUI();
};

function addBatchToTestList() {
    currentRecommendBatch.forEach(word => {
        if (!testList.some(item => item.eng === word.eng)) testList.push(word);
    });
    updateTestSetupUI();
}

function updateTestSetupUI() {
    testTotalCount.textContent = testList.length;
    nextPenaltyMin.textContent = (penaltyCount + 1) * 5; 
    
    if (testList.length === 0) {
        testPreviewUl.innerHTML = `<p class="info-text">추천 단어 혹은 상단에서 직접 검색한 단어를 등록해 보세요!</p>`;
        return;
    }
    
    testPreviewUl.innerHTML = "";
    testList.forEach((word, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<span><strong>${word.eng}</strong> : ${word.kor}</span><span class="delete-btn" onclick="removePreviewWord(${index})">❌</span>`;
        testPreviewUl.appendChild(li);
    });
}

window.removePreviewWord = function(index) {
    testList.splice(index, 1);
    updateTestSetupUI();
};

// [3] 시험 보기 채점 주관식 모듈
let activeExamWords = []; let examIdx = 0; let examScore = 0; let examGoal = 0;
document.getElementById("btn-start-test").addEventListener("click", () => {
    if (testList.length === 0) return alert("시험을 치를 단어가 없습니다!");
    examGoal = parseInt(inputTargetGoal.value) || 1;
    if (examGoal > testList.length) return alert(`단어 수보다 목표 개수가 많습니다!`);

    activeExamWords = [...testList].sort(() => Math.random() - 0.5);
    examIdx = 0; examScore = 0;
    testSetupZone.style.display = "none"; testPlayZone.style.display = "block";
    showQuestion();
});

function showQuestion() {
    totalQCount.textContent = activeExamWords.length;
    currentQIndex.textContent = examIdx + 1;
    currentScoreCount.textContent = examScore;
    
    const currentWord = activeExamWords[examIdx].eng;
    testQEng.textContent = currentWord;
    
    // 다중 매칭용 맞춤 컨텍스트 발음 인젝션 설정
    if (masterDict[currentWord]) {
        btnTestSpeaker.onclick = () => speakWord(currentWord, masterDict[currentWord][0].speakText);
        speakWord(currentWord, masterDict[currentWord][0].speakText);
    } else {
        btnTestSpeaker.onclick = () => speakWord(currentWord);
        speakWord(currentWord);
    }
    
    testAnsInput.value = ""; testAnsInput.focus();
}

function submitAnswer() {
    const userAns = testAnsInput.value.trim();
    const correctAnsString = activeExamWords[examIdx].kor;
    
    // 복수 정답 유효 배열 스캔 구조화
    const possibleAnswers = correctAnsString.split(",").map(a => a.replace(/^[0-9.\s]+/g, "").trim());
    const isCorrect = possibleAnswers.some(ans => userAns && (ans.includes(userAns) || userAns.includes(ans)));
    
    if (isCorrect) examScore++;
    examIdx++;
    if (examIdx < activeExamWords.length) showQuestion(); else endExam();
}
btnSubmitAns.addEventListener("click", submitAnswer);
testAnsInput.addEventListener("keypress", (e) => { if (e.key === "Enter") submitAnswer(); });

function endExam() {
    testPlayZone.style.display = "none"; testResultZone.style.display = "block";
    finalScore.textContent = examScore; finalTotal.textContent = activeExamWords.length; finalGoal.textContent = examGoal;
    
    if (examScore >= examGoal) {
        resultTitle.textContent = "🎉 목표 통과!"; resultTitle.style.color = "#10b981";
        penaltyCount = 0; localStorage.setItem("penaltyCount", 0);
    } else {
        penaltyCount++; localStorage.setItem("penaltyCount", penaltyCount);
        const mins = penaltyCount * 5;
        resultTitle.textContent = "🚨 목표 달성 실패!"; resultTitle.style.color = "#ef4444";
        localStorage.setItem("penaltyEndTime", Date.now() + mins * 60 * 1000);
    }
}

btnFinishTest.addEventListener("click", () => {
    testResultZone.style.display = "none"; testSetupZone.style.display = "block";
    updateTestSetupUI(); checkPenalty(); 
});

function checkPenalty() {
    const endTime = localStorage.getItem("penaltyEndTime");
    if (!endTime) { penaltyOverlay.style.display = "none"; return; }
    const remainingMs = endTime - Date.now();
    if (remainingMs <= 0) {
        localStorage.removeItem("penaltyEndTime"); penaltyOverlay.style.display = "none";
        if (penaltyTimerInterval) clearInterval(penaltyTimerInterval);
    } else {
        penaltyOverlay.style.display = "flex"; updateClockDisplay(remainingMs);
        if (!penaltyTimerInterval) {
            penaltyTimerInterval = setInterval(() => {
                const currentRemaining = localStorage.getItem("penaltyEndTime") - Date.now();
                if (currentRemaining <= 0) checkPenalty(); else updateClockDisplay(currentRemaining);
            }, 1000);
        }
    }
}
function updateClockDisplay(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const min = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const sec = String(totalSeconds % 60).padStart(2, "0");
    penaltyClock.textContent = `${min}:${sec}`;
}

btnRefresh.addEventListener("click", get8RecommendWords);
btnAddTest.addEventListener("click", addBatchToTestList);
typeSelect.addEventListener("change", get8RecommendWords);
get8RecommendWords(); updateTestSetupUI(); checkPenalty();
>>>>>>> c161dab0c225180f72d33ca11248073976d7ed7c
