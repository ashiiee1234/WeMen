// Document loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if admin is logged in happens in admin.js
    
    // Load profile data
    loadProfileData();
    
    // Add event listeners
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfileChanges);
    document.getElementById('resetProfileBtn').addEventListener('click', resetProfileChanges);
    
    // Profile image upload
    const profileAvatar = document.querySelector('.profile-avatar');
    const profileImageUpload = document.getElementById('profileImageUpload');
    
    profileAvatar.addEventListener('click', () => {
        profileImageUpload.click();
    });
    
    profileImageUpload.addEventListener('change', handleProfileImageUpload);
    
    // Message toast close buttons
    const messageCloseButtons = document.querySelectorAll('.message-toast .message-close');
    messageCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.message-toast').classList.remove('show');
        });
    });
});

// Load profile data from Firestore
function loadProfileData() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Load user data
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        
                        // Update profile information
                        document.getElementById('profileName').textContent = userData.name || user.displayName || 'Admin User';
                        document.getElementById('profileEmail').textContent = userData.email || user.email || '';
                        document.getElementById('adminName').textContent = userData.name || user.displayName || 'Admin User';
                        
                        // Form fields
                        document.getElementById('fullName').value = userData.name || user.displayName || '';
                        document.getElementById('email').value = userData.email || user.email || '';
                        document.getElementById('phone').value = userData.phone || '';
                        document.getElementById('location').value = userData.location || '';
                        document.getElementById('bio').value = userData.bio || '';
                        
                        // Notification settings
                        document.getElementById('caseNotifications').checked = userData.notifications?.cases !== false;
                        document.getElementById('forumNotifications').checked = userData.notifications?.forum !== false;
                        document.getElementById('emailNotifications').checked = userData.notifications?.email !== false;
                        
                        // Profile image
                        if (userData.photoURL || user.photoURL) {
                            document.getElementById('profileImage').src = userData.photoURL || user.photoURL;
                            document.getElementById('headerProfileImage').src = userData.photoURL || user.photoURL;
                        }
                    }
                })
                .catch((error) => {
                    console.error("Error loading profile:", error);
                    showErrorMessage('Error loading profile data. Please try again later.');
                });
        }
    });
}

// Save profile changes
function saveProfileChanges() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Get form values
            const fullName = document.getElementById('fullName').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const location = document.getElementById('location').value.trim();
            const bio = document.getElementById('bio').value.trim();
            
            // Get notification settings
            const caseNotifications = document.getElementById('caseNotifications').checked;
            const forumNotifications = document.getElementById('forumNotifications').checked;
            const emailNotifications = document.getElementById('emailNotifications').checked;
            
            // Validate name
            if (!fullName) {
                showErrorMessage('Please enter your full name.');
                return;
            }
            
            // Prepare update data
            const updateData = {
                name: fullName,
                phone: phone || null,
                location: location || null,
                bio: bio || null,
                notifications: {
                    cases: caseNotifications,
                    forum: forumNotifications,
                    email: emailNotifications
                },
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Update profile in Firestore
            db.collection('users').doc(user.uid).update(updateData)
                .then(() => {
                    // Update displayed name
                    document.getElementById('profileName').textContent = fullName;
                    document.getElementById('adminName').textContent = fullName;
                    
                    // Update Firebase Auth profile
                    return user.updateProfile({
                        displayName: fullName
                    });
                })
                .then(() => {
                    showSuccessMessage('Profile updated successfully.');
                })
                .catch((error) => {
                    console.error("Error updating profile:", error);
                    showErrorMessage('Error updating profile. Please try again later.');
                });
            
            // Handle password change if provided
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (currentPassword && newPassword) {
                // Validate password match
                if (newPassword !== confirmPassword) {
                    showErrorMessage('New passwords do not match.');
                    return;
                }
                
                // Validate password strength
                if (newPassword.length < 8) {
                    showErrorMessage('Password must be at least 8 characters long.');
                    return;
                }
                
                // Reauthenticate user
                const credential = firebase.auth.EmailAuthProvider.credential(
                    user.email, 
                    currentPassword
                );
                
                user.reauthenticateWithCredential(credential)
                    .then(() => {
                        // Update password
                        return user.updatePassword(newPassword);
                    })
                    .then(() => {
                        showSuccessMessage('Password updated successfully.');
                        
                        // Clear password fields
                        document.getElementById('currentPassword').value = '';
                        document.getElementById('newPassword').value = '';
                        document.getElementById('confirmPassword').value = '';
                    })
                    .catch((error) => {
                        console.error("Error updating password:", error);
                        
                        if (error.code === 'auth/wrong-password') {
                            showErrorMessage('Current password is incorrect.');
                        } else {
                            showErrorMessage('Error updating password. Please try again later.');
                        }
                    });
            }
        }
    });
}

// Reset profile form
function resetProfileChanges() {
    // Reload data from Firestore
    loadProfileData();
    
    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    showSuccessMessage('Form has been reset.');
}

// Handle profile image upload
function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        showErrorMessage('Please select a valid image file (JPEG, PNG, or GIF).');
        return;
    }
    
    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
        showErrorMessage('Image file is too large. Maximum size is 2MB.');
        return;
    }
    
    // Show loading state
    const profileImage = document.getElementById('profileImage');
    profileImage.src = 'loading.gif'; // You might want to add a loading image
    
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Upload to Firebase Storage
            const storageRef = storage.ref();
            const profileImageRef = storageRef.child(`profile_images/${user.uid}/${file.name}`);
            
            profileImageRef.put(file)
                .then((snapshot) => {
                    return snapshot.ref.getDownloadURL();
                })
                .then((downloadURL) => {
                    // Update profile image
                    profileImage.src = downloadURL;
                    document.getElementById('headerProfileImage').src = downloadURL;
                    
                    // Update user profile
                    return user.updateProfile({
                        photoURL: downloadURL
                    });
                })
                .then(() => {
                    // Update Firestore document
                    return db.collection('users').doc(user.uid).update({
                        photoURL: profileImage.src,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    showSuccessMessage('Profile picture updated successfully.');
                })
                .catch((error) => {
                    console.error("Error uploading image:", error);
                    showErrorMessage('Error uploading image. Please try again later.');
                    
                    // Reset profile image on error
                    loadProfileData();
                });
        }
    });
}

// Show success message
function showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.querySelector('p').textContent = message;
    successMessage.classList.add('show');
    
    // Hide after 5 seconds
    setTimeout(() => {
        successMessage.classList.remove('show');
    }, 5000);
}

// Show error message
function showErrorMessage(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.querySelector('p').textContent = message;
    errorMessage.classList.add('show');
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
} 