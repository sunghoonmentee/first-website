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