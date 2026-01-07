// Admin Dashboard - Main Page
// Displays overview statistics and system status

// NOTE: db and auth are initialized in firebase-config.js (assumed loaded first)

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is admin
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '../auth/login.html';
            return;
        }

        try {
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'admin') {
                alert('ليس لديك صلاحيات الوصول لهذه الصفحة');
                window.location.href = '../index.html';
                return;
            }

            // Load user name
            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = userDoc.data().name || 'المدير';
            }

            // Load dashboard data
            await loadDashboardData();
        } catch (error) {
            console.error('Error checking permissions:', error);
        }
    });

    // Event Listeners
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
});

function handleLogout() {
    firebase.auth().signOut().then(() => {
        window.location.href = '../auth/login.html';
    }).catch((error) => {
        console.error('Error logging out:', error);
        alert('حدث خطأ في تسجيل الخروج');
    });
}

// ============================================
// Load Dashboard Data
// ============================================

async function loadDashboardData() {
    try {
        await Promise.all([
            loadUserStats(),
            loadPuppetStats(),
            loadDialogueStats(),
            loadAssessmentStats(),
            loadRecentActivity(),
            loadPopularPuppets(),
            checkSystemStatus()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// ============================================
// User Statistics
// ============================================

async function loadUserStats() {
    try {
        const usersSnapshot = await firebase.firestore().collection('users').get();
        const totalUsers = usersSnapshot.size;

        // Count new users this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        let newUsersWeek = 0;
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.createdAt && data.createdAt.toDate() >= oneWeekAgo) {
                newUsersWeek++;
            }
        });

        const totalUsersEl = document.getElementById('totalUsers');
        if (totalUsersEl) totalUsersEl.textContent = totalUsers;

        const newUsersWeekEl = document.getElementById('newUsersWeek');
        if (newUsersWeekEl) newUsersWeekEl.textContent = newUsersWeek;
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

// ============================================
// Puppet Statistics
// ============================================

async function loadPuppetStats() {
    try {
        const puppetsSnapshot = await firebase.firestore().collection('puppets').get();
        const totalPuppets = puppetsSnapshot.size;

        let availablePuppets = 0;
        puppetsSnapshot.forEach(doc => {
            if (doc.data().available === true) {
                availablePuppets++;
            }
        });

        const totalPuppetsEl = document.getElementById('totalPuppets');
        if (totalPuppetsEl) totalPuppetsEl.textContent = totalPuppets;

        const availablePuppetsEl = document.getElementById('availablePuppets');
        if (availablePuppetsEl) availablePuppetsEl.textContent = availablePuppets;
    } catch (error) {
        console.error('Error loading puppet stats:', error);
    }
}

// ============================================
// Dialogue Statistics
// ============================================

async function loadDialogueStats() {
    try {
        const dialoguesSnapshot = await firebase.firestore().collection('dialogues').get();
        const totalDialogues = dialoguesSnapshot.size;

        // Count dialogues created today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let newDialoguesToday = 0;
        dialoguesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.createdAt && data.createdAt.toDate() >= today) {
                newDialoguesToday++;
            }
        });

        const totalDialoguesEl = document.getElementById('totalDialogues');
        if (totalDialoguesEl) totalDialoguesEl.textContent = totalDialogues;

        const newDialoguesTodayEl = document.getElementById('newDialoguesToday');
        if (newDialoguesTodayEl) newDialoguesTodayEl.textContent = newDialoguesToday;
    } catch (error) {
        console.error('Error loading dialogue stats:', error);
    }
}

// ============================================
// Assessment Statistics
// ============================================

async function loadAssessmentStats() {
    try {
        const assessmentsSnapshot = await firebase.firestore().collection('assessments').get();
        const totalAssessments = assessmentsSnapshot.size;

        const dialoguesSnapshot = await firebase.firestore().collection('dialogues').get();
        const completionRate = totalAssessments > 0
            ? Math.round((dialoguesSnapshot.size / totalAssessments) * 100)
            : 0;

        const totalAssessmentsEl = document.getElementById('totalAssessments');
        if (totalAssessmentsEl) totalAssessmentsEl.textContent = totalAssessments;

        const completionRateEl = document.getElementById('completionRate');
        if (completionRateEl) completionRateEl.textContent = completionRate + '%';
    } catch (error) {
        console.error('Error loading assessment stats:', error);
    }
}

// ============================================
// Recent Activity
// ============================================

async function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    try {
        const dialoguesSnapshot = await firebase.firestore().collection('dialogues')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        if (dialoguesSnapshot.empty) {
            container.innerHTML = '<p class="empty-state">لا توجد أنشطة حديثة</p>';
            return;
        }

        let html = '<div class="activity-list">';

        for (const doc of dialoguesSnapshot.docs) {
            const data = doc.data();
            let userName = 'مستخدم';

            try {
                if (data.studentId) {
                    const userDoc = await firebase.firestore().collection('users').doc(data.studentId).get();
                    if (userDoc.exists) userName = userDoc.data().name;
                }
            } catch (e) { console.log('User fetch error', e); }

            const timeAgo = getTimeAgo(data.createdAt);

            html += `
                <div class="activity-item">
                    <div class="activity-icon">📝</div>
                    <div class="activity-content">
                        <div class="activity-title">${userName} أنشأ حواراً جديداً</div>
                        <div class="activity-meta">${data.title} • ${timeAgo}</div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading recent activity:', error);
        container.innerHTML = '<p class="error-state">حدث خطأ في تحميل الأنشطة</p>';
    }
}

// ============================================
// Popular Puppets
// ============================================

async function loadPopularPuppets() {
    const container = document.getElementById('popularPuppets');
    if (!container) return;

    try {
        const dialoguesSnapshot = await firebase.firestore().collection('dialogues').get();

        // Count puppet usage
        const puppetUsage = {};
        dialoguesSnapshot.forEach(doc => {
            const puppets = doc.data().puppets || [];
            puppets.forEach(puppetId => {
                puppetUsage[puppetId] = (puppetUsage[puppetId] || 0) + 1;
            });
        });

        // Sort by usage
        const sortedPuppets = Object.entries(puppetUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (sortedPuppets.length === 0) {
            container.innerHTML = '<p class="empty-state">لا توجد بيانات كافية</p>';
            return;
        }

        let html = '<div class="popular-list">';

        for (const [puppetId, count] of sortedPuppets) {
            let puppetData = { name: puppetId, emoji: '🎭' };
            try {
                const puppetDoc = await firebase.firestore().collection('puppets').doc(puppetId).get();
                if (puppetDoc.exists) puppetData = puppetDoc.data();
            } catch (e) { }

            html += `
                <div class="popular-item">
                    <div class="popular-emoji">${puppetData.emoji || '🎭'}</div>
                    <div class="popular-details">
                        <div class="popular-name">${puppetData.name || puppetId}</div>
                        <div class="popular-count">${count} مرة استخدام</div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        // console.error('Error loading popular puppets:', error);
        container.innerHTML = '<p class="error-state">حدث خطأ في تحميل البيانات</p>';
    }
}

// ============================================
// System Status
// ============================================

async function checkSystemStatus() {
    const storageStatus = document.getElementById('storageStatus');
    const storageValue = document.getElementById('storageValue');
    if (!storageStatus || !storageValue) return;

    try {
        // Check if storage is initialized
        if (firebase.storage) {
            storageStatus.className = 'status-indicator status-active';
            storageValue.textContent = 'متاح';
        } else {
            storageStatus.className = 'status-indicator status-warning';
            storageValue.textContent = 'غير مفعّل';
        }
    } catch (error) {
        storageStatus.className = 'status-indicator status-inactive';
        storageValue.textContent = 'غير متاح';
    }
}

// ============================================
// Helper Functions
// ============================================

function getTimeAgo(timestamp) {
    if (!timestamp) return '';

    const now = new Date();
    // Handle both Firestore Timestamp and standard Date
    const then = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((now - then) / 1000); // seconds

    if (diff < 60) return 'منذ لحظات';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return `منذ ${Math.floor(diff / 604800)} أسبوع`;
}
