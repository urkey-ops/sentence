document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});

class App {
    constructor() {
        this.elements = {
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
        this.elements.introScreen.classList.remove('hidden');
        this.elements.themeSelector.classList.add('hidden');
        this.elements.lessonView.classList.add('hidden');
    }

    async _loadData() {
        try {
            const lessonsResponse = await fetch('lessons.json');
            this.state.allLessonsData = await lessonsResponse.json();
            const wordsResponse = await fetch('words.json');
            this.state.allWordsData = await wordsResponse.json();
        } catch (error) {
            console.error('Failed to load data files:', error);
            this._showMessage('Failed to load lessons. Please check the files.', 'failure', 0);
        }
    }

    _renderLessonButtons() {
        this.elements.lessonSelector.innerHTML = this.state.allLessonsData.map((lesson, index) => 
            `<button class="base-button lesson-button" data-lesson-index="${index}"><i class="fas fa-play mr-2"></i>Lesson ${lesson.lesson}: ${lesson.goal}</button>`
        ).join('');
    }

    _setupEventListeners() {
        this.elements.startLessonsBtn.addEventListener('click', () => {
            this.elements.introScreen.classList.add('hidden');
            this._showLessonSelector();
        });

        this.elements.lessonSelector.addEventListener('click', (e) => {
            const btn = e.target.closest('.lesson-button');
            if (btn) {
                const index = parseInt(btn.dataset.lessonIndex);
                this.state.currentLessonIndex = index;
                this.state.currentChallengeIndex = 0;
                this._showLessonView();
            }
        });

        this.elements.interactiveContainer.addEventListener('click', this._handleInteractiveClick.bind(this));
        this.elements.lessonDisplay.addEventListener('click', this._handleInteractiveClick.bind(this));

        this.elements.submitBtn.addEventListener('click', this._handleSubmit.bind(this));
        this.elements.nextBtn.addEventListener('click', this._handleNext.bind(this));
        this.elements.clearBtn.addEventListener('click', this._handleClear.bind(this));
        this.elements.backToLessonsBtn.addEventListener('click', this._showLessonSelector.bind(this));
    }

    _showLessonSelector() {
        this.elements.lessonView.classList.add('hidden');
        this.elements.introScreen.classList.add('hidden');
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
            this._showMessage('You have completed all lessons!', 'success', 0);
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
        this.state.currentSentenceArray = [];
        this._resetSteps();

        switch (lesson.type) {
            case 'sentence_or_not':
                this._loadSentenceOrNot();
                break;
            case 'identify':
                this._loadIdentify();
                break;
            case 'scramble':
                this._loadScramble();
                break;
            case 'make_it_a_sentence':
                this._loadMakeItASentence();
                break;
            case 'silly_sentences':
                this._loadSillySentences();
                break;
            default:
                this._showMessage(`Unknown lesson type: ${lesson.type}`, 'failure', 0);
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
            this._showMessage('Lesson complete!', 'success', 0);
            this.elements.nextBtn.classList.remove('hidden');
            return;
        }
        this.elements.placeholderText.style.display = 'none';
        this.elements.lessonDisplay.textContent = challenge.text;
        this.elements.interactiveContainer.innerHTML = `
            <button class="base-button action-button" data-answer="true">It's a Sentence!</button>
            <button class="base-button clear-button" data-answer="false">Not a Sentence.</button>
        `;
        setTimeout(() => this._handleReadAloud(challenge.text), 500);
    }

    _loadIdentify() {
        const challenge = this.state.allLessonsData[this.state.currentLessonIndex].challenges[this.state.currentChallengeIndex];
        if (!challenge) {
            this._showMessage('Lesson complete!', 'success', 0);
            this.elements.nextBtn.classList.remove('hidden');
            return;
        }
        this.elements.placeholderText.style.display = 'none';
        this.elements.lessonDisplay.innerHTML = challenge.sentence.split(' ').map(word => `<span class="word-in-sentence cursor-pointer">${word}</span>`).join(' ');
        this.state.userAnswer = [];
        this.elements.interactiveContainer.innerHTML = `
            <button class="base-button action-button" id="submitBtn">Check Answer</button>
        `;
        this.elements.submitBtn.classList.remove('hidden');
        setTimeout(() => this._handleReadAloud(challenge.sentence), 500);
    }
    
    _loadScramble() {
        const challenge = this.state.allLessonsData[this.state.currentLessonIndex].challenges[this.state.currentChallengeIndex];
        if (!challenge) {
            this._showMessage('Lesson complete!', 'success', 0);
            this.elements.nextBtn.classList.remove('hidden');
            return;
        }
        this.elements.placeholderText.style.display = 'block';
        this.elements.placeholderText.textContent = "Click the words below to build your sentence!";
        this.state.currentSentenceArray = [];
        this.state.originalScrambleSentence = challenge.words.join(' ');
        const shuffledWords = this._shuffleArray([...challenge.words]);
        this.elements.interactiveContainer.innerHTML = shuffledWords.map(word => `<button class="base-button word-button" data-word="${word}">${word}</button>`).join('');
        this.elements.submitBtn.classList.remove('hidden');
        this.elements.clearBtn.classList.remove('hidden');
        setTimeout(() => this._handleReadAloud("Click the words below to build your sentence!"), 500);
    }
    
    _loadMakeItASentence() {
        const challenge = this.state.allLessonsData[this.state.currentLessonIndex].challenges[this.state.currentChallengeIndex];
        if (!challenge) {
            this._showMessage('Lesson complete!', 'success', 0);
            this.elements.nextBtn.classList.remove('hidden');
            return;
        }
        this.elements.placeholderText.style.display = 'none';
        this.elements.lessonDisplay.innerHTML = `${challenge.incomplete_sentence} <span class="fill-in"></span>`;
        
        const words = this.state.allWordsData.words[challenge.word_type] || [];
        this.elements.interactiveContainer.innerHTML = `<div class="word-bank">${this._shuffleArray(words).map(word => `<button class="base-button word-button" data-word="${word}">${word}</button>`).join('')}</div>`;

        this.elements.submitBtn.classList.remove('hidden');
        this.elements.clearBtn.classList.remove('hidden');
        setTimeout(() => this._handleReadAloud(challenge.incomplete_sentence), 500);
    }

    _loadSillySentences() {
        const challenge = this.state.allLessonsData[this.state.currentLessonIndex].challenges[this.state.currentChallengeIndex];
        if (!challenge) {
            this._showMessage('Lesson complete!', 'success', 0);
            this.elements.nextBtn.classList.remove('hidden');
            return;
        }
        this.elements.placeholderText.style.display = 'block';
        this.elements.placeholderText.textContent = "Pick a Naming Part and a Telling Part!";
        
        const namingWords = this.state.allWordsData.words.noun || [];
        const tellingWords = this.state.allWordsData.words.verb || [];
        
        this.elements.interactiveContainer.innerHTML = `
            <div class="flex flex-col items-center gap-4 w-full">
                <div class="flex justify-center gap-4 w-full">
                    <div class="w-1/2 p-4 bg-purple-200 rounded-lg shadow-md">
                        <h4 class="text-xl font-bold mb-2 text-center">Naming Part</h4>
                        <div class="flex flex-wrap justify-center gap-2">
                            ${this._shuffleArray(namingWords).slice(0, 5).map(word => `<button class="base-button word-button" data-word="${word}" data-part="naming">${word}</button>`).join('')}
                        </div>
                    </div>
                    <div class="w-1/2 p-4 bg-pink-200 rounded-lg shadow-md">
                        <h4 class="text-xl font-bold mb-2 text-center">Telling Part</h4>
                        <div class="flex flex-wrap justify-center gap-2">
                            ${this._shuffleArray(tellingWords).slice(0, 5).map(word => `<button class="base-button word-button" data-word="${word}" data-part="telling">${word}</button>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.elements.submitBtn.classList.remove('hidden');
        this.elements.clearBtn.classList.remove('hidden');
        setTimeout(() => this._handleReadAloud("Pick a Naming Part and a Telling Part!"), 500);
    }


    _handleInteractiveClick(e) {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        
        if (lesson.type === 'scramble' || lesson.type === 'make_it_a_sentence' || lesson.type === 'silly_sentences') {
            const button = e.target.closest('.word-button');
            if (button && !button.disabled) {
                const word = button.dataset.word;
                this.state.currentSentenceArray.push(word);
                this._renderCurrentSentence();
                button.disabled = true;
                this.elements.placeholderText.style.display = 'none';
            }
        }
        
        if (lesson.type === 'identify') {
            const wordSpan = e.target.closest('.word-in-sentence');
            if (wordSpan) {
                const word = wordSpan.textContent.toLowerCase();
                const index = this.state.userAnswer.indexOf(word);
                if (index > -1) {
                    this.state.userAnswer.splice(index, 1);
                    wordSpan.classList.remove('active');
                } else {
                    this.state.userAnswer.push(word);
                    wordSpan.classList.add('active');
                }
            }
        }
    }

    _renderCurrentSentence() {
        this.elements.lessonDisplay.innerHTML = this.state.currentSentenceArray.map(word => 
            `<button class="base-button word-in-sentence" data-word="${word}">${word}</button>`).join(' ');
        this._handleReadAloud(this.state.currentSentenceArray.join(' '));
    }

    _handleSubmit(e) {
        const lesson = this.state.allLessonsData[this.state.currentLessonIndex];
        const challenge = lesson.challenges[this.state.currentChallengeIndex];
        let isCorrect = false;
        let message = '';
        let messageClass = 'failure';

        switch (lesson.type) {
            case 'sentence_or_not':
                const userAnswer = e.target.dataset.answer === 'true';
                isCorrect = userAnswer === challenge.isSentence;
                message = isCorrect ? 'Great job! You got it right!' : 'Oops, not quite. Try again!';
                break;

            case 'identify':
                const correct = challenge.answer.sort().join(' ') === this.state.userAnswer.sort().join(' ');
                isCorrect = correct && this.state.userAnswer.length === challenge.answer.length;
                message = isCorrect ? 'Excellent! You found the right part!' : 'Not all of the words are correct. Look again!';
                break;
            
            case 'scramble':
                const userSentence = this.state.currentSentenceArray.join(' ').toLowerCase();
                isCorrect = userSentence === this.state.originalScrambleSentence.toLowerCase();
                message = isCorrect ? 'Fantastic! You put the words in the right order!' : `Oops, that's not right. The correct sentence is: ${this.state.originalScrambleSentence}`;
                break;
            
            case 'make_it_a_sentence':
                const userSentenceMake = this.state.currentSentenceArray.join(' ').toLowerCase();
                isCorrect = userSentenceMake.includes(challenge.correct_answer.toLowerCase());
                message = isCorrect ? 'You did it! That makes a complete sentence!' : `Almost! Try again to make a complete sentence.`;
                break;
            
            case 'silly_sentences':
                const sentence = this.state.currentSentenceArray.join(' ');
                const [namingPart, ...tellingPart] = this.state.currentSentenceArray;
                const namingCheck = this.state.allWordsData.words.noun.includes(namingPart);
                const tellingCheck = tellingPart.every(word => this.state.allWordsData.words.verb.includes(word));
                isCorrect = namingCheck && tellingPart.length > 0;
                message = isCorrect ? `What a funny sentence! ${sentence}` : 'Make sure you pick one Naming Part and at least one Telling Part.';
                break;
        }

        messageClass = isCorrect ? 'success' : 'failure';
        this._showMessage(message, messageClass);
        if (isCorrect) {
            this.elements.nextBtn.classList.remove('hidden');
        }
    }

    _handleNext() {
        this.state.currentChallengeIndex++;
        this._loadLesson();
    }

    _handleClear() {
        this.state.currentSentenceArray = [];
        this._renderCurrentSentence();
        this.elements.placeholderText.style.display = 'block';
        
        // Re-enable all word buttons
        const wordButtons = this.elements.interactiveContainer.querySelectorAll('.word-button');
        wordButtons.forEach(button => {
            button.disabled = false;
        });
    }

    _handleReadAloud(text) {
        if (!text) {
             text = this.state.currentSentenceArray.join(' ') || this.elements.lessonDisplay.textContent;
        }
        if (text) speechSynthesis.speak(new SpeechSynthesisUtterance(text));
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

    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
