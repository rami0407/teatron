// Register Page JavaScript

// Toggle fields based on user type
const userTypeRadios = document.querySelectorAll('input[name="userType"]');
const studentFields = document.getElementById('studentFields');
const teacherFields = document.getElementById('teacherFields');

userTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'student') {
            studentFields.style.display = 'block';
            teacherFields.style.display = 'none';

            // Make student fields required
            document.getElementById('grade').required = true;
            document.getElementById('section').required = true;
            document.getElementById('subject').required = false;
        } else {
            studentFields.style.display = 'none';
            teacherFields.style.display = 'block';

            // Make teacher fields required
            document.getElementById('grade').required = false;
            document.getElementById('section').required = false;
            document.getElementById('subject').required = true;
        }
    });
});

// Password strength indicator
const passwordInput = document.getElementById('password');
passwordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    const strength = calculatePasswordStrength(password);

    // You can add a visual indicator here if desired
    console.log('Password strength:', strength);
});

function calculatePasswordStrength(password) {
    if (password.length === 0) return 'none';
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    return 'strong';
}

// Form submission
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const userType = document.querySelector('input[name="userType"]:checked').value;
    const terms = document.getElementById('terms').checked;

    // Validation
    if (!terms) {
        showError('يجب الموافقة على الشروط والأحكام');
        return;
    }

    if (password !== confirmPassword) {
        showError('كلمتا المرور غير متطابقتين');
        return;
    }

    if (password.length < 6) {
        showError('كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل');
        return;
    }

    showLoading(true);
    hideMessages();

    try {
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Prepare user data
        const userData = {
            uid: user.uid,
            name: fullName,
            email: email,
            phone: phone || null,
            role: userType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            photoURL: null
        };

        // Add role-specific data
        if (userType === 'student') {
            const grade = document.getElementById('grade').value;
            const section = document.getElementById('section').value;

            if (!grade || !section) {
                throw new Error('يرجى اختيار الصف والشعبة');
            }

            userData.grade = grade;
            userData.section = section;
            userData.approved = true; // Students are auto-approved
            userData.points = 0;
        } else {
            // Teacher
            const subject = document.getElementById('subject').value.trim();

            if (!subject) {
                throw new Error('يرجى إدخال المادة التدريسية');
            }

            userData.subject = subject;
            userData.approved = false; // Teachers need admin approval
        }

        // Save to Firestore
        await db.collection('users').doc(user.uid).set(userData);

        // Update profile
        await user.updateProfile({
            displayName: fullName
        });

        showLoading(false);

        if (userType === 'teacher') {
            showSuccess('تم إنشاء الحساب بنجاح! سيتم مراجعة طلبك من قبل الإدارة.');
            setTimeout(() => {
                auth.signOut();
                window.location.href = 'login.html';
            }, 3000);
        } else {
            showSuccess('تم إنشاء الحساب بنجاح! جارٍ التحويل...');
            setTimeout(() => {
                window.location.href = '../student/dashboard.html';
            }, 2000);
        }

    } catch (error) {
        console.error('Registration error:', error);
        showLoading(false);

        let errorMessage = 'حدث خطأ أثناء التسجيل';

        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'البريد الإلكتروني مسجل مسبقاً';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صالح';
                break;
            case 'auth/weak-password':
                errorMessage = 'كلمة المرور ضعيفة جداً';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'التسجيل غير مفعّل حالياً';
                break;
            default:
                errorMessage = error.message;
        }

        showError(errorMessage);
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

    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';

    // Scroll to success
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}
