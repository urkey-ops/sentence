"use strict";

(function() {
    document.addEventListener('DOMContentLoaded', () => {
        new App();
    });

    // Constants for CSS classes
    const CSS_CLASSES = {
        LESSON_DISPLAY_TEXT: 'lesson-display-text',
        LESSON_DISPLAY_PLACEHOLDER: 'lesson-display-placeholder',
        BASE_BUTTON: 'base-button',
        SQUIRCLE: 'squircle',
        LESSON_BUTTON: 'lesson-button',
        ACTION_BUTTON: 'action-button',
        WORD_BUTTON: 'word-button',
        PUNCTUATION_BUTTON: 'punctuation-button',
        WORD_BANK_CONTAINER: 'word-bank-button-container',
        SILLY_CONTAINER: 'silly-sentences-container',
        SILLY_COLUMN: 'silly-sentences-column',
        NAMING_COLUMN: 'naming-part-column',
        TELLING_COLUMN: 'telling-part-column',
        COLUMN_TITLE: 'column-title',
        PUNCTUATION_CHOICES: 'punctuation-choices-container',
        COMBINE_DISPLAY: 'combine-sentences-display',
        COMBINE_PART: 'combine-sentence-part',
        COMBINE_CONJUNCTION: 'combine-conjunction',
        COMBINE_INPUT: 'combine-input',
        MESSAGE_BOX: 'message-box',
        VISIBLE: 'visible',
        HIDDEN: 'hidden',
        SELECTED: 'selected',
        SUCCESS: 'success',
        FAILURE: 'failure'
    };

    // Constants for element IDs
    const ELEMENT_IDS = {
        INTRO_SCREEN: 'introScreen',
        START_LESSONS_BTN: 'startLessonsBtn',
        THEME_SELECTOR: 'themeSelector',
        LESSON_SELECTOR: 'lessonSelector',
        LESSON_VIEW: 'lessonView',
        LESSON_TITLE: 'lessonTitle',
        LESSON_GOAL_DISPLAY: 'lessonGoalDisplay',
        PROGRESS_INDICATOR: 'progressIndicator',
        LESSON_DISPLAY: 'lessonDisplay',
        INTERACTIVE_CONTAINER: 'interactiveContainer',
        SUBMIT_BTN: 'submitBtn',
        NEXT_BTN: 'nextBtn',
        CLEAR_BTN: 'clearBtn',
        BACK_TO_LESSONS_BTN: 'backToLessonsBtn',
        MESSAGE_BOX: 'messageBox',
        LESSON_BUTTONS_CONTAINER: 'lessonButtonsContainer',
        COMBINE_SENTENCE_INPUT: 'combineSentenceInput'
    };

    // Constants for lesson types
    const LESSON_TYPES = {
        SENTENCE_OR_NOT: 'sentence_or_not',
        IDENTIFY: 'identify',
        SCRAMBLE: 'scramble',
        MAKE_IT_A_SENTENCE: 'make_it_a_sentence',
        SILLY_SENTENCES: 'silly_sentences',
        PUNCTUATION_CHOICE: 'punctuation_choice',
        COMBINE_SENTENCES: 'combine_sentences'
    };

    /**
     * Handles all DOM manipulation and rendering concerns.
     */
    class UIController {
        constructor(elements) {
            this.elements = elements;
        }

        /**
         * Updates the lesson display with text or placeholder.
         * @param {string} text - The text to display.
         */
        updateLessonDisplay(text) {
            const { lessonDisplay } = this.elements;
            lessonDisplay.classList.remove(CSS_CLASSES.LESSON_DISPLAY_TEXT, CSS_CLASSES.LESSON_DISPLAY_PLACEHOLDER);

            if (!text || text.trim() === '') {
                lessonDisplay.textContent = 'Your sentence will appear here...';
                lessonDisplay.classList.add(CSS_CLASSES.LESSON_DISPLAY_PLACEHOLDER);
            } else {
                lessonDisplay.textContent = text;
                lessonDisplay.classList.add(CSS_CLASSES.LESSON_DISPLAY_TEXT);
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
            button.classList.add(CSS_CLASSES.BASE_BUTTON, CSS_CLASSES.SQUIRCLE, className);
            button.addEventListener('click', onClick);
            return button;
        }

        /**
         * Renders the lesson selection buttons.
         * @param {Array<Object>} lessons - The array of lesson data.
         * @param {function} startLessonCallback - Callback function to start a lesson.
         */
        loadLessonButtons(lessons, startLessonCallback) {
            const container = document.getElementById(ELEMENT_IDS.LESSON_BUTTONS_CONTAINER);
            if (!container) {
                console.error(`Element with ID '${ELEMENT_IDS.LESSON_BUTTONS_CONTAINER}' not found`);
                return;
            }
            container.innerHTML = '';
            lessons.forEach((lesson, index) => {
                const button = this.createButton(
                    `Lesson ${lesson.lesson}: ${lesson.title}`, 
                    CSS_CLASSES.LESSON_BUTTON, 
                    () => startLessonCallback(index)
                );
                container.appendChild(button);
            });
        }

        /**
         * Toggles the visibility of main screen elements.
         * @param {string} screenName - 'intro', 'selector', or 'view'.
         * @param {boolean} showBackButton - Whether to show the back button.
         */
        toggleScreens(screenName, showBackButton = false) {
            this.elements.introScreen.classList.toggle(CSS_CLASSES.HIDDEN, screenName !== 'intro');
            this.elements.lessonSelector.classList.toggle(CSS_CLASSES.HIDDEN, screenName !== 'selector');
            this.elements.lessonView.classList.toggle(CSS_CLASSES.HIDDEN, screenName !== 'view');
            this.elements.backToLessonsBtn.classList.toggle(CSS_CLASSES.HIDDEN, !showBackButton);
        }

        /**
         * Toggles the visibility of control buttons.
         * @param {Object} visibility - Object with keys for control buttons.
         */
        toggleControlButtons(visibility) {
            this.elements.submitBtn.classList.toggle(CSS_CLASSES.HIDDEN, !visibility.submit);
            this.elements.clearBtn.classList.toggle(CSS_CLASSES.HIDDEN, !visibility.clear);
            this.elements.nextBtn.classList.toggle(CSS_CLASSES.HIDDEN, !visibility.next);
        }

        /**
         * Displays a message to the user.
         * @param {string} text - Message text.
         * @param {string} className - CSS class for styling ('success' or 'failure').
         * @param {number} duration - Time in ms to display the message (0 for permanent).
         * @param {number|null} messageTimeout - The current timeout ID.
         * @param {function} hideMessageCallback - Callback to hide the message.
         * @returns {number|null} The new timeout ID.
         */
        showMessage(text, className, duration, messageTimeout, hideMessageCallback) {
            if (messageTimeout) {
                clearTimeout(messageTimeout);
            }
            this.elements.messageBox.textContent = text;
            this.elements.messageBox.className = `${CSS_CLASSES.MESSAGE_BOX} ${CSS_CLASSES.VISIBLE} ${className}`;
            
            if (duration > 0) {
                return setTimeout(() => hideMessageCallback(), duration);
            }
            return null;
        }

        hideMessage() {
            this.elements.messageBox.classList.remove(CSS_CLASSES.VISIBLE);
        }

        /**
         * Clears the interactive container.
         */
        clearInteractiveContainer() {
            this.elements.interactiveContainer.innerHTML = '';
        }

        /**
         * Gets a managed input element (textarea) for combine sentences challenge.
         * @returns {HTMLTextAreaElement|null}
         */
        getCombineInput() {
            return document.getElementById(ELEMENT_IDS.COMBINE_SENTENCE_INPUT);
        }
        
        // --- Render Methods (DOM Creation) ---
        
        renderSentenceOrNotChallenge(challenge, handlerCallback) {
            this.toggleControlButtons({ submit: false, clear: false, next: false });
            this.clearInteractiveContainer();
            
            const trueBtn = this.createButton('Yes, it is!', CSS_CLASSES.ACTION_BUTTON, () => handlerCallback(true));
            const falseBtn = this.createButton('No, it is not.', CSS_CLASSES.ACTION_BUTTON, () => handlerCallback(false));

            this.elements.interactiveContainer.appendChild(trueBtn);
            this.elements.interactiveContainer.appendChild(falseBtn);
            
            this.updateLessonDisplay(challenge.text); 
        }

        renderWordBankChallenge(words, selectWordCallback) {
            this.toggleControlButtons({ submit: true, clear: true, next: false });
            this.updateLessonDisplay('');

            const wordBank = document.createElement('div');
            wordBank.classList.add(CSS_CLASSES.WORD_BANK_CONTAINER);

            words.forEach(word => {
                const button = this.createButton(word, CSS_CLASSES.WORD_BUTTON, (e) => selectWordCallback(e.target, word));
                wordBank.appendChild(button);
            });

            this.clearInteractiveContainer();
            this.elements.interactiveContainer.appendChild(wordBank);
        }

        renderSillySentencesChallenge(challenge, selectSillyPartCallback) {
            this.toggleControlButtons({ submit: true, clear: true, next: false });
            this.updateLessonDisplay('');

            const container = document.createElement('div');
            container.classList.add(CSS_CLASSES.SILLY_CONTAINER);
            
            // Naming Part Container
            const namingPartContainer = document.createElement('div');
            namingPartContainer.classList.add(CSS_CLASSES.SILLY_COLUMN, CSS_CLASSES.NAMING_COLUMN);
            namingPartContainer.innerHTML = `<h4 class="${CSS_CLASSES.COLUMN_TITLE}">Choose a Naming Part</h4>`;
            challenge.naming_parts.forEach(part => {
                const button = this.createButton(part, CSS_CLASSES.WORD_BUTTON, (e) => selectSillyPartCallback(e.target, part, 'naming'));
                namingPartContainer.appendChild(button);
            });
            
            // Telling Part Container
            const tellingPartContainer = document.createElement('div');
            tellingPartContainer.classList.add(CSS_CLASSES.SILLY_COLUMN, CSS_CLASSES.TELLING_COLUMN);
            tellingPartContainer.innerHTML = `<h4 class="${CSS_CLASSES.COLUMN_TITLE}">Choose a Telling Part</h4>`;
            challenge.telling_parts.forEach(part => {
                const button = this.createButton(part, CSS_CLASSES.WORD_BUTTON, (e) => selectSillyPartCallback(e.target, part, 'telling'));
                tellingPartContainer.appendChild(button);
            });

            container.appendChild(namingPartContainer);
            container.appendChild(tellingPartContainer);
            this.clearInteractiveContainer();
            this.elements.interactiveContainer.appendChild(container);
        }
        
        renderPunctuationChoiceChallenge(challenge, handlerCallback) {
            this.toggleControlButtons({ submit: false, clear: false, next: false });
            this.updateLessonDisplay(challenge.sentence);

            const choicesContainer = document.createElement('div');
            choicesContainer.classList.add(CSS_CLASSES.PUNCTUATION_CHOICES);

            challenge.choices.forEach(choice => {
                const button = this.createButton(choice, CSS_CLASSES.PUNCTUATION_BUTTON, () => handlerCallback(choice));
                choicesContainer.appendChild(button);
            });

            this.clearInteractiveContainer();
            this.elements.interactiveContainer.appendChild(choicesContainer);
        }

        /**
         * Renders the Combine Sentences challenge using a standard <textarea> for input.
         */
        renderCombineSentencesChallenge(challenge) {
            this.elements.lessonGoalDisplay.textContent = `Combine two sentences using '${challenge.conjunction}'.`;
            
            this.elements.lessonDisplay.innerHTML = `
                <div class="${CSS_CLASSES.COMBINE_DISPLAY}">
                    <p class="${CSS_CLASSES.COMBINE_PART}">${this._escapeHtml(challenge.sentences[0])}</p>
                    <p class="${CSS_CLASSES.COMBINE_CONJUNCTION}">${this._escapeHtml(challenge.conjunction)}</p>
                    <p class="${CSS_CLASSES.COMBINE_PART}">${this._escapeHtml(challenge.sentences[1])}</p>
                </div>
                <textarea id="${ELEMENT_IDS.COMBINE_SENTENCE_INPUT}" rows="3" placeholder="Type your combined sentence here..." class="${CSS_CLASSES.COMBINE_INPUT}"></textarea>
            `;

            this.clearInteractiveContainer();
            this.toggleControlButtons({ submit: true, clear: false, next: false });
        }

        /**
         * Escapes HTML to prevent XSS.
         * @param {string} text 
         * @returns {string}
         */
        _escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
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
                selectedWords: [],
                sillyParts: { naming: '', telling: '' },
                makeItASentence: { prefix: '', suffix: '' },
                currentChallenge: null
            };
            this.messageTimeout = null;
            this.wordBankData = {};
            this.challengeHandlers = {
                [LESSON_TYPES.SENTENCE_OR_NOT]: this._renderSentenceOrNotChallenge,
                [LESSON_TYPES.IDENTIFY]: this._renderIdentifyChallenge,
                [LESSON_TYPES.SCRAMBLE]: this._renderScrambleChallenge,
                [LESSON_TYPES.MAKE_IT_A_SENTENCE]: this._renderMakeItASentenceChallenge,
                [LESSON_TYPES.SILLY_SENTENCES]: this._renderSillySentencesChallenge,
                [LESSON_TYPES.PUNCTUATION_CHOICE]: this._renderPunctuationChoiceChallenge,
                [LESSON_TYPES.COMBINE_SENTENCES]: this._renderCombineSentencesChallenge
            };

            this._loadLessonsFile();
        }

        _getElements() {
            const elements = {};
            Object.values(ELEMENT_IDS).forEach(id => {
                elements[this._camelCase(id)] = document.getElementById(id);
            });
            return elements;
        }

        /**
         * Converts kebab-case or regular ID to camelCase.
         * @param {string} str 
         * @returns {string}
         */
        _camelCase(str) {
            return str.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase());
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
                    throw new Error(`Failed to load lessons.json: ${lessonsResponse.status}`);
                }
                this.lessons = await lessonsResponse.json();

                const wordsResponse = await fetch('words.json');
                if (!wordsResponse.ok) {
                    throw new Error(`Failed to load words.json: ${wordsResponse.status}`);
                }
                this.wordBankData = await wordsResponse.json();

                this._initialize();
            } catch (error) {
                console.error('Error loading files:', error);
                this._showMessage('Failed to load lessons. Please refresh the page.', CSS_CLASSES.FAILURE, 0);
            }
        }
        
        _initialize() {
            this._addEventListeners();
            this._showIntroScreen();
        }

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
            
            if (this.state.currentChallengeIndex === 0) {
                currentLesson.challenges = this._shuffleArray(currentLesson.challenges);
            }

            this._renderChallenge();
        }

        _renderChallenge() {
            this._resetState();
            this.ui.clearInteractiveContainer();
            
            const currentLesson = this.lessons[this.state.currentLessonIndex];
            const currentChallenge = currentLesson.challenges[this.state.currentChallengeIndex];
            this.state.currentChallenge = currentChallenge;

            this.elements.progressIndicator.textContent = `Challenge ${this.state.currentChallengeIndex + 1} of ${currentLesson.challenges.length}`;

            const handler = this.challengeHandlers[currentLesson.type];
            if (handler) {
                handler.call(this, currentChallenge);
            } else {
                const errorMsg = `No handler found for lesson type: ${currentLesson.type}`;
                console.error(errorMsg);
                this._showMessage(`Application Error: ${errorMsg}`, CSS_CLASSES.FAILURE, 0);
            }
        }

        /**
         * Resets state for a new challenge.
         */
        _resetState() {
            this.state.selectedWords = [];
            this.state.sillyParts = { naming: '', telling: '' };
            this.state.makeItASentence = { prefix: '', suffix: '' };
        }
        
        _renderSentenceOrNotChallenge(challenge) {
            this.ui.renderSentenceOrNotChallenge(challenge, this._handleSentenceOrNot.bind(this));
        }

        _renderIdentifyChallenge(challenge) {
            const words = challenge.sentence.split(' ').map(word => word.replace(/[.?!]/g, ''));
            this.ui.renderWordBankChallenge(this._shuffleArray(words), (button, word) => {
                this._selectWord(button, word.toLowerCase());
            });
        }

        _renderScrambleChallenge(challenge) {
            const shuffledWords = this._shuffleArray([...challenge.words]);
            this.ui.renderWordBankChallenge(shuffledWords, (button, word) => {
                this._selectWord(button, word);
            });
        }
        
        _renderMakeItASentenceChallenge(challenge) {
            this.state.makeItASentence.prefix = challenge.incomplete_sentence;
            this.ui.updateLessonDisplay(this.state.makeItASentence.prefix);

            const wordsToAdd = this.wordBankData.words?.[challenge.word_type] || [];
            if (wordsToAdd.length === 0) {
                console.error(`No words found for word_type: ${challenge.word_type}`);
            }
            
            this.ui.renderWordBankChallenge(this._shuffleArray(wordsToAdd), (button, word) => {
                this._selectWordForMakeItASentence(button, word);
            });
        }

        _renderSillySentencesChallenge(challenge) {
            this.ui.renderSillySentencesChallenge(challenge, this._selectSillyPart.bind(this));
        }

        _renderPunctuationChoiceChallenge(challenge) {
            this.ui.renderPunctuationChoiceChallenge(challenge, this._handlePunctuationChoice.bind(this));
        }

        _renderCombineSentencesChallenge(challenge) {
            this.ui.renderCombineSentencesChallenge(challenge);
        }
        
        /**
         * Handles word selection for identify and scramble challenges.
         */
        _selectWord(button, word) {
            this.state.selectedWords.push(word);
            button.disabled = true;
            this.ui.updateLessonDisplay(this.state.selectedWords.join(' '));
        }

        /**
         * Handles word selection for make_it_a_sentence challenge.
         */
        _selectWordForMakeItASentence(button, word) {
            this.state.makeItASentence.suffix = word;
            
            const buttons = this.elements.interactiveContainer.querySelectorAll(`.${CSS_CLASSES.WORD_BUTTON}`);
            buttons.forEach(btn => btn.disabled = false);
            button.disabled = true;

            const fullSentence = `${this.state.makeItASentence.prefix} ${this.state.makeItASentence.suffix}`;
            this.ui.updateLessonDisplay(fullSentence);
            
            this.elements.submitBtn.classList.remove(CSS_CLASSES.HIDDEN);
        }
        
        /**
         * Handles silly sentence part selection.
         */
        _selectSillyPart(button, part, type) {
            const otherButtons = button.parentElement.querySelectorAll('button');
            otherButtons.forEach(btn => btn.disabled = true);
            button.classList.add(CSS_CLASSES.SELECTED);
            
            this.state.sillyParts[type] = part;

            const fullSentence = `${this.state.sillyParts.naming} ${this.state.sillyParts.telling}`;
            this.ui.updateLessonDisplay(fullSentence);

            if (this.state.sillyParts.naming && this.state.sillyParts.telling) {
                this._handleSubmit(true);
            }
        }

        /**
         * Handles submit button click.
         * @param {boolean} forceCorrect - Force the answer to be correct (for auto-submit).
         */
        _handleSubmit(forceCorrect = false) {
            const currentLesson = this.lessons[this.state.currentLessonIndex];
            const currentChallenge = this.state.currentChallenge;

            if (!currentChallenge) {
                console.error('No current challenge found');
                return;
            }

            let isCorrect = forceCorrect;

            if (!forceCorrect) {
                switch (currentLesson.type) {
                    case LESSON_TYPES.IDENTIFY:
                        isCorrect = this._checkIdentifyAnswer(currentChallenge);
                        break;
                    case LESSON_TYPES.SCRAMBLE:
                    case LESSON_TYPES.MAKE_IT_A_SENTENCE:
                        isCorrect = this._checkWordSequence(currentChallenge);
                        break;
                    case LESSON_TYPES.COMBINE_SENTENCES:
                        isCorrect = this._checkCombineSentences(currentChallenge);
                        break;
                    default:
                        console.warn(`Submit attempted for unhandled type: ${currentLesson.type}`);
                        return;
                }
            }

            if (isCorrect) {
                this._showMessage('Correct! Great job!', CSS_CLASSES.SUCCESS, 3000);
                this.elements.nextBtn.classList.remove(CSS_CLASSES.HIDDEN);
                this.elements.submitBtn.classList.add(CSS_CLASSES.HIDDEN);
            } else {
                this._showMessage('Not quite, try again.', CSS_CLASSES.FAILURE, 3000);
            }
        }

        /**
         * Checks if the identify challenge answer is correct.
         */
        _checkIdentifyAnswer(challenge) {
            if (!challenge.answer || !Array.isArray(challenge.answer)) {
                console.error('Invalid challenge answer format');
                return false;
            }
            const userWords = [...this.state.selectedWords].sort().join(' ');
            const correctWords = [...challenge.answer].sort().join(' ');
            return userWords === correctWords;
        }
        
        /**
         * Checks if the word sequence answer is correct.
         */
        _checkWordSequence(challenge) {
            if (!challenge.correct_answer) {
                console.error('Challenge missing correct_answer');
                return false;
            }

            const currentLesson = this.lessons[this.state.currentLessonIndex];
            let userAnswer = '';

            if (currentLesson.type === LESSON_TYPES.MAKE_IT_A_SENTENCE) {
                userAnswer = `${this.state.makeItASentence.prefix} ${this.state.makeItASentence.suffix}`;
            } else {
                userAnswer = this.state.selectedWords.join(' ');
            }

            return userAnswer.toLowerCase().trim() === challenge.correct_answer.toLowerCase().trim();
        }

        /**
         * Checks if the combine sentences answer is correct.
         */
        _checkCombineSentences(challenge) {
            if (!challenge.correct_answer) {
                console.error('Challenge missing correct_answer');
                return false;
            }

            const combineInput = this.ui.getCombineInput();
            if (!combineInput) {
                console.error('Combine input element not found');
                return false;
            }

            const userSentence = combineInput.value.trim().toLowerCase().replace(/[.,?!]/g, '');
            const correctAnswer = challenge.correct_answer.toLowerCase().replace(/[.,?!]/g, '');
            
            return userSentence === correctAnswer;
        }

        /**
         * Handles sentence_or_not challenge response.
         */
        _handleSentenceOrNot(userChoice) {
            if (this.state.currentChallenge?.isSentence === undefined) {
                console.error('Challenge missing isSentence property');
                return;
            }

            const isCorrect = userChoice === this.state.currentChallenge.isSentence;
            if (isCorrect) {
                this._showMessage('Correct!', CSS_CLASSES.SUCCESS, 3000);
                this.elements.nextBtn.classList.remove(CSS_CLASSES.HIDDEN);
            } else {
                this._showMessage('Not quite, try again.', CSS_CLASSES.FAILURE, 3000);
            }
        }

        /**
         * Handles punctuation choice challenge response.
         */
        _handlePunctuationChoice(userChoice) {
            if (!this.state.currentChallenge?.correct_answer) {
                console.error('Challenge missing correct_answer');
                return;
            }

            const isCorrect = userChoice === this.state.currentChallenge.correct_answer;
            if (isCorrect) {
                this._showMessage('Correct! That\'s a feeling sentence.', CSS_CLASSES.SUCCESS, 3000);
                this.elements.nextBtn.classList.remove(CSS_CLASSES.HIDDEN);
            } else {
                this._showMessage('Not quite, try again.', CSS_CLASSES.FAILURE, 3000);
            }
        }

        /**
         * Handles next button click.
         */
        _handleNext() {
            this.state.currentChallengeIndex++;
            const currentLesson = this.lessons[this.state.currentLessonIndex];
            
            if (this.state.currentChallengeIndex < currentLesson.challenges.length) {
                this._renderChallenge();
            } else {
                this._showMessage('Lesson complete! Well done.', CSS_CLASSES.SUCCESS, 3000);
                this.elements.backToLessonsBtn.classList.remove(CSS_CLASSES.HIDDEN);
                this.ui.toggleControlButtons({ submit: false, clear: false, next: false });
            }
        }

        /**
         * Handles clear button click.
         */
        _handleClear() {
            const currentLessonType = this.lessons[this.state.currentLessonIndex].type;
            const currentChallenge = this.state.currentChallenge;
            
            if (currentLessonType === LESSON_TYPES.MAKE_IT_A_SENTENCE && currentChallenge) {
                this.state.makeItASentence.suffix = '';
                this.ui.updateLessonDisplay(this.state.makeItASentence.prefix);
                this.elements.submitBtn.classList.add(CSS_CLASSES.HIDDEN);
            } else {
                this._resetState();
                this.ui.updateLessonDisplay('');
            }
            
            const wordButtons = this.elements.interactiveContainer.querySelectorAll(`.${CSS_CLASSES.WORD_BUTTON}`);
            wordButtons.forEach(button => {
                button.disabled = false;
                button.classList.remove(CSS_CLASSES.SELECTED);
            });
            
            const combineInput = this.ui.getCombineInput();
            if (combineInput) {
                combineInput.value = '';
            }
        }
        
        /**
         * Shows a message to the user.
         */
        _showMessage(text, className, duration = 3000) {
            this.messageTimeout = this.ui.showMessage(
                text, 
                className, 
                duration, 
                this.messageTimeout, 
                this._hideMessage.bind(this)
            );
        }

        /**
         * Hides the message box.
         */
        _hideMessage() {
            this.ui.hideMessage();
        }

        /**
         * Shuffles an array in place using Fisher-Yates algorithm.
         * @param {Array} array 
         * @returns {Array}
         */
        _shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }
    }
})();
