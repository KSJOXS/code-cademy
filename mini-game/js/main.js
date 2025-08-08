        const db = {
            // Correctly initialize the users object, loading from localStorage and adding the admin.
            users: {
                ...(JSON.parse(localStorage.getItem('users')) || {}),
                'admin@example.com': { 
                    id: 'admin', 
                    email: 'admin@example.com', 
                    password: 'admin1111', 
                 
                    isAdmin: true 
                }
            },
            userChallenges: JSON.parse(localStorage.getItem('userChallenges')) || [],
            challenges: [
                {
                    id: 1,
                    title: "Hello World",
                    language: "C",
                    question: "Write a simple C program that prints 'Hello, World!' to the console.",
                    correctCode: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!");\n    return 0;\n}`,
                    points: 100
                },
                {
                    id: 2,
                    title: "Sum of Two Numbers",
                    language: "C",
                    question: ". Write a program to input two numbers and print their sum.",
                     correctCode: `#include <stdio.h>\n\nint main() {\n    int a, b;\n    printf("Enter two numbers: ");\n    scanf("%d %d", &a, &b);\n    printf("Sum = %d\\n", a + b);\n    return 0;\n}`,
                    points: 100
                },
                {
                    id: 3,
                    title: "Factorial Function",
                    language: "C",
                    question: "Write a C function that takes an integer n and returns its factorial. You can assume n is non-negative.",
                    correctCode: `int factorial(int n) {\n    if (n < 0) return -1; \n    if (n == 0) return 1;\n    int result = 1;\n    for (int i = 1; i <= n; i++) {\n        result *= i;\n    }\n    return result;\n}`,
                    points: 150
                }
            ],
            // Load the current user from localStorage
            currentUser: JSON.parse(localStorage.getItem('currentUser')) || null
        };

        // Function to save the "database" to localStorage
        function saveDb() {
            localStorage.setItem('users', JSON.stringify(db.users));
            localStorage.setItem('userChallenges', JSON.stringify(db.userChallenges));
        }

        // Simulates a registration endpoint
        function registerUser(email, password) {
            if (!email || !password) {
                return { success: false, message: 'Email and password cannot be empty.' };
            }
            if (db.users[email]) {
                return { success: false, message: 'User already exists.' };
            }
            const newUser = { id: Date.now(), email, password, points: 0 };
            db.users[email] = newUser;
            saveDb();
            return { success: true, message: 'Registration successful. Please log in.' };
        }

        // Simulates a login endpoint with validation
        function loginUser(email, password) {
            const user = db.users[email];
            
            if (user && user.password === password) {
                db.currentUser = user;
                // Save the current user to localStorage
                localStorage.setItem('currentUser', JSON.stringify(db.currentUser));
                
                if (user.isAdmin) {
                    return { success: true, message: 'Admin login successful.', isAdmin: true };
                }
                return { success: true, message: 'Login successful.', isAdmin: false };
            }
            return { success: false, message: 'Invalid email or password.' };
        }

        function compareCode(userCode, correctCode) {
            const normalizeCode = (code) => code.split('\n').map(line => line.replace(/\s/g, '')).filter(line => line !== '');
            const userLines = normalizeCode(userCode);
            const correctLines = normalizeCode(correctCode);
            if (correctLines.length === 0) {
                return 0;
            }
            let matchingLines = 0;
            const maxLength = Math.max(userLines.length, correctLines.length);
            for (let i = 0; i < maxLength; i++) {
                const userLine = userLines[i] || '';
                const correctLine = correctLines[i] || '';
                if (userLine === correctLine) {
                    matchingLines++;
                }
            }
            const totalLines = Math.max(userLines.length, correctLines.length);
            const percentage = (matchingLines / totalLines) * 100;
            return Math.round(percentage);
        }

        function submitCode(challengeId, code) {
            const challenge = db.challenges.find(c => c.id === challengeId);
            if (!challenge) {
                return { success: false, message: 'Challenge not found.' };
            }

            const isCompleted = db.userChallenges.some(
                c => c.userId === db.currentUser.id && c.challengeId === challengeId
            );

            if (isCompleted) {
                return { success: false, message: 'You have already completed this challenge.', score: 0 };
            }

            const percentageCorrect = compareCode(code, challenge.correctCode);
            const isCorrect = percentageCorrect === 100;

            if (isCorrect) {
                const completionRecord = {
                    userId: db.currentUser.id,
                    challengeId: challengeId,
                    date: new Date().toISOString(),
                    submittedCode: code
                };
                db.userChallenges.push(completionRecord);

                const user = db.users[db.currentUser.email];
                user.points = (user.points || 0) + challenge.points;
                db.currentUser = user;

                saveDb();
                
                return { success: true, message: `Your code is 100% correct! You scored ${challenge.points} points.`, score: challenge.points };
            } else {
                return { success: false, message: `Your code is ${percentageCorrect}% correct. Please fix it and try again.`, score: 0 };
            }
        }

        // --- Frontend Logic and Event Handlers ---

        // Element references
        const authView = document.getElementById('auth-view');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const dashboardView = document.getElementById('dashboard-view');
        const challengeView = document.getElementById('challenge-view');
        const leaderboardView = document.getElementById('leaderboard-view');
        const adminDashboardView = document.getElementById('admin-dashboard-view');
        const editUserModal = document.getElementById('edit-user-modal');
        const confirmationModal = document.getElementById('confirmation-modal');

        const loginEmailInput = document.getElementById('login-email');
        const loginPasswordInput = document.getElementById('login-password');
        const registerEmailInput = document.getElementById('register-email');
        const registerPasswordInput = document.getElementById('register-password');

        const showRegisterButton = document.getElementById('show-register-button');
        const showLoginButton = document.getElementById('show-login-button');
        const loginButton = document.getElementById('login-button');
        const registerButton = document.getElementById('register-button');

        const showPointsButton = document.getElementById('show-points-button');
        const logoutButtons = document.querySelectorAll('#logout-button, #challenge-logout-button, #admin-logout-button');

        const userEmailDisplay = document.getElementById('user-email-display');
        const userPointsDisplay = document.getElementById('user-points-display');
        const challengeList = document.getElementById('challenge-list');
        const challengeTitle = document.getElementById('challenge-title');
        const challengeQuestion = document.getElementById('challenge-question');
        const codeEditor = document.getElementById('code-editor');
        const submitCodeButton = document.getElementById('submit-code-button');
        const backToDashboardButton = document.getElementById('back-to-dashboard-button');
        const showPointsFromChallengeButton = document.getElementById('show-points-from-challenge-button');

        const resultBox = document.getElementById('result-box');
        const authMessageBox = document.getElementById('auth-message-box');
        const timerDisplay = document.getElementById('timer-display');

        const confirmMessage = document.getElementById('confirm-message');
        const confirmYesButton = document.getElementById('confirm-yes-button');
        const confirmNoButton = document.getElementById('confirm-no-button');

        const leaderboardList = document.getElementById('leaderboard-list');
        const backFromLeaderboardButton = document.getElementById('back-from-leaderboard-button');

        const adminLogoutButton = document.getElementById('admin-logout-button');
        const adminUserList = document.getElementById('admin-user-list');

        const editEmailInput = document.getElementById('edit-email-input');
        const editPointsInput = document.getElementById('edit-points-input');
        const saveUserButton = document.getElementById('save-user-button');
        const cancelEditButton = document.getElementById('cancel-edit-button');
        
        let activeChallenge = null;
        let challengeTimer = null;
        const challengeTimeLimit = 600;
        let pendingAction = null;
        let adminDashboardInterval = null;
        let leaderboardUpdateInterval = null;


        function showMessage(element, message, type = 'success') {
            element.textContent = message;
            element.className = `message-box ${type}`;
            element.classList.remove('hidden');
            setTimeout(() => {
                element.classList.add('hidden');
            }, 5000);
        }

        function showConfirmationModal(message, onConfirm) {
            confirmMessage.textContent = message;
            confirmationModal.classList.remove('hidden');
            pendingAction = onConfirm;
        }

        function renderUI() {
    // Clear any active timers on UI render
    if (challengeTimer) {
        clearInterval(challengeTimer);
        challengeTimer = null;
    }
    if (leaderboardUpdateInterval) {
        clearInterval(leaderboardUpdateInterval);
        leaderboardUpdateInterval = null;
    }
    if (adminDashboardInterval) {
        clearInterval(adminDashboardInterval);
        adminDashboardInterval = null;
    }

    [authView, dashboardView, challengeView, leaderboardView, adminDashboardView, editUserModal, confirmationModal].forEach(view => {
        view.classList.add('hidden');
    });
    
    if (db.currentUser) {
        if (db.currentUser.isAdmin) {
            adminDashboardView.classList.remove('hidden');
            renderAdminUserList(); // Initial render
            // Set an interval to refresh the admin user list every 5 seconds
            adminDashboardInterval = setInterval(renderAdminUserList, 5000);
        } else {
            dashboardView.classList.remove('hidden');
            userEmailDisplay.textContent = db.currentUser.email;
            userPointsDisplay.textContent = `${db.currentUser.points || 0} Pts`;
            renderChallengeList();
        }
    } else {
        authView.classList.remove('hidden');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        
        displayLeaderboard();
        leaderboardUpdateInterval = setInterval(displayLeaderboard, 5000);
    }
}





function renderAdminUserList() {
    adminUserList.innerHTML = '';
    // Filter out the admin user from the list
    const allUsers = Object.values(db.users).filter(user => !user.isAdmin);
    // Sort users by points in descending order
    const sortedUsers = allUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
    
    sortedUsers.forEach((user, index) => {
        const listItem = document.createElement('li');
        listItem.className = "leaderboard-item";
        
        const userPoints = user.points || 0;

        listItem.innerHTML = `
            <span class="leaderboard-name">${index + 1}. ${user.email}</span>
            <span class="leaderboard-points">${userPoints} pts</span>
            <div class="nav-buttons">
                <button class="edit-user-button outline" data-email="${user.email}">Edit</button>
                <button class="delete-user-button" data-email="${user.email}">Delete</button>
            </div>
        `;
        adminUserList.appendChild(listItem);
    });
}

        function editUser(email, points) {
            const user = db.users[email];
            if (user) {
                user.points = parseInt(points, 10);
                saveDb();
                renderUI();
            }
        }

        function deleteUser(email) {
            const userToDelete = db.users[email];
            if (userToDelete) {
                if (userToDelete.isAdmin) {
                    console.warn("Attempt to delete admin account blocked.");
                    return;
                }

                const userId = userToDelete.id;
                delete db.users[email];
                db.userChallenges = db.userChallenges.filter(c => c.userId !== userId);
                
                saveDb();
                renderUI(); 
            }
        }

        function renderChallengeList() {
            challengeList.innerHTML = '';
            const completedChallenges = db.userChallenges
                .filter(c => c.userId === db.currentUser.id)
                .map(c => c.challengeId);
                
            db.challenges.forEach(challenge => {
                const listItem = document.createElement('li');
                listItem.className = "card";
                const isCompleted = completedChallenges.includes(challenge.id);
                
                let statusText = '';
                if (isCompleted) {
                    statusText = `<span style="color: #2ecc71; font-weight: 600;">(Completed)</span>`;
                    listItem.style.backgroundColor = '#2c4060';
                    listItem.style.cursor = 'default';
                } else {
                    statusText = `<span style="color: #f1c40f; font-weight: 600;">(Pending)</span>`;
                    listItem.style.cursor = 'pointer';
                    listItem.style.transition = 'transform 0.2s';
                    listItem.addEventListener('mouseenter', () => listItem.style.transform = 'scale(1.02)');
                    listItem.addEventListener('mouseleave', () => listItem.style.transform = 'scale(1)');
                }

                listItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>${challenge.title}</h3>
                        ${statusText}
                    </div>
                    <p style="font-size: 0.9rem; color: #a0a0a0;">Language: ${challenge.language}</p>
                `;

                if (!isCompleted) {
                    listItem.onclick = () => {
                        if (challengeTimer) {
                            clearInterval(challengeTimer);
                        }
                        activeChallenge = challenge;
                        dashboardView.classList.add('hidden');
                        challengeView.classList.remove('hidden');
                        challengeTitle.textContent = challenge.title;
                        challengeQuestion.textContent = challenge.question;
                        codeEditor.value = '';
                        resultBox.classList.add('hidden');
                        submitCodeButton.disabled = false;
                        startCountdownTimer();
                    };
                }
                challengeList.appendChild(listItem);
            });
        }

        function startCountdownTimer() {
            let timeLeft = challengeTimeLimit;
            const updateTimer = () => {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                if (timeLeft <= 0) {
                    clearInterval(challengeTimer);
                    challengeTimer = null;
                    showMessage(resultBox, 'Time\'s up! The challenge has ended.', 'error');
                    submitCodeButton.disabled = true;
                }
                timeLeft--;
            };
            updateTimer();
            challengeTimer = setInterval(updateTimer, 1000);
        }
        
        function displayLeaderboard() {
            leaderboardList.innerHTML = '';
            const allUsers = Object.values(db.users).filter(user => !user.isAdmin);
            const sortedUsers = allUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
            
            sortedUsers.forEach((user, index) => {
                const userPoints = user.points || 0;
                const listItem = document.createElement('li');
                listItem.classList.add('leaderboard-item');
                listItem.innerHTML = `
                    <span class="leaderboard-rank">${index + 1}.</span>
                    <span class="leaderboard-name">${user.email}</span>
                    <span class="leaderboard-points">${userPoints} pts</span>
                `;
                leaderboardList.appendChild(listItem);
            });
        }
        
        // Event Listeners
        showRegisterButton.addEventListener('click', () => {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });

        showLoginButton.addEventListener('click', () => {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });

        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            const result = loginUser(loginEmailInput.value, loginPasswordInput.value);
            if (result.success) {
                showMessage(authMessageBox, result.message, 'success');
                renderUI();
            } else {
                showMessage(authMessageBox, result.message, 'error');
            }
        });

        registerButton.addEventListener('click', (e) => {
            e.preventDefault();
            const result = registerUser(registerEmailInput.value, registerPasswordInput.value);
            if (result.success) {
                showMessage(authMessageBox, result.message, 'success');
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                showMessage(authMessageBox, result.message, 'error');
            }
        });

        logoutButtons.forEach(button => {
            button.addEventListener('click', () => {
                const logoutAction = () => {
                    db.currentUser = null;
                    localStorage.removeItem('currentUser');
                    renderUI();
                };
                if (challengeView.classList.contains('hidden')) {
                    logoutAction();
                } else {
                    showConfirmationModal('Are you sure you want to log out? Your current challenge progress will be lost.', logoutAction);
                }
            });
        });

        submitCodeButton.addEventListener('click', () => {
            if (activeChallenge) {
                // Clear any existing timer to prevent multiple timers running
                if (challengeTimer) {
                    clearInterval(challengeTimer);
                    challengeTimer = null;
                }
                const result = submitCode(activeChallenge.id, codeEditor.value);
                if (result.success) {
                    showMessage(resultBox, result.message, 'success');
                    renderUI();
                } else {
                    showMessage(resultBox, result.message, 'error');
                    // Re-enable the button and restart the timer for another try
                    submitCodeButton.disabled = false;
                    startCountdownTimer();
                }
            }
        });

        backToDashboardButton.addEventListener('click', () => {
            showConfirmationModal('Are you sure you want to go back? Your current challenge progress will be lost.', () => {
                renderUI();
            });
        });

        confirmYesButton.addEventListener('click', () => {
            if (pendingAction) {
                pendingAction();
            }
            confirmationModal.classList.add('hidden');
            pendingAction = null;
        });

        confirmNoButton.addEventListener('click', () => {
            confirmationModal.classList.add('hidden');
            pendingAction = null;
        });

        showPointsButton.addEventListener('click', () => {
            dashboardView.classList.add('hidden');
            leaderboardView.classList.remove('hidden');
            displayLeaderboard();
        });
        
        const showPointsFromAdminButton = document.getElementById('show-points-from-admin-button');
        if (showPointsFromAdminButton) {
            showPointsFromAdminButton.addEventListener('click', () => {
                adminDashboardView.classList.add('hidden');
                leaderboardView.classList.remove('hidden');
                displayLeaderboard();
            });
        }

        showPointsFromChallengeButton.addEventListener('click', () => {
            challengeView.classList.add('hidden');
            leaderboardView.classList.remove('hidden');
            displayLeaderboard();
        });

        backFromLeaderboardButton.addEventListener('click', () => {
            leaderboardView.classList.add('hidden');
            if(db.currentUser && db.currentUser.isAdmin) {
                adminDashboardView.classList.remove('hidden');
            } else {
                dashboardView.classList.remove('hidden');
            }
        });

        // Event listener for admin user list, delegated to the parent ul
        adminUserList.addEventListener('click', (e) => {
            const targetButton = e.target.closest('button');

            if (targetButton) {
                const email = targetButton.dataset.email;
                
                if (targetButton.classList.contains('edit-user-button')) {
                    const userToEdit = db.users[email];
                    if (userToEdit) {
                        editEmailInput.value = userToEdit.email;
                        editPointsInput.value = userToEdit.points || 0;
                        editUserModal.classList.remove('hidden');
                    }
                } else if (targetButton.classList.contains('delete-user-button')) {
                    showConfirmationModal(`Are you sure you want to delete user ${email}? This action cannot be undone.`, () => {
                        deleteUser(email); 
                    });
                }
            }
        });

        saveUserButton.addEventListener('click', () => {
            const email = editEmailInput.value;
            const points = editPointsInput.value;
            editUser(email, points);
            editUserModal.classList.add('hidden');
        });

        cancelEditButton.addEventListener('click', () => {
            editUserModal.classList.add('hidden');
        });

        document.addEventListener('DOMContentLoaded', renderUI);