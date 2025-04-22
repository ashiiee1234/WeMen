// This is a utility script to make a user an admin
// You should use this script only once to set up an admin user
// After using it, remove it or secure it

// DOM Elements
const adminForm = document.getElementById('adminForm');
const emailInput = document.getElementById('adminEmail');
const statusMessage = document.getElementById('statusMessage');

// Check if the form exists (script runs only on the admin setup page)
if (adminForm) {
    adminForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        
        if (!email) {
            showStatus('Please enter a valid email address', 'error');
            return;
        }
        
        // First, find the user by email
        db.collection('users')
            .where('email', '==', email)
            .get()
            .then((snapshot) => {
                if (snapshot.empty) {
                    showStatus(`No user found with email: ${email}`, 'error');
                    return;
                }
                
                // Use the first matching user (should be only one)
                const userDoc = snapshot.docs[0];
                
                // Update the user role to admin
                return db.collection('users').doc(userDoc.id).update({
                    role: 'admin'
                });
            })
            .then(() => {
                showStatus(`User with email ${email} has been made an admin!`, 'success');
            })
            .catch((error) => {
                console.error("Error making user admin:", error);
                showStatus(`Error: ${error.message}`, 'error');
            });
    });
}

// Helper function to show status messages
function showStatus(message, type) {
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = type; // 'success' or 'error'
        statusMessage.style.display = 'block';
        
        // Hide message after 5 seconds
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Check for logged-in user to ensure security
auth.onAuthStateChanged((user) => {
    if (!user) {
        // Not logged in, hide the form
        if (adminForm) {
            adminForm.style.display = 'none';
            document.getElementById('loginMessage').style.display = 'block';
        }
    }
}); 