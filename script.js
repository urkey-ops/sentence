document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});

class App {
    constructor() {
        this.elements = {
            // NEW ELEMENTS
            introScreen: document.getElementById('introScreen'),
            startLessonsBtn: document.getElementById('startLessonsBtn'),

            themeSelector: document.getElementById('themeSelector'),
            lessonSelector: document.getElementById('lessonSelector'),
            lessonView: document.getElementById('lessonView'),
            lessonTitle: document.getElementById('lessonTitle'),
            lessonGoalDisplay: document.getElementById('lessonGoalDisplay'),
            lessonDisplay: document.getElementById('lessonDisplay'),
            placeholderText: document.getElementById('placeholderText'),
            interactiveContainer: document.getElementById('interactiveContainer'),
            submitBtn: document.getElementById('submitBtn'),
            readAloudBtn: document.getElementById('readAloudBtn'),
            nextBtn: document.getElementById('nextBtn'),
            clearBtn: document.getElementById('clearBtn'),
            backToLessonsBtn: document.getElementById('backToLessonsBtn'),
            messageBox: document.getElementById('messageBox'),
            stepSay: document.getElementById('step-say'),
            stepCapital: document.getElementById('step-capital'),
            stepSpace: document.getElementById('step-space'),
            stepEnd: document.getElementById('step-end'),
            stepRead: document.getElementById('step-read')
        };
        this.state = {
            allLessonsData: [],
            allWordsData: {},
            currentLessonIndex: -1,
            currentChallengeIndex: 0,
            currentSentenceArray: [],
            wordBank: [],
            originalScrambleSentence: '',
            userAnswer: []
        };

        this.messageTimeout = null;
        this.init();
    }

    async init() {
        await this._loadData();
        this._renderLessonButtons();
        this._setupEventListeners();
        this.elements.introScreen.classList.remove('hidden'); // Show the intro screen first
        this.elements.themeSelector.classList.add('hidden'); // Hide the lesson selector
    }

    async _loadData() {
        try {
            const lessonsResponse = await fetch('lessons.json');
            this.state.allLessonsData = await lessonsResponse.json();
            const wordsResponse = await fetch('words.json');
            this.state.allWordsData = await wordsResponse.json();
        } catch (error) {
            console.error('Failed to load data files:', error);
            this._showMessage('Failed to load lessons. Please check the files.', 'bg-danger');
        }
    }

    _renderLessonButtons() {
        this.elements.lessonSelector.innerHTML = this.state.allLessonsData.map((lesson, index) => 
            `<button class="base-button lesson-button" data-lesson-index="${index}">Lesson ${lesson.lesson}: ${lesson.goal}</button>`
        ).join('');
    }

    _setupEventListeners() {
        // NEW: Event listener for the intro screen button
        this.elements.startLessonsBtn.addEventListener('click', () => {
            this.elements.introScreen.classList.add('hidden');
            this._showLessonSelector();
        });

        this.elements.lessonSelector.addEventListener('click', (e) => {
            if (e.target.matches('.lesson-button')) {
                const index = parseInt(e.target.dataset.lessonIndex);
                this.state.currentLessonIndex = index;
                this.state.currentChallengeIndex = 0;
                this._showLessonView();
            }
        });

        this.elements.interactiveContainer.addEventListener('click', this._handleInteractiveClick.bind(this));
        this.elements.lessonDisplay.addEventListener('click', this._handleInteractiveClick.bind(this));

        this.elements.submitBtn.addEventListener('click', this._handleSubmit.bind(this));
        this.elements.readAloudBtn.addEventListener('click', this._handleReadAloud.bind(this));
        this.elements.nextBtn.addEventListener('click', this._handleNext.bind(this));
        this.elements.clearBtn.addEventListener('click', this._handleClear.bind(this));
        this.elements.backToLessonsBtn.addEventListener('click', this._showLessonSelector.bind(this));
    }

    _showLessonSelector() {
        this.elements.lessonView.classList.add('hidden');
        this.elements.themeSelector.classList.remove('hidden');
    }

    _showLessonView() {
        this.elements.themeSelector.classList.add('hidden');
        this.elements.lessonView.classList.remove('hidden');
        this._loadLesson();
    }

    _loadLesson() {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        if (!lesson) {
            this._showMessage('You have completed all lessons!', 'bg-success', 0);
            return;
        }

        this.elements.lessonTitle.textContent = `Lesson ${lesson.lesson}`;
        this.elements.lessonGoalDisplay.textContent = lesson.goal;
        this.elements.interactiveContainer.innerHTML = '';
        this.elements.lessonDisplay.innerHTML = '';
        this.elements.placeholderText.textContent = 'Let\'s get started!';
        this.elements.placeholderText.style.display = 'block';
        this.elements.submitBtn.classList.add('hidden');
        this.elements.nextBtn.classList.add('hidden');
        this.elements.clearBtn.classList.add('hidden');
        this.elements.readAloudBtn.classList.remove('hidden');
        this.state.currentSentenceArray = [];

        this._resetSteps();

        switch (lesson.type) {
            case 'sentence_or_not':
                this._loadSentenceOrNot();
                break;
            case 'identify':
                this._loadIdentify();
                break;
            case 'build':
                this._loadBuild();
                break;
            case 'scramble':
                this._loadScramble();
                break;
            case 'punctuate':
                this._loadPunctuate();
                break;
            case 'guided_build':
                this._loadGuidedBuild();
                break;
        }
    }
    
    _resetSteps() {
        const steps = [this.elements.stepSay, this.elements.stepCapital, this.elements.stepSpace, this.elements.stepEnd, this.elements.stepRead];
        steps.forEach(step => step.classList.add('hidden'));
    }

    _activateStep(stepElement) {
        this._resetSteps();
        stepElement.classList.remove('hidden');
    }

    _loadSentenceOrNot() {
        const challenge = this.state.allLessonsData[this.state.currentLessonIndex].challenges[this.state.currentChallengeIndex];
        if (!challenge) {
            this._showMessage('Lesson complete!', 'bg-success', 0);
            this.elements.nextBtn.classList.remove('hidden');
            return;
        }
        this.elements.placeholderText.style.display = 'none';
        this.elements.lessonDisplay.textContent = challenge.text;
        this.elements.interactiveContainer.innerHTML = `
            <button class="base-button action-button" data-answer="true">It's a Sentence!</button>
            <button class="base-button clear-button" data-answer="false">Not a Sentence.</button>
        `;
    }

    _loadIdentify() {
        const challenge = this.state.allLessonsData[this.state.currentLessonIndex].challenges[this.state.currentChallengeIndex];
        if (!challenge) {
            this._showMessage('Lesson complete!', 'bg-success', 0);
            this.elements.nextBtn.classList.remove('hidden');
            return;
        }
        this.elements.placeholderText.style.display = 'none';
        
        this.elements.lessonDisplay.innerHTML = challenge.sentence.split(' ').map(word => `<span class="word-in-sentence cursor-pointer">${word}</span>`).join(' ');
        
        this.elements.interactiveContainer.innerHTML = '';
        this.elements.submitBtn.classList.remove('hidden');
        this.state.userAnswer = [];
    }
    
    _loadBuild() {
        this.elements.placeholderText.style.display = 'none';
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        this.state.wordBank = [];
        lesson.structure.forEach(type => {
            const words = this.state.allWordsData.words[type] || [];
            if (words.length > 0) {
                this.state.wordBank.push(words[Math.floor(Math.random() * words.length)]);
            }
        });
        
        this.state.originalScrambleSentence = this.state.wordBank.join(' ');
        this.state.wordBank = this.state.wordBank.sort(() => 0.5 - Math.random());
        
        this._renderWordBank();
        this.elements.clearBtn.classList.remove('hidden');
        this.elements.submitBtn.classList.remove('hidden');
    }

    _renderWordBank() {
        this.elements.interactiveContainer.innerHTML = this.state.wordBank.map(word => 
            `<button class="word-button">${word}</button>`
        ).join(' ');
    }

    _loadScramble() {
        const challenge = this.state.allLessonsData[this.state.currentLessonIndex].challenges[this.state.currentChallengeIndex];
        if (!challenge) {
            this._showMessage('Lesson complete!', 'bg-success', 0);
            this.elements.nextBtn.classList.remove('hidden');
            return;
        }
        this.elements.placeholderText.style.display = 'none';
        
        this.state.originalScrambleSentence = challenge.words.join(' ');
        this.state.wordBank = challenge.words.slice().sort(() => 0.5 - Math.random());
        
        this._renderWordBank();
        this.elements.clearBtn.classList.remove('hidden');
        this.elements.submitBtn.classList.remove('hidden');
    }

    _loadPunctuate() {
        const challenge = this.state.allLessonsData[this.state.currentLessonIndex].challenges[this.state.currentChallengeIndex];
        if (!challenge) {
            this._showMessage('Lesson complete!', 'bg-success', 0);
            this.elements.nextBtn.classList.remove('hidden');
            return;
        }
        this.elements.placeholderText.style.display = 'none';
        this.elements.lessonDisplay.textContent = challenge.sentence;
        this.elements.interactiveContainer.innerHTML = `
            <button class="punctuation-button" data-punct=".">.</button>
            <button class="punctuation-button" data-punct="?">?</button>
            <button class="punctuation-button" data-punct="!">!</button>
        `;
    }
    
    _loadGuidedBuild() {
        this.elements.interactiveContainer.innerHTML = `
            <input type="text" id="guidedSentence" class="w-full p-4 border rounded-xl" placeholder="Write your sentence here...">
        `;
        this.elements.submitBtn.classList.remove('hidden');
        this.elements.lessonGoalDisplay.textContent = 'Follow the 5-step guide above!';
        // Show the 5-step guide elements for this lesson
        this.elements.stepSay.classList.remove('hidden');
        this.elements.stepCapital.classList.remove('hidden');
        this.elements.stepSpace.classList.remove('hidden');
        this.elements.stepEnd.classList.remove('hidden');
        this.elements.stepRead.classList.remove('hidden');
    }
    
    _handleInteractiveClick(e) {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        
        if (lesson.type === 'sentence_or_not' && e.target.dataset.answer) {
            const isCorrect = (e.target.dataset.answer === String(lesson.challenges[this.state.currentChallengeIndex].isSentence));
            const textElement = this.elements.lessonDisplay;
            if (isCorrect) {
                this._showMessage('Great job!', 'bg-success');
                textElement.classList.add('thought-bubble', 'complete');
            } else {
                this._showMessage('Try again!', 'bg-danger');
                textElement.classList.add('thought-bubble', 'incomplete');
            }
            setTimeout(() => {
                textElement.classList.remove('thought-bubble', 'complete', 'incomplete');
                if (isCorrect) {
                    this.state.currentChallengeIndex++;
                    this._loadSentenceOrNot();
                }
            }, 1500);
        }

        if (e.target.classList.contains('word-in-sentence')) {
            e.target.classList.toggle('active');
            this.state.userAnswer = Array.from(this.elements.lessonDisplay.querySelectorAll('.word-in-sentence.active')).map(el => el.textContent.toLowerCase());
        }

        if ((lesson.type === 'build' || lesson.type === 'scramble') && e.target.classList.contains('word-button')) {
            const word = e.target.textContent;
            this.state.currentSentenceArray.push(word);
            this._renderCurrentSentence();
            e.target.classList.add('picked');
            e.target.disabled = true;
            this.elements.submitBtn.classList.remove('hidden');
            this.elements.clearBtn.classList.remove('hidden');
        }

        if (lesson.type === 'punctuate' && e.target.dataset.punct) {
            const isCorrect = (e.target.dataset.punct === lesson.challenges[this.state.currentChallengeIndex].answer);
            if (isCorrect) {
                this._showMessage('Correct!', 'bg-success');
                this.state.currentChallengeIndex++;
                setTimeout(() => this._loadPunctuate(), 1000);
            } else {
                this._showMessage('Oops, try again!', 'bg-danger');
            }
        }
    }

    _renderCurrentSentence() {
        this.elements.placeholderText.style.display = 'none';
        this.elements.lessonDisplay.innerHTML = this.state.currentSentenceArray.map(word => `<span class="word-in-sentence">${word}</span>`).join(' ');
    }

    _handleSubmit() {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        
        switch(lesson.type) {
            case 'identify':
                const correct = lesson.challenges[this.state.currentChallengeIndex].answer.every(ans => this.state.userAnswer.includes(ans)) && lesson.challenges[this.state.currentChallengeIndex].answer.length === this.state.userAnswer.length;
                if (correct) {
                    this._showMessage('Perfect!', 'bg-success');
                    this.state.currentChallengeIndex++;
                    setTimeout(() => this._loadIdentify(), 1000);
                } else {
                    this._showMessage('Keep trying!', 'bg-danger');
                }
                break;
            case 'build':
            case 'scramble':
                const isCorrect = this.state.currentSentenceArray.join(' ').toLowerCase() === this.state.originalScrambleSentence.toLowerCase();
                
                if (isCorrect) {
                    this._showMessage('Excellent!', 'bg-success');
                    this.state.currentChallengeIndex++;
                    setTimeout(() => this._loadLesson(), 1000);
                } else {
                    this._showMessage('That doesn\'t look right. Try again!', 'bg-danger');
                }
                break;
            case 'guided_build':
                const sentence = document.getElementById('guidedSentence').value.trim();
                if (sentence.length === 0) {
                    this._showMessage('Please write a sentence.', 'bg-danger');
                    return;
                }
                this._check5Steps(sentence);
                break;
        }
    }

    _check5Steps(sentence) {
        const words = sentence.split(' ');
        let allCorrect = true;
        this._activateStep(this.elements.stepSay);

        setTimeout(() => {
            this._activateStep(this.elements.stepCapital);
            if (!/^[A-Z]/.test(sentence)) {
                this._showMessage('Your sentence needs a capital letter at the beginning!', 'bg-danger');
                allCorrect = false;
            } else {
                this._showMessage('Great! Capital letter is perfect.', 'bg-success');
            }
        }, 1000);

        setTimeout(() => {
            this._activateStep(this.elements.stepSpace);
            if (words.length <= 1 && sentence.length > 0) {
                 this._showMessage('A sentence needs spaces between words.', 'bg-danger');
                 allCorrect = false;
            } else if (words.length > 1) {
                this._showMessage('Good job using spaces.', 'bg-success');
            }
        }, 2000);

        setTimeout(() => {
            this._activateStep(this.elements.stepEnd);
            if (!/[.!?]$/.test(sentence)) {
                this._showMessage('Don\'t forget a period, question mark, or exclamation point!', 'bg-danger');
                allCorrect = false;
            } else {
                this._showMessage('You ended your sentence correctly!', 'bg-success');
            }
        }, 3000);

        setTimeout(() => {
            this._activateStep(this.elements.stepRead);
            if (allCorrect) {
                this._showMessage('You are a master sentence builder! 🥳', 'bg-success', 0);
            }
            this._handleReadAloud();
        }, 4000);
    }
    
    _handleClear() {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        if (lesson.type === 'build' || lesson.type === 'scramble') {
            this.state.currentSentenceArray = [];
            this.elements.lessonDisplay.innerHTML = `<span id="placeholderText" class="placeholder-text">Click the words below to build your sentence!</span>`;
            this.elements.placeholderText.style.display = 'block';
            this.elements.submitBtn.classList.add('hidden');
            this._renderWordBank();
        }
    }

    _handleNext() {
        this.state.currentLessonIndex++;
        this.state.currentChallengeIndex = 0;
        this._loadLesson();
    }
    
    _handleReadAloud() {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        let textToRead = '';
        if (lesson.type === 'guided_build') {
            textToRead = document.getElementById('guidedSentence').value;
        } else {
            textToRead = this.state.currentSentenceArray.join(' ') || this.elements.lessonDisplay.textContent;
        }
        if (textToRead) speechSynthesis.speak(new SpeechSynthesisUtterance(textToRead));
    }

    _showMessage(text, className, duration = 3000) {
        clearTimeout(this.messageTimeout);
        this.elements.messageBox.textContent = text;
        this.elements.messageBox.className = `message-box visible ${className}`;
        if (duration > 0) this.messageTimeout = setTimeout(() => this._hideMessage(), duration);
    }
    
    _hideMessage() {
        this.elements.messageBox.classList.remove('visible');
    }
}
