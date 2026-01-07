// Student Dashboard JavaScript

let currentUser = null;
let userData = null;

// Check authentication and load dashboard
async function initDashboard() {
    try {
        const authData = await checkAuth('student');
        currentUser = authData.user;
        userData = authData.userData;

        // Update UI with user data
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('studentGrade').textContent = `الصف ${userData.grade || '-'}`;
        document.getElementById('studentSection').textContent = userData.section || '-';
        document.getElementById('studentPoints').textContent = userData.points || 0;

    } catch (error) {
        console.error('Dashboard init error:', error);
    }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
});

// Initialize dashboard on page load
initDashboard();
