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
            // Variable to store the dynamically created event handler for removal
            this._currentInputHandler = null; 
        }

        /**
         * Clears the main display and sets a placeholder if no text is provided.
         * @param {string} text - The text to display.
         */
        updateLessonDisplay(text) {
            if (!text || text.trim() === '') {
                // Using textContent for safety when rendering user-generated text
                this.elements.lessonDisplay.textContent = 'Your sentence will appear here...';
                this.elements.lessonDisplay.classList.add('text-gray-400', 'font-semibold');
            } else {
                this.elements.lessonDisplay.textContent = text;
                this.elements.lessonDisplay.classList.remove('text-gray-400', 'font-semibold');
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
        
        // --- Render Methods (DOM Creation) ---
        
        renderSentenceOrNotChallenge(challenge, handlerCallback) {
            this.toggleControlButtons({ submit: false, clear: false, next: false });
            this.elements.interactiveContainer.innerHTML = '';
            
            const trueBtn = this.createButton('Yes, it is!', 'action-button', () => handlerCallback(true));
            const falseBtn = this.createButton('No, it is not.', 'action-button', () => handlerCallback(false));

            this.elements.interactiveContainer.appendChild(trueBtn);
            this.elements.interactiveContainer.appendChild(falseBtn);
            
            // This now uses textContent from updateLessonDisplay
            this.updateLessonDisplay(challenge.text); 
        }

        renderWordBankChallenge(words, selectWordCallback) {
            this.toggleControlButtons({ submit: true, clear: true, next: false });
            this.updateLessonDisplay('');

            const wordBank = document.createElement('div');
            wordBank.classList.add('word-bank-button-container');

            words.forEach(word => {
                const button = this.createButton(word, 'word-button', (e) => selectWordCallback(e.target, word));
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
                const button = this.createButton(part, 'word-button', (e) => selectSillyPartCallback(e.target, part, 'naming'));
                namingPartContainer.appendChild(button);
            });
            
            // Telling Part Container
            const tellingPartContainer = document.createElement('div');
            tellingPartContainer.classList.add('silly-sentences-column', 'bg-pink-200', 'flex-1', 'text-center');
            tellingPartContainer.innerHTML = '<h4 class="text-xl font-bold mb-2">Choose a Telling Part</h4>';
            challenge.telling_parts.forEach(part => {
                const button = this.createButton(part, 'word-button', (e) => selectSillyPartCallback(e.target, part, 'telling'));
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
                const button = this.createButton(choice, 'punctuation-button', () => handlerCallback(choice));
                choicesContainer.appendChild(button);
            });

            this.elements.interactiveContainer.innerHTML = '';
            this.elements.interactiveContainer.appendChild(choicesContainer);
        }

        /**
         * Renders the Combine Sentences challenge using a standard <textarea> for robust input.
         */
        renderCombineSentencesChallenge(challenge) {
            this.elements.lessonGoalDisplay.textContent = `Combine two sentences using '${challenge.conjunction}'.`;
            this.elements.lessonDisplay.innerHTML = `
                <div class="text-center">
                    <p class="text-xl mb-2">${challenge.sentences[0]}</p>
                    <p class="text-2xl font-bold text-purple-600">${challenge.conjunction}</p>
                    <p class="text-xl mt-2">${challenge.sentences[1]}</p>
                </div>
                <textarea id="combineSentenceInput" rows="3" placeholder="Type your combined sentence here..." class="w-full bg-gray-100 p-4 rounded-xl shadow-inner text-xl md:text-2xl font-semibold mt-4"></textarea>
            `;
            
            // Remove previous listeners to prevent duplicates
            const combineInput = document.getElementById('combineSentenceInput');
            if (combineInput && this._currentInputHandler) {
                 combineInput.removeEventListener('input', this._currentInputHandler);
            }
            // No need for a complex handler now; standard textarea handles placeholder.
            this._currentInputHandler = null; 

            this.elements.interactiveContainer.innerHTML = '';
            // The display area for this challenge is the lessonDisplay, so interactive container is kept clear
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
                tellingPart: '',
                currentChallengeData: null // Store current challenge for easy access
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
                themeSelector: document.getElementById('themeSelector'), // Unused, but kept for future expansion
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
                // Fetch lessons.json
                const lessonsResponse = await fetch('lessons.json');
                if (!lessonsResponse.ok) {
                    throw new Error('Network response was not ok for lessons.json');
                }
                this.lessons = await lessonsResponse.json();

                // Fetch words.json
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
            this.state.currentChallengeData = currentChallenge; // Store for easy check access

            this.elements.progressIndicator.textContent = `Challenge ${this.state.currentChallengeIndex + 1} of ${currentLesson.challenges.length}`;

            const handler = this.challengeHandlers[currentLesson.type];
            if (handler) {
                // Pass challenge data, but keep `this` context for all internal calls
                handler.call(this, currentChallenge);
            } else {
                const errorMsg = `No handler found for lesson type: ${currentLesson.type}`;
                console.error(errorMsg);
                this._showMessage(`Application Error: ${errorMsg}`, 'failure', 0);
            }
        }
        
        _renderSentenceOrNotChallenge(challenge) {
            // Callback now only passes the user choice, correctness check is in App
            this.ui.renderSentenceOrNotChallenge(challenge, this._handleSentenceOrNot.bind(this));
        }

        _renderIdentifyChallenge(challenge) {
            // Extract and prepare words for the word bank
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
            // Pre-fill with incomplete part, preserving the structure for joining later
            this.state.currentSelectionArray = [challenge.incomplete_sentence, '']; 
            this.ui.updateLessonDisplay(this.state.currentSelectionArray[0]);

            const wordsToAdd = this.wordBankData.words[challenge.word_type];
            
            this.ui.renderWordBankChallenge(this._shuffleArray(wordsToAdd), (button, word) => {
                // isAppendable flag is removed; logic is handled by challenge type
                this._selectWord(button, word, true); 
            });
        }

        _renderSillySentencesChallenge(challenge) {
            this.ui.renderSillySentencesChallenge(challenge, this._selectSillyPart.bind(this));
        }

        _renderPunctuationChoiceChallenge(challenge) {
            // Callback now only passes the user choice, correctness check is in App
            this.ui.renderPunctuationChoiceChallenge(challenge, this._handlePunctuationChoice.bind(this));
        }

        _renderCombineSentencesChallenge(challenge) {
            // UI handles most of the display, the submit button uses the central _handleSubmit
            this.ui.renderCombineSentencesChallenge(challenge);
        }

        // --- Interaction Logic (Core to App) ---
        
        /**
         * Selects a word/part for sentence construction challenges.
         * @param {HTMLElement} button - The button element clicked.
         * @param {string} word - The word/part value.
         * @param {boolean} isReplacable - Flag for MakeItASentence to replace the selection.
         */
        _selectWord(button, word, isReplacable = false) {
            if (isReplacable) {
                // For MakeItASentence: replace the second item (the word to be added)
                this.state.currentSelectionArray[1] = word;
                // Re-enable all buttons, then disable the current selection
                const buttons = this.elements.interactiveContainer.querySelectorAll('.word-button');
                buttons.forEach(btn => btn.disabled = false);
                button.disabled = true;
            } else {
                this.state.currentSelectionArray.push(word);
                button.disabled = true;
            }
            
            this.ui.updateLessonDisplay(this.state.currentSelectionArray.join(' '));

            // Show submit button only if a selection has been made (for replacable types)
            if (isReplacable && this.state.currentSelectionArray[1]) {
                 this.elements.submitBtn.classList.remove('hidden');
            }
        }
        
        _selectSillyPart(button, part, type) {
            // Disable other buttons in the same column
            const otherButtons = button.parentElement.querySelectorAll('button');
            otherButtons.forEach(btn => btn.disabled = true);
            button.classList.add('selected'); // Visual feedback
            
            if (type === 'naming') {
                this.state.namingPart = part;
            } else {
                this.state.tellingPart = part;
            }

            const fullSentence = `${this.state.namingPart} ${this.state.tellingPart}`;
            this.ui.updateLessonDisplay(fullSentence);

            // Trigger submit handler if both parts are selected.
            if (this.state.namingPart && this.state.tellingPart) {
                this._handleSubmit(true); // Auto-pass for this challenge type
            }
        }

        /**
         * Central handler for submission for challenges that use the submit button.
         * @param {boolean} forceCorrect - Forces the challenge to be marked as correct (used by silly_sentences auto-pass).
         */
        _handleSubmit(forceCorrect = false) {
            const currentLesson = this.lessons[this.state.currentLessonIndex];
            const currentChallenge = this.state.currentChallengeData;

            let isCorrect = forceCorrect;

            if (!forceCorrect) {
                 switch (currentLesson.type) {
                    case 'identify':
                    case 'scramble':
                    case 'make_it_a_sentence':
                        isCorrect = this._checkWordSequence(currentLesson.type, currentChallenge);
                        break;
                    case 'combine_sentences':
                        isCorrect = this._checkCombineSentences(currentChallenge);
                        break;
                    default:
                        console.warn(`Attempted to submit for unhandled type: ${currentLesson.type}`);
                        return;
                }
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
        
        _checkWordSequence(type, challenge) {
            // Handles Identify, Scramble, and MakeItASentence (which uses a 2-part array)
            const userAnswer = this.state.currentSelectionArray.join(' ').toLowerCase().trim();
            const correctAnswer = challenge.correct_answer.toLowerCase().trim();

            if (type === 'identify') {
                // For Identify, word order doesn't matter (answer is a list of words to select)
                const userWords = this.state.currentSelectionArray.sort().join(' ');
                const correctWords = challenge.answer.sort().join(' ');
                return userWords === correctWords;
            }
            
            // For scramble and make_it_a_sentence, exact sentence match is required (case-insensitive)
            return userAnswer === correctAnswer;
        }

        _checkCombineSentences(challenge) {
            const combineInput = document.getElementById('combineSentenceInput');
            // Use basic cleanup. NOTE: Complex grammar checking would require a separate service/library.
            const userSentence = combineInput ? combineInput.value.trim().toLowerCase().replace(/[.,?!]/g, '') : '';
            const correctAnswer = challenge.correct_answer.toLowerCase().replace(/[.,?!]/g, '');
            
            return userSentence === correctAnswer;
        }

        _handleSentenceOrNot(userChoice) {
            const isCorrect = userChoice === this.state.currentChallengeData.isSentence;
            if (isCorrect) {
                 this._showMessage('Correct!', 'success', 3000);
                 this.elements.nextBtn.classList.remove('hidden');
            } else {
                 this._showMessage('Not quite, try again.', 'failure', 3000);
            }
        }

        _handlePunctuationChoice(userChoice) {
            const isCorrect = userChoice === this.state.currentChallengeData.correct_answer;
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
                this.ui.toggleControlButtons({ submit: false, clear: false, next: false });
            }
        }

        _handleClear() {
            // Reset common state elements
            this.state.currentSelectionArray = [];
            this.state.namingPart = '';
            this.state.tellingPart = '';
            
            const currentLessonType = this.lessons[this.state.currentLessonIndex].type;
            const currentChallenge = this.state.currentChallengeData;
            
            // Re-display the incomplete sentence and reset selection array if applicable
            if (currentLessonType === 'make_it_a_sentence') {
                this.state.currentSelectionArray = [currentChallenge.incomplete_sentence, ''];
                this.ui.updateLessonDisplay(currentChallenge.incomplete_sentence);
                this.elements.submitBtn.classList.add('hidden');
            } else {
                this.ui.updateLessonDisplay('');
            }
            
            // Re-enable word/part selection buttons
            const wordButtons = this.elements.interactiveContainer.querySelectorAll('.word-button');
            wordButtons.forEach(button => {
                button.disabled = false;
                button.classList.remove('selected');
            });
            
            // Clear combine sentence input if present
            const combineInput = document.getElementById('combineSentenceInput');
            if (combineInput) {
                combineInput.value = '';
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
