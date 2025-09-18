// --- GEMINI API SETUP ---
const API_KEY = 'AIzaSyAoRr33eg9Fkt-DW3qX-zeZJ2UtHFBTzFI'; // Replace with your key
const apiCache = new Map();

function findTextInResponse(obj) {
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            const result = findTextInResponse(obj[key]);
            if (result) return result;
        }
    }
    return null;
}

const callGeminiAPI = async (prompt) => {
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    if (apiCache.has(prompt)) return apiCache.get(prompt);

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorData.error.message}`);
        }
        const data = await response.json();
        apiCache.set(prompt, data);
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

class SentenceJourney {
    constructor() {
        this.state = {
            allWordsData: null,
            allLessonsData: null,
            currentLessonIndex: 0,
            currentChallengeIndex: 0,
            currentSentenceArray: [],
            userSelection: null,
        };
        this.elements = {};
        this.messageTimeout = null;
        this._getElements();
        this.debouncedSubmit = this._debounce(this._handleSubmit, 2000); 
        this._setupEventListeners();
    }

    async init() {
        try {
            const [wordsResponse, lessonsResponse] = await Promise.all([
                fetch('./words.json'),
                fetch('./lessons.json')
            ]);
            this.state.allWordsData = await wordsResponse.json();
            this.state.allLessonsData = await lessonsResponse.json();
            
            this.elements.themeSelector.classList.add('hidden');
            this.elements.appContainer.classList.remove('hidden');
            this.elements.appContainer.classList.add('flex');
            this._startLesson();
            
        } catch (error) {
            console.error("Failed to load initial data:", error);
            this.elements.themeSelector.innerHTML = `<h1 class="text-2xl text-red-600">Error: Could not load game data.</h1>`;
        }
    }

    _getElements() {
        this.elements = {
            themeSelector: document.getElementById('themeSelector'),
            themeButtonsContainer: document.getElementById('themeButtonsContainer'),
            appContainer: document.getElementById('appContainer'),
            lessonGoalDisplay: document.getElementById('lessonGoalDisplay'), // 💡 ADDED: New element to display the lesson goal permanently
            lessonDisplay: document.getElementById('lessonDisplay'),
            interactiveContainer: document.getElementById('interactiveContainer'),
            placeholderText: document.getElementById('placeholderText'),
            submitBtn: document.getElementById('submitBtn'),
            goBackBtn: document.getElementById('goBackBtn'),
            clearBtn: document.getElementById('clearBtn'),
            readAloudBtn: document.getElementById('readAloudBtn'),
            messageBox: document.getElementById('messageBox'),
            progressText: document.getElementById('progressText'),
            progressFill: document.getElementById('progressFill'),
        };
    }

    _setupEventListeners() {
        this.elements.goBackBtn.addEventListener('click', () => this._handleGoBack());
        this.elements.clearBtn.addEventListener('click', () => this._handleClear());
        this.elements.readAloudBtn.addEventListener('click', () => this._handleReadAloud());
        this.elements.submitBtn.addEventListener('click', () => this.debouncedSubmit());
        this.elements.interactiveContainer.addEventListener('click', (e) => this._handleInteraction(e));
        this.elements.lessonDisplay.addEventListener('click', (e) => this._handleInteraction(e));
    }
    
    _debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    _startLesson() {
        this._resetCurrentState();
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        if (!lesson) {
            this.elements.appContainer.innerHTML = `<h1 class="text-4xl text-green-600 text-center">You've completed all lessons! 🎉</h1>`;
            return;
        }

        this.elements.submitBtn.classList.add('hidden');
        this._updateProgress();

        if (lesson.challenges && lesson.challenges.length > 0) {
            this.state.currentChallengeIndex = 0;
            this._startChallenge();
        } else {
            this._renderLesson(lesson);
        }
    }

    _startChallenge() {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        const challenge = lesson.challenges[this.state.currentChallengeIndex];
        
        // 💡 MODIFIED: Display the challenge instruction permanently
        this.elements.lessonGoalDisplay.textContent = `${lesson.goal} (${this.state.currentChallengeIndex + 1} / ${lesson.challenges.length})`;
        this._resetSelectionState();
        this._renderLesson(lesson, challenge);
    }

    _advanceLesson() {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];

        if (lesson.challenges && lesson.challenges.length > 0) {
            this.state.currentChallengeIndex++;
            if (this.state.currentChallengeIndex < lesson.challenges.length) {
                this._showMessage("Correct!", 'bg-success', 1000);
                setTimeout(() => this._startChallenge(), 1100);
            } else {
                this._showMessage("Great work! You finished the lesson!", 'bg-success', 2000);
                setTimeout(() => {
                    this.state.currentLessonIndex++;
                    this._startLesson();
                }, 2100);
            }
        } else {
            this._showMessage("Great job! Let's try the next one!", 'bg-success', 2000);
            setTimeout(() => {
                this.state.currentLessonIndex++;
                this._startLesson();
            }, 2100);
        }
    }

    _renderLesson(lesson, challengeData = null) {
        const data = challengeData || lesson;
        this.elements.submitBtn.classList.add('hidden');
        switch (lesson.type) {
            case 'build': this._renderBuildMode(data); break;
            case 'sentence_or_not': this._renderSentenceOrNotMode(data); break;
            case 'identify': this._renderIdentifyMode(data); break;
            case 'scramble': this._renderScrambleMode(data); break;
            case 'punctuate': this._renderPunctuateMode(data); break;
            case 'fix_it': this._renderFixItMode(data); break;
            case 'free_write': this._renderFreeWriteMode(data); break;
            case 'final_challenge': this._renderFinalChallenge(data); break;
        }
    }

    // --- RENDER MODES ---
    _renderBuildMode(data) {
        this.elements.lessonDisplay.innerHTML = '<span class="placeholder-text">Click a word to begin...</span>';
        this._fetchAndRenderWordBank(data);
    }
    _renderSentenceOrNotMode(data) {
        this.elements.lessonDisplay.textContent = `"${data.text}"`;
        this.elements.interactiveContainer.innerHTML = `
            <button class="action-button bg-green-500 hover:bg-green-600" data-choice="true">Yes, it's a sentence!</button>
            <button class="action-button bg-red-500 hover:bg-red-600" data-choice="false">No, it's not.</button>
        `;
    }
    _renderIdentifyMode(data) {
        this.elements.lessonDisplay.innerHTML = data.sentence.split(' ').map((word, index) => 
            `<span class="sentence-word other-color clickable" data-word="${word.toLowerCase().replace('.', '')}" data-index="${index}">${word}</span>`
        ).join(' ');
        this.elements.submitBtn.classList.remove('hidden');
    }
    _renderScrambleMode(data) {
        const shuffled = [...data.words].sort(() => Math.random() - 0.5);
        this.elements.interactiveContainer.innerHTML = shuffled.map(word => 
            `<button class="word-button other-color" data-word="${word}">${word}</button>`
        ).join(' ');
    }
    _renderPunctuateMode(data) {
        this.elements.lessonDisplay.textContent = data.sentence;
        this.elements.interactiveContainer.innerHTML = `
            <button class="punctuation-button" data-choice=".">.</button>
            <button class="punctuation-button" data-choice="?">?</button>
            <button class="punctuation-button" data-choice="!">!</button>
        `;
    }
    _renderFreeWriteMode(data) {
        this.elements.lessonDisplay.innerHTML = `<input type="text" id="freeWriteInput" class="free-write-input" placeholder="Type your sentence here...">`;
        this.elements.submitBtn.classList.remove('hidden');
    }
    _renderFinalChallenge(data) {
        this.elements.lessonDisplay.innerHTML = `<div class="text-center"><span class="emoji">🏆</span><p>${data.goal}</p></div>`;
        this.elements.interactiveContainer.innerHTML = `<button id="restartBtn" class="action-button">Play Again!</button>`;
        document.getElementById('restartBtn').addEventListener('click', () => window.location.reload());
    }

    // --- EVENT HANDLING & SUBMISSION ---
    _handleInteraction(e) {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        const challenge = lesson.challenges ? lesson.challenges[this.state.currentChallengeIndex] : lesson;
        const target = e.target;
        
        if (lesson.type === 'build' && target.matches('.word-button')) {
            this.state.currentSentenceArray.push({ word: target.dataset.word, type: target.dataset.type });
            this._renderSentenceDisplay();
            this._fetchAndRenderWordBank(challenge);
        } else if (lesson.type === 'sentence_or_not' && target.matches('[data-choice]')) {
            const choice = target.dataset.choice === 'true';
            if (choice === challenge.isSentence) this._advanceLesson();
            else this._showMessage("Not quite, try again!", 'bg-warning');
        } else if (lesson.type === 'identify' && target.matches('.clickable')) {
            target.classList.toggle('selected');
            const word = target.dataset.word;
            if (this.state.userSelection.includes(word)) {
                this.state.userSelection = this.state.userSelection.filter(w => w !== word);
            } else {
                this.state.userSelection.push(word);
            }
        } else if (lesson.type === 'scramble' && target.matches('.word-button')) {
            this.state.userSelection.push(target.dataset.word);
            target.style.display = 'none';
            this.elements.lessonDisplay.textContent = this.state.userSelection.join(' ');
            if (this.state.userSelection.length === challenge.words.length) {
                this.elements.submitBtn.classList.remove('hidden');
            }
        } else if (lesson.type === 'punctuate' && target.matches('[data-choice]')) {
            if (target.dataset.choice === challenge.answer) this._advanceLesson();
            else this._showMessage("That's not the right end mark here.", 'bg-warning');
        }
    }
    
    async _handleSubmit() {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        const challenge = lesson.challenges ? lesson.challenges[this.state.currentChallengeIndex] : lesson;
        let isCorrect = false;

        switch(lesson.type) {
            case 'build': isCorrect = true; break;
            case 'free_write':
                const userInput = document.getElementById('freeWriteInput').value;
                if (userInput.length < 3) return this._showMessage("Please write a sentence!", 'bg-warning');
                
                this._showMessage("Checking your sentence...", 'bg-info', 0);
                try {
                    const prompt = `You are a friendly teacher for a 6-year-old. The child wrote: "${userInput}". Is it a complete sentence that starts with a capital and ends with punctuation? Respond with "VALID" if it is good, otherwise provide one very simple, encouraging hint to fix it.`;
                    const response = await callGeminiAPI(prompt);
                    const feedback = findTextInResponse(response).trim();
                    if (feedback.toUpperCase().includes("VALID")) this._advanceLesson();
                    else this._showMessage(feedback, 'bg-info', 5000);
                } catch (error) {
                    this._showMessage("I couldn't check that, but let's move on!", 'bg-success');
                    setTimeout(() => this._advanceLesson(), 2000);
                }
                return;
            case 'identify':
                const selected = this.state.userSelection.sort().join(',');
                const answer = challenge.answer.sort().join(',');
                isCorrect = (selected === answer);
                break;
            case 'scramble':
                isCorrect = (this.state.userSelection.join(' ') === challenge.words.join(' '));
                break;
        }

        if (isCorrect) this._advanceLesson();
        else this._showMessage("That's not quite right. Try clearing and starting over.", 'bg-danger');
    }

    // --- STATE RESET & UI UPDATES ---
    _handleGoBack() {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        if (lesson.type === 'build' && this.state.currentSentenceArray.length > 0) {
            this.state.currentSentenceArray.pop();
            this._renderSentenceDisplay();
            this._fetchAndRenderWordBank(lesson);
        }
    }
    _handleClear() {
        if (this.state.allLessonsData[this.state.currentLessonIndex].challenges) this._startChallenge();
        else this._startLesson();
    }
    _resetCurrentState() {
        this.state.currentSentenceArray = [];
        this.state.userSelection = null;
        this.state.currentChallengeIndex = 0;
        this.elements.lessonDisplay.innerHTML = '';
        this.elements.interactiveContainer.innerHTML = '';
    }
    _resetSelectionState() {
        this.state.currentSentenceArray = [];
        this.state.userSelection = [];
        this.elements.lessonDisplay.innerHTML = '';
        this.elements.interactiveContainer.innerHTML = '';
    }
    _updateProgress() {
        const totalLessons = this.state.allLessonsData.length;
        const current = this.state.currentLessonIndex + 1;
        this.elements.progressText.textContent = `Lesson ${current} of ${totalLessons}`;
        this.elements.progressFill.style.width = `${(current / totalLessons) * 100}%`;
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        // 💡 MODIFIED: Display the lesson goal permanently
        this.elements.lessonGoalDisplay.textContent = lesson.goal;
    }
    _renderSentenceDisplay() {
        if (this.state.currentSentenceArray.length === 0) {
            this.elements.lessonDisplay.innerHTML = '<span class="placeholder-text">Click a word to begin...</span>';
            return;
        }
        const colorMap = this.state.allWordsData.typeColors;
        this.elements.lessonDisplay.innerHTML = this.state.currentSentenceArray.map(wordObj => {
            const colorClass = colorMap[wordObj.type] || 'other-color';
            return `<span class="sentence-word ${colorClass}">${wordObj.word}</span>`;
        }).join(' ');
    }

    // --- WORD BANK & UTILITY ---
    async _fetchAndRenderWordBank(data) {
        const structure = data.structure;
        const nextPartIndex = this.state.currentSentenceArray.length;
        const nextPart = structure ? structure[nextPartIndex] : null;

        if (!nextPart) {
            this.elements.interactiveContainer.innerHTML = '';
            this.elements.submitBtn.classList.remove('hidden');
            return;
        }

        let words = [];
        if (this.state.allWordsData.miscWords[nextPart]) {
            words = this.state.allWordsData.miscWords[nextPart];
        } else if (this.state.allWordsData.words[nextPart]) {
            // Note: This relies on your words.json having a key for the theme or a general one.
            words = this.state.allWordsData.words[nextPart][this.state.currentTheme]; 
        } else {
             console.error(`Words for type "${nextPart}" not found.`);
        }
        
        const wordBank = words.sort(() => 0.5 - Math.random()).slice(0, 7);
        const colorMap = this.state.allWordsData.typeColors;
        const colorClass = colorMap[nextPart] || 'other-color';
        this.elements.interactiveContainer.innerHTML = wordBank.map(word => 
            `<button class="word-button ${colorClass}" data-word="${word}" data-type="${nextPart}">${word}</button>`
        ).join(' ');
    }
    _handleReadAloud() {
        let textToRead = '';
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        if (lesson.type === 'build') textToRead = this.state.currentSentenceArray.map(w => w.word).join(' ');
        else if (document.getElementById('freeWriteInput')) textToRead = document.getElementById('freeWriteInput').value;
        else textToRead = this.elements.lessonDisplay.textContent;
        if (textToRead) speechSynthesis.speak(new SpeechSynthesisUtterance(textToRead));
    }
    _showMessage(text, className, duration = 3000) {
        clearTimeout(this.messageTimeout);
        this.elements.messageBox.textContent = text;
        this.elements.messageBox.className = `message-box visible ${className}`;
        if (duration > 0) this.messageTimeout = setTimeout(() => this._hideMessage(), duration);
    }
    _hideMessage() {
        this.elements.messageBox.className = 'message-box';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new SentenceJourney();
    app.init();
});
