// Common Auth Helper Functions

// Always scroll to top when page loads for better UX
window.addEventListener('load', function () {
    window.scrollTo(0, 0);
});

// Check if user is authenticated and redirect if not
async function checkAuth(requiredRole = null) {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                // Not logged in
                // Assuming we are in a subdirectory like /student/ or /admin/
                // If we are in root, this might need adjustment, but for dashboards it's safer
                const pathPrefix = window.location.pathname.includes('/') && window.location.pathname.split('/').length > 2 ? '../' : './';

                window.location.href = pathPrefix + 'auth/login.html';
                reject('Not authenticated');
                return;
            }

            if (requiredRole) {
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    if (!userDoc.exists) {
                        const pathPrefix = window.location.pathname.includes('/') && window.location.pathname.split('/').length > 2 ? '../' : './';
                        window.location.href = pathPrefix + 'auth/login.html';
                        reject('User data not found');
                        return;
                    }

                    const userData = userDoc.data();

                    // Check role
                    if (userData.role !== requiredRole) {
                        const pathPrefix = window.location.pathname.includes('/') && window.location.pathname.split('/').length > 2 ? '../' : './';
                        window.location.href = pathPrefix + 'index.html';
                        reject('Unauthorized role');
                        return;
                    }

                    // Check if teacher is approved
                    if (userData.role === 'teacher' && !userData.approved) {
                        alert('حسابك قيد المراجعة من قبل الإدارة');
                        await auth.signOut();
                        const pathPrefix = window.location.pathname.includes('/') && window.location.pathname.split('/').length > 2 ? '../' : './';
                        window.location.href = pathPrefix + 'auth/login.html';
                        reject('Teacher not approved');
                        return;
                    }

                    resolve({ user, userData });
                } catch (error) {
                    console.error('Error checking role:', error);
                    const pathPrefix = window.location.pathname.includes('/') && window.location.pathname.split('/').length > 2 ? '../' : './';
                    window.location.href = pathPrefix + 'auth/login.html';
                    reject(error);
                }
            } else {
                resolve({ user });
            }
        });
    });
}

// Logout function
async function logout() {
    try {
        await auth.signOut();
        const pathPrefix = window.location.pathname.includes('/') && window.location.pathname.split('/').length > 2 ? '../' : './';
        window.location.href = pathPrefix + 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('حدث خطأ أثناء تسجيل الخروج');
    }
}

// Get user display name
function getUserDisplayName(user) {
    return user.displayName || user.email.split('@')[0];
}

// Format timestamp to Arabic date
function formatDate(timestamp) {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format timestamp to time
function formatTime(timestamp) {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Upload file to Firebase Storage
async function uploadFile(file, path) {
    try {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(path);

        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();

        return downloadURL;
    } catch (error) {
        console.error('File upload error:', error);
        throw error;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Validate email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone (Israeli format)
function isValidPhone(phone) {
    const re = /^(\+972|0)?[2-9]\d{7,8}$/;
    return re.test(phone.replace(/[- ]/g, ''));
}
