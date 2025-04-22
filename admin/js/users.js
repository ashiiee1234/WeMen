// Define users array and current page
let allUsers = [];
let currentPage = 1;
const usersPerPage = 10;
let filteredUsers = [];
let currentUserId = null;

// Document loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if admin is logged in happens in admin.js
    
    // Load all users and statistics
    loadAllUsers();
    
    // Add event listeners for filters
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('exportUsers').addEventListener('click', exportUsersCSV);
    document.getElementById('addUser').addEventListener('click', showAddUserModal);
    
    // User details modal event listeners
    const userDetailsModal = document.getElementById('userDetailsModal');
    const closeBtn = userDetailsModal.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        userDetailsModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === userDetailsModal) {
            userDetailsModal.style.display = 'none';
        }
    });
    
    // Add user modal event listeners
    const addUserModal = document.getElementById('addUserModal');
    const addUserCloseBtn = addUserModal.querySelector('.close');
    
    addUserCloseBtn.addEventListener('click', () => {
        addUserModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === addUserModal) {
            addUserModal.style.display = 'none';
        }
    });
    
    document.getElementById('cancelAddUser').addEventListener('click', () => {
        addUserModal.style.display = 'none';
    });
    
    // Add user form
    document.getElementById('addUserForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addNewUser();
    });
    
    // Save user details
    document.getElementById('saveUserBtn').addEventListener('click', saveUserChanges);
    
    // Delete user
    document.getElementById('deleteUserBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            deleteUser(currentUserId);
        }
    });
});

// Load all users from Firestore
function loadAllUsers() {
    const usersTable = document.getElementById('usersTable');
    usersTable.innerHTML = '<tr><td colspan="7" class="text-center">Loading users...</td></tr>';
    
    db.collection('users')
        .orderBy('createdAt', 'desc')
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                usersTable.innerHTML = '<tr><td colspan="7" class="text-center">No users found.</td></tr>';
                return;
            }
            
            allUsers = [];
            let adminCount = 0;
            let lawyerCount = 0;
            let newUserCount = 0;
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            snapshot.forEach((doc) => {
                const userData = doc.data();
                
                // Format date
                const createdDate = userData.createdAt ? userData.createdAt.toDate() : new Date();
                const formattedDate = createdDate.toLocaleDateString();
                
                // Count by role
                if (userData.role === 'admin') adminCount++;
                if (userData.role === 'lawyer') lawyerCount++;
                
                // Count new users in last 30 days
                if (createdDate > thirtyDaysAgo) newUserCount++;
                
                allUsers.push({
                    id: doc.id,
                    ...userData,
                    formattedDate: formattedDate
                });
            });
            
            // Update statistics
            document.getElementById('totalUsers').textContent = allUsers.length;
            document.getElementById('adminUsers').textContent = adminCount;
            document.getElementById('lawyerUsers').textContent = lawyerCount;
            document.getElementById('newUsers').textContent = newUserCount;
            
            // Set filtered users to all users initially
            filteredUsers = [...allUsers];
            
            // Render the first page
            renderUsersPage(1);
        })
        .catch((error) => {
            console.error("Error loading users:", error);
            usersTable.innerHTML = '<tr><td colspan="7" class="text-center">Error loading users.</td></tr>';
        });
}

// Render users for current page
function renderUsersPage(page) {
    const usersTable = document.getElementById('usersTable');
    const usersPagination = document.getElementById('usersPagination');
    
    // Calculate start and end index
    const startIndex = (page - 1) * usersPerPage;
    const endIndex = Math.min(startIndex + usersPerPage, filteredUsers.length);
    
    // Check if there are users to display
    if (filteredUsers.length === 0) {
        usersTable.innerHTML = '<tr><td colspan="7" class="text-center">No users found.</td></tr>';
        usersPagination.innerHTML = '';
        return;
    }
    
    // Clear the table
    usersTable.innerHTML = '';
    
    // Add rows for current page
    for (let i = startIndex; i < endIndex; i++) {
        const user = filteredUsers[i];
        const row = document.createElement('tr');
        
        // Define status class based on user status
        const statusClass = user.status || 'active';
        
        row.innerHTML = `
            <td>${user.id.substring(0, 8)}...</td>
            <td>${user.name || user.displayName || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.role || 'user'}</td>
            <td>${user.formattedDate}</td>
            <td><span class="status ${statusClass}">${user.status || 'active'}</span></td>
            <td class="table-actions">
                <button class="view" data-id="${user.id}"><i class="fas fa-eye"></i></button>
                <button class="edit" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                <button class="delete" data-id="${user.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        usersTable.appendChild(row);
    }
    
    // Add event listeners to buttons
    addUserActionListeners();
    
    // Create pagination
    createPagination(page, Math.ceil(filteredUsers.length / usersPerPage));
}

// Create pagination controls
function createPagination(currentPage, totalPages) {
    const paginationElement = document.getElementById('usersPagination');
    
    // Clear existing pagination
    paginationElement.innerHTML = '';
    
    // Don't show pagination if only one page
    if (totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            renderUsersPage(currentPage - 1);
        }
    });
    paginationElement.appendChild(prevButton);
    
    // Page buttons
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        
        pageButton.addEventListener('click', () => {
            renderUsersPage(i);
        });
        
        paginationElement.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            renderUsersPage(currentPage + 1);
        }
    });
    paginationElement.appendChild(nextButton);
}

// Add event listeners to user action buttons
function addUserActionListeners() {
    // View buttons
    const viewButtons = document.querySelectorAll('.table-actions .view');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            viewUserDetails(userId);
        });
    });
    
    // Edit buttons
    const editButtons = document.querySelectorAll('.table-actions .edit');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            viewUserDetails(userId, true); // view with edit mode
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.table-actions .delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this user?')) {
                deleteUser(userId);
            }
        });
    });
}

// View user details
function viewUserDetails(userId, editMode = false) {
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                currentUserId = userId;
                
                // Update modal with user details
                document.getElementById('userFullName').textContent = userData.name || userData.displayName || 'N/A';
                document.getElementById('userEmail').textContent = userData.email || 'N/A';
                document.getElementById('userRole').textContent = userData.role || 'User';
                document.getElementById('userRole').className = `status ${userData.role === 'admin' ? 'approved' : (userData.role === 'lawyer' ? 'pending' : '')}`;
                
                // Profile image
                const profileImage = document.getElementById('userProfileImage');
                if (userData.photoURL) {
                    profileImage.src = userData.photoURL;
                } else {
                    profileImage.src = '../images/default-avatar.jpg';
                }
                
                // Personal info
                document.getElementById('userPhone').textContent = userData.phone || 'Not provided';
                document.getElementById('userLocation').textContent = userData.location || 'Not provided';
                
                // Joined date
                const joinedDate = userData.createdAt ? userData.createdAt.toDate().toLocaleDateString() : 'Unknown';
                document.getElementById('userJoinedDate').textContent = joinedDate;
                
                // Activity info - would need separate queries for actual counts
                document.getElementById('userCasesCount').textContent = userData.casesCount || '0';
                document.getElementById('userPostsCount').textContent = userData.postsCount || '0';
                document.getElementById('userLastLogin').textContent = userData.lastLogin ? userData.lastLogin.toDate().toLocaleString() : 'Never';
                
                // Set form select values
                document.getElementById('userStatus').value = userData.status || 'active';
                document.getElementById('userRoleSelect').value = userData.role || 'user';
                
                // Show modal
                document.getElementById('userDetailsModal').style.display = 'block';
            } else {
                alert('User not found.');
            }
        })
        .catch((error) => {
            console.error("Error getting user:", error);
            alert('Error loading user details.');
        });
}

// Save user changes
function saveUserChanges() {
    if (!currentUserId) {
        alert('No user selected.');
        return;
    }
    
    const status = document.getElementById('userStatus').value;
    const role = document.getElementById('userRoleSelect').value;
    
    db.collection('users').doc(currentUserId).update({
        status: status,
        role: role,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // Update in arrays
        const userIndex = allUsers.findIndex(u => u.id === currentUserId);
        if (userIndex !== -1) {
            allUsers[userIndex].status = status;
            allUsers[userIndex].role = role;
        }
        
        const filteredIndex = filteredUsers.findIndex(u => u.id === currentUserId);
        if (filteredIndex !== -1) {
            filteredUsers[filteredIndex].status = status;
            filteredUsers[filteredIndex].role = role;
        }
        
        // Re-render current page
        renderUsersPage(currentPage);
        
        // Update modal display
        document.getElementById('userRole').textContent = role.charAt(0).toUpperCase() + role.slice(1);
        document.getElementById('userRole').className = `status ${role === 'admin' ? 'approved' : (role === 'lawyer' ? 'pending' : '')}`;
        
        alert('User updated successfully.');
        
        // Close modal
        document.getElementById('userDetailsModal').style.display = 'none';
    })
    .catch((error) => {
        console.error("Error updating user:", error);
        alert('Error updating user.');
    });
}

// Delete user
function deleteUser(userId) {
    // Note: In a real application, you would need Firebase Admin SDK
    // to delete the actual Firebase auth user. This just deletes the Firestore record.
    db.collection('users').doc(userId).delete()
        .then(() => {
            // Remove from arrays
            allUsers = allUsers.filter(u => u.id !== userId);
            filteredUsers = filteredUsers.filter(u => u.id !== userId);
            
            // Update statistics
            const adminCount = allUsers.filter(u => u.role === 'admin').length;
            const lawyerCount = allUsers.filter(u => u.role === 'lawyer').length;
            
            document.getElementById('totalUsers').textContent = allUsers.length;
            document.getElementById('adminUsers').textContent = adminCount;
            document.getElementById('lawyerUsers').textContent = lawyerCount;
            
            // Re-render current page
            renderUsersPage(currentPage);
            
            alert('User deleted successfully.');
            
            // Close modal if open
            document.getElementById('userDetailsModal').style.display = 'none';
        })
        .catch((error) => {
            console.error("Error deleting user:", error);
            alert('Error deleting user.');
        });
}

// Show add user modal
function showAddUserModal() {
    // Reset form
    document.getElementById('addUserForm').reset();
    
    // Show modal
    document.getElementById('addUserModal').style.display = 'block';
}

// Add new user
function addNewUser() {
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    const phone = document.getElementById('newUserPhone').value;
    const location = document.getElementById('newUserLocation').value;
    
    // Note: In a real application, user creation should be done through
    // Firebase Admin SDK on the server side for security reasons.
    // This is a simplified version for frontend demo.
    
    // Create auth user (this would typically be done on the server)
    auth.createUserWithEmailAndPassword(email, password)
        .then((result) => {
            const user = result.user;
            
            // Create user document in Firestore
            return db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: role,
                phone: phone || null,
                location: location || null,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                casesCount: 0,
                postsCount: 0
            });
        })
        .then(() => {
            alert('User created successfully.');
            
            // Reload users to update the list
            loadAllUsers();
            
            // Close modal
            document.getElementById('addUserModal').style.display = 'none';
        })
        .catch((error) => {
            console.error("Error creating user:", error);
            alert('Error creating user: ' + error.message);
        });
}

// Apply filters
function applyFilters() {
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    
    // Apply filters
    filteredUsers = allUsers.filter(user => {
        // Role filter
        if (roleFilter !== 'all' && (user.role || 'user') !== roleFilter) {
            return false;
        }
        
        // Status filter
        if (statusFilter !== 'all' && (user.status || 'active') !== statusFilter) {
            return false;
        }
        
        // Search filter
        if (searchFilter) {
            const searchFields = [
                user.name ? user.name.toLowerCase() : '',
                user.displayName ? user.displayName.toLowerCase() : '',
                user.email ? user.email.toLowerCase() : ''
            ];
            
            return searchFields.some(field => field.includes(searchFilter));
        }
        
        return true;
    });
    
    // Reset to first page and render
    renderUsersPage(1);
}

// Export users to CSV
function exportUsersCSV() {
    // Get filtered users or all users if no filter
    const usersToExport = filteredUsers.length > 0 ? filteredUsers : allUsers;
    
    if (usersToExport.length === 0) {
        alert('No users to export.');
        return;
    }
    
    // CSV header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Email,Role,Status,Phone,Location,Joined Date\n";
    
    // Add rows
    usersToExport.forEach(user => {
        const row = [
            user.id,
            `"${user.name || user.displayName || ''}"`,
            `"${user.email || ''}"`,
            user.role || 'user',
            user.status || 'active',
            `"${user.phone || ''}"`,
            `"${user.location || ''}"`,
            user.formattedDate
        ];
        
        csvContent += row.join(",") + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
} 