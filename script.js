/* =====================================================
   영단어 마스터 - 개선판
   개선 항목:
   1. [보안] API 키 → 서버 프록시(/api/recommend)로 이동
   2. [구조] 전역 상태를 State 객체 하나로 통합 관리
   3. [UX]   alert() → 커스텀 토스트 알림으로 교체
   4. [데이터] 단어 DB 중복 항목 제거
   5. [이벤트] 인라인 onclick → addEventListener 위임 방식
   6. [모바일] 안전 영역 & 터치 피드백 추가
===================================================== */

/* =====================================================
   [0] 전역 상태 — 하나의 객체로 통합 관리
===================================================== */
const State = {
    // 추천 탭
    recommend: {
        batch:     [],                   // 현재 추천 단어 목록
        usedWords: {                     // 카테고리별 이미 추천된 단어 추적
            basic: new Set(), exam: new Set(), daily: new Set(),
            toeic: new Set(), advanced: new Set()
        }
    },

    // 시험 탭
    testList: [],                        // 시험 단어장

    // 시험 진행
    exam: {
        words:    [],                    // 출제 단어 목록
        idx:      0,                     // 현재 문제 인덱스
        score:    0,                     // 현재 점수
        goal:     0,                     // 목표 점수
        wrong:    [],                    // 오답 목록
        hintUsed: false                  // 힌트 사용 여부
    },

    // 패널티
    penalty: {
        count:    parseInt(localStorage.getItem("penaltyCount")) || 0,
        interval: null
    }
};

/* =====================================================
   [1] 마스터 다의어 사전
===================================================== */
const masterDict = {
    fine:    [
        { meaning: "좋은, 맑은",     pos: "adj",  speakText: "It is fine.",   synonyms: ["좋은","맑은","괜찮은","훌륭한"] },
        { meaning: "벌금, 과태료",   pos: "n/v",  speakText: "Pay a fine.",   synonyms: ["벌금","과태료","벌칙"] },
        { meaning: "미세한, 고운",   pos: "adj",  speakText: "Fine dust.",    synonyms: ["미세한","고운","섬세한"] }
    ],
    book:    [
        { meaning: "책, 도서",       pos: "n",    speakText: "Read a book.",  synonyms: ["책","도서","서적"] },
        { meaning: "예약하다",        pos: "v",    speakText: "Book a flight.",synonyms: ["예약하다","예약","부킹"] }
    ],
    lead:    [
        { meaning: "이끌다, 안내하다",pos: "v",    speakText: "Lead the way.", synonyms: ["이끌다","인도하다","안내하다","리드하다"] },
        { meaning: "납 (금속)",      pos: "n",    speakText: "Made of lead.", synonyms: ["납","납성분","금속"] }
    ],
    bear:    [
        { meaning: "곰",             pos: "n",    speakText: "A wild bear.",  synonyms: ["곰"] },
        { meaning: "참다, 견디다",   pos: "v",    speakText: "Bear the pain.",synonyms: ["참다","견디다","버티다","감내하다"] }
    ],
    run:     [
        { meaning: "달리다, 뛰다",   pos: "v",    speakText: "Run fast.",     synonyms: ["달리다","뛰다","달리기"] },
        { meaning: "운영하다",        pos: "v",    speakText: "Run a business.",synonyms: ["운영하다","경영하다","관리하다","운영"] }
    ],
    mean:    [
        { meaning: "의미하다",        pos: "v",    speakText: "What do you mean?", synonyms: ["의미하다","뜻하다","의미","뜻"] },
        { meaning: "못된, 심술궂은", pos: "adj",  speakText: "Don't be mean.",    synonyms: ["못된","심술궂은","나쁜","못됐다"] },
        { meaning: "평균",            pos: "n",    speakText: "Mean value.",        synonyms: ["평균","중간값"] }
    ],
    present: [
        { meaning: "선물, 현재의",   pos: "n/adj",speakText: "A birthday present.", synonyms: ["선물","현재","지금","현재의"] },
        { meaning: "발표하다",        pos: "v",    speakText: "Present the award.",  synonyms: ["발표하다","제출하다","제시하다","발표"] }
    ],
    close:   [
        { meaning: "닫다, 끝내다",   pos: "v",    speakText: "Close the door.",    synonyms: ["닫다","끝내다","폐쇄하다","닫기"] },
        { meaning: "가까운, 친밀한", pos: "adj",  speakText: "Stand close to me.", synonyms: ["가까운","친밀한","근접한","가까이"] }
    ],
    kind:    [
        { meaning: "친절한, 다정한", pos: "adj",  speakText: "She is kind.",        synonyms: ["친절한","다정한","친절","상냥한"] },
        { meaning: "종류, 유형",     pos: "n",    speakText: "What kind is this?",  synonyms: ["종류","유형","타입","종"] }
    ],
    light:   [
        { meaning: "빛, 불빛",       pos: "n",    speakText: "Turn on the light.",  synonyms: ["빛","불빛","광","조명"] },
        { meaning: "가벼운",          pos: "adj",  speakText: "Light as a feather.", synonyms: ["가벼운","가볍다"] },
        { meaning: "밝은, 연한",     pos: "adj",  speakText: "Light blue.",         synonyms: ["밝은","연한","연"] }
    ]
};

/* =====================================================
   [2] 단어 DB (중복 제거 완료)
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
        {eng:"phenomenon",kor:"현상, 경이로운 것"},{eng:"significant",kor:"중요한, 상당한"},
        {eng:"hypothesis",kor:"가설"},{eng:"consequence",kor:"결과, 영향"},
        {eng:"simultaneous",kor:"동시의"},{eng:"perspective",kor:"관점, 시각"},
        {eng:"comprehensive",kor:"포괄적인, 종합적인"},{eng:"fundamental",kor:"근본적인, 기초적인"},
        {eng:"substantial",kor:"상당한, 실질적인"},{eng:"perceive",kor:"인지하다, 인식하다"},
        {eng:"elaborate",kor:"정교한, 자세히 설명하다"},{eng:"relevant",kor:"관련있는, 적절한"},
        {eng:"despite",kor:"~에도 불구하고"},{eng:"whereas",kor:"~인 반면에"},
        {eng:"thereby",kor:"그렇게 함으로써"},{eng:"moreover",kor:"게다가, 더욱이"},
        {eng:"nevertheless",kor:"그럼에도 불구하고"},{eng:"consistent",kor:"일관된, 지속적인"},
        {eng:"contrast",kor:"대조, 대비하다"},{eng:"emphasize",kor:"강조하다"},
        {eng:"imply",kor:"암시하다, 시사하다"},{eng:"inherit",kor:"물려받다, 상속받다"},
        {eng:"diminish",kor:"줄어들다, 약해지다"},{eng:"accommodate",kor:"수용하다, 맞추다"},
        {eng:"ambiguous",kor:"모호한, 애매한"},{eng:"inevitable",kor:"불가피한, 피할 수 없는"},
        {eng:"predominant",kor:"우세한, 지배적인"},{eng:"arbitrary",kor:"임의적인, 자의적인"},
        {eng:"controversy",kor:"논란, 논쟁"},{eng:"subsequent",kor:"그 이후의, 뒤이은"},
        {eng:"reluctant",kor:"꺼리는, 마지못한"},{eng:"sufficient",kor:"충분한"},
        {eng:"portray",kor:"묘사하다, 나타내다"},{eng:"advocate",kor:"지지자, 옹호하다"},
        {eng:"revise",kor:"수정하다, 개정하다"},{eng:"dilemma",kor:"딜레마, 진퇴양난"},
        {eng:"abolish",kor:"폐지하다"},{eng:"coherent",kor:"일관성있는, 논리적인"},
        {eng:"paradox",kor:"역설, 모순"}
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
        {eng:"basically",kor:"기본적으로, 사실상"},{eng:"literally",kor:"말 그대로, 정말로"}
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
        {eng:"workforce",kor:"인력, 노동력"}
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
        {eng:"ubiquitous",kor:"어디에나 있는, 편재하는"},{eng:"vehement",kor:"격렬한, 맹렬한"}
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
   [4] 토스트 알림 — alert() 대체
===================================================== */
function showToast(message, type = "info") {
    // 기존 토스트 제거
    document.querySelectorAll(".toast").forEach(t => t.remove());

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 강제 리플로우 후 진입 애니메이션
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add("toast-show"));
    });

    setTimeout(() => {
        toast.classList.remove("toast-show");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 2400);
}

/* =====================================================
   [5] 탭 전환 — 이벤트 위임
===================================================== */
document.querySelector(".tab-menu").addEventListener("click", e => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    if (localStorage.getItem("penaltyEndTime")) return;

    const tabId = btn.dataset.tab;
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
    btn.classList.add("active");
});

/* =====================================================
   [6] 목표값 조절
===================================================== */
window.adjustGoal = function(delta) {
    const inp = document.getElementById("input-target-goal");
    inp.value = Math.max(1, (parseInt(inp.value) || 1) + delta);
};

/* =====================================================
   [7] 발음 엔진
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
   [8] 검색 기능
===================================================== */
const searchInput      = document.getElementById("search-input");
const btnSearch        = document.getElementById("btn-search");
const searchResult     = document.getElementById("search-result");
const searchSuggestions = document.getElementById("search-suggestions");

async function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    searchSuggestions.style.display = "none";

    if (!query) { showToast("단어를 입력해주세요!", "warn"); return; }

    searchResult.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <span>검색 중...</span>
        </div>`;

    // 마스터 사전 우선
    if (masterDict[query]) {
        renderSearchResult(query, masterDict[query].map(d => ({
            pos: d.pos, meaning: d.meaning,
            example: d.speakText, speakText: d.speakText, synonyms: d.synonyms
        })), "내장 사전");
        speakWord(query, masterDict[query][0].speakText);
        return;
    }

    // Free Dictionary API
    try {
        const res  = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
        const data = await res.json();

        if (Array.isArray(data) && data[0]?.meanings) {
            const entry    = data[0];
            const phonetic = entry.phonetics?.find(p => p.text)?.text || "";
            const rawMeanings = [];

            entry.meanings.forEach(m => {
                m.definitions.slice(0, 2).forEach(def => {
                    rawMeanings.push({
                        pos: m.partOfSpeech, defEn: def.definition,
                        example: def.example || "", speakText: def.example || query, synonyms: []
                    });
                });
            });

            const translated = await Promise.all(
                rawMeanings.slice(0, 5).map(m =>
                    translateToKorean(m.defEn).then(kor => ({ ...m, meaning: kor }))
                )
            );

            renderSearchResult(query, translated, "Dictionary API", phonetic);
            speakWord(query);
            return;
        }
    } catch (_) { /* fallback */ }

    // MyMemory fallback
    try {
        const res  = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=en|ko`);
        const data = await res.json();

        const meanings = [];
        const raw = data.responseData?.translatedText?.trim();
        if (raw) meanings.push({ pos: "", meaning: raw, speakText: query, synonyms: [] });

        if (data.matches) {
            data.matches.slice(0, 4).forEach(m => {
                const k = m.translation?.trim();
                if (k && /[가-힣]/.test(k) && !meanings.some(x => x.meaning === k))
                    meanings.push({ pos: "", meaning: k, speakText: query, synonyms: [] });
            });
        }

        if (meanings.length === 0) {
            searchResult.innerHTML = `<p class="info-text">⚠️ "${query}" 단어를 찾을 수 없습니다.</p>`;
            return;
        }

        renderSearchResult(query, meanings, "MyMemory");
        speakWord(query);
    } catch (_) {
        searchResult.innerHTML = `<p class="info-text">⚠️ 인터넷 연결을 확인하세요.</p>`;
    }
}

async function translateToKorean(text) {
    try {
        const res  = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`);
        const data = await res.json();
        const t    = data.responseData?.translatedText?.trim();
        return (t && /[가-힣]/.test(t)) ? t : text;
    } catch (_) { return text; }
}

function renderSearchResult(query, meanings, source, phonetic = "") {
    const savedKor = meanings.map(m => m.meaning).join(", ");
    const safeQuery = query.replace(/'/g, "");

    const meaningsHtml = meanings.map(m => `
        <li class="meaning-item">
            <div class="meaning-left">
                ${m.pos ? `<span class="meaning-pos">${m.pos}</span>` : ""}
                <span class="meaning-text">${m.meaning}</span>
                ${m.example ? `<span class="meaning-example">"${m.example}"</span>` : ""}
            </div>
            <button class="btn-speaker-mini"
                data-word="${safeQuery}"
                data-speak="${(m.speakText || query).replace(/'/g, "")}"
                title="발음 듣기">🔊</button>
        </li>`).join("");

    searchResult.innerHTML = `
        <div class="result-header">
            <div class="result-word-info">
                <h3>${query}</h3>
                ${phonetic ? `<span class="result-phonetic">${phonetic}</span>` : ""}
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span class="source-badge">${source}</span>
                <button class="btn-speaker" data-word="${safeQuery}" title="발음 듣기">🔊</button>
            </div>
        </div>
        <ul class="meaning-list">${meaningsHtml}</ul>
        <button class="btn btn-secondary" style="width:100%;font-size:12px;"
            data-action="add-to-test"
            data-eng="${safeQuery}"
            data-kor="${savedKor.replace(/"/g, "&quot;")}">
            ⭐ 시험 단어장에 추가
        </button>`;
}

// 검색 결과 내 클릭 이벤트 위임
searchResult.addEventListener("click", e => {
    const speakerBtn = e.target.closest("[data-speak]");
    if (speakerBtn) { speakWord(speakerBtn.dataset.word, speakerBtn.dataset.speak); return; }

    const mainSpeaker = e.target.closest(".btn-speaker[data-word]");
    if (mainSpeaker) { speakWord(mainSpeaker.dataset.word); return; }

    const addBtn = e.target.closest("[data-action='add-to-test']");
    if (addBtn) { addSearchedWordToTest(addBtn.dataset.eng, addBtn.dataset.kor); }
});

function addSearchedWordToTest(eng, kor) {
    if (State.testList.some(item => item.eng === eng)) {
        showToast("이미 등록된 단어입니다!", "warn"); return;
    }
    State.testList.push({ eng, kor });
    updateTestSetupUI();
    showToast(`"${eng}" 단어가 추가되었습니다! ⭐`, "success");
}

// 자동완성
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
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") handleSearch(); });
searchInput.addEventListener("input", handleSuggestions);
document.addEventListener("click", e => {
    if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target))
        searchSuggestions.style.display = "none";
});

/* =====================================================
   [9] AI 추천 단어 — 서버 프록시 경유 (/api/recommend)
        (직접 배포 없이 테스트 시 로컬 DB 자동 fallback)
===================================================== */
const categoryNames = {
    basic:    "기초 필수 영단어",
    exam:     "수능·모의고사 대비 영단어",
    daily:    "영어 일상 표현",
    toeic:    "토익 핵심 비즈니스 영단어",
    advanced: "고급 학문적 영어 어휘"
};

const typeSelect    = document.getElementById("type-select");
const countSelect   = document.getElementById("count-select");
const recommendWordList = document.getElementById("recommend-word-list");
const charContainer = document.getElementById("char-container");
const bubbleText    = document.getElementById("bubble-text");

async function fetchRecommendWords() {
    const type  = typeSelect.value;
    const count = parseInt(countSelect.value) || 8;

    recommendWordList.innerHTML = Array(count).fill(`<div class="skeleton-card"></div>`).join("");
    bubbleText.textContent = "AI가 새 단어를 골라오는 중...";
    playCharAnim();

    const usedList = [...State.recommend.usedWords[type]].slice(-60).join(", ");
    const prompt = `당신은 영어 교육 전문가입니다.
다음 카테고리에 맞는 영단어 ${count}개를 추천해 주세요: ${categoryNames[type]}

규칙:
1. 이미 추천된 단어는 절대 포함하지 마세요: ${usedList || "없음"}
2. 각 단어마다 대표 한국어 뜻 1~3개(쉼표 구분)를 제공하세요.
3. JSON 배열만 출력하세요. 마크다운 없이 순수 JSON만 출력하세요.
4. 형식: [{"eng":"word","kor":"뜻1, 뜻2"}, ...]
5. 영단어는 소문자로, 구동사는 그대로 써주세요.`;

    try {
        // ── 서버 프록시 경유 (API 키 숨김) ──
        const response = await fetch("/api/recommend", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ prompt })
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data    = await response.json();
        const rawText = data.content?.map(c => c.text || "").join("") || "";
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("JSON not found");

        const words = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(words) || words.length === 0) throw new Error("Empty array");

        words.forEach(w => State.recommend.usedWords[type].add(w.eng));
        State.recommend.batch = words;
        renderRecommendList(words);
        bubbleText.textContent = `${categoryNames[type]} ${words.length}개 준비됐어! 🎉`;

    } catch (err) {
        // 서버 미실행 / AI 오류 시 → 로컬 DB fallback
        console.warn("AI API 실패, 로컬 DB 사용:", err.message);
        const pool   = wordDB[type] || wordDB.basic;
        const unused = pool.filter(w => !State.recommend.usedWords[type].has(w.eng));
        const source = unused.length >= count ? unused : pool;
        const words  = [...source].sort(() => Math.random() - 0.5).slice(0, count);

        words.forEach(w => State.recommend.usedWords[type].add(w.eng));
        State.recommend.batch = words;
        renderRecommendList(words);
        bubbleText.textContent = "로컬 단어장에서 불러왔어! 🎲";
    }
}

function renderRecommendList(words) {
    recommendWordList.innerHTML = "";
    words.forEach((word, idx) => {
        const div = document.createElement("div");
        div.className = "rec-item";
        div.dataset.idx = idx;
        div.innerHTML = `
            <div class="rec-item-header">
                <span class="eng-txt">${word.eng}</span>
                <button class="btn-speaker-mini" data-word="${word.eng.replace(/'/g, "")}" title="발음">🔊</button>
            </div>
            <span class="kor-txt">${word.kor}</span>
            <button class="btn-add-single" data-idx="${idx}">➕ 추가</button>
        `;
        recommendWordList.appendChild(div);
    });
}

// 추천 목록 클릭 위임
recommendWordList.addEventListener("click", e => {
    const speakerBtn = e.target.closest(".btn-speaker-mini[data-word]");
    if (speakerBtn) { speakWord(speakerBtn.dataset.word); return; }

    const addBtn = e.target.closest(".btn-add-single");
    if (addBtn) { addSingleWord(parseInt(addBtn.dataset.idx)); }
});

function addSingleWord(idx) {
    const word = State.recommend.batch[idx];
    if (!word) return;
    const btn = recommendWordList.querySelector(`[data-idx="${idx}"] .btn-add-single`);
    if (State.testList.some(item => item.eng === word.eng)) {
        if (btn) { btn.textContent = "✅ 추가됨"; btn.classList.add("added"); }
        return;
    }
    State.testList.push(word);
    updateTestSetupUI();
    if (btn) { btn.textContent = "✅ 추가됨"; btn.classList.add("added"); }
    showToast(`"${word.eng}" 추가됨 ⭐`, "success");
}

function addBatchToTestList() {
    let added = 0;
    State.recommend.batch.forEach((word, idx) => {
        if (!State.testList.some(item => item.eng === word.eng)) {
            State.testList.push(word);
            added++;
            const btn = recommendWordList.querySelector(`[data-idx="${idx}"] .btn-add-single`);
            if (btn) { btn.textContent = "✅ 추가됨"; btn.classList.add("added"); }
        }
    });
    updateTestSetupUI();
    showToast(`${added}개 단어가 추가되었습니다! 🎉`, "success");
}

function playCharAnim() {
    charContainer.innerHTML = characters[Math.floor(Math.random() * characters.length)];
    const char = charContainer.querySelector(".pixel-char");
    animations.forEach(a => char.classList.remove(a));
    void char.offsetWidth;
    char.classList.add(animations[Math.floor(Math.random() * animations.length)]);
}

/* =====================================================
   [10] 시험 단어장 UI
===================================================== */
const testPreviewUl  = document.getElementById("test-preview-ul");
const testTotalCount = document.getElementById("test-total-count");
const nextPenaltyMin = document.getElementById("next-penalty-min");

function updateTestSetupUI() {
    testTotalCount.textContent = State.testList.length;
    nextPenaltyMin.textContent = (State.penalty.count + 1) * 5;

    if (State.testList.length === 0) {
        testPreviewUl.innerHTML = `<p class="info-text" style="padding:10px 0;">추천 단어 또는 검색한 단어를 추가해 보세요!</p>`;
        return;
    }

    testPreviewUl.innerHTML = "";
    State.testList.forEach((word, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span><span class="word-eng">${word.eng}</span> &nbsp;${word.kor}</span>
            <span class="delete-btn" data-index="${index}">✕</span>
        `;
        testPreviewUl.appendChild(li);
    });
}

// 단어장 삭제 위임
testPreviewUl.addEventListener("click", e => {
    const delBtn = e.target.closest(".delete-btn");
    if (!delBtn) return;
    State.testList.splice(parseInt(delBtn.dataset.index), 1);
    updateTestSetupUI();
});

window.clearAllWords = function() {
    if (!State.testList.length) return;
    if (confirm("시험 단어장을 모두 비울까요?")) {
        State.testList = [];
        updateTestSetupUI();
    }
};

/* =====================================================
   [11] 시험 진행 — 스마트 채점
===================================================== */
const testSetupZone  = document.getElementById("test-setup-zone");
const testPlayZone   = document.getElementById("test-play-zone");
const testResultZone = document.getElementById("test-result-zone");
const inputTargetGoal = document.getElementById("input-target-goal");

const currentQIndex     = document.getElementById("current-q-index");
const totalQCount       = document.getElementById("total-q-count");
const currentScoreCount = document.getElementById("current-score-count");
const progressFill      = document.getElementById("progress-fill");
const testQEng          = document.getElementById("test-q-eng");
const testAnsInput      = document.getElementById("test-ans-input");
const btnSubmitAns      = document.getElementById("btn-submit-ans");
const btnTestSpeaker    = document.getElementById("btn-test-speaker");
const btnHint           = document.getElementById("btn-hint");
const testHint          = document.getElementById("test-hint");
const answerFeedback    = document.getElementById("answer-feedback");

document.getElementById("btn-start-test").addEventListener("click", () => {
    if (State.testList.length === 0) { showToast("시험 단어가 없습니다!", "warn"); return; }
    const goal = parseInt(inputTargetGoal.value) || 1;
    if (goal > State.testList.length) { showToast("목표 개수가 단어 수보다 많습니다!", "warn"); return; }

    State.exam.words    = [...State.testList].sort(() => Math.random() - 0.5);
    State.exam.idx      = 0;
    State.exam.score    = 0;
    State.exam.goal     = goal;
    State.exam.wrong    = [];

    testSetupZone.style.display = "none";
    testPlayZone.style.display  = "block";
    showQuestion();
});

function showQuestion() {
    const { exam } = State;
    totalQCount.textContent       = exam.words.length;
    currentQIndex.textContent     = exam.idx + 1;
    currentScoreCount.textContent = exam.score;
    progressFill.style.width      = `${(exam.idx / exam.words.length) * 100}%`;

    exam.hintUsed = false;
    testHint.textContent = "";
    answerFeedback.style.display = "none";
    answerFeedback.className     = "answer-feedback";

    const word    = exam.words[exam.idx].eng;
    const speakCtx = masterDict[word]?.[0]?.speakText || word;
    testQEng.textContent = word;

    btnTestSpeaker.onclick = () => speakWord(word, speakCtx);
    speakWord(word, speakCtx);

    testAnsInput.value    = "";
    testAnsInput.disabled = false;
    testAnsInput.focus();

    // 힌트 버튼 초기화
    btnHint.disabled    = false;
    btnHint.textContent = "💡 힌트";
}

function isSimilar(a, b) {
    a = a.trim(); b = b.trim();
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.length >= 3 && b.length >= 3 && (b.includes(a) || a.includes(b))) return true;
    const strip = s => s.replace(/(하다|되다|이다|한|은|는|의|을|를|에|도|로|으로)$/g, "");
    const sa = strip(a), sb = strip(b);
    if (sa.length >= 2 && sb.length >= 2 && sa === sb) return true;
    if (sa.length >= 3 && sb.length >= 3 && (sb.includes(sa) || sa.includes(sb))) return true;
    return false;
}

function isAnswerCorrect(userAns, correctKor) {
    if (!userAns) return false;
    const u = userAns.trim();

    // masterDict 동의어 검사
    const wordEng = State.exam.words[State.exam.idx].eng;
    const master  = masterDict[wordEng];
    if (master) {
        for (const d of master) {
            if (d.synonyms.some(syn => isSimilar(u, syn))) return true;
        }
    }

    // 저장된 뜻 분해 검사
    const candidates = correctKor
        .split(/[,\/]/)
        .map(s => s.replace(/^[0-9.\s]+/, "").trim())
        .filter(Boolean);

    return candidates.some(cand => isSimilar(u, cand));
}

function submitAnswer() {
    const userAns  = testAnsInput.value.trim();
    const wordData = State.exam.words[State.exam.idx];
    const isCorrect = isAnswerCorrect(userAns, wordData.kor);

    answerFeedback.style.display = "block";
    if (isCorrect) {
        State.exam.score++;
        answerFeedback.className = "answer-feedback feedback-correct";
        answerFeedback.innerHTML = `✅ 정답! <strong>${wordData.kor.split(",")[0].trim()}</strong>`;
    } else {
        State.exam.wrong.push(wordData);
        answerFeedback.className = "answer-feedback feedback-wrong";
        answerFeedback.innerHTML = `❌ 오답. 정답: <strong>${wordData.kor}</strong>`;
    }

    testAnsInput.disabled = true;
    currentScoreCount.textContent = State.exam.score;

    setTimeout(() => {
        State.exam.idx++;
        if (State.exam.idx < State.exam.words.length) showQuestion();
        else endExam();
    }, 900);
}

btnSubmitAns.addEventListener("click", submitAnswer);
testAnsInput.addEventListener("keydown", e => { if (e.key === "Enter") submitAnswer(); });

btnHint.addEventListener("click", () => {
    if (State.exam.hintUsed) return;
    State.exam.hintUsed = true;
    const first = State.exam.words[State.exam.idx].kor.split(",")[0].trim();
    testHint.textContent = `힌트: ${first[0]}${"_".repeat(Math.max(1, first.length - 1))} (${first.length}글자)`;
    btnHint.disabled    = true;
    btnHint.textContent = "힌트 사용됨";
});

/* =====================================================
   [12] 시험 종료 & 결과
===================================================== */
const finalScore    = document.getElementById("final-score");
const finalTotal    = document.getElementById("final-total");
const finalGoal     = document.getElementById("final-goal");
const resultTitle   = document.getElementById("result-title");
const resultComment = document.getElementById("result-comment");
const wrongReview   = document.getElementById("wrong-review");
const wrongList     = document.getElementById("wrong-list");

function endExam() {
    const { exam, penalty } = State;

    testPlayZone.style.display   = "none";
    testResultZone.style.display = "block";
    progressFill.style.width     = "100%";

    finalScore.textContent = exam.score;
    finalTotal.textContent = exam.words.length;
    finalGoal.textContent  = exam.goal;

    if (exam.score >= exam.goal) {
        resultTitle.textContent   = "🎉 목표 달성!";
        resultTitle.style.color   = "#22c55e";
        resultComment.textContent = "훌륭해요! 꾸준히 하면 영어 마스터가 될 수 있어요!";
        penalty.count = 0;
        localStorage.setItem("penaltyCount", 0);
    } else {
        penalty.count++;
        localStorage.setItem("penaltyCount", penalty.count);
        const mins = penalty.count * 5;
        resultTitle.textContent   = "🚨 목표 달성 실패!";
        resultTitle.style.color   = "#ef4444";
        resultComment.textContent = `다시 도전해보세요! ${mins}분 패널티가 부여됩니다.`;
        localStorage.setItem("penaltyEndTime", Date.now() + mins * 60 * 1000);
    }

    if (exam.wrong.length > 0) {
        wrongReview.style.display = "block";
        wrongList.innerHTML = exam.wrong.map(w => `
            <li>
                <span class="wrong-eng">${w.eng}</span>
                <span class="wrong-kor">${w.kor}</span>
            </li>`).join("");
    } else {
        wrongReview.style.display = "none";
    }
}

document.getElementById("btn-finish-test").addEventListener("click", () => {
    testResultZone.style.display = "none";
    testSetupZone.style.display  = "block";
    updateTestSetupUI();
    checkPenalty();
});

/* =====================================================
   [13] 패널티 시스템
===================================================== */
const penaltyOverlay = document.getElementById("penalty-overlay");
const penaltyClock   = document.getElementById("penalty-clock");

function checkPenalty() {
    const endTime = localStorage.getItem("penaltyEndTime");
    if (!endTime) { penaltyOverlay.style.display = "none"; return; }

    const remainingMs = endTime - Date.now();
    if (remainingMs <= 0) {
        localStorage.removeItem("penaltyEndTime");
        penaltyOverlay.style.display = "none";
        if (State.penalty.interval) {
            clearInterval(State.penalty.interval);
            State.penalty.interval = null;
        }
    } else {
        penaltyOverlay.style.display = "flex";
        updateClockDisplay(remainingMs);
        if (!State.penalty.interval) {
            State.penalty.interval = setInterval(() => {
                const remaining = localStorage.getItem("penaltyEndTime") - Date.now();
                if (remaining <= 0) checkPenalty();
                else updateClockDisplay(remaining);
            }, 1000);
        }
    }
}

function updateClockDisplay(ms) {
    const totalSec = Math.ceil(ms / 1000);
    penaltyClock.textContent =
        `${String(Math.floor(totalSec / 60)).padStart(2, "0")}:${String(totalSec % 60).padStart(2, "0")}`;
}

/* =====================================================
   초기화
===================================================== */
document.getElementById("btn-refresh").addEventListener("click", fetchRecommendWords);
document.getElementById("btn-add-test").addEventListener("click", addBatchToTestList);
typeSelect.addEventListener("change", () => { recommendWordList.innerHTML = ""; fetchRecommendWords(); });
countSelect.addEventListener("change", fetchRecommendWords);

fetchRecommendWords();
updateTestSetupUI();
checkPenalty();
