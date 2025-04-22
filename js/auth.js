// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userProfile = document.getElementById('userProfile');
const userName = document.getElementById('userName');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const anonymousLogin = document.getElementById('anonymousLogin');
const anonymousRegister = document.getElementById('anonymousRegister');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const closeBtns = document.querySelectorAll('.close');

// Show/Hide Modals
loginBtn?.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

registerBtn?.addEventListener('click', () => {
    registerModal.style.display = 'block';
});

showRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'none';
    registerModal.style.display = 'block';
});

showLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.style.display = 'none';
    loginModal.style.display = 'block';
});

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        loginModal.style.display = 'none';
        registerModal.style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === registerModal) {
        registerModal.style.display = 'none';
    }
});

// Form Submissions
loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Email/Password Login
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login successful
            loginModal.style.display = 'none';
            loginForm.reset();
        })
        .catch((error) => {
            alert(`Login Error: ${error.message}`);
        });
});

registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        alert("Passwords don't match!");
        return;
    }
    
    // Create user with email/password
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Update profile with name
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
                // Create user document in Firestore
                return db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: new Date(),
                    role: 'user'
                });
            });
        })
        .then(() => {
            // Registration successful
            registerModal.style.display = 'none';
            registerForm.reset();
        })
        .catch((error) => {
            alert(`Registration Error: ${error.message}`);
        });
});

// Anonymous Authentication
anonymousLogin?.addEventListener('click', () => {
    auth.signInAnonymously()
        .then((userCredential) => {
            console.log("Anonymous sign-in successful");
            
            // Generate random username for anonymous user
            const randomUsername = "Anonymous_" + Math.floor(1000 + Math.random() * 9000);
            const userId = userCredential.user.uid;
            
            // Set the anonymous user profile with the random username
            return userCredential.user.updateProfile({
                displayName: randomUsername
            }).then(() => {
                // Create a document for the anonymous user in Firestore
                return db.collection('users').doc(userId).set({
                    name: randomUsername,
                    isAnonymous: true,
                    createdAt: new Date(),
                    role: 'user'
                });
            });
        })
        .then(() => {
            loginModal.style.display = 'none';
        })
        .catch((error) => {
            console.error("Anonymous Login Error:", error);
            console.error("Error Code:", error.code);
            console.error("Error Message:", error.message);
            alert(`Anonymous Login Error: ${error.message}`);
        });
});

anonymousRegister?.addEventListener('click', () => {
    auth.signInAnonymously()
        .then((userCredential) => {
            console.log("Anonymous sign-in successful");
            
            // Generate random username for anonymous user
            const randomUsername = "Anonymous_" + Math.floor(1000 + Math.random() * 9000);
            const userId = userCredential.user.uid;
            
            // Set the anonymous user profile with the random username
            return userCredential.user.updateProfile({
                displayName: randomUsername
            }).then(() => {
                // Create a document for the anonymous user in Firestore
                return db.collection('users').doc(userId).set({
                    name: randomUsername,
                    isAnonymous: true,
                    createdAt: new Date(),
                    role: 'user'
                });
            });
        })
        .then(() => {
            registerModal.style.display = 'none';
        })
        .catch((error) => {
            console.error("Anonymous Login Error:", error);
            console.error("Error Code:", error.code);
            console.error("Error Message:", error.message);
            alert(`Anonymous Login Error: ${error.message}`);
        });
});

// Logout
logoutBtn?.addEventListener('click', () => {
    auth.signOut()
        .catch((error) => {
            console.error("Logout Error:", error);
        });
});

// Auth State Change Listener
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        if (loginBtn && registerBtn && userProfile) {
            loginBtn.classList.add('hidden');
            registerBtn.classList.add('hidden');
            userProfile.classList.remove('hidden');
            
            // Display user name
            userName.textContent = user.displayName || (user.isAnonymous ? 'Anonymous User' : 'User');
        }
        
        // Check if admin (anonymous users are never admin)
        if (!user.isAnonymous) {
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists && doc.data().role === 'admin') {
                        // Add admin-specific functionality here
                        localStorage.setItem('isAdmin', 'true');
                    } else {
                        localStorage.setItem('isAdmin', 'false');
                    }
                })
                .catch((error) => {
                    console.error("Error checking admin status:", error);
                });
        } else {
            localStorage.setItem('isAdmin', 'false');
        }
    } else {
        // User is signed out
        if (loginBtn && registerBtn && userProfile) {
            loginBtn.classList.remove('hidden');
            registerBtn.classList.remove('hidden');
            userProfile.classList.add('hidden');
        }
        localStorage.setItem('isAdmin', 'false');
    }
}); 