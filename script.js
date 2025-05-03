
        const quotes = [
            "The only way to do great work is to love what you do. – Steve Jobs",
            "Education is the most powerful weapon which you can use to change the world. – Nelson Mandela",
            "The future belongs to those who believe in the beauty of their dreams. – Eleanor Roosevelt",
            "Strive for progress, not perfection.",
            "The expert in anything was once a beginner.",
            "Don't watch the clock; do what it does. Keep going.",
            "Success is not final, failure is not fatal: It is the courage to continue that counts. – Winston Churchill",
            "The mind is not a vessel to be filled, but a fire to be kindled. – Plutarch",
            "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible. – Richard Feynman",
            "Learning never exhausts the mind. – Leonardo da Vinci"
        ];


        let currentQuestionIndex = 0;
        let score = 0;
        let buttonsDisabled = false; // Controls user input on answer/skip buttons / self-correction buttons / reveal button
        let gameInProgress = false; // Controls overall game state
        let currentTopicQuestions = [];
        let lessonAttempts = []; // To store results for PDF: Incorrect MCQs, Skipped MCQs, Self-corrected Wrong Essays
        let questionsToRemember = []; // To store questions added to remember list for PDF: Correct MCQs (if button clicked), Self-corrected Correct Essays (if button clicked)

        // Get DOM elements
        const lessonSelectionElement = document.getElementById('lesson-selection');
        const gameContainerElement = document.querySelector('.game-container');
        const gameTitleElement = document.getElementById('game-title');
        const questionCounterElement = document.querySelector('.question-counter');
        const currentQNumElement = document.getElementById('current-q-num');
        const totalQNumElement = document.getElementById('total-q-num');
        const questionAreaElement = document.getElementById('question-area');
        const questionTextElement = document.getElementById('question-text');
        const answerButtonsElement = document.getElementById('answer-buttons'); // MCQ buttons container
        const revealAnswerButton = document.getElementById('reveal-answer-button'); // New Reveal button
        const essaySelfCorrectionButtonsElement = document.getElementById('essay-self-correction-buttons'); // Essay buttons container
        const feedbackElement = document.getElementById('feedback');
        const explanationAreaElement = document.getElementById('explanation-area');
        const explanationTextElement = document.getElementById('explanation-text');
        const scoreAreaElement = document.getElementById('score-area');
        const scoreElement = document.getElementById('score');
        const skipButton = document.getElementById('skip-button'); // Skip button (only for MCQ)
        const nextButton = document.getElementById('next-button');
        const addToRememberButton = document.getElementById('add-to-remember-button'); // Add to Remember button
        const finalScoreElement = document.getElementById('final-score');
        const finalScoreTextElement = document.getElementById('final-score-text');
        const finalTotalTextElement = document.getElementById('final-total-text');
        const restartButton = document.getElementById('restart-button');
        const downloadPdfButton = document.getElementById('download-mistakes-pdf');
        const exportAllPdfButton = document.getElementById('export-all-pdf-button'); // Export All button
        const quoteAreaElement = document.getElementById('quote-area');
        const currentQuoteElement = document.getElementById('current-quote');

         // Create self-correction buttons once and manage their visibility
        const correctEssayButton = document.createElement('button');
        correctEssayButton.textContent = 'I got it Right!';
        correctEssayButton.classList.add('self-correct-button');
        // Event listener added in revealAnswer()

        const wrongEssayButton = document.createElement('button');
        wrongEssayButton.textContent = 'I was Wrong';
        wrongEssayButton.classList.add('self-correct-button', 'wrong');
        // Event listener added in revealAnswer()

        // Append them to the container, they will be hidden by default via CSS .hidden
        essaySelfCorrectionButtonsElement.appendChild(correctEssayButton);
        essaySelfCorrectionButtonsElement.appendChild(wrongEssayButton);

         // Add event listener for the new Reveal Answer button
         revealAnswerButton.addEventListener('click', revealAnswer);


        // --- Functions ---

        function showLessonSelection() {
            gameInProgress = false;
            // Hide game elements
            gameContainerElement.classList.add('hidden');
            finalScoreElement.classList.add('hidden');
            explanationAreaElement.classList.add('hidden');
            explanationAreaElement.classList.remove('visible'); // Remove animation class
            addToRememberButton.classList.add('hidden'); // Hide remember button
            quoteAreaElement.classList.add('hidden'); // Hide quote area

            // Show lesson selection
            lessonSelectionElement.classList.remove('hidden');

            // Clear existing buttons before adding new ones
             while (lessonSelectionElement.firstChild) {
                 lessonSelectionElement.removeChild(lessonSelectionElement.firstChild);
             }
             // Add back the h2 title
             const title = document.createElement('h2');
             title.textContent = 'Choose a Lesson';
             lessonSelectionElement.appendChild(title);


            for (const topicKey in Topics) {
                const topicName = Topics[topicKey];
                // Check if there are questions for this topic before adding the button
                const questionsForTopic = allQuestions.filter(q => q.topic === topicName);
                if (questionsForTopic.length > 0) {
                    const btn = document.createElement("button");
                    btn.classList.add("action-button");
                    btn.innerText = `${topicName} (${questionsForTopic.length} Questions)`;
                    btn.addEventListener('click', () => startGame(topicName));
                    lessonSelectionElement.appendChild(btn);
                }
            }
        }

        function startGame(topic) {
            gameInProgress = true;
            console.log(`Starting lesson: ${topic}`);
            // Filter questions based on the chosen topic and sort by original number
            currentTopicQuestions = allQuestions
                .filter(q => q.topic === topic)

            if (currentTopicQuestions.length === 0) {
                alert(`No questions found for the topic: ${topic}`);
                showLessonSelection(); // Go back to selection if no questions
                return;
            }

            // Reset game state
            currentQuestionIndex = 0;
            score = 0;
            lessonAttempts = []; // Clear attempts for the new lesson
            questionsToRemember = []; // Clear remember list for the new lesson
            scoreElement.textContent = score;
            totalQNumElement.textContent = currentTopicQuestions.length; // Update total count

            // Update game title
            gameTitleElement.textContent = `Game Show! - ${topic}`; // Updated title

            // Hide lesson selection
            lessonSelectionElement.classList.add('hidden');

            // Show game elements
            gameContainerElement.classList.remove('hidden');
            questionAreaElement.classList.remove('hidden');
            feedbackElement.classList.remove('hidden');
            scoreAreaElement.classList.remove('hidden');
            quoteAreaElement.classList.remove('hidden');
            questionCounterElement.classList.remove('hidden'); // Show question counter

            // Hide end game elements
            finalScoreElement.classList.add('hidden');
            nextButton.classList.add('hidden');
            restartButton.classList.add('hidden');
            downloadPdfButton.classList.add('hidden');
            exportAllPdfButton.classList.add('hidden'); // Hide export all button

            displayQuestion();
            displayRandomQuote();
        }

        function displayQuestion() {
            resetState(); // Clears feedback, explanation, buttons, etc.
            buttonsDisabled = false; // Re-enable input

            const question = currentTopicQuestions[currentQuestionIndex];

            if (!question) {
                console.error("Question index out of bounds or no questions found.");
                questionTextElement.innerHTML = "Error: Could not load next question."; // Use innerHTML for potential HTML
                buttonsDisabled = true;
                // Hide all action buttons on error
                nextButton.classList.add('hidden');
                skipButton.classList.add('hidden');
                addToRememberButton.classList.add('hidden');
                revealAnswerButton.classList.add('hidden');
                essaySelfCorrectionButtonsElement.classList.add('hidden');
                 quoteAreaElement.classList.add('hidden'); // Hide quote area on error
                setTimeout(() => restartButton.classList.remove('hidden'), 2000);
                return;
            }

            // Update question counter
            currentQNumElement.textContent = currentQuestionIndex + 1;
            console.log(`--- Displaying Question ${currentQuestionIndex + 1} (Original #${question.originalNumber}) ---`); // Log question start

            questionTextElement.innerHTML = question.question; // Use innerHTML

            // --- Handle different question types ---
            if (question.type === 'mcq') {
                answerButtonsElement.classList.remove('hidden');
                revealAnswerButton.classList.add('hidden'); // Hide reveal for MCQ
                essaySelfCorrectionButtonsElement.classList.add('hidden'); // Hide essay buttons
                skipButton.classList.remove('hidden'); // Show the skip button for MCQ
                skipButton.disabled = false; // Enable the skip button

                 if (!question.options || question.options.length === 0) {
                     console.error("MCQ question has no options:", question);
                     questionTextElement.innerHTML = `Error loading MCQ question ${question.originalNumber}. Please check the question data.`; // Use innerHTML
                     buttonsDisabled = true;
                     // Hide all action buttons on error
                     skipButton.classList.add('hidden');
                     addToRememberButton.classList.add('hidden');
                     revealAnswerButton.classList.add('hidden');
                      essaySelfCorrectionButtonsElement.classList.add('hidden');
                      quoteAreaElement.classList.add('hidden'); // Hide quote area on error
                     if (currentQuestionIndex < currentTopicQuestions.length - 1) {
                         setTimeout(() => { nextButton.classList.remove('hidden'); }, 800);
                     } else {
                         setTimeout(endGame, 1000);
                     }
                     return;
                 }


                answerButtonsElement.innerHTML = ''; // Clear previous MCQ buttons effectively
                question.options.forEach((option, index) => {
                    const button = document.createElement('button');
                    button.innerHTML = option; // Use innerHTML
                    button.classList.add('answer-button');
                    button.dataset.index = index;

                    // Use an anonymous function to call selectAnswer with the correct index
                    button.addEventListener('click', () => selectAnswer(index));
                    answerButtonsElement.appendChild(button);
                });

            } else if (question.type === 'essay') {
                answerButtonsElement.classList.add('hidden'); // Hide MCQ buttons
                skipButton.classList.add('hidden'); // Hide the skip button for essay
                essaySelfCorrectionButtonsElement.classList.add('hidden'); // Hide essay buttons initially
                explanationAreaElement.classList.add('hidden'); // Hide explanation initially for essay
                explanationAreaElement.classList.remove('visible'); // Remove animation class
                 addToRememberButton.classList.add('hidden'); // Hide remember button initially for essay

                 // Show and enable the Reveal Answer button
                 revealAnswerButton.classList.remove('hidden');
                 revealAnswerButton.disabled = false;

            } else {
                // Handle unknown question types
                 console.error("Question has unknown type:", question);
                 questionTextElement.innerHTML = `Error loading question ${question.originalNumber} (Unknown type). Please check the question data.`; // Use innerHTML
                 buttonsDisabled = true;
                  // Hide all action buttons on error
                 skipButton.classList.add('hidden');
                 addToRememberButton.classList.add('hidden');
                 revealAnswerButton.classList.add('hidden');
                  essaySelfCorrectionButtonsElement.classList.add('hidden');
                  quoteAreaElement.classList.add('hidden'); // Hide quote area on error
                 if (currentQuestionIndex < currentTopicQuestions.length - 1) {
                     setTimeout(() => { nextButton.classList.remove('hidden'); }, 800);
                 } else {
                     setTimeout(endGame, 1000);
                 }
                 return;
            }
        }

        function resetState() {
            console.log("Resetting state for next question...");
            // Clear previous answer buttons (MCQ) and hide their container
             answerButtonsElement.innerHTML = '';
             answerButtonsElement.classList.add('hidden'); // Ensure MCQ buttons are hidden by default


            // Hide essay self-correction buttons
            essaySelfCorrectionButtonsElement.classList.add('hidden');
             correctEssayButton.disabled = true; // Disable them when hidden
             wrongEssayButton.disabled = true;

             // Hide reveal answer button
             revealAnswerButton.classList.add('hidden');
             revealAnswerButton.disabled = true;


            feedbackElement.textContent = '';
            feedbackElement.style.color = '';
            explanationAreaElement.classList.add('hidden');
            explanationAreaElement.classList.remove('visible');
            explanationTextElement.innerHTML = ''; // Use innerHTML
            nextButton.classList.add('hidden');
            skipButton.classList.add('hidden'); // Hide skip button by default, displayQuestion will show for MCQ

            // --- FIX: Reset Add to Remember button state explicitly ---
            console.log("Resetting 'Add to Remember' button state.");
            addToRememberButton.classList.add('hidden'); // Hide the button
            addToRememberButton.disabled = false; // Ensure it's enabled
            addToRememberButton.textContent = "Add to Remember List"; // Reset text
            // --- End Fix ---

             // Remove any event listeners added in revealAnswer to prevent duplicates on subsequent questions
             correctEssayButton.removeEventListener('click', () => handleSelfCorrection(true));
             wrongEssayButton.removeEventListener('click', () => handleSelfCorrection(false));

             console.log("Reset complete. Add to Remember button state:", { hidden: addToRememberButton.classList.contains('hidden'), disabled: addToRememberButton.disabled, text: addToRememberButton.textContent });
        }

        // Handle MCQ answer selection
        function selectAnswer(selectedIndex) {
            if (buttonsDisabled) return; // Prevent double-clicking
            const question = currentTopicQuestions[currentQuestionIndex];

            // Ensure this is an MCQ, although displayQuestion should prevent calling this
             if (question.type !== 'mcq') {
                 console.warn("selectAnswer called for non-MCQ type:", question);
                 return; // Should not happen if displayQuestion works correctly
             }

            buttonsDisabled = true; // Disable input once an answer is chosen

            // Disable and hide the skip button immediately
            skipButton.disabled = true;
            skipButton.classList.add('hidden');

            // Disable all answer buttons
            const answerButtons = answerButtonsElement.querySelectorAll('.answer-button');
            answerButtons.forEach(button => button.disabled = true);


            const isCorrect = (selectedIndex === question.correctAnswer);
            console.log(`MCQ Answer Selected (Index ${selectedIndex}): Is Correct? ${isCorrect}`);

            // Record the attempt ONLY IF INCORRECT OR SKIPPED (handled in skipQuestion)
            // Correct MCQ attempts are NOT added to lessonAttempts
            if (!isCorrect) {
                lessonAttempts.push({
                    type: 'mcq', // Store type in attempt
                    originalNumber: question.originalNumber, // Include original number
                    questionText: question.question, // Keep original HTML
                    selectedAnswer: question.options[selectedIndex], // Keep original HTML
                    correctAnswerText: question.correctAnswerText, // Keep original HTML
                    options: question.options, // Keep original HTML options list
                    explanation: question.explanation, // Keep original HTML
                    isCorrect: isCorrect, // Will be false here
                    topic: question.topic,
                    // isRememberedItem is only added to questionsToRemember list
                });
                console.log(`MCQ Answered Incorrectly (Original #${question.originalNumber}). Added to lessonAttempts.`);
            }


            // Highlight buttons
            answerButtons.forEach((button, index) => {
                if (index === question.correctAnswer) {
                    button.classList.add('correct');
                } else if (index === selectedIndex) {
                    button.classList.add('incorrect');
                }
            });

            if (isCorrect) {
                score++;
                scoreElement.textContent = score;
                feedbackElement.textContent = 'Correct!';
                feedbackElement.style.color = '#28a745'; // Green
                console.log("Answer was Correct. Score updated.");

                // Show and check state of Add to Remember button ONLY if correct
                console.log("Showing 'Add to Remember' button.");
                addToRememberButton.classList.remove('hidden');
                checkRememberButtonState(question); // Check if already added and set state/text

            } else {
                feedbackElement.textContent = `Incorrect.`;
                feedbackElement.style.color = '#dc3545'; // Red
                console.log("Answer was Incorrect. Hiding 'Add to Remember' button.");
                addToRememberButton.classList.add('hidden'); // Ensure hidden if incorrect
            }

            // Display explanation with animation (includes correct answer)
            // Construct explanation HTML to include Correct Answer text for display
            const explanationHtml = `<strong>Correct Answer:</strong> ${question.correctAnswerText}<br><br><strong>Explanation:</strong> ${question.explanation}`;
            explanationTextElement.innerHTML = explanationHtml; // Use innerHTML
            explanationAreaElement.classList.remove('hidden');
            setTimeout(() => {
                explanationAreaElement.classList.add('visible');
            }, 10);


            // Determine next action after a delay
            if (currentQuestionIndex < currentTopicQuestions.length - 1) {
                setTimeout(() => {
                    nextButton.classList.remove('hidden');
                }, 800); // Faster timeout
            } else {
                // This is the last question
                setTimeout(endGame, 1200); // Faster endgame
            }
        }

         // Handle clicking the Reveal Answer button for essay questions
         function revealAnswer() {
             if (buttonsDisabled) return; // Prevent double-clicking
             buttonsDisabled = true; // Disable input temporarily

             const question = currentTopicQuestions[currentQuestionIndex];
             if (question.type !== 'essay') {
                  console.warn("revealAnswer called for non-essay type:", question);
                  buttonsDisabled = false; // Re-enable if it was a mistake
                  return;
             }

             console.log(`Revealing answer for Essay Question (Original #${question.originalNumber})`);

             // Disable and hide the Reveal button
             revealAnswerButton.disabled = true;
             revealAnswerButton.classList.add('hidden');


             // Display explanation with animation (includes model answer)
             const explanationHtml = `<strong>Model Answer:</strong> ${question.correctAnswerText}<br><br><strong>Explanation:</strong> ${question.explanation}`;
             explanationTextElement.innerHTML = explanationHtml; // Use innerHTML
             explanationAreaElement.classList.remove('hidden');
             setTimeout(() => {
                 explanationAreaElement.classList.add('visible');
             }, 10);


             // Now show and enable the self-correction buttons after a slight delay
             setTimeout(() => {
                  console.log("Showing essay self-correction buttons.");
                  essaySelfCorrectionButtonsElement.classList.remove('hidden');
                  correctEssayButton.disabled = false;
                  wrongEssayButton.disabled = false;
                  buttonsDisabled = false; // Re-enable input for self-correction buttons

                  // Add listeners *only* after they are revealed and enabled
                  // Previous listeners are removed in resetState
                  correctEssayButton.addEventListener('click', () => handleSelfCorrection(true));
                  wrongEssayButton.addEventListener('click', () => handleSelfCorrection(false));

             }, 500); // Small delay before showing correction buttons
         }


        // Handle Essay self-correction
        function handleSelfCorrection(isCorrect) {
            if (buttonsDisabled) return; // Prevent double-clicking
             const question = currentTopicQuestions[currentQuestionIndex];

            // Ensure this is an Essay
             if (question.type !== 'essay') {
                 console.warn("handleSelfCorrection called for non-essay type:", question);
                  return; // Should not happen
             }

            buttonsDisabled = true; // Disable input once self-corrected
            console.log(`Essay Self-Correction: Marked as ${isCorrect ? 'Right' : 'Wrong'} (Original #${question.originalNumber})`);

            // Disable self-correction buttons immediately
             correctEssayButton.disabled = true;
             wrongEssayButton.disabled = true;
             essaySelfCorrectionButtonsElement.classList.add('hidden'); // Hide the container

             // Remove listeners to prevent them from firing again
             correctEssayButton.removeEventListener('click', () => handleSelfCorrection(true));
             wrongEssayButton.removeEventListener('click', () => handleSelfCorrection(false));


             if (isCorrect) {
                score++;
                scoreElement.textContent = score;
                feedbackElement.textContent = 'Marked as Correct!';
                feedbackElement.style.color = '#28a745'; // Green
                 console.log("Marked Right. Score updated.");

                // *** REMOVED AUTOMATIC ADDITION FOR ESSAY CORRECT ***
                // Now just show the 'Add to Remember' button like for MCQs
                 console.log("Showing 'Add to Remember' button.");
                 addToRememberButton.classList.remove('hidden');
                 checkRememberButtonState(question); // Set button text and state

             } else {
                feedbackElement.textContent = `Marked as Incorrect.`;
                feedbackElement.style.color = '#dc3545'; // Red
                 console.log("Marked Wrong. Hiding 'Add to Remember' button. Added to lessonAttempts.");
                 addToRememberButton.classList.add('hidden'); // Ensure hidden if incorrect

                 // Record the attempt as self-corrected wrong
                lessonAttempts.push({
                    type: 'essay', // Store type in attempt
                    originalNumber: question.originalNumber,
                    questionText: question.question, // Include question text
                    selectedAnswer: "[Self-Corrected as Wrong]", // Indicate it was self-corrected wrong
                    correctAnswerText: question.correctAnswerText, // Include correct answer text (model answer)
                    options: [], // No options for essay
                    explanation: question.explanation, // Include explanation
                    isCorrect: false, // Mark as incorrect/missed
                    topic: question.topic,
                });
             }

            // Explanation is already visible from revealAnswer()


            // Determine next action after a delay
            if (currentQuestionIndex < currentTopicQuestions.length - 1) {
                setTimeout(() => {
                    nextButton.classList.remove('hidden');
                }, 800); // Faster timeout
            } else {
                setTimeout(endGame, 1200);
            }
        }


        // Handle MCQ skip
        function skipQuestion() {
            if (buttonsDisabled) return; // Prevent double-clicking
            const question = currentTopicQuestions[currentQuestionIndex];
             // Ensure this is an MCQ
            if (question.type !== 'mcq') {
                 console.warn("skipQuestion called for non-MCQ type:", question);
                 return; // Should not happen
            }

            buttonsDisabled = true; // Disable input once skip is clicked
            console.log(`Skipped MCQ Question (Original #${question.originalNumber}). Added to lessonAttempts.`);

            // Disable and hide the skip button immediately
            skipButton.disabled = true;
            skipButton.classList.add('hidden');

            // Disable all answer buttons
            const answerButtons = answerButtonsElement.querySelectorAll('.answer-button');
            answerButtons.forEach(button => button.disabled = true);

            // Record the attempt as skipped/incorrect
             lessonAttempts.push({
                type: 'mcq', // Store type in attempt
                originalNumber: question.originalNumber,
                questionText: question.question, // Include question text
                selectedAnswer: "[Skipped]", // Indicate it was skipped
                correctAnswerText: question.correctAnswerText, // Include correct answer text
                options: question.options, // Include options
                explanation: question.explanation, // Include explanation
                isCorrect: false, // Mark as incorrect/missed for filtering
                topic: question.topic,
                // Do NOT add isRememberedItem: true here
            });


            // Provide feedback for skipping
            feedbackElement.textContent = 'Question Skipped.';
            feedbackElement.style.color = '#ffc107'; // Yellow/Orange color for skipped feedback

            // Highlight the correct answer button visually (if it exists)
             const answerButtonsList = answerButtonsElement.querySelectorAll('.answer-button');
            if (question.correctAnswer !== undefined && question.correctAnswer >= 0 && question.correctAnswer < answerButtonsList.length) {
                 answerButtonsList[question.correctAnswer].classList.add('correct');
            }


            // Display explanation and correct answer with animation
             const explanationHtml = `<strong>Correct Answer:</strong> ${question.correctAnswerText}<br><br><strong>Explanation:</strong> ${question.explanation}`;
             explanationTextElement.innerHTML = explanationHtml; // Use innerHTML
            explanationAreaElement.classList.remove('hidden');
            setTimeout(() => {
                explanationAreaElement.classList.add('visible');
            }, 10);

            // *** Do NOT show "Add to Remember" button if skipped ***
            console.log("Skipped. Hiding 'Add to Remember' button.");
            addToRememberButton.classList.add('hidden');


            // Determine next action after a delay
            if (currentQuestionIndex < currentTopicQuestions.length - 1) {
                setTimeout(() => {
                    nextButton.classList.remove('hidden');
                }, 800); // Faster timeout
            } else {
                setTimeout(endGame, 1200);
            }
        }

        // Function to check and set the state of the "Add to Remember" button
        function checkRememberButtonState(question) {
            console.log(`Checking remember state for Original #${question.originalNumber}`);
            // Check if the current question is already in the remember list
            const isAlreadyAdded = questionsToRemember.some(q => q.originalNumber === question.originalNumber && q.topic === question.topic);

            if (isAlreadyAdded) {
                console.log("Question found in remember list. Disabling button.");
                addToRememberButton.textContent = "Added!";
                addToRememberButton.disabled = true;
                 // Styling is handled by the CSS :disabled rule now
            } else {
                 console.log("Question NOT found in remember list. Enabling button.");
                addToRememberButton.textContent = "Add to Remember List";
                addToRememberButton.disabled = false;
                 // Styling is handled by the CSS rule for #add-to-remember-button
            }
             console.log("Add to Remember button state after check:", { hidden: addToRememberButton.classList.contains('hidden'), disabled: addToRememberButton.disabled, text: addToRememberButton.textContent });
        }


        // Function to add the current question to the remember list when button is clicked
        // This function is now called *only* when the 'Add to Remember List' button is explicitly clicked.
        function addToRememberList() {
            const question = currentTopicQuestions[currentQuestionIndex];
            // Check if the current question is already in the remember list before adding
            const isAlreadyAdded = questionsToRemember.some(q => q.originalNumber === question.originalNumber && q.topic === question.topic);

            if (!isAlreadyAdded) {
                // Add a copy of the current question object with a flag
                 questionsToRemember.push({...question, isRememberedItem: true}); // Use spread to copy properties

                // Update button state immediately
                console.log(`Question Original #${question.originalNumber} clicked to add to remember list.`);
                checkRememberButtonState(question); // This will set the text to "Added!" and disable the button
                console.log(`Question Original #${question.originalNumber} added to remember list. List size: ${questionsToRemember.length}`);
            } else {
                 console.log(`Attempted to add Question Original #${question.originalNumber}, but it was already in the list.`);
            }
            // If it was already added, the button should have been disabled already by checkRememberButtonState
        }


        function nextQuestion() {
            console.log("Clicked Next Question.");
            currentQuestionIndex++;
            if (currentQuestionIndex < currentTopicQuestions.length) {
                displayQuestion(); // displayQuestion will handle showing/enabling buttons based on type
                displayRandomQuote();
            } else {
                // Should be handled by selectAnswer/skipQuestion/handleSelfCorrection, but included for safety
                endGame();
            }
        }

        function endGame() {
            gameInProgress = false;
            console.log("Game Over.");
            // Hide game elements
            questionAreaElement.classList.add('hidden');
            feedbackElement.classList.add('hidden');
            explanationAreaElement.classList.add('hidden');
            explanationAreaElement.classList.remove('visible');
            scoreAreaElement.classList.add('hidden');
            nextButton.classList.add('hidden');
            skipButton.classList.add('hidden'); // Ensure skip button is hidden at the end
            addToRememberButton.classList.add('hidden'); // Ensure remember button is hidden at the end
             essaySelfCorrectionButtonsElement.classList.add('hidden'); // Ensure essay buttons are hidden at the end
             revealAnswerButton.classList.add('hidden'); // Ensure reveal button is hidden at the end
            quoteAreaElement.classList.add('hidden');
            questionCounterElement.classList.add('hidden');


            // Show final score and restart button
            finalScoreElement.classList.remove('hidden');
            finalScoreTextElement.textContent = score;
            finalTotalTextElement.textContent = currentTopicQuestions.length;
            restartButton.classList.remove('hidden');

            // Show Review PDF button only if there were mistakes, skips, or items to remember
             // lessonAttempts contains incorrect MCQs, skipped MCQs, and self-corrected wrong Essays
             // questionsToRemember contains correct MCQs added (if button clicked), and self-corrected correct Essays added (if button clicked)
             console.log(`End Game Summary: Attempts=${lessonAttempts.length}, Remembered=${questionsToRemember.length}`);
            if (lessonAttempts.length > 0 || questionsToRemember.length > 0) {
                downloadPdfButton.classList.remove('hidden');
            } else {
                downloadPdfButton.classList.add('hidden');
            }

            // Always show the Export All button on the final screen
            exportAllPdfButton.classList.remove('hidden');
        }

        function displayRandomQuote() {
            // Only display quote if game is in progress
            if (gameInProgress) {
                const randomIndex = Math.floor(Math.random() * quotes.length);
                currentQuoteElement.textContent = quotes[randomIndex];
                quoteAreaElement.classList.remove('hidden');
            } else {
                quoteAreaElement.classList.add('hidden'); // Hide if not in game
            }
        }

        // Common CSS styles for PDF content - Updated font sizes
        const pdfStyles = `
             <style>
                 body { font-family: 'Arial', sans-serif; line-height: 1.4; color: #333; margin: 0; padding: 0; } /* Removed padding from body, add to html2pdf margin */
                 h1, h2 { color: #1a2a6c; }
                 h1 { font-size: 18pt; margin-bottom: 5mm; }
                 h2 { font-size: 14pt; margin-bottom: 10mm; }
                 p { margin: 0 0 8px 0; }
                 strong { font-weight: bold; }
                 ul { margin: 8px 0 8px 20px; padding: 0; list-style: none; }
                 li { margin-bottom: 4px; font-size: 12pt; } /* Increased font size for options list items */
                 .item-container {
                     border: 1px solid #eee;
                     padding: 15px;
                     margin-bottom: 20px;
                     border-radius: 5px;
                     page-break-inside: avoid; /* Ensures item tries not to break across pages */
                 }
                 .item-header { font-size: 11pt; font-weight: bold; margin-bottom: 10px; color: #444; } /* Increased font size for header */
                 .question-text { font-size: 14pt; margin-bottom: 8px; } /* Increased font size for question text */
                 .answer-text { font-size: 12pt; } /* Increased font size for answer text */
                 .correct-answer { color: #28a745; }
                 .incorrect-answer { color: #dc3545; }
                 .skipped-answer { color: #6c757d; font-style: italic; }
                  .self-corrected-wrong { color: #dc3545; font-style: italic; }
                 .explanation-text { font-size: 11pt; color: #1b5e20; margin-top: 8px; } /* Increased font size for explanation */
                 /* Basic sub/sup styling */
                 sub, sup { font-size: 0.7em; line-height: 0; position: relative; vertical-align: baseline; }
                 sup { top: -0.5em; }
                 sub { bottom: -0.2em; }

                 /* Section Titles */
                 .section-title { font-size: 16pt; font-weight: bold; margin-top: 15mm; margin-bottom: 8mm; }
                 .section-title.attempts { color: #dc3545; }
                 .section-title.remember { color: #4a69bd; }
             </style>
         `;


        // Helper function to generate the HTML content for a single item in the PDF
        // It now handles different question types and sources (attempts vs remembered vs all)
        function buildItemHtml(item, index, isReview = true) {
            // Styles are now defined outside and included in the main HTML string

            let itemHtml = `<div class="item-container">`;

             // Determine how to display the item based on context (Review vs All) and type (MCQ vs Essay)

            if (isReview) {
                 // --- Building for Review PDF (Mistakes/Skips/Remembered) ---
                 // Item comes from either lessonAttempts or questionsToRemember
                 const isRemembered = !!item.isRememberedItem; // Check the flag

                 itemHtml += `<p class="item-header">Item ${index + 1}: (Original Question ${item.originalNumber})</p>`;
                 itemHtml += `<p class="question-text"><strong>Question:</strong> ${item.questionText || item.question}</p>`; // Use questionText from attempt if available, otherwise question from original

                 if (item.type === 'mcq') {
                      // Display for MCQ in review (Incorrect/Skipped - from lessonAttempts)
                      // Or Remembered MCQ (from questionsToRemember)
                      if (isRemembered) {
                          // Do nothing specific for remembered MCQs here, just show Question, Answer, Explanation below
                      } else { // Must be from lessonAttempts, i.e., incorrect or skipped
                          if (item.selectedAnswer === "[Skipped]") {
                             itemHtml += `<p class="answer-text skipped-answer"><strong>Your Action:</strong> [Skipped]</p>`;
                         } else if (item.selectedAnswer) { // Was an incorrect attempt
                             itemHtml += `<p class="answer-text incorrect-answer"><strong>Your Answer:</strong> ${item.selectedAnswer}</p>`;
                         }
                      }

                 } else if (item.type === 'essay') {
                     // Display for Essay in review (Self-corrected Wrong - from lessonAttempts or Remembered - from questionsToRemember)
                     if (!isRemembered) { // Must be a self-corrected wrong attempt from lessonAttempts
                         itemHtml += `<p class="answer-text self-corrected-wrong"><strong>Your Action:</strong> [Self-Corrected as Wrong]</p>`;
                     }
                     // If it's a remembered essay (isRememberedItem: true), no user action text is shown here,
                     // just the question, model answer, and explanation below.
                 }

                 // Always show the correct/model answer in the review PDF
                 itemHtml += `<p class="answer-text correct-answer"><strong>Correct/Model Answer:</strong> ${item.correctAnswerText}</p>`;

                 // Always show the explanation in the review PDF
                 itemHtml += `<p class="explanation-text"><strong>Explanation:</strong> ${item.explanation}</p>`;


            } else {
                 // --- Building for All Questions PDF ---
                 // Item comes directly from allQuestions
                 const question = item; // Use the original question object directly

                 itemHtml += `<p class="item-header">Question ${question.originalNumber}:</p>`;
                 itemHtml += `<p class="question-text"><strong>Question:</strong> ${question.question}</p>`;

                 if (question.type === 'mcq') {
                     // Add options list for MCQ
                     if (question.options && Array.isArray(question.options) && question.options.length > 0) {
                          itemHtml += `<p style="margin-bottom: 5px;"><strong>Options:</strong></p><ul>`;
                          question.options.forEach((opt, idx) => {
                              itemHtml += `<li>${String.fromCharCode(97 + idx)}) ${opt}</li>`;
                          });
                          itemHtml += `</ul>`;
                     }
                     // Add correct answer for MCQ
                     itemHtml += `<p class="answer-text correct-answer"><strong>Correct Answer:</strong> ${question.correctAnswerText}</p>`;

                 } else if (question.type === 'essay') {
                      // Add model answer for Essay
                     itemHtml += `<p class="answer-text correct-answer"><strong>Model Answer:</strong> ${question.correctAnswerText}</p>`;
                 }

                 // Add explanation
                 itemHtml += `<p class="explanation-text"><strong>Explanation:</strong> ${question.explanation}</p>`;
            }


            itemHtml += `</div>`; // Close item-container

             return itemHtml; // Return HTML without styles
        }


        // PDF Generation Function for Mistakes, Skips, and Remembered Items using html2pdf.js
        function generateReviewPDF() {
             // lessonAttempts contains incorrect MCQs, skipped MCQs, and self-corrected wrong Essays
             // questionsToRemember contains correct MCQs added (if button clicked), and self-corrected correct Essays added (if button clicked)

            if (lessonAttempts.length === 0 && questionsToRemember.length === 0) {
                alert("No mistakes, skips, or items added to the 'Remember' list to review.");
                return;
            }

            const topicName = currentTopicQuestions.length > 0 ? currentTopicQuestions[0].topic : 'Lesson';
            console.log(`Generating Review PDF for ${topicName}...`);

            let pdfHtml = `
                <html>
                <head>
                    <title>${topicName} Review</title>
                    ${pdfStyles} <!-- Include styles here -->
                </head>
                <body>
                    <h1>Review - Mistakes, Skips, and Remembered Items</h1>
                    <h2>Lesson: ${topicName}</h2>
                    <p><strong>Final Score:</strong> ${score} / ${currentTopicQuestions.length}</p>
            `;

            // --- Incorrect Answers & Skips & Self-Corrected Wrong Section ---
            if (lessonAttempts.length > 0) {
                pdfHtml += `<h2 class="section-title attempts">Incorrect Answers, Skips & Self-Corrected Wrong (${lessonAttempts.length})</h2>`;
                 // Sort attempts by original question number before adding to PDF
                 const sortedAttempts = lessonAttempts.slice().sort((a, b) => a.originalNumber - b.originalNumber);
                sortedAttempts.forEach((item, index) => {
                    pdfHtml += buildItemHtml(item, index, true); // true for isReview
                });
                 console.log(`${lessonAttempts.length} items added to Attempts section of PDF.`);
            }

            // --- Questions to Remember Section ---
            if (questionsToRemember.length > 0) {
                 // Add a little space before this section if the previous one exists
                 if (lessonAttempts.length > 0) {
                     pdfHtml += `<div style="height: 10mm;"></div>`; // Add vertical space
                 }
                pdfHtml += `<h2 class="section-title remember">Questions to Remember (${questionsToRemember.length})</h2>`;
                 // Sort remembered items by original question number
                 const sortedRemembered = questionsToRemember.slice().sort((a, b) => a.originalNumber - b.originalNumber);
                sortedRemembered.forEach((item, index) => {
                     // For remembered items, use buildItemHtml in review mode.
                     // The item object already has the necessary structure (question, type, etc.)
                    pdfHtml += buildItemHtml(item, index, true); // true for isReview
                });
                 console.log(`${questionsToRemember.length} items added to Remember section of PDF.`);
            }

            pdfHtml += `</body></html>`;

            // Use html2pdf.js to generate and save the PDF
            const worker = html2pdf().from(pdfHtml).set({
                margin: 15, // Page margins in mm
                filename: `${topicName.replace(/[^a-z0-9]/gi, '_')}_Review.pdf`,
				pagebreak:{mode:"css"}, // Use css mode for page breaks
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 8, // Keep scale 8 for now, reduce if still issues with white pages
                    logging: true,
                    dpi: 300,
                    letterRendering: true
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            });

             worker.save();
             console.log("PDF Generation initiated.");
        }


        // PDF Generation Function for ALL Questions using html2pdf.js
        function generateAllQuestionsPDF() {
             if (currentTopicQuestions.length === 0) {
                alert("No questions available for the current lesson.");
                return;
            }

            const topicName = currentTopicQuestions.length > 0 ? currentTopicQuestions[0].topic : 'Lesson';
             console.log(`Generating All Questions PDF for ${topicName}...`);

            let pdfHtml = `
                <html>
                <head>
                    <title>${topicName} All Questions</title>
                     ${pdfStyles} <!-- Include styles here -->
                </head>
                <body>
                    <h1>All Questions and Answers</h1>
                    <h2>Lesson: ${topicName}</h2>
            `;

             // Sort questions just in case they weren't filtered/sorted earlier (though startGame does this)
             const sortedQuestions = currentTopicQuestions.slice().sort((a, b) => a.originalNumber - b.originalNumber);

            // Add each question to the HTML
             sortedQuestions.forEach((item, index) => {
                pdfHtml += buildItemHtml(item, index, false); // false for not isReview (i.e., building for All Questions)
            });
             console.log(`${sortedQuestions.length} items added to All Questions PDF.`);

            pdfHtml += `</body></html>`;


            // Use html2pdf.js to generate and save the PDF
             const worker = html2pdf().from(pdfHtml).set({
                margin: 15, // Page margins in mm
                filename: `${topicName.replace(/[^a-z0-9]/gi, '_')}_All_Questions_and_Answers.pdf`,
                 image: { type: 'jpeg', quality: 0.98 },
				 pagebreak:{mode:"css"}, // Use css mode for page breaks
                 html2canvas: {
                     scale: 8, // Keep scale 8 for now, reduce if still issues with white pages
                     logging: true,
                     dpi: 300,
                     letterRendering: true
                    },
                 jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            });

             worker.save();
             console.log("PDF Generation initiated.");
        }


        // --- Event Listeners ---
        addToRememberButton.addEventListener('click', addToRememberList);
        // revealAnswerButton.addEventListener('click', revealAnswer); // Listener added in displayQuestion now
        skipButton.addEventListener('click', skipQuestion);
        nextButton.addEventListener('click', nextQuestion);
        restartButton.addEventListener('click', showLessonSelection);
        downloadPdfButton.addEventListener('click', generateReviewPDF); // Hook up to the new Review PDF function
        exportAllPdfButton.addEventListener('click', generateAllQuestionsPDF);


        // --- Initial Call to Show Lesson Selection ---
        // Using DOMContentLoaded ensures the script runs after the HTML is fully parsed
        document.addEventListener('DOMContentLoaded', showLessonSelection);
