// Document loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load statistics and data
    loadForumStatistics();
    loadTopics();
    loadCategories();
    loadReportedPosts();
    
    // Tab navigation
    setupTabNavigation();
    
    // Add event listeners for modals
    setupModalListeners();
});

// Set up tab navigation
function setupTabNavigation() {
    const tabLinks = document.querySelectorAll('.admin-nav-tabs a');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all tabs
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to current tab
            const tabId = link.getAttribute('data-tab');
            link.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Set up modal listeners
function setupModalListeners() {
    // Topic details modal
    const topicModal = document.getElementById('topicDetailsModal');
    topicModal.querySelector('.close').addEventListener('click', () => {
        topicModal.style.display = 'none';
    });
    
    // Category modal
    const categoryModal = document.getElementById('categoryModal');
    categoryModal.querySelector('.close').addEventListener('click', () => {
        categoryModal.style.display = 'none';
    });
    
    // Add topic modal
    const addTopicModal = document.getElementById('addTopicModal');
    addTopicModal.querySelector('.close').addEventListener('click', () => {
        addTopicModal.style.display = 'none';
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === topicModal) topicModal.style.display = 'none';
        if (e.target === categoryModal) categoryModal.style.display = 'none';
        if (e.target === addTopicModal) addTopicModal.style.display = 'none';
    });
    
    // Add category button
    document.getElementById('addCategory').addEventListener('click', () => {
        // Reset form
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryModalTitle').textContent = 'Add Category';
        categoryModal.style.display = 'block';
    });
    
    // Add topic button
    document.getElementById('addTopic').addEventListener('click', () => {
        // Reset form
        document.getElementById('topicForm').reset();
        document.getElementById('topicModalTitle').textContent = 'Add Topic';
        loadCategoriesForSelect();
        addTopicModal.style.display = 'block';
    });
}

// Load forum statistics
function loadForumStatistics() {
    // Topics count
    db.collection('forum')
        .get()
        .then(snapshot => {
            document.getElementById('totalTopics').textContent = snapshot.size;
        });
    
    // Categories count
    db.collection('forumCategories')
        .get()
        .then(snapshot => {
            document.getElementById('totalCategories').textContent = snapshot.size;
        });
    
    // Replies count (assuming replies are in a subcollection)
    db.collectionGroup('replies')
        .get()
        .then(snapshot => {
            document.getElementById('totalReplies').textContent = snapshot.size;
        });
    
    // Reported posts count
    db.collection('reportedPosts')
        .get()
        .then(snapshot => {
            document.getElementById('reportedPosts').textContent = snapshot.size;
        });
}

// Load topics
function loadTopics() {
    const topicsTable = document.getElementById('topicsTable');
    topicsTable.innerHTML = '<tr><td colspan="7" class="text-center">Loading topics...</td></tr>';
    
    db.collection('forum')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                topicsTable.innerHTML = '<tr><td colspan="7" class="text-center">No topics found</td></tr>';
                return;
            }
            
            topicsTable.innerHTML = '';
            
            snapshot.forEach(doc => {
                const topic = doc.data();
                const date = topic.createdAt ? topic.createdAt.toDate().toLocaleDateString() : 'N/A';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${topic.title}</td>
                    <td>${topic.author ? topic.author.name : 'Anonymous'}</td>
                    <td>${topic.category || 'Uncategorized'}</td>
                    <td>${date}</td>
                    <td>${topic.replies || 0}</td>
                    <td>${topic.views || 0}</td>
                    <td class="table-actions">
                        <button class="view" data-id="${doc.id}"><i class="fas fa-eye"></i></button>
                        <button class="edit" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                
                topicsTable.appendChild(row);
            });
            
            // Add event listeners to buttons
            addTopicActionListeners();
        })
        .catch(error => {
            console.error('Error loading topics:', error);
            topicsTable.innerHTML = '<tr><td colspan="7" class="text-center">Error loading topics</td></tr>';
        });
}

// Load categories
function loadCategories() {
    const categoriesTable = document.getElementById('categoriesTable');
    categoriesTable.innerHTML = '<tr><td colspan="5" class="text-center">Loading categories...</td></tr>';
    
    db.collection('forumCategories')
        .orderBy('order')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                categoriesTable.innerHTML = '<tr><td colspan="5" class="text-center">No categories found</td></tr>';
                return;
            }
            
            categoriesTable.innerHTML = '';
            
            snapshot.forEach(doc => {
                const category = doc.data();
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${category.name}</td>
                    <td>${category.description}</td>
                    <td>${category.topicsCount || 0}</td>
                    <td>${category.order}</td>
                    <td class="table-actions">
                        <button class="edit" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                
                categoriesTable.appendChild(row);
            });
            
            // Add event listeners to buttons
            addCategoryActionListeners();
        })
        .catch(error => {
            console.error('Error loading categories:', error);
            categoriesTable.innerHTML = '<tr><td colspan="5" class="text-center">Error loading categories</td></tr>';
        });
}

// Load reported posts
function loadReportedPosts() {
    const reportedTable = document.getElementById('reportedTable');
    reportedTable.innerHTML = '<tr><td colspan="6" class="text-center">Loading reported posts...</td></tr>';
    
    db.collection('reportedPosts')
        .orderBy('reportedAt', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                reportedTable.innerHTML = '<tr><td colspan="6" class="text-center">No reported posts found</td></tr>';
                return;
            }
            
            reportedTable.innerHTML = '';
            
            snapshot.forEach(doc => {
                const report = doc.data();
                const date = report.reportedAt ? report.reportedAt.toDate().toLocaleDateString() : 'N/A';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${report.content.substring(0, 50)}${report.content.length > 50 ? '...' : ''}</td>
                    <td>${report.authorName || 'Anonymous'}</td>
                    <td>${report.reportedBy || 'Anonymous'}</td>
                    <td>${report.reason || 'No reason provided'}</td>
                    <td>${date}</td>
                    <td class="table-actions">
                        <button class="view" data-id="${doc.id}"><i class="fas fa-eye"></i></button>
                        <button class="approve" data-id="${doc.id}"><i class="fas fa-check"></i></button>
                        <button class="delete" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                
                reportedTable.appendChild(row);
            });
            
            // Add event listeners to buttons
            addReportActionListeners();
        })
        .catch(error => {
            console.error('Error loading reported posts:', error);
            reportedTable.innerHTML = '<tr><td colspan="6" class="text-center">Error loading reported posts</td></tr>';
        });
} 