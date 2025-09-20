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
        this.lessons = [];
        this.state = {
            currentLessonIndex: 0,
            currentChallengeIndex: 0,
            currentSentenceArray: [],
            namingPart: '',
            tellingPart: ''
        };
        this.messageTimeout = null;
        this.wordBankData = {};

        this._loadLessonsFile();
    }

    _addEventListeners() {
        this.elements.startLessonsBtn.addEventListener('click', () => this._showLessonSelector());
        this.elements.backToLessonsBtn.addEventListener('click', () => this._showLessonSelector());
        this.elements.submitBtn.addEventListener('click', () => this._handleSubmit());
        this.elements.nextBtn.addEventListener('click', () => this._handleNext());
        this.elements.clearBtn.addEventListener('click', () => this._handleClear());
    }

    async _loadLessonsFile() {
        try {
            const lessonsResponse = await fetch('lessons.json');
            if (!lessonsResponse.ok) {
                throw new Error('Network response was not ok for lessons.json');
            }
            this.lessons = await lessonsResponse.json();

            const wordsResponse = await fetch('words.json');
            if (!wordsResponse.ok) {
                throw new Error('Network response was not ok for words.json');
            }
            this.wordBankData = await wordsResponse.json();

            this._initialize();
        } catch (error) {
            console.error('Error loading files:', error);
        }
    }
    
    _initialize() {
        this._addEventListeners();
        this._showIntroScreen();
    }

    _showIntroScreen() {
        this.elements.introScreen.classList.remove('hidden');
        this.elements.lessonSelector.classList.add('hidden');
        this.elements.lessonView.classList.add('hidden');
    }

    _showLessonSelector() {
        this.elements.introScreen.classList.add('hidden');
        this.elements.lessonView.classList.add('hidden');
        this.elements.lessonSelector.classList.remove('hidden');
        this.elements.backToLessonsBtn.classList.add('hidden');
        this.elements.submitBtn.classList.add('hidden');
        this.elements.clearBtn.classList.add('hidden');
        this.elements.nextBtn.classList.add('hidden');
        this._loadLessonButtons();
    }

    _loadLessonButtons() {
        const container = document.getElementById('lessonButtonsContainer');
        container.innerHTML = '';
        this.lessons.forEach((lesson, index) => {
            const button = document.createElement('button');
            button.classList.add('lesson-button', 'squircle');
            button.textContent = `Lesson ${lesson.lesson}: ${lesson.title}`;
            button.addEventListener('click', () => this._startLesson(index));
            container.appendChild(button);
        });
    }

    _startLesson(lessonIndex) {
        this.state.currentLessonIndex = lessonIndex;
        this.state.currentChallengeIndex = 0;
        this.elements.lessonSelector.classList.add('hidden');
        this.elements.lessonView.classList.remove('hidden');
        this.elements.backToLessonsBtn.classList.remove('hidden');
        this._loadLesson();
    }

    _loadLesson() {
        this._hideMessage();
        this.elements.submitBtn.classList.add('hidden');
        this.elements.nextBtn.classList.add('hidden');
        this.elements.clearBtn.classList.add('hidden');
        
        const currentLesson = this.lessons[this.state.currentLessonIndex];
        this.elements.lessonTitle.textContent = `Lesson ${currentLesson.lesson}: ${currentLesson.title}`;
        this.elements.lessonGoalDisplay.textContent = currentLesson.goal;
        
        currentLesson.challenges = this._shuffleArray(currentLesson.challenges);

        this._renderChallenge();
    }

    _renderChallenge() {
        this.state.currentSentenceArray = [];
        this.state.namingPart = '';
        this.state.tellingPart = '';
        this.elements.placeholderText.style.display = 'block';
        this.elements.lessonDisplay.textContent = '';
        this.elements.interactiveContainer.innerHTML = '';
        this.elements.clearBtn.classList.add('hidden');
        
        const currentLesson = this.lessons[this.state.currentLessonIndex];
        const currentChallenge = currentLesson.challenges[this.state.currentChallengeIndex];

        switch (currentLesson.type) {
            case 'sentence_or_not':
                this._renderSentenceOrNotChallenge(currentChallenge);
                break;
            case 'identify':
                this._renderIdentifyChallenge(currentChallenge);
                break;
            case 'scramble':
                this._renderScrambleChallenge(currentChallenge);
                break;
            case 'make_it_a_sentence':
                this._renderMakeItASentenceChallenge(currentChallenge);
                break;
            case 'silly_sentences':
                this._renderSillySentencesChallenge(currentChallenge);
                break;
            case 'punctuation_choice':
                this._renderPunctuationChoiceChallenge(currentChallenge);
                break;
            case 'combine_sentences':
                this._renderCombineSentencesChallenge(currentChallenge);
                break;
        }
    }
    
    // --- RENDER FUNCTIONS FOR EACH LESSON TYPE ---
    _renderSentenceOrNotChallenge(challenge) {
        const trueBtn = document.createElement('button');
        trueBtn.textContent = 'Yes, it is!';
        trueBtn.classList.add('action-button', 'squircle');
        trueBtn.addEventListener('click', () => this._handleSentenceOrNot(true, challenge.isSentence));

        const falseBtn = document.createElement('button');
        falseBtn.textContent = 'No, it is not.';
        falseBtn.classList.add('action-button', 'squircle');
        falseBtn.addEventListener('click', () => this._handleSentenceOrNot(false, challenge.isSentence));

        this.elements.interactiveContainer.appendChild(trueBtn);
        this.elements.interactiveContainer.appendChild(falseBtn);
        this.elements.lessonDisplay.textContent = challenge.text;
        this.elements.placeholderText.style.display = 'none';
    }

    _renderIdentifyChallenge(challenge) {
        this.elements.clearBtn.classList.remove('hidden');
        this.elements.submitBtn.classList.remove('hidden');
        this.elements.lessonDisplay.textContent = '';
        this.elements.placeholderText.style.display = 'block';

        const words = challenge.sentence.split(' ');
        const wordBank = document.createElement('div');
        wordBank.classList.add('word-bank-button-container');

        words.forEach(word => {
            const button = document.createElement('button');
            button.textContent = word.replace('.', '').replace('?', '').replace('!', '');
            button.classList.add('word-button', 'squircle');
            button.addEventListener('click', () => this._selectWord(button, word.toLowerCase().replace(/[.?!]/g, '')));
            wordBank.appendChild(button);
        });

        this.elements.interactiveContainer.appendChild(wordBank);
    }

    _renderScrambleChallenge(challenge) {
        this.elements.clearBtn.classList.remove('hidden');
        this.elements.submitBtn.classList.remove('hidden');
        this.elements.lessonDisplay.textContent = '';
        this.elements.placeholderText.style.display = 'block';

        const shuffledWords = this._shuffleArray([...challenge.words]);
        const wordBank = document.createElement('div');
        wordBank.classList.add('word-bank-button-container');

        shuffledWords.forEach(word => {
            const button = document.createElement('button');
            button.textContent = word;
            button.classList.add('word-button', 'squircle');
            button.addEventListener('click', () => this._selectWord(button, word.toLowerCase()));
            wordBank.appendChild(button);
        });

        this.elements.interactiveContainer.appendChild(wordBank);
    }
    
    _renderMakeItASentenceChallenge(challenge) {
        this.elements.clearBtn.classList.remove('hidden');
        this.elements.submitBtn.classList.remove('hidden');
        this.elements.lessonDisplay.textContent = challenge.incomplete_sentence;
        this.elements.placeholderText.style.display = 'none';
        
        const wordBank = document.createElement('div');
        wordBank.classList.add('word-bank-button-container');

        const wordsToAdd = this.wordBankData.words[challenge.word_type];

        this._shuffleArray(wordsToAdd).forEach(word => {
            const button = document.createElement('button');
            button.textContent = word;
            button.classList.add('word-button', 'squircle');
            button.addEventListener('click', () => this._selectWord(button, word.toLowerCase()));
            wordBank.appendChild(button);
        });

        this.elements.interactiveContainer.appendChild(wordBank);
    }

    _renderSillySentencesChallenge(challenge) {
        this.elements.clearBtn.classList.remove('hidden');
        this.elements.submitBtn.classList.remove('hidden');
        this.elements.lessonDisplay.textContent = '';
        this.elements.placeholderText.style.display = 'block';
        
        const container = document.createElement('div');
        container.classList.add('flex', 'flex-col', 'md:flex-row', 'gap-4', 'w-full');
        
        const namingPartContainer = document.createElement('div');
        namingPartContainer.classList.add('silly-sentences-column', 'bg-purple-200', 'flex-1', 'text-center');
        namingPartContainer.innerHTML = '<h4 class="text-xl font-bold mb-2">Choose a Naming Part</h4>';
        challenge.naming_parts.forEach(part => {
            const button = document.createElement('button');
            button.textContent = part;
            button.classList.add('word-button', 'squircle', 'my-2');
            button.addEventListener('click', () => this._selectSillyPart(button, part, 'naming'));
            namingPartContainer.appendChild(button);
        });
        
        const tellingPartContainer = document.createElement('div');
        tellingPartContainer.classList.add('silly-sentences-column', 'bg-pink-200', 'flex-1', 'text-center');
        tellingPartContainer.innerHTML = '<h4 class="text-xl font-bold mb-2">Choose a Telling Part</h4>';
        challenge.telling_parts.forEach(part => {
            const button = document.createElement('button');
            button.textContent = part;
            button.classList.add('word-button', 'squircle', 'my-2');
            button.addEventListener('click', () => this._selectSillyPart(button, part, 'telling'));
            tellingPartContainer.appendChild(button);
        });

        container.appendChild(namingPartContainer);
        container.appendChild(tellingPartContainer);
        this.elements.interactiveContainer.appendChild(container);
    }

    _renderPunctuationChoiceChallenge(challenge) {
        this.elements.lessonDisplay.textContent = challenge.sentence;
        this.elements.placeholderText.style.display = 'none';
        
        const choicesContainer = document.createElement('div');
        choicesContainer.classList.add('flex', 'justify-center', 'gap-4', 'mt-4');

        this._shuffleArray(challenge.choices).forEach(choice => {
            const button = document.createElement('button');
            button.textContent = choice;
            button.classList.add('punctuation-button', 'action-button', 'squircle');
            button.addEventListener('click', () => this._handlePunctuationChoice(choice, challenge.correct_answer));
            choicesContainer.appendChild(button);
        });

        this.elements.interactiveContainer.appendChild(choicesContainer);
    }

    _renderCombineSentencesChallenge(challenge) {
        this.elements.lessonGoalDisplay.textContent = `Combine two sentences using '${challenge.conjunction}'.`;
        this.elements.lessonDisplay.innerHTML = `
            <div class="text-center">
                <p class="text-xl mb-2">${challenge.sentences[0]}</p>
                <p class="text-2xl font-bold text-purple-600">${challenge.conjunction}</p>
                <p class="text-xl mt-2">${challenge.sentences[1]}</p>
            </div>
            <div id="combineSentenceInput" class="bg-gray-100 p-4 rounded-xl shadow-inner min-h-[60px] flex items-center justify-center mt-4" contenteditable="true">
                <p id="placeholderText" class="text-xl md:text-2xl font-semibold text-center text-gray-400">Type your combined sentence here...</p>
            </div>
        `;
        
        const combineInput = document.getElementById('combineSentenceInput');
        combineInput.addEventListener('input', () => {
            if (combineInput.textContent.trim().length > 0) {
                this.elements.placeholderText.style.display = 'none';
            } else {
                this.elements.placeholderText.style.display = 'block';
            }
        });

        this.elements.submitBtn.classList.remove('hidden');
    }

    // --- INTERACTIVE HANDLERS ---
    _selectWord(button, word) {
        this.state.currentSentenceArray.push(word);
        this._renderCurrentSentence();
        button.disabled = true;
        this.elements.placeholderText.style.display = 'none';
    }
    
    _selectSillyPart(button, part, type) {
        if (type === 'naming') {
            this.state.namingPart = part;
            const otherButtons = button.parentElement.querySelectorAll('button');
            otherButtons.forEach(btn => btn.disabled = true);
        } else if (type === 'telling') {
            this.state.tellingPart = part;
            const otherButtons = button.parentElement.querySelectorAll('button');
            otherButtons.forEach(btn => btn.disabled = true);
        }

        this.elements.lessonDisplay.textContent = `${this.state.namingPart} ${this.state.tellingPart}`;

        if (this.state.namingPart && this.state.tellingPart) {
            this._showMessage('Great job! You made a silly sentence!', 'success', 3000);
            this.elements.nextBtn.classList.remove('hidden');
        } else {
            this.elements.placeholderText.style.display = 'none';
        }
    }

    // --- SUBMIT LOGIC ---
    _handleSubmit() {
        const currentLesson = this.lessons[this.state.currentLessonIndex];
        const currentChallenge = currentLesson.challenges[this.state.currentChallengeIndex];

        let isCorrect = false;

        switch (currentLesson.type) {
            case 'identify':
                isCorrect = this._checkIdentify(currentChallenge);
                break;
            case 'scramble':
                isCorrect = this._checkScramble(currentChallenge);
                break;
            case 'make_it_a_sentence':
                isCorrect = this._checkMakeItASentence(currentChallenge);
                break;
            case 'combine_sentences':
                const userSentence = document.getElementById('combineSentenceInput').textContent.trim().toLowerCase().replace(/[.?!]/g, '');
                isCorrect = userSentence === currentChallenge.correct_answer.toLowerCase().replace(/[.?!]/g, '');
                break;
        }

        if (isCorrect) {
            this._showMessage('Correct! Great job!', 'success', 3000);
            this.elements.nextBtn.classList.remove('hidden');
            this.elements.submitBtn.classList.add('hidden');
        } else {
            this._showMessage('Not quite, try again.', 'failure', 3000);
        }
    }

    _checkIdentify(challenge) {
        const userAnswer = this.state.currentSentenceArray.sort().join(' ');
        const correctAnswers = challenge.answer.sort().join(' ');
        return userAnswer === correctAnswers;
    }
    
    _checkScramble(challenge) {
        const userAnswer = this.state.currentSentenceArray.join(' ').toLowerCase();
        return userAnswer === challenge.correct_answer.toLowerCase();
    }
    
    _checkMakeItASentence(challenge) {
        const fullSentence = `${challenge.incomplete_sentence.toLowerCase()} ${this.state.currentSentenceArray.join(' ').toLowerCase().trim()}`;
        return challenge.acceptable_answers.some(answer => fullSentence.toLowerCase().trim() === answer.toLowerCase().trim());
    }
    
    _handleSentenceOrNot(userChoice, isCorrectSentence) {
        const isCorrect = userChoice === isCorrectSentence;
        if (isCorrect) {
            this._showMessage('Correct!', 'success', 3000);
            this.elements.nextBtn.classList.remove('hidden');
        } else {
            this._showMessage('Not quite, try again.', 'failure', 3000);
        }
    }

    _handlePunctuationChoice(userChoice, correctAnswer) {
        const isCorrect = userChoice === correctAnswer;
        if (isCorrect) {
            this._showMessage('Correct! That\'s a feeling sentence.', 'success', 3000);
            this.elements.nextBtn.classList.remove('hidden');
        } else {
            this._showMessage('Not quite, try again.', 'failure', 3000);
        }
    }

    _handleNext() {
        this.state.currentChallengeIndex++;
        const currentLesson = this.lessons[this.state.currentLessonIndex];
        if (this.state.currentChallengeIndex < currentLesson.challenges.length) {
            this._renderChallenge();
        } else {
            this._showMessage('Lesson complete!', 'success', 3000);
            this.elements.backToLessonsBtn.classList.remove('hidden');
        }
    }

    _handleClear() {
        this.state.currentSentenceArray = [];
        this.state.namingPart = '';
        this.state.tellingPart = '';
        this.elements.lessonDisplay.textContent = '';
        this.elements.placeholderText.style.display = 'block';
        
        const wordButtons = this.elements.interactiveContainer.querySelectorAll('.word-button');
        wordButtons.forEach(button => {
            button.disabled = false;
        });
    }

    _renderCurrentSentence() {
        this.elements.lessonDisplay.textContent = this.state.currentSentenceArray.join(' ');
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
