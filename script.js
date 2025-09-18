// --- LESSON PLAN (based on 50 Sentence Building.docx) ---
const LESSON_PLAN = [
    // Phase 1: The Basics
    { lesson: 1, type: 'sentence_or_not', goal: "Is this a complete sentence?", text: "The cat.", isSentence: false },
    { lesson: 2, type: 'sentence_or_not', goal: "Is this a complete sentence?", text: "The cat naps.", isSentence: true },
    { lesson: 3, type: 'identify', goal: "Click the Naming Part (who or what the sentence is about).", sentence: "My mom smiles.", answer: ["my", "mom"] },
    { lesson: 4, type: 'identify', goal: "Click the Telling Part (what the naming part is doing).", sentence: "The fish swims.", answer: ["swims"] },
    { lesson: 5, type: 'build', goal: "Let's build a sentence! (Naming Part + Telling Part)", structure: ['determiner', 'noun', 'verb', 'punctuation']},
    { lesson: 6, type: 'scramble', goal: "Put the words in the right order!", words: ['the', 'dog', 'is', 'big'] },

    // Phase 2: Punctuation & Polish
    { lesson: 7, type: 'punctuate', goal: "Choose the right end mark.", sentence: "I am happy", answer: '.'},
    { lesson: 8, type: 'punctuate', goal: "Choose the right end mark.", sentence: "What is your name", answer: '?'},
    { lesson: 9, type: 'punctuate', goal: "Choose the right end mark.", sentence: "We won the game", answer: '!'},
    { lesson: 10, type: 'fix_it', goal: "Fix the sentence (add a capital and a period).", sentence: "my dog barks", answer: "My dog barks." },
    
    // Phase 3: Adding Rich Detail
    { lesson: 11, type: 'build', goal: "Let's add a describing word (adjective).", structure: ['determiner', 'adjective', 'noun', 'verb', 'punctuation']},
    { lesson: 12, type: 'build', goal: "Let's say *where* it happened (preposition).", structure: ['determiner', 'noun', 'verb', 'preposition', 'determiner', 'noun', 'punctuation']},

    // Phase 4: Creative Writing
    { lesson: 13, type: 'free_write', goal: "Write a sentence using the sight words 'I' and 'like'." },
    { lesson: 14, type: 'free_write', goal: "Write a sentence about your favorite animal." },
    
    // Final Challenge
    { lesson: 15, type: 'final_challenge', goal: "Great job! You finished the journey!" }
];


class SentenceJourney {
    constructor() {
        this.state = {
            allWordsData: null,
            currentTheme: null,
            currentLessonIndex: 0,
            currentSentenceArray: [], // For 'build' mode
            userSelection: null, // For other modes
        };
        this.elements = {};
        this.messageTimeout = null;
        this._getElements();
        this._setupEventListeners();
    }

    async init() {
        try {
            const response = await fetch('./words.json');
            this.state.allWordsData = await response.json();
            this._renderThemeSelector();
        } catch (error) {
            console.error("Failed to load word data:", error);
            this.elements.themeSelector.innerHTML = `<h1 class="text-2xl text-red-600">Error: Could not load word data.</h1>`;
        }
    }

    _getElements() {
        this.elements = {
            themeSelector: document.getElementById('themeSelector'),
            themeButtonsContainer: document.getElementById('themeButtonsContainer'),
            appContainer: document.getElementById('appContainer'),
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
        this.elements.submitBtn.addEventListener('click', () => this._handleSubmit());
        this.elements.interactiveContainer.addEventListener('click', (e) => this._handleInteraction(e));
        this.elements.lessonDisplay.addEventListener('click', (e) => this._handleInteraction(e));
    }

    // --- Theme Selection ---
    _renderThemeSelector() {
        this.state.allWordsData.themes.forEach(theme => {
            const button = document.createElement('button');
            button.className = 'theme-button squircle';
            button.innerHTML = `<span class="emoji">${theme.emoji}</span>${theme.name}`;
            button.addEventListener('click', () => this._selectTheme(theme.name));
            this.elements.themeButtonsContainer.appendChild(button);
        });
    }

    _selectTheme(themeName) {
        this.state.currentTheme = themeName;
        this.elements.themeSelector.classList.add('hidden');
        this.elements.appContainer.classList.remove('hidden');
        this.elements.appContainer.classList.add('flex');
        this._startLesson();
    }

    // --- Lesson Management ---
    _startLesson() {
        this._resetCurrentState();
        const lesson = LESSON_PLAN[this.state.currentLessonIndex];
        if (!lesson) return;

        this.elements.submitBtn.classList.add('hidden');
        this.elements.placeholderText.classList.add('hidden');

        this._updateProgress();

        switch (lesson.type) {
            case 'build': this._renderBuildMode(lesson); break;
            case 'sentence_or_not': this._renderSentenceOrNotMode(lesson); break;
            case 'identify': this._renderIdentifyMode(lesson); break;
            case 'scramble': this._renderScrambleMode(lesson); break;
            case 'punctuate': this._renderPunctuateMode(lesson); break;
            case 'fix_it': this._renderFixItMode(lesson); break;
            case 'free_write': this._renderFreeWriteMode(lesson); break;
            case 'final_challenge': this._renderFinalChallenge(lesson); break;
        }
    }

    _advanceLesson() {
        this._showMessage("Great job! Let's try the next one!", 'bg-success', 2000);
        setTimeout(() => {
            this.state.currentLessonIndex++;
            this._startLesson();
        }, 2100);
    }
    
    _resetCurrentState() {
        this.state.currentSentenceArray = [];
        this.state.userSelection = null;
        this.elements.lessonDisplay.innerHTML = '';
        this.elements.interactiveContainer.innerHTML = '';
    }

    _updateProgress() {
        const totalLessons = LESSON_PLAN.length;
        const current = this.state.currentLessonIndex + 1;
        this.elements.progressText.textContent = `Lesson ${current} of ${totalLessons}`;
        this.elements.progressFill.style.width = `${(current / totalLessons) * 100}%`;
        const lesson = LESSON_PLAN[this.state.currentLessonIndex];
        this._showMessage(lesson.goal, 'bg-info', 5000);
    }
    
    // --- RENDER MODES ---
    
    _renderBuildMode(lesson) {
        this.elements.lessonDisplay.innerHTML = '<span id="placeholderText" class="placeholder-text">Click a word to begin...</span>';
        this._fetchAndRenderWordBank(lesson);
    }

    _renderSentenceOrNotMode(lesson) {
        this.elements.lessonDisplay.textContent = `"${lesson.text}"`;
        this.elements.interactiveContainer.innerHTML = `
            <button class="action-button bg-green-500 hover:bg-green-600" data-choice="true">Yes, it's a sentence!</button>
            <button class="action-button bg-red-500 hover:bg-red-600" data-choice="false">No, it's not.</button>
        `;
    }

    _renderIdentifyMode(lesson) {
        this.state.userSelection = [];
        this.elements.lessonDisplay.innerHTML = lesson.sentence.split(' ').map((word, index) => 
            `<span class="sentence-word other-color clickable" data-word="${word.toLowerCase().replace('.', '')}" data-index="${index}">${word}</span>`
        ).join(' ');
        this.elements.submitBtn.classList.remove('hidden');
    }

    _renderScrambleMode(lesson) {
        // Simple version: click in order
        this.state.userSelection = [];
        const shuffled = [...lesson.words].sort(() => Math.random() - 0.5);
        this.elements.interactiveContainer.innerHTML = shuffled.map(word => 
            `<button class="word-button other-color" data-word="${word}">${word}</button>`
        ).join(' ');
    }
    
    _renderPunctuateMode(lesson) {
        this.elements.lessonDisplay.textContent = lesson.sentence;
        this.elements.interactiveContainer.innerHTML = `
            <button class="punctuation-button" data-choice=".">.</button>
            <button class="punctuation-button" data-choice="?">?</button>
            <button class="punctuation-button" data-choice="!">!</button>
        `;
    }

    _renderFixItMode(lesson) {
        // In a real app, this might be a text input. For simplicity, we'll make it a choice.
        this.elements.lessonDisplay.textContent = `Fix this: "${lesson.sentence}"`;
        this.elements.interactiveContainer.innerHTML = `<button class="action-button" data-choice="${lesson.answer}">${lesson.answer}</button>`;
    }
    
    _renderFreeWriteMode(lesson) {
        this.elements.lessonDisplay.innerHTML = `<input type="text" id="freeWriteInput" class="free-write-input" placeholder="Type your sentence here...">`;
        this.elements.submitBtn.classList.remove('hidden');
    }

    _renderFinalChallenge(lesson) {
        this.elements.lessonDisplay.innerHTML = `<div class="text-center"><span class="emoji">🏆</span><p>${lesson.goal}</p></div>`;
        this.elements.interactiveContainer.innerHTML = `<button id="restartBtn" class="action-button">Play Again!</button>`;
        document.getElementById('restartBtn').addEventListener('click', () => window.location.reload());
    }

    // --- WORD BANK LOGIC (for 'build' mode) ---
    async _fetchAndRenderWordBank(lesson) {
        const structure = lesson.structure;
        const nextPartIndex = this.state.currentSentenceArray.length;
        const nextPart = structure[nextPartIndex];

        if (!nextPart) {
            this.elements.interactiveContainer.innerHTML = '';
            this.elements.submitBtn.classList.remove('hidden'); // Show submit when sentence is potentially complete
            return;
        }

        let words = [];
        if (this.state.allWordsData.miscWords[nextPart]) {
            words = this.state.allWordsData.miscWords[nextPart];
        } else if (this.state.allWordsData.words[nextPart]) {
            words = this.state.allWordsData.words[nextPart][this.state.currentTheme];
        }
        
        const wordBank = words.sort(() => 0.5 - Math.random()).slice(0, 5);
        this._renderWordBank(wordBank, nextPart);
    }
    
    _renderWordBank(words, type) {
        const colorMap = this.state.allWordsData.typeColors;
        const colorClass = colorMap[type] || 'other-color';
        this.elements.interactiveContainer.innerHTML = words.map(word => 
            `<button class="word-button ${colorClass}" data-word="${word}" data-type="${type}">${word}</button>`
        ).join(' ');
    }
    
    // --- EVENT HANDLING ---
    
    _handleInteraction(e) {
        const lesson = LESSON_PLAN[this.state.currentLessonIndex];
        const target = e.target;
        
        if (lesson.type === 'build' && target.matches('.word-button')) {
            this.state.currentSentenceArray.push({ word: target.dataset.word, type: target.dataset.type });
            this._renderSentenceDisplay();
            this._fetchAndRenderWordBank(lesson);
        } else if (lesson.type === 'sentence_or_not' && target.matches('[data-choice]')) {
            const choice = target.dataset.choice === 'true';
            if (choice === lesson.isSentence) this._advanceLesson();
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
            target.style.display = 'none'; // Hide button after click
            this.elements.lessonDisplay.textContent = this.state.userSelection.join(' ');
            if (this.state.userSelection.length === lesson.words.length) {
                this.elements.submitBtn.classList.remove('hidden');
            }
        } else if (lesson.type === 'punctuate' && target.matches('[data-choice]')) {
            if (target.dataset.choice === lesson.answer) this._advanceLesson();
            else this._showMessage("That's not the right end mark here.", 'bg-warning');
        } else if (lesson.type === 'fix_it' && target.matches('[data-choice]')) {
            this._advanceLesson();
        }
    }
    
    _handleSubmit() {
        const lesson = LESSON_PLAN[this.state.currentLessonIndex];
        let isCorrect = false;

        switch(lesson.type) {
            case 'build':
            case 'free_write':
                isCorrect = true; // For simplicity, we'll accept any build/free-write
                break;
            case 'identify':
                const selected = this.state.userSelection.sort().join(',');
                const answer = lesson.answer.sort().join(',');
                isCorrect = (selected === answer);
                break;
            case 'scramble':
                isCorrect = (this.state.userSelection.join(' ') === lesson.words.join(' '));
                break;
        }

        if (isCorrect) this._advanceLesson();
        else this._showMessage("That's not quite right. Try clearing and starting over.", 'bg-danger');
    }
    
    _handleGoBack() {
        const lesson = LESSON_PLAN[this.state.currentLessonIndex];
        if (lesson.type === 'build' && this.state.currentSentenceArray.length > 0) {
            this.state.currentSentenceArray.pop();
            this._renderSentenceDisplay();
            this._fetchAndRenderWordBank(lesson);
        }
    }

    _handleClear() {
        this._startLesson(); // Just restart the current lesson
    }
    
    _handleReadAloud() {
        const lesson = LESSON_PLAN[this.state.currentLessonIndex];
        let textToRead = '';
        if (lesson.type === 'build') {
            textToRead = this.state.currentSentenceArray.map(w => w.word).join(' ');
        } else if (document.getElementById('freeWriteInput')) {
            textToRead = document.getElementById('freeWriteInput').value;
        } else {
            textToRead = this.elements.lessonDisplay.textContent;
        }
        if (textToRead) {
            speechSynthesis.speak(new SpeechSynthesisUtterance(textToRead));
        }
    }
    
    _renderSentenceDisplay() {
        if (this.state.currentSentenceArray.length === 0) {
            this.elements.lessonDisplay.innerHTML = '<span id="placeholderText" class="placeholder-text">Click a word to begin...</span>';
            return;
        }
        const colorMap = this.state.allWordsData.typeColors;
        this.elements.lessonDisplay.innerHTML = this.state.currentSentenceArray.map(wordObj => {
            const colorClass = colorMap[wordObj.type] || 'other-color';
            return `<span class="sentence-word ${colorClass}">${wordObj.word}</span>`;
        }).join(' ');
    }

    // --- Utility ---
    _showMessage(text, className, duration = 3000) {
        clearTimeout(this.messageTimeout);
        this.elements.messageBox.textContent = text;
        this.elements.messageBox.className = `message-box visible ${className}`;
        if (duration > 0) {
            this.messageTimeout = setTimeout(() => this._hideMessage(), duration);
        }
    }

    _hideMessage() {
        this.elements.messageBox.className = 'message-box';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new SentenceJourney();
    app.init();
});