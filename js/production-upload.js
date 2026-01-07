// Production Upload JavaScript

let currentUser = null;
let userData = null;
let selectedFile = null;
let participants = [];

// Check authentication
async function initUploadPage() {
    try {
        const authData = await checkAuth('student');
        currentUser = authData.user;
        userData = authData.userData;
    } catch (error) {
        console.error('Upload page init error:', error);
    }
}

// File upload area handling
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');

fileUploadArea.addEventListener('click', () => {
    fileInput.click();
});

// Drag and drop
fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('active');
});

fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('active');
});

fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('active');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

// Handle file selection
function handleFileSelect(file) {
    // Check file size (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
        alert('حجم الملف كبير جداً! الحد الأقصى هو 100MB');
        return;
    }

    // Check file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        alert('نوع الملف غير مدعوم! يرجى اختيار فيديو أو صورة');
        return;
    }

    selectedFile = file;
    displayFilePreview(file);
}

// Display file preview
function displayFilePreview(file) {
    const previewIcon = document.getElementById('previewIcon');
    const previewName = document.getElementById('previewName');
    const previewSize = document.getElementById('previewSize');

    // Set icon based on file type
    if (file.type.startsWith('video/')) {
        previewIcon.textContent = '🎬';
    } else if (file.type.startsWith('image/')) {
        previewIcon.textContent = '🖼️';
    }

    previewName.textContent = file.name;
    previewSize.textContent = formatFileSize(file.size);

    filePreview.classList.add('active');
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Remove file
document.getElementById('removeFileBtn').addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    filePreview.classList.remove('active');
});

// Participants handling
const participantInput = document.getElementById('participantInput');
const participantsList = document.getElementById('participantsList');

participantInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const name = participantInput.value.trim();
        if (name) {
            addParticipant(name);
            participantInput.value = '';
        }
    }
});

function addParticipant(name) {
    if (!participants.includes(name)) {
        participants.push(name);
        renderParticipants();
    }
}

function removeParticipant(name) {
    participants = participants.filter(p => p !== name);
    renderParticipants();
}

function renderParticipants() {
    participantsList.innerHTML = '';
    participants.forEach(name => {
        const tag = document.createElement('div');
        tag.className = 'participant-tag';
        tag.innerHTML = `
            <span>${name}</span>
            <button type="button" onclick="removeParticipant('${name}')">×</button>
        `;
        participantsList.appendChild(tag);
    });
}

// Make removeParticipant global
window.removeParticipant = removeParticipant;

// Form submission
const uploadForm = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedFile) {
        alert('يرجى اختيار ملف للرفع');
        return;
    }

    // Get form data
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const stemTopic = document.getElementById('stemTopic').value;
    const grade = document.getElementById('grade').value;

    // Show loading
    loadingOverlay.style.display = 'flex';
    submitBtn.disabled = true;

    try {
        // Upload file to Firebase Storage
        const fileExtension = selectedFile.name.split('.').pop();
        const fileName = `productions/${currentUser.uid}_${Date.now()}.${fileExtension}`;
        const storageRef = firebase.storage().ref(fileName);

        // Upload with progress tracking
        const uploadTask = storageRef.put(selectedFile);

        uploadTask.on('state_changed',
            (snapshot) => {
                // Track progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload progress: ' + progress + '%');
            },
            (error) => {
                console.error('Upload error:', error);
                throw error;
            },
            async () => {
                // Upload completed successfully
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                // Create production document in Firestore
                const productionData = {
                    title: title,
                    description: description,
                    stemTopic: stemTopic,
                    grade: grade,
                    section: userData.section || '',
                    fileURL: downloadURL,
                    fileType: selectedFile.type.startsWith('video/') ? 'video' : 'image',
                    students: [currentUser.uid],
                    studentNames: [userData.name],
                    participants: participants,
                    uploadDate: firebase.firestore.FieldValue.serverTimestamp(),
                    views: 0,
                    likes: 0,
                    rating: 0,
                    comments: [],
                    status: 'published'
                };

                await db.collection('productions').add(productionData);

                // Show success message
                loadingOverlay.style.display = 'none';
                successMessage.classList.add('active');

                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = '../student/dashboard.html';
                }, 2000);
            }
        );

    } catch (error) {
        console.error('Error uploading production:', error);
        loadingOverlay.style.display = 'none';
        submitBtn.disabled = false;
        errorMessage.textContent = '❌ حدث خطأ: ' + error.message;
        errorMessage.classList.add('active');

        // Hide error message after 5 seconds
        setTimeout(() => {
            errorMessage.classList.remove('active');
        }, 5000);
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
});

// Initialize page
initUploadPage();
