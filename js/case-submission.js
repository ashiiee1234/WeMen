// Array to store uploaded files
let uploadedFiles = [];

document.addEventListener('DOMContentLoaded', function() {
    const caseForm = document.getElementById('caseForm');
    const fileUpload = document.getElementById('fileUpload');
    const fileList = document.getElementById('fileList');
    const dropArea = document.getElementById('dropArea');
    
    // Drag and drop functionality
    dropArea.addEventListener('click', () => {
        fileUpload.click();
    });
    
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('active');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('active');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            fileUpload.files = e.dataTransfer.files;
            const event = new Event('change');
            fileUpload.dispatchEvent(event);
        }
    });
    
    // Handle file selection
    fileUpload.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        // Validate files
        files.forEach(file => {
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum size is 5MB.`);
                return;
            }
            
            // Check file type
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                alert(`File ${file.name} is not a supported file type. Please upload PDF, JPG, PNG, DOC, or DOCX files.`);
                return;
            }
            
            // Add file to the list
            uploadedFiles.push(file);
            displayFileList();
        });
        
        // Reset the input to allow re-uploading the same file
        fileUpload.value = '';
    });
    
    // Handle form submission
    caseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        const submitButton = caseForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        try {
            // Check if user is logged in
            const user = auth.currentUser;
            if (!user) {
                alert('Please log in to submit a case.');
                
                // Open login modal
                document.getElementById('loginModal').style.display = 'block';
                
                // Reset button
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                return;
            }
            
            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const location = document.getElementById('location').value;
            const caseType = document.getElementById('caseType').value;
            const description = document.getElementById('description').value;
            
            // Upload files to Firebase Storage and get URLs
            const fileUrls = await Promise.all(
                uploadedFiles.map(async (file) => {
                    const storageRef = storage.ref();
                    const fileRef = storageRef.child(`case_files/${user.uid}/${Date.now()}_${file.name}`);
                    await fileRef.put(file);
                    const downloadUrl = await fileRef.getDownloadURL();
                    
                    return {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: downloadUrl
                    };
                })
            );
            
            // Create case data
            const caseData = {
                name,
                email,
                phone,
                location,
                caseType,
                description,
                attachments: fileUrls,
                userId: user.uid,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Save to Firestore
            await db.collection('cases').add(caseData);
            
            // Update user's cases count
            const userRef = db.collection('users').doc(user.uid);
            await userRef.update({
                casesCount: firebase.firestore.FieldValue.increment(1)
            });
            
            // Show success message
            alert('Your case has been submitted successfully. Our team will review it and get back to you soon.');
            
            // Reset form
            caseForm.reset();
            uploadedFiles = [];
            displayFileList();
            
            // Redirect to thank you page
            window.location.href = 'case-submitted.html';
            
        } catch (error) {
            console.error('Error submitting case:', error);
            alert('There was an error submitting your case. Please try again later.');
        } finally {
            // Reset button
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
    
    // Function to display the list of uploaded files
    function displayFileList() {
        fileList.innerHTML = '';
        
        uploadedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            // Get file icon based on type
            let fileIcon = 'fa-file';
            if (file.type.includes('pdf')) fileIcon = 'fa-file-pdf';
            else if (file.type.includes('image')) fileIcon = 'fa-file-image';
            else if (file.type.includes('word')) fileIcon = 'fa-file-word';
            
            fileItem.innerHTML = `
                <i class="fas ${fileIcon}"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
                <button type="button" class="remove-file" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            fileList.appendChild(fileItem);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-file').forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.getAttribute('data-index'));
                uploadedFiles.splice(index, 1);
                displayFileList();
            });
        });
    }
    
    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }
}); 