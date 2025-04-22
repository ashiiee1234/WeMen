// Define cases array and current page
let allCases = [];
let currentPage = 1;
const casesPerPage = 10;
let filteredCases = [];

// Document loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if admin is logged in happens in admin.js
    
    // Load all cases
    loadAllCases();
    
    // Add event listeners
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('exportCases').addEventListener('click', exportCasesCSV);
    
    // Modal event listeners
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
    
    // Case actions in modal
    document.getElementById('approveCaseBtn').addEventListener('click', () => {
        const caseId = document.getElementById('caseId').textContent;
        updateCaseStatus(caseId, 'approved');
    });
    
    document.getElementById('rejectCaseBtn').addEventListener('click', () => {
        const caseId = document.getElementById('caseId').textContent;
        updateCaseStatus(caseId, 'rejected');
    });
});

// Load all cases from Firestore
function loadAllCases() {
    const casesTable = document.getElementById('casesTable');
    casesTable.innerHTML = '<tr><td colspan="6" class="text-center">Loading cases...</td></tr>';
    
    db.collection('cases')
        .orderBy('createdAt', 'desc')
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                casesTable.innerHTML = '<tr><td colspan="6" class="text-center">No cases found.</td></tr>';
                return;
            }
            
            allCases = [];
            snapshot.forEach((doc) => {
                const caseData = doc.data();
                allCases.push({
                    id: doc.id,
                    ...caseData,
                    formattedDate: caseData.createdAt ? caseData.createdAt.toDate().toLocaleDateString() : 'N/A'
                });
            });
            
            // Set filtered cases to all cases initially
            filteredCases = [...allCases];
            
            // Render the first page
            renderCasesPage(1);
        })
        .catch((error) => {
            console.error("Error loading cases:", error);
            casesTable.innerHTML = '<tr><td colspan="6" class="text-center">Error loading cases.</td></tr>';
        });
}

// Render cases for current page
function renderCasesPage(page) {
    const casesTable = document.getElementById('casesTable');
    const casesPagination = document.getElementById('casesPagination');
    
    // Calculate start and end index
    const startIndex = (page - 1) * casesPerPage;
    const endIndex = Math.min(startIndex + casesPerPage, filteredCases.length);
    
    // Check if there are cases to display
    if (filteredCases.length === 0) {
        casesTable.innerHTML = '<tr><td colspan="6" class="text-center">No cases found.</td></tr>';
        casesPagination.innerHTML = '';
        return;
    }
    
    // Clear the table
    casesTable.innerHTML = '';
    
    // Add rows for current page
    for (let i = startIndex; i < endIndex; i++) {
        const caseItem = filteredCases[i];
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${caseItem.id.substring(0, 8)}...</td>
            <td>${caseItem.name}</td>
            <td>${caseItem.caseType}</td>
            <td>${caseItem.formattedDate}</td>
            <td><span class="status ${caseItem.status}">${caseItem.status}</span></td>
            <td class="table-actions">
                <button class="view" data-id="${caseItem.id}"><i class="fas fa-eye"></i></button>
                <button class="edit" data-id="${caseItem.id}"><i class="fas fa-edit"></i></button>
                <button class="delete" data-id="${caseItem.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        casesTable.appendChild(row);
    }
    
    // Add event listeners to buttons
    addCaseActionListeners();
    
    // Create pagination
    createPagination(page, Math.ceil(filteredCases.length / casesPerPage));
}

// Create pagination controls
function createPagination(currentPage, totalPages) {
    const paginationElement = document.getElementById('casesPagination');
    
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
            renderCasesPage(currentPage - 1);
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
            renderCasesPage(i);
        });
        
        paginationElement.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            renderCasesPage(currentPage + 1);
        }
    });
    paginationElement.appendChild(nextButton);
}

// Add event listeners to case action buttons
function addCaseActionListeners() {
    // View buttons
    const viewButtons = document.querySelectorAll('.table-actions .view');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const caseId = button.getAttribute('data-id');
            viewCaseDetails(caseId);
        });
    });
    
    // Edit buttons
    const editButtons = document.querySelectorAll('.table-actions .edit');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const caseId = button.getAttribute('data-id');
            editCase(caseId);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.table-actions .delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const caseId = button.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this case?')) {
                deleteCase(caseId);
            }
        });
    });
}

// View case details
function viewCaseDetails(caseId) {
    db.collection('cases').doc(caseId).get()
        .then((doc) => {
            if (doc.exists) {
                const caseData = doc.data();
                const date = caseData.createdAt ? caseData.createdAt.toDate() : new Date();
                const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                
                // Update modal with case details
                document.getElementById('caseId').textContent = caseId;
                document.getElementById('caseDate').textContent = formattedDate;
                document.getElementById('caseName').textContent = caseData.name || 'N/A';
                document.getElementById('caseEmail').textContent = caseData.email || 'N/A';
                document.getElementById('casePhone').textContent = caseData.phone || 'N/A';
                document.getElementById('caseLocation').textContent = caseData.location || 'N/A';
                document.getElementById('caseType').textContent = caseData.caseType || 'N/A';
                document.getElementById('caseDescription').textContent = caseData.description || 'No description provided.';
                
                // Update status badge
                const statusBadge = document.getElementById('caseStatusBadge');
                statusBadge.textContent = caseData.status;
                statusBadge.className = `status ${caseData.status}`;
                
                // Handle attachments
                const attachmentsContainer = document.getElementById('caseAttachments');
                if (caseData.attachments && caseData.attachments.length > 0) {
                    let attachmentsHTML = '';
                    caseData.attachments.forEach(attachment => {
                        attachmentsHTML += `
                            <div class="attachment-item">
                                <i class="fas fa-file"></i>
                                <p>${attachment.name}</p>
                                <a href="${attachment.url}" target="_blank" class="btn-secondary">View</a>
                            </div>
                        `;
                    });
                    attachmentsContainer.innerHTML = attachmentsHTML;
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
            console.error("Error getting case:", error);
            alert('Error loading case details.');
        });
}

// Edit case
function editCase(caseId) {
    // Redirect to case edit page
    // This is a placeholder - you might want to implement inline editing
    // or create a separate edit page
    alert('Edit functionality to be implemented. Case ID: ' + caseId);
}

// Delete case
function deleteCase(caseId) {
    db.collection('cases').doc(caseId).delete()
        .then(() => {
            // Remove from arrays
            allCases = allCases.filter(c => c.id !== caseId);
            filteredCases = filteredCases.filter(c => c.id !== caseId);
            
            // Re-render current page
            renderCasesPage(currentPage);
            
            alert('Case deleted successfully.');
        })
        .catch((error) => {
            console.error("Error deleting case:", error);
            alert('Error deleting case.');
        });
}

// Update case status
function updateCaseStatus(caseId, status) {
    db.collection('cases').doc(caseId).update({
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // Update in arrays
        const caseIndex = allCases.findIndex(c => c.id === caseId);
        if (caseIndex !== -1) {
            allCases[caseIndex].status = status;
        }
        
        const filteredIndex = filteredCases.findIndex(c => c.id === caseId);
        if (filteredIndex !== -1) {
            filteredCases[filteredIndex].status = status;
        }
        
        // Re-render current page
        renderCasesPage(currentPage);
        
        // Update modal status
        const statusBadge = document.getElementById('caseStatusBadge');
        statusBadge.textContent = status;
        statusBadge.className = `status ${status}`;
        
        alert(`Case ${status} successfully.`);
    })
    .catch((error) => {
        console.error("Error updating case:", error);
        alert('Error updating case status.');
    });
}

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    
    // Apply filters
    filteredCases = allCases.filter(caseItem => {
        // Status filter
        if (statusFilter !== 'all' && caseItem.status !== statusFilter) {
            return false;
        }
        
        // Type filter
        if (typeFilter !== 'all' && caseItem.caseType !== typeFilter) {
            return false;
        }
        
        // Search filter
        if (searchFilter) {
            const searchFields = [
                caseItem.id.toLowerCase(),
                caseItem.name.toLowerCase(),
                caseItem.email ? caseItem.email.toLowerCase() : ''
            ];
            
            return searchFields.some(field => field.includes(searchFilter));
        }
        
        return true;
    });
    
    // Reset to first page and render
    renderCasesPage(1);
}

// Export cases to CSV
function exportCasesCSV() {
    // Get filtered cases or all cases if no filter
    const casesToExport = filteredCases.length > 0 ? filteredCases : allCases;
    
    if (casesToExport.length === 0) {
        alert('No cases to export.');
        return;
    }
    
    // CSV header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Email,Phone,Location,Case Type,Description,Status,Date\n";
    
    // Add rows
    casesToExport.forEach(caseItem => {
        const row = [
            caseItem.id,
            `"${caseItem.name || ''}"`,
            `"${caseItem.email || ''}"`,
            `"${caseItem.phone || ''}"`,
            `"${caseItem.location || ''}"`,
            `"${caseItem.caseType || ''}"`,
            `"${(caseItem.description || '').replace(/"/g, '""')}"`,
            caseItem.status,
            caseItem.formattedDate
        ];
        
        csvContent += row.join(",") + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cases_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
} 