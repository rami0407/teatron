// Login Page JavaScript

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    showLoading(true);
    hideMessages();

    try {
        // Attempt to login with email
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Set persistence based on remember me
        if (remember) {
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } else {
            await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }

        // Get user role and redirect
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const role = userData.role;

            // Check if teacher is approved
            if (role === 'teacher' && !userData.approved) {
                showError('حسابك قيد المراجعة من قبل الإدارة. سيتم إشعارك عند الموافقة.');
                await auth.signOut();
                showLoading(false);
                return;
            }

            showSuccess('تم تسجيل الدخول بنجاح! جارٍ التحويل...');

            // Redirect based on role
            setTimeout(() => {
                switch (role) {
                    case 'student':
                        window.location.href = '../student/dashboard.html';
                        break;
                    case 'teacher':
                        window.location.href = '../teacher/dashboard.html';
                        break;
                    case 'admin':
                        window.location.href = '../admin/dashboard.html';
                        break;
                    default:
                        window.location.href = '../index.html';
                }
            }, 1500);
        } else {
            throw new Error('لم يتم العثور على بيانات المستخدم');
        }

    } catch (error) {
        console.error('Login error:', error);
        showLoading(false);

        let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';

        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'البريد الإلكتروني غير مسجل';
                break;
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صالح';
                break;
            case 'auth/user-disabled':
                errorMessage = 'تم تعطيل هذا الحساب';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'محاولات كثيرة. يرجى المحاولة لاحقاً';
                break;
            default:
                errorMessage = error.message;
        }

        showError(errorMessage);
    }
});

// Google Login
document.getElementById('googleLogin').addEventListener('click', async () => {
    showLoading(true);
    hideMessages();

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Check if user exists in Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists) {
            // New user - create profile
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                role: 'student', // Default role
                approved: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        showSuccess('تم تسجيل الدخول بنجاح! جارٍ التحويل...');

        setTimeout(() => {
            window.location.href = '../student/dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Google login error:', error);
        showLoading(false);

        if (error.code === 'auth/popup-closed-by-user') {
            showError('تم إلغاء تسجيل الدخول');
        } else {
            showError('فشل تسجيل الدخول بحساب Google: ' + error.message);
        }
    }
});

// Helper functions
function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}
