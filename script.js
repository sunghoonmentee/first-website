// [1] 상단 탭 창 전환 기능
function openTab(tabId) {
    if (localStorage.getItem("penaltyEndTime")) return;

    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// 데이터베이스 
const wordDB = {
    basic: [
        { eng: "analyze", kor: "분석하다" },
        { eng: "alternative", kor: "대안" },
        { eng: "improve", kor: "개선하다" },
        { eng: "manage", kor: "관리하다" },
        { eng: "frequently", kor: "자주" },
        { eng: "emphasis", kor: "강조" },
        { eng: "maintain", kor: "유지하다" },
        { eng: "accurate", kor: "정확한" },
        { eng: "acquire", kor: "획득하다" },
        { eng: "adapt", kor: "적응하다" },
        { eng: "complex", kor: "복잡한" },
        { eng: "evaluate", kor: "평가하다" }
    ],
    exam: [
        { eng: "phenomenon", kor: "현상" },
        { eng: "significant", kor: "중요한" },
        { eng: "hypothesis", kor: "가설" },
        { eng: "consequence", kor: "결과" },
        { eng: "simultaneous", kor: "동시의" },
        { eng: "substitute", kor: "대체하다" },
        { eng: "artificial", kor: "인공적인" },
        { eng: "predictable", kor: "예측 가능한" },
        { eng: "continuous", kor: "지속적인" },
        { eng: "theoretical", kor: "이론적인" },
        { eng: "empirical", kor: "경험적인" },
        { eng: "psychological", kor: "심리학적인" }
    ],
    daily: [
        { eng: "hang out", kor: "놀다" },
        { eng: "grab a bite", kor: "간단히 먹다" },
        { eng: "chill out", kor: "휴식을 취하다" },
        { eng: "count me in", kor: "나도 끼워줘" },
        { eng: "rings a bell", kor: "들어본 적이 있다" },
        { eng: "play it by ear", kor: "임기응변으로 정하다" },
        { eng: "cost an arm and a leg", kor: "너무 비싸다" },
        { eng: "hit the sack", kor: "자다" },
        { eng: "break a leg", kor: "행운을 빌어" },
        { eng: "under the weather", kor: "몸 상태가 안 좋은" },
        { eng: "spice things up", kor: "흥미진진하게 만들다" },
        { eng: "call it a day", kor: "하루를 마무리하다" }
    ]
};

const allWords = [...wordDB.basic, ...wordDB.exam, ...wordDB.daily];

// 픽셀 캐릭터 및 대사
const characters = [
    `<svg class="pixel-char" viewBox="0 0 16 16">
        <rect x="4" y="3" width="8" height="1" fill="#4A90E2"/><rect x="3" y="4" width="10" height="1" fill="#4A90E2"/>
        <rect x="2" y="5" width="12" height="7" fill="#50E3C2"/><rect x="5" y="7" width="2" height="2" fill="#333"/>
        <rect x="9" y="7" width="2" height="2" fill="#333"/><rect x="4" y="9" width="1" height="1" fill="#FF85A2"/>
        <rect x="11" y="9" width="1" height="1" fill="#FF85A2"/><rect x="7" y="9" width="2" height="1" fill="#333"/>
        <rect x="2" y="12" width="12" height="1" fill="#4A90E2"/>
    </svg>`,
    `<svg class="pixel-char" viewBox="0 0 16 16">
        <rect x="3" y="1" width="2" height="4" fill="#FF85A2"/><rect x="11" y="1" width="2" height="4" fill="#FF85A2"/>
        <rect x="3" y="5" width="10" height="8" fill="#FFB6C1"/><rect x="5" y="7" width="2" height="2" fill="#333"/>
        <rect x="9" y="7" width="2" height="2" fill="#333"/><rect x="7" y="9" width="2" height="1" fill="#BA55D3"/>
        <rect x="4" y="13" width="2" height="1" fill="#FF85A2"/><rect x="10" y="13" width="2" height="1" fill="#FF85A2"/>
    </svg>`,
    `<svg class="pixel-char" viewBox="0 0 16 16">
        <rect x="7" y="1" width="2" height="2" fill="#9B59B6"/><rect x="3" y="3" width="10" height="9" fill="#F1C40F"/>
        <rect x="4" y="4" width="8" height="5" fill="#34495E"/><rect x="5" y="5" width="2" height="2" fill="#2ECC71"/>
        <rect x="9" y="5" width="2" height="2" fill="#2ECC71"/><rect x="6" y="10" width="4" height="1" fill="#E74C3C"/>
        <rect x="4" y="12" width="2" height="2" fill="#7F8C8D"/><rect x="10" y="12" width="2" height="2" fill="#7F8C8D"/>
    </svg>`
];

const animations = ["anim-jump", "anim-spin", "anim-shake"];
const pixelSayings = ["정사각형이라 더 잘 보이지?", "원하는 단어만 쏙쏙 골라봐!", "마음에 드는 것만 추가해도 돼!", "이번 라인업 최고야!", "천천히 골라봐! ✨"];

let currentRecommendBatch = []; 
let testList = []; 

let penaltyCount = parseInt(localStorage.getItem("penaltyCount")) || 0;
let penaltyTimerInterval = null;

// DOM 연결
const searchInput = document.getElementById("search-input");
const btnSearch = document.getElementById("btn-search");
const searchResult = document.getElementById("search-result");

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

const finalScore = document.getElementById("final-score");
const finalTotal = document.getElementById("final-total");
const finalGoal = document.getElementById("final-goal");
const resultTitle = document.getElementById("result-title");
const resultComment = document.getElementById("result-comment");
const btnFinishTest = document.getElementById("btn-finish-test");

const penaltyOverlay = document.getElementById("penalty-overlay");
const penaltyClock = document.getElementById("penalty-clock");


// [2] 단어 검색 기능
function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
        searchResult.innerHTML = `<p class="info-text">단어를 입력해주세요!</p>`;
        return;
    }
    const found = allWords.find(item => item.eng.toLowerCase() === query);
    if (found) {
        searchResult.innerHTML = `<h3>${found.eng}</h3><p>${found.kor}</p>`;
    } else {
        searchResult.innerHTML = `<h3>"${query}"</h3><p class="info-text">데이터에 없는 단어입니다.</p>`;
    }
}
btnSearch.addEventListener("click", handleSearch);
searchInput.addEventListener("keypress", (e) => { if (e.key === "Enter") handleSearch(); });


// [3] 오늘의 추천 기능 (정사각형 카드 렌더링 및 개별 추가 이벤트 연결)
function get8RecommendWords() {
    const selectedType = typeSelect.value;
    const wordList = wordDB[selectedType];
    
    const shuffled = [...wordList].sort(() => Math.random() - 0.5);
    currentRecommendBatch = shuffled.slice(0, 8);

    recommendWordList.innerHTML = "";
    currentRecommendBatch.forEach((word, idx) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "rec-item";
        // ⚡ 하단에 개별 추가 버튼 탑재 (인덱스를 매개변수로 전달)
        itemDiv.innerHTML = `
            <span class="eng-txt">${word.eng}</span>
            <span class="kor-txt">${word.kor}</span>
            <button class="btn-add-single" onclick="addSingleWordToTestList(${idx})">➕ 추가</button>
        `;
        recommendWordList.appendChild(itemDiv);
    });

    // 캐릭터 변경 및 애니메이션
    charContainer.innerHTML = characters[Math.floor(Math.random() * characters.length)];
    const targetChar = charContainer.querySelector(".pixel-char");
    
    animations.forEach(anim => targetChar.classList.remove(anim));
    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
    void targetChar.offsetWidth; 
    targetChar.classList.add(randomAnim);

    bubbleText.textContent = pixelSayings[Math.floor(Math.random() * pixelSayings.length)];
}


// [4] ⚡ 단어 개별 추천 추가 로직 (새로 추가됨)
window.addSingleWordToTestList = function(idx) {
    const word = currentRecommendBatch[idx];
    if (!word) return;

    // 이미 들어가 있는 중복 단어 검사
    if (testList.some(item => item.eng === word.eng)) {
        bubbleText.textContent = `"${word.eng}"은(는) 이미 시험 단어장에 들어있어! 😮`;
        return;
    }

    testList.push(word);
    updateTestSetupUI();
    bubbleText.textContent = `"${word.eng}" 단어를 시험장에 쏙 넣었어! ⭐`;
};


// [5] 전체 단어 일괄 추가 기능 (유지됨)
function addBatchToTestList() {
    if (currentRecommendBatch.length === 0) return;
    
    let addedCount = 0;
    currentRecommendBatch.forEach(word => {
        if (!testList.some(item => item.eng === word.eng)) {
            testList.push(word);
            addedCount++;
        }
    });

    updateTestSetupUI();
    bubbleText.textContent = `현재 세트 중 새로운 단어 ${addedCount}개가 시험 단어장에 전부 추가됐어! 🚀`;
}

function updateTestSetupUI() {
    testTotalCount.textContent = testList.length;
    nextPenaltyMin.textContent = (penaltyCount + 1) * 5; 
    
    if (testList.length === 0) {
        testPreviewUl.innerHTML = `<p class="info-text">추천 메뉴에서 단어를 먼저 등록해 보세요!</p>`;
        return;
    }
    
    testPreviewUl.innerHTML = "";
    testList.forEach((word, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span><strong>${word.eng}</strong> : ${word.kor}</span>
            <span class="delete-btn" onclick="removePreviewWord(${index})">❌</span>
        `;
        testPreviewUl.appendChild(li);
    });
}

window.removePreviewWord = function(index) {
    testList.splice(index, 1);
    updateTestSetupUI();
};


// --- 주관식 엔진 ---
let activeExamWords = [];
let examIdx = 0;
let examScore = 0;
let examGoal = 0;

document.getElementById("btn-start-test").addEventListener("click", () => {
    if (testList.length === 0) {
        alert("시험을 치를 단어가 없습니다! 오늘의 추천 탭에서 단어를 등록해 주세요.");
        return;
    }
    examGoal = parseInt(inputTargetGoal.value) || 1;
    if (examGoal > testList.length) {
        alert(`현재 저장된 단어(${testList.length}개)보다 목표 개수가 많습니다!`);
        return;
    }

    activeExamWords = [...testList].sort(() => Math.random() - 0.5);
    examIdx = 0;
    examScore = 0;
    
    testSetupZone.style.display = "none";
    testPlayZone.style.display = "block";
    testResultZone.style.display = "none";
    
    showQuestion();
});

function showQuestion() {
    totalQCount.textContent = activeExamWords.length;
    currentQIndex.textContent = examIdx + 1;
    currentScoreCount.textContent = examScore;
    
    testQEng.textContent = activeExamWords[examIdx].eng;
    testAnsInput.value = "";
    testAnsInput.focus();
}

function submitAnswer() {
    const userAns = testAnsInput.value.trim();
    const correctAns = activeExamWords[examIdx].kor.trim();
    
    if (userAns && (correctAns.includes(userAns) || userAns.includes(correctAns))) {
        examScore++;
    }
    
    examIdx++;
    if (examIdx < activeExamWords.length) {
        showQuestion();
    } else {
        endExam();
    }
}

btnSubmitAns.addEventListener("click", submitAnswer);
testAnsInput.addEventListener("keypress", (e) => { if (e.key === "Enter") submitAnswer(); });


// [6] 시험 종료 및 패널티 시스템
function endExam() {
    testPlayZone.style.display = "none";
    testResultZone.style.display = "block";
    
    finalScore.textContent = examScore;
    finalTotal.textContent = activeExamWords.length;
    finalGoal.textContent = examGoal;
    
    if (examScore >= examGoal) {
        resultTitle.textContent = "🎉 목표 통과! 훌륭해!";
        resultTitle.style.color = "#10b981";
        resultComment.textContent = "약속한 개수를 맞췄습니다! 누적되었던 패널티 스택이 리셋됩니다.";
        penaltyCount = 0;
        localStorage.setItem("penaltyCount", 0);
    } else {
        penaltyCount++;
        localStorage.setItem("penaltyCount", penaltyCount);
        
        const minutesToLock = penaltyCount * 5; 
        resultTitle.textContent = "🚨 목표 달성 실패!";
        resultTitle.style.color = "#ef4444";
        resultComment.textContent = `목표에 미달하여 약속대로 ${minutesToLock}분간 앱이 완전히 차단됩니다.`;
        
        const endTime = Date.now() + minutesToLock * 60 * 1000;
        localStorage.setItem("penaltyEndTime", endTime);
    }
}

btnFinishTest.addEventListener("click", () => {
    testResultZone.style.display = "none";
    testSetupZone.style.display = "block";
    updateTestSetupUI();
    checkPenalty(); 
});


// [7] 우회 방지 차단기
function checkPenalty() {
    const endTime = localStorage.getItem("penaltyEndTime");
    if (!endTime) {
        penaltyOverlay.style.display = "none";
        if (penaltyTimerInterval) clearInterval(penaltyTimerInterval);
        return;
    }

    const remainingMs = endTime - Date.now();
    if (remainingMs <= 0) {
        localStorage.removeItem("penaltyEndTime");
        penaltyOverlay.style.display = "none";
        if (penaltyTimerInterval) clearInterval(penaltyTimerInterval);
        updateTestSetupUI();
        alert("대기 시간이 종료되었습니다! 다시 도전해 보세요!");
    } else {
        penaltyOverlay.style.display = "flex";
        updateClockDisplay(remainingMs);
        
        if (!penaltyTimerInterval) {
            penaltyTimerInterval = setInterval(() => {
                const currentRemaining = localStorage.getItem("penaltyEndTime") - Date.now();
                if (currentRemaining <= 0) {
                    checkPenalty();
                } else {
                    updateClockDisplay(currentRemaining);
                }
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

get8RecommendWords();
updateTestSetupUI();
checkPenalty();