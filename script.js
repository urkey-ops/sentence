"use strict";

(function() {
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
                progressIndicator: document.getElementById('progressIndicator'),
                lessonDisplay: document.getElementById('lessonDisplay'),
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
            this.challengeHandlers = {
                'sentence_or_not': this._renderSentenceOrNotChallenge,
                'identify': this._renderIdentifyChallenge,
                'scramble': this._renderScrambleChallenge,
                'make_it_a_sentence': this._renderMakeItASentenceChallenge,
                'silly_sentences': this._renderSillySentencesChallenge,
                'punctuation_choice': this._renderPunctuationChoiceChallenge,
                'combine_sentences': this._renderCombineSentencesChallenge
            };

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
                this._showMessage('Failed to load lessons. Please try again.', 'failure', 0);
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
                const button = this._createButton(`Lesson ${lesson.lesson}: ${lesson.title}`, 'lesson-button', () => this._startLesson(index));
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
            
            const currentLesson = this.lessons[this.state.currentLessonIndex];
            this.elements.lessonTitle.textContent = `Lesson ${currentLesson.lesson}: ${currentLesson.title}`;
            this.elements.lessonGoalDisplay.textContent = currentLesson.goal;
            
            if (this.state.currentChallengeIndex === 0) {
                currentLesson.challenges = this._shuffleArray(currentLesson.challenges);
            }

            this._renderChallenge();
        }

        _renderChallenge() {
            this.state.currentSentenceArray = [];
            this.state.namingPart = '';
            this.state.tellingPart = '';
            this.elements.interactiveContainer.innerHTML = '';
            
            this.elements.clearBtn.classList.add('hidden');
            this.elements.submitBtn.classList.add('hidden');
            this.elements.nextBtn.classList.add('hidden');
            
            const currentLesson = this.lessons[this.state.currentLessonIndex];
            const currentChallenge = currentLesson.challenges[this.state.currentChallengeIndex];

            this.elements.progressIndicator.textContent = `Challenge ${this.state.currentChallengeIndex + 1} of ${currentLesson.challenges.length}`;

            const handler = this.challengeHandlers[currentLesson.type];
            if (handler) {
                handler.call(this, currentChallenge);
            } else {
                console.error(`No handler found for lesson type: ${currentLesson.type}`);
            }
        }
        
        _renderSentenceOrNotChallenge(challenge) {
            const trueBtn = this._createButton('Yes, it is!', 'action-button', () => this._handleSentenceOrNot(true, challenge.isSentence));
            const falseBtn = this._createButton('No, it is not.', 'action-button', () => this._handleSentenceOrNot(false, challenge.isSentence));

            this.elements.interactiveContainer.appendChild(trueBtn);
            this.elements.interactiveContainer.appendChild(falseBtn);
            this._updateLessonDisplay(challenge.text);
        }

        _renderIdentifyChallenge(challenge) {
            this.elements.clearBtn.classList.remove('hidden');
            this.elements.submitBtn.classList.remove('hidden');
            this._updateLessonDisplay('');

            const words = challenge.sentence.split(' ');
            const wordBank = document.createElement('div');
            wordBank.classList.add('word-bank-button-container');

            words.forEach(word => {
                const button = this._createButton(word.replace(/[.?!]/g, ''), 'word-button', () => this._selectWord(button, word.toLowerCase().replace(/[.?!]/g, '')));
                wordBank.appendChild(button);
            });

            this.elements.interactiveContainer.appendChild(wordBank);
        }

        _renderScrambleChallenge(challenge) {
            this.elements.clearBtn.classList.remove('hidden');
            this.elements.submitBtn.classList.remove('hidden');
            this._updateLessonDisplay('');

            const shuffledWords = this._shuffleArray([...challenge.words]);
            const wordBank = document.createElement('div');
            wordBank.classList.add('word-bank-button-container');

            shuffledWords.forEach(word => {
                const button = this._createButton(word, 'word-button', () => this._selectWord(button, word.toLowerCase()));
                wordBank.appendChild(button);
            });

            this.elements.interactiveContainer.appendChild(wordBank);
        }
        
        _renderMakeItASentenceChallenge(challenge) {
            this.elements.clearBtn.classList.remove('hidden');
            this.elements.submitBtn.classList.remove('hidden');
            this._updateLessonDisplay(challenge.incomplete_sentence);
            
            const wordBank = document.createElement('div');
            wordBank.classList.add('word-bank-button-container');

            const wordsToAdd = this.wordBankData.words[challenge.word_type];

            this._shuffleArray(wordsToAdd).forEach(word => {
                const button = this._createButton(word, 'word-button', () => this._selectWord(button, word.toLowerCase()));
                wordBank.appendChild(button);
            });

            this.elements.interactiveContainer.appendChild(wordBank);
        }

        _renderSillySentencesChallenge(challenge) {
            this.elements.clearBtn.classList.remove('hidden');
            this.elements.submitBtn.classList.remove('hidden');
            this._updateLessonDisplay('');
            
            const container = document.createElement('div');
            container.classList.add('flex', 'flex-col', 'md:flex-row', 'gap-4', 'w-full');
            
            const namingPartContainer = document.createElement('div');
            namingPartContainer.classList.add('silly-sentences-column', 'bg-purple-200', 'flex-1', 'text-center');
            namingPartContainer.innerHTML = '<h4 class="text-xl font-bold mb-2">Choose a Naming Part</h4>';
            challenge.naming_parts.forEach(part => {
                const button = this._createButton(part, 'word-button', () => this._selectSillyPart(button, part, 'naming'));
                namingPartContainer.appendChild(button);
            });
            
            const tellingPartContainer = document.createElement('div');
            tellingPartContainer.classList.add('silly-sentences-column', 'bg-pink-200', 'flex-1', 'text-center');
            tellingPartContainer.innerHTML = '<h4 class="text-xl font-bold mb-2">Choose a Telling Part</h4>';
            challenge.telling_parts.forEach(part => {
                const button = this._createButton(part, 'word-button', () => this._selectSillyPart(button, part, 'telling'));
                tellingPartContainer.appendChild(button);
            });

            container.appendChild(namingPartContainer);
            container.appendChild(tellingPartContainer);
            this.elements.interactiveContainer.appendChild(container);
        }

        _renderPunctuationChoiceChallenge(challenge) {
            this._updateLessonDisplay(challenge.sentence);
            
            const choicesContainer = document.createElement('div');
            choicesContainer.classList.add('flex', 'justify-center', 'gap-4', 'mt-4');

            this._shuffleArray(challenge.choices).forEach(choice => {
                const button = this._createButton(choice, 'punctuation-button', () => this._handlePunctuationChoice(choice, challenge.correct_answer));
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
                    <p class="text-xl md:text-2xl font-semibold text-center text-gray-400">Type your combined sentence here...</p>
                </div>
            `;
            
            const combineInput = document.getElementById('combineSentenceInput');
            combineInput.addEventListener('input', () => {
                const placeholder = combineInput.querySelector('p');
                if (combineInput.textContent.trim().length > 0) {
                    if (placeholder) placeholder.style.display = 'none';
                } else {
                    if (placeholder) placeholder.style.display = 'block';
                }
            });

            this.elements.submitBtn.classList.remove('hidden');
        }

        _selectWord(button, word) {
            this.state.currentSentenceArray.push(word);
            this._updateLessonDisplay(this.state.currentSentenceArray.join(' '));
            button.disabled = true;
        }
        
        _selectSillyPart(button, part, type) {
            const otherButtons = button.parentElement.querySelectorAll('button');
            otherButtons.forEach(btn => btn.disabled = true);

            if (type === 'naming') {
                this.state.namingPart = part;
            } else {
                this.state.tellingPart = part;
            }

            const fullSentence = `${this.state.namingPart} ${this.state.tellingPart}`;
            this._updateLessonDisplay(fullSentence);

            if (this.state.namingPart && this.state.tellingPart) {
                this._showMessage('Great job! You made a silly sentence!', 'success', 3000);
                this.elements.nextBtn.classList.remove('hidden');
            }
        }

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
            const fullSentence = `${challenge.incomplete_sentence.toLowerCase().replace(/\s*$/, ' ')}${this.state.currentSentenceArray.join(' ').toLowerCase().trim()}`;
            return challenge.acceptable_answers.some(answer => fullSentence.trim() === answer.toLowerCase().trim());
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
            this._updateLessonDisplay('');
            
            const wordButtons = this.elements.interactiveContainer.querySelectorAll('.word-button');
            wordButtons.forEach(button => {
                button.disabled = false;
            });
        }
        
        _createButton(text, className, onClick) {
            const button = document.createElement('button');
            button.textContent = text;
            button.classList.add(className, 'squircle');
            button.addEventListener('click', onClick);
            return button;
        }

        _updateLessonDisplay(text) {
            if (!text || text.trim() === '') {
                this.elements.lessonDisplay.innerHTML = `<p class="text-xl md:text-2xl font-semibold text-center text-gray-400">Your sentence will appear here...</p>`;
            } else {
                this.elements.lessonDisplay.innerHTML = `<p class="text-xl md:text-2xl font-semibold text-center">${text}</p>`;
            }
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
})();
