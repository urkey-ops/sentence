"use strict";

(function() {
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize the App
        new App();
    });

    /**
     * Handles all DOM manipulation and rendering concerns.
     * Keeps the main App logic clean.
     */
    class UIController {
        constructor(elements) {
            this.elements = elements;
        }

        /**
         * Clears the main display and sets a placeholder if no text is provided.
         * @param {string} text - The text to display.
         */
        updateLessonDisplay(text) {
            if (!text || text.trim() === '') {
                this.elements.lessonDisplay.innerHTML = `<p class="text-xl md:text-2xl font-semibold text-center text-gray-400">Your sentence will appear here...</p>`;
            } else {
                // Using textContent for safety when rendering user-generated text
                // However, since it's a display area, let's stick to innerHTML for potential styling/formatting if needed
                this.elements.lessonDisplay.innerHTML = `<p class="text-xl md:text-2xl font-semibold text-center">${text}</p>`;
            }
        }

        /**
         * Creates a standard button element.
         * @param {string} text - The button text.
         * @param {string} className - Additional CSS class name.
         * @param {function} onClick - The click event handler.
         * @returns {HTMLButtonElement}
         */
        createButton(text, className, onClick) {
            const button = document.createElement('button');
            button.textContent = text;
            button.classList.add(className, 'squircle');
            button.addEventListener('click', onClick);
            return button;
        }

        /**
         * Renders the lesson selection buttons.
         * @param {Array<Object>} lessons - The array of lesson data.
         * @param {function} startLessonCallback - Callback function to start a lesson.
         */
        loadLessonButtons(lessons, startLessonCallback) {
            const container = document.getElementById('lessonButtonsContainer');
            if (!container) return; 
            container.innerHTML = ''; // Clear container
            lessons.forEach((lesson, index) => {
                const button = this.createButton(`Lesson ${lesson.lesson}: ${lesson.title}`, 'lesson-button', () => startLessonCallback(index));
                container.appendChild(button);
            });
        }

        /**
         * Toggles the visibility of main screen elements.
         * @param {string} screenName - 'intro', 'selector', or 'view'.
         * @param {boolean} showBackButton - Whether to show the back button.
         */
        toggleScreens(screenName, showBackButton = false) {
            this.elements.introScreen.classList.toggle('hidden', screenName !== 'intro');
            this.elements.lessonSelector.classList.toggle('hidden', screenName !== 'selector');
            this.elements.lessonView.classList.toggle('hidden', screenName !== 'view');
            this.elements.backToLessonsBtn.classList.toggle('hidden', !showBackButton);
        }

        /**
         * Toggles the visibility of control buttons.
         * @param {Object} visibility - Object with keys for control buttons.
         */
        toggleControlButtons(visibility) {
            this.elements.submitBtn.classList.toggle('hidden', !visibility.submit);
            this.elements.clearBtn.classList.toggle('hidden', !visibility.clear);
            this.elements.nextBtn.classList.toggle('hidden', !visibility.next);
        }

        /**
         * Displays a message to the user.
         * @param {string} text - Message text.
         * @param {string} className - CSS class for styling ('success' or 'failure').
         * @param {number} duration - Time in ms to display the message (0 for permanent).
         * @param {number} messageTimeout - The current timeout ID.
         * @param {function} hideMessageCallback - Callback to hide the message.
         * @returns {number} The new timeout ID.
         */
        showMessage(text, className, duration, messageTimeout, hideMessageCallback) {
            clearTimeout(messageTimeout);
            this.elements.messageBox.textContent = text;
            this.elements.messageBox.className = `message-box visible ${className}`;
            
            if (duration > 0) {
                return setTimeout(() => hideMessageCallback(), duration);
            }
            return null;
        }

        hideMessage() {
            this.elements.messageBox.classList.remove('visible');
        }
        
        // Render methods (moved from App)
        // Note: These still contain significant DOM creation but are now centralized.
        
        renderSentenceOrNotChallenge(challenge, handlerCallback) {
            this.toggleControlButtons({ submit: false, clear: false, next: false });
            this.elements.interactiveContainer.innerHTML = '';
            
            const trueBtn = this.createButton('Yes, it is!', 'action-button', () => handlerCallback(true, challenge.isSentence));
            const falseBtn = this.createButton('No, it is not.', 'action-button', () => handlerCallback(false, challenge.isSentence));

            this.elements.interactiveContainer.appendChild(trueBtn);
            this.elements.interactiveContainer.appendChild(falseBtn);
            this.updateLessonDisplay(challenge.text);
        }

        renderWordBankChallenge(words, selectWordCallback) {
            this.toggleControlButtons({ submit: true, clear: true, next: false });
            this.updateLessonDisplay('');

            const wordBank = document.createElement('div');
            wordBank.classList.add('word-bank-button-container');

            words.forEach(word => {
                const button = this.createButton(word, 'word-button', () => selectWordCallback(button, word));
                wordBank.appendChild(button);
            });

            this.elements.interactiveContainer.innerHTML = '';
            this.elements.interactiveContainer.appendChild(wordBank);
        }

        renderSillySentencesChallenge(challenge, selectSillyPartCallback) {
            this.toggleControlButtons({ submit: true, clear: true, next: false });
            this.updateLessonDisplay('');

            const container = document.createElement('div');
            container.classList.add('flex', 'flex-col', 'md:flex-row', 'gap-4', 'w-full');
            
            // Naming Part Container
            const namingPartContainer = document.createElement('div');
            namingPartContainer.classList.add('silly-sentences-column', 'bg-purple-200', 'flex-1', 'text-center');
            namingPartContainer.innerHTML = '<h4 class="text-xl font-bold mb-2">Choose a Naming Part</h4>';
            challenge.naming_parts.forEach(part => {
                const button = this.createButton(part, 'word-button', () => selectSillyPartCallback(button, part, 'naming'));
                namingPartContainer.appendChild(button);
            });
            
            // Telling Part Container
            const tellingPartContainer = document.createElement('div');
            tellingPartContainer.classList.add('silly-sentences-column', 'bg-pink-200', 'flex-1', 'text-center');
            tellingPartContainer.innerHTML = '<h4 class="text-xl font-bold mb-2">Choose a Telling Part</h4>';
            challenge.telling_parts.forEach(part => {
                const button = this.createButton(part, 'word-button', () => selectSillyPartCallback(button, part, 'telling'));
                tellingPartContainer.appendChild(button);
            });

            container.appendChild(namingPartContainer);
            container.appendChild(tellingPartContainer);
            this.elements.interactiveContainer.innerHTML = '';
            this.elements.interactiveContainer.appendChild(container);
        }
        
        renderPunctuationChoiceChallenge(challenge, handlerCallback) {
            this.toggleControlButtons({ submit: false, clear: false, next: false });
            this.updateLessonDisplay(challenge.sentence);

            const choicesContainer = document.createElement('div');
            choicesContainer.classList.add('flex', 'justify-center', 'gap-4', 'mt-4');

            challenge.choices.forEach(choice => {
                const button = this.createButton(choice, 'punctuation-button', () => handlerCallback(choice, challenge.correct_answer));
                choicesContainer.appendChild(button);
            });

            this.elements.interactiveContainer.innerHTML = '';
            this.elements.interactiveContainer.appendChild(choicesContainer);
        }

        // The combine sentences challenge still requires some view logic due to the contenteditable setup
        renderCombineSentencesChallenge(challenge, submitCallback) {
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
            // Attach temporary event listener to handle placeholder visibility
            const inputHandler = () => {
                const placeholder = combineInput.querySelector('p');
                if (combineInput.textContent.trim().length > 0) {
                    if (placeholder) placeholder.style.display = 'none';
                } else {
                    if (placeholder) placeholder.style.display = 'block';
                }
            };
            
            // Remove previous listeners to prevent duplicates
            combineInput.removeEventListener('input', this._currentInputHandler); 
            combineInput.addEventListener('input', inputHandler);
            this._currentInputHandler = inputHandler; // Store reference for removal

            this.toggleControlButtons({ submit: true, clear: false, next: false });
        }
    }


    /**
     * The main application logic and state controller.
     */
    class App {
        constructor() {
            this.elements = this._getElements();
            this.ui = new UIController(this.elements);
            this.lessons = [];
            this.state = {
                currentLessonIndex: 0,
                currentChallengeIndex: 0,
                // Stores the words/parts selected by the user for the current challenge
                currentSelectionArray: [], 
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

        _getElements() {
            // Centralized DOM element fetching
            return {
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
                // Include other step elements if needed, but they are generally UI/Display only.
            };
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

        // --- Screen Transitions (Use UIController) ---
        _showIntroScreen() {
            this.ui.toggleScreens('intro');
        }

        _showLessonSelector() {
            this.ui.toggleScreens('selector', false);
            this.ui.toggleControlButtons({ submit: false, clear: false, next: false });
            this.ui.loadLessonButtons(this.lessons, this._startLesson.bind(this));
        }

        _startLesson(lessonIndex) {
            this.state.currentLessonIndex = lessonIndex;
            this.state.currentChallengeIndex = 0;
            this.ui.toggleScreens('view', true);
            this._loadLesson();
        }

        _loadLesson() {
            this._hideMessage();
            
            const currentLesson = this.lessons[this.state.currentLessonIndex];
            this.elements.lessonTitle.textContent = `Lesson ${currentLesson.lesson}: ${currentLesson.title}`;
            this.elements.lessonGoalDisplay.textContent = currentLesson.goal;
            
            // Shuffle only on the first load of a lesson
            if (this.state.currentChallengeIndex === 0) {
                currentLesson.challenges = this._shuffleArray(currentLesson.challenges);
            }

            this._renderChallenge();
        }

        // --- Challenge Rendering (Delegated to UIController) ---
        _renderChallenge() {
            // Reset state
            this.state.currentSelectionArray = [];
            this.state.namingPart = '';
            this.state.tellingPart = '';
            this.elements.interactiveContainer.innerHTML = '';
            
            const currentLesson = this.lessons[this.state.currentLessonIndex];
            const currentChallenge = currentLesson.challenges[this.state.currentChallengeIndex];

            this.elements.progressIndicator.textContent = `Challenge ${this.state.currentChallengeIndex + 1} of ${currentLesson.challenges.length}`;

            const handler = this.challengeHandlers[currentLesson.type];
            if (handler) {
                handler.call(this, currentChallenge);
            } else {
                const errorMsg = `No handler found for lesson type: ${currentLesson.type}`;
                console.error(errorMsg);
                this._showMessage(`Application Error: ${errorMsg}`, 'failure', 0);
            }
        }
        
        _renderSentenceOrNotChallenge(challenge) {
            this.ui.renderSentenceOrNotChallenge(challenge, this._handleSentenceOrNot.bind(this));
        }

        _renderIdentifyChallenge(challenge) {
            // Extract and prepare words for the word bank
            const words = challenge.sentence.split(' ').map(word => word.replace(/[.?!]/g, ''));
            
            this.ui.renderWordBankChallenge(words, (button, word) => {
                this._selectWord(button, word.toLowerCase()); // Logic remains in App
            });
        }

        _renderScrambleChallenge(challenge) {
            const shuffledWords = this._shuffleArray([...challenge.words]);
            
            this.ui.renderWordBankChallenge(shuffledWords, (button, word) => {
                this._selectWord(button, word); // Logic remains in App
            });
        }
        
        _renderMakeItASentenceChallenge(challenge) {
            this.state.currentSelectionArray = [challenge.incomplete_sentence]; // Pre-fill with incomplete part
            this.ui.updateLessonDisplay(this.state.currentSelectionArray[0]);

            const wordsToAdd = this.wordBankData.words[challenge.word_type];
            
            this.ui.renderWordBankChallenge(this._shuffleArray(wordsToAdd), (button, word) => {
                this._selectWord(button, word, true); // Use isAppendable flag
            });
        }

        _renderSillySentencesChallenge(challenge) {
            this.ui.renderSillySentencesChallenge(challenge, this._selectSillyPart.bind(this));
        }

        _renderPunctuationChoiceChallenge(challenge) {
            this.ui.renderPunctuationChoiceChallenge(challenge, this._handlePunctuationChoice.bind(this));
        }

        _renderCombineSentencesChallenge(challenge) {
            // UI handles most of the display, App only attaches the submit handler implicitly
            this.ui.renderCombineSentencesChallenge(challenge, this._handleSubmit.bind(this));
        }

        // --- Interaction Logic (Core to App) ---
        
        /**
         * Selects a word/part for sentence construction challenges.
         * @param {HTMLElement} button - The button element clicked.
         * @param {string} word - The word/part value.
         * @param {boolean} isAppendable - Flag for MakeItASentence to only allow one selection.
         */
        _selectWord(button, word, isAppendable = false) {
            if (isAppendable) {
                // For MakeItASentence: replace the only selectable item (the part to be added)
                this.state.currentSelectionArray[1] = word;
            } else {
                this.state.currentSelectionArray.push(word);
            }
            
            this.ui.updateLessonDisplay(this.state.currentSelectionArray.join(' '));
            button.disabled = true;

            // Immediately enable submit for single selection challenges like make_it_a_sentence
            if (isAppendable) {
                this.elements.submitBtn.classList.remove('hidden');
            }
        }
        
        _selectSillyPart(button, part, type) {
            // Disable other buttons in the same column
            const otherButtons = button.parentElement.querySelectorAll('button');
            otherButtons.forEach(btn => btn.disabled = true);

            if (type === 'naming') {
                this.state.namingPart = part;
            } else {
                this.state.tellingPart = part;
            }

            const fullSentence = `${this.state.namingPart} ${this.state.tellingPart}`;
            this.ui.updateLessonDisplay(fullSentence);

            if (this.state.namingPart && this.state.tellingPart) {
                this._showMessage('Great job! You made a silly sentence!', 'success', 3000);
                this.elements.nextBtn.classList.remove('hidden');
                this.elements.submitBtn.classList.add('hidden'); // Silly sentences auto-pass/show next
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
                    isCorrect = this._checkCombineSentences(currentChallenge);
                    break;
                default:
                    // Should not happen if rendering is correct, but safe check
                    console.warn(`Attempted to submit for unhandled type: ${currentLesson.type}`);
                    return;
            }

            if (isCorrect) {
                this._showMessage('Correct! Great job!', 'success', 3000);
                this.elements.nextBtn.classList.remove('hidden');
                this.elements.submitBtn.classList.add('hidden');
            } else {
                this._showMessage('Not quite, try again.', 'failure', 3000);
            }
        }
        
        // --- Answer Checking Logic ---
        
        _checkIdentify(challenge) {
            const userAnswer = this.state.currentSelectionArray.sort().join(' ');
            const correctAnswers = challenge.answer.sort().join(' ');
            return userAnswer === correctAnswers;
        }
        
        _checkScramble(challenge) {
            const userAnswer = this.state.currentSelectionArray.join(' ').toLowerCase();
            return userAnswer === challenge.correct_answer.toLowerCase();
        }
        
        _checkMakeItASentence(challenge) {
            // currentSelectionArray is [incomplete_sentence, selected_word]
            const fullSentence = this.state.currentSelectionArray.join(' ').trim();
            const correctAnswer = challenge.correct_answer.trim();
            return fullSentence.toLowerCase() === correctAnswer.toLowerCase();
        }

        _checkCombineSentences(challenge) {
            const combineInput = document.getElementById('combineSentenceInput');
            // Basic cleanup: trim, to lowercase, remove common punctuation
            const userSentence = combineInput ? combineInput.textContent.trim().toLowerCase().replace(/[.,?!]/g, '') : '';
            const correctAnswer = challenge.correct_answer.toLowerCase().replace(/[.,?!]/g, '');
            return userSentence === correctAnswer;
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
                this._showMessage('Lesson complete! Well done.', 'success', 3000);
                this.elements.backToLessonsBtn.classList.remove('hidden');
            }
        }

        _handleClear() {
            this.state.currentSelectionArray = [];
            this.state.namingPart = '';
            this.state.tellingPart = '';
            
            const currentLesson = this.lessons[this.state.currentLessonIndex];
            const currentChallenge = currentLesson.challenges[this.state.currentChallengeIndex];
            
            // Re-display the incomplete sentence if applicable
            if (currentLesson.type === 'make_it_a_sentence') {
                this.state.currentSelectionArray = [currentChallenge.incomplete_sentence];
                this.ui.updateLessonDisplay(currentChallenge.incomplete_sentence);
            } else {
                this.ui.updateLessonDisplay('');
            }
            
            // Re-enable word/part selection buttons
            const wordButtons = this.elements.interactiveContainer.querySelectorAll('.word-button');
            wordButtons.forEach(button => {
                button.disabled = false;
            });
            
            // Re-hide submit if no selection is made for make_it_a_sentence (only clear does this)
            if (currentLesson.type === 'make_it_a_sentence') {
                this.elements.submitBtn.classList.add('hidden');
            }
        }
        
        // --- Utility Methods ---
        
        _showMessage(text, className, duration = 3000) {
            this.messageTimeout = this.ui.showMessage(text, className, duration, this.messageTimeout, this._hideMessage.bind(this));
        }

        _hideMessage() {
            this.ui.hideMessage();
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
