// Check if user is admin
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Check if user is admin
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists && doc.data().role === 'admin') {
                        // User is admin, update UI
                        document.getElementById('adminName').textContent = user.displayName || doc.data().name || 'Admin';
                        
                        // Load dashboard data
                        loadDashboardData();
                    } else {
                        // User is not admin, redirect to home
                        alert('You do not have permission to access the admin area.');
                        window.location.href = '../index.html';
                    }
                })
                .catch((error) => {
                    console.error("Error checking admin status:", error);
                    alert('An error occurred. Please try again later.');
                    window.location.href = '../index.html';
                });
        } else {
            // User is not logged in, redirect to home
            window.location.href = '../index.html';
        }
    });
    
    // Logout button
    document.getElementById('adminLogout').addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                window.location.href = '../index.html';
            })
            .catch((error) => {
                console.error("Logout Error:", error);
            });
    });
    
    // Case details modal
    const caseDetailsModal = document.getElementById('caseDetailsModal');
    const closeBtn = caseDetailsModal.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        caseDetailsModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === caseDetailsModal) {
            caseDetailsModal.style.display = 'none';
        }
    });
    
    // Case actions
    document.getElementById('approveCaseBtn').addEventListener('click', () => {
        const caseId = document.getElementById('caseId').textContent;
        updateCaseStatus(caseId, 'approved');
    });
    
    document.getElementById('rejectCaseBtn').addEventListener('click', () => {
        const caseId = document.getElementById('caseId').textContent;
        updateCaseStatus(caseId, 'rejected');
    });
});

// Load dashboard data
function loadDashboardData() {
    // Load cases statistics
    db.collection('cases').get()
        .then((snapshot) => {
            const totalCases = snapshot.size;
            let pendingCases = 0;
            let approvedCases = 0;
            
            snapshot.forEach((doc) => {
                const status = doc.data().status;
                if (status === 'pending') {
                    pendingCases++;
                } else if (status === 'approved') {
                    approvedCases++;
                }
            });
            
            document.getElementById('totalCases').textContent = totalCases;
            document.getElementById('pendingCases').textContent = pendingCases;
            document.getElementById('approvedCases').textContent = approvedCases;
            
            // Load recent cases
            loadRecentCases();
        })
        .catch((error) => {
            console.error("Error loading cases:", error);
        });
    
    // Load users count
    db.collection('users').get()
        .then((snapshot) => {
            document.getElementById('totalUsers').textContent = snapshot.size;
        })
        .catch((error) => {
            console.error("Error loading users:", error);
        });
    
    // Load recent forum activity
    loadRecentForumActivity();
}

// Load recent cases
function loadRecentCases() {
    const recentCasesTable = document.getElementById('recentCasesTable');
    
    db.collection('cases')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
        .then((snapshot) => {
            recentCasesTable.innerHTML = '';
            
            if (snapshot.empty) {
                recentCasesTable.innerHTML = '<tr><td colspan="6" class="text-center">No cases found.</td></tr>';
                return;
            }
            
            snapshot.forEach((doc) => {
                const caseData = doc.data();
                const date = caseData.createdAt.toDate();
                const formattedDate = `${date.toLocaleDateString()}`;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${doc.id.substring(0, 8)}...</td>
                    <td>${caseData.name}</td>
                    <td>${caseData.caseType}</td>
                    <td>${formattedDate}</td>
                    <td><span class="status ${caseData.status}">${caseData.status}</span></td>
                    <td class="table-actions">
                        <button class="view" data-id="${doc.id}"><i class="fas fa-eye"></i></button>
                        <button class="edit" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                
                recentCasesTable.appendChild(row);
            });
            
            // Add event listeners to view buttons
            const viewButtons = document.querySelectorAll('.table-actions .view');
            viewButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const caseId = button.getAttribute('data-id');
                    viewCaseDetails(caseId);
                });
            });
            
            // Add event listeners to delete buttons
            const deleteButtons = document.querySelectorAll('.table-actions .delete');
            deleteButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const caseId = button.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this case?')) {
                        deleteCase(caseId);
                    }
                });
            });
        })
        .catch((error) => {
            console.error("Error loading recent cases:", error);
            recentCasesTable.innerHTML = '<tr><td colspan="6" class="text-center">Error loading cases.</td></tr>';
        });
}

// Load recent forum activity
function loadRecentForumActivity() {
    const recentForumTable = document.getElementById('recentForumTable');
    
    db.collection('forum')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
        .then((snapshot) => {
            recentForumTable.innerHTML = '';
            
            if (snapshot.empty) {
                recentForumTable.innerHTML = '<tr><td colspan="6" class="text-center">No forum topics found.</td></tr>';
                return;
            }
            
            snapshot.forEach((doc) => {
                const topic = doc.data();
                const date = topic.createdAt.toDate();
                const formattedDate = `${date.toLocaleDateString()}`;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${topic.title.substring(0, 30)}${topic.title.length > 30 ? '...' : ''}</td>
                    <td>${topic.author.name}</td>
                    <td>${topic.category}</td>
                    <td>${formattedDate}</td>
                    <td>${topic.replies}</td>
                    <td class="table-actions">
                        <button class="view" data-id="${doc.id}"><i class="fas fa-eye"></i></button>
                        <button class="delete" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                
                recentForumTable.appendChild(row);
            });
            
            // Add event listeners to delete buttons
            const deleteButtons = document.querySelectorAll('#recentForumTable .table-actions .delete');
            deleteButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const topicId = button.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this topic?')) {
                        deleteTopic(topicId);
                    }
                });
            });
        })
        .catch((error) => {
            console.error("Error loading recent forum activity:", error);
            recentForumTable.innerHTML = '<tr><td colspan="6" class="text-center">Error loading forum topics.</td></tr>';
        });
}

// View case details
function viewCaseDetails(caseId) {
    db.collection('cases').doc(caseId).get()
        .then((doc) => {
            if (doc.exists) {
                const caseData = doc.data();
                const date = caseData.createdAt.toDate();
                const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                
                // Update modal with case details
                document.getElementById('caseId').textContent = caseId;
                document.getElementById('caseDate').textContent = formattedDate;
                document.getElementById('caseName').textContent = caseData.name;
                document.getElementById('caseEmail').textContent = caseData.email;
                document.getElementById('casePhone').textContent = caseData.phone;
                document.getElementById('caseLocation').textContent = caseData.location;
                document.getElementById('caseType').textContent = caseData.caseType;
                document.getElementById('caseDescription').textContent = caseData.description;
                
                // Update status badge
                const statusBadge = document.getElementById('caseStatusBadge');
                statusBadge.textContent = caseData.status;
                statusBadge.className = `status ${caseData.status}`;
                
                // Update attachments
                const attachmentsContainer = document.getElementById('caseAttachments');
                
                if (caseData.attachments && caseData.attachments.length > 0) {
                    attachmentsContainer.innerHTML = '';
                    
                    caseData.attachments.forEach(attachment => {
                        const attachmentItem = document.createElement('div');
                        attachmentItem.className = 'attachment-item';
                        
                        // Determine icon based on file type
                        let icon = 'fa-file';
                        if (attachment.type.includes('image')) {
                            icon = 'fa-file-image';
                        } else if (attachment.type.includes('pdf')) {
                            icon = 'fa-file-pdf';
                        } else if (attachment.type.includes('word')) {
                            icon = 'fa-file-word';
                        } else if (attachment.type.includes('excel')) {
                            icon = 'fa-file-excel';
                        }
                        
                        attachmentItem.innerHTML = `
                            <i class="fas ${icon}"></i>
                            <p>${attachment.name}</p>
                            <a href="${attachment.url}" target="_blank" class="btn-secondary btn-sm">View</a>
                        `;
                        
                        attachmentsContainer.appendChild(attachmentItem);
                    });
                } else {
                    attachmentsContainer.innerHTML = '<p>No attachments found.</p>';
                }
                
                // Show modal
                document.getElementById('caseDetailsModal').style.display = 'block';
            } else {
                alert('Case not found.');
            }
        })
        .catch((error) => {
            console.error("Error loading case details:", error);
            alert('Error loading case details. Please try again later.');
        });
}

// Update case status
function updateCaseStatus(caseId, status) {
    db.collection('cases').doc(caseId).update({
        status: status
    })
    .then(() => {
        alert(`Case ${status} successfully.`);
        document.getElementById('caseDetailsModal').style.display = 'none';
        loadDashboardData();
    })
    .catch((error) => {
        console.error("Error updating case status:", error);
        alert('Error updating case status. Please try again later.');
    });
}

// Delete case
function deleteCase(caseId) {
    db.collection('cases').doc(caseId).delete()
        .then(() => {
            alert('Case deleted successfully.');
            loadDashboardData();
        })
        .catch((error) => {
            console.error("Error deleting case:", error);
            alert('Error deleting case. Please try again later.');
        });
}

// Delete topic
function deleteTopic(topicId) {
    db.collection('forum').doc(topicId).delete()
        .then(() => {
            alert('Topic deleted successfully.');
            loadRecentForumActivity();
        })
        .catch((error) => {
            console.error("Error deleting topic:", error);
            alert('Error deleting topic. Please try again later.');
        });
} 