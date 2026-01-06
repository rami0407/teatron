// Admin Dashboard - Main Page
// Displays overview statistics and system status

let db, auth;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    db = firebase.firestore();
    auth = firebase.auth();

    // Check if user is admin
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '../auth/login.html';
            return;
        }

        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'admin') {
                alert('ليس لديك صلاحيات الوصول لهذه الصفحة');
                window.location.href = '../index.html';
                return;
            }

            // Load user name
            document.getElementById('userName').textContent = userDoc.data().name || 'المدير';

            // Load dashboard data
            await loadDashboardData();
        } catch (error) {
            console.error('Error checking permissions:', error);
            alert('حدث خطأ في التحقق من الصلاحيات');
        }
    });

    // Event Listeners
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('refreshBtn').addEventListener('click', loadDashboardData);
});

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
        const usersSnapshot = await db.collection('users').get();
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

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('newUsersWeek').textContent = newUsersWeek;
    } catch (error) {
        console.error('Error loading user stats:', error);
        document.getElementById('totalUsers').textContent = '-';
    }
}

// ============================================
// Puppet Statistics
// ============================================

async function loadPuppetStats() {
    try {
        const puppetsSnapshot = await db.collection('puppets').get();
        const totalPuppets = puppetsSnapshot.size;

        let availablePuppets = 0;
        puppetsSnapshot.forEach(doc => {
            if (doc.data().available === true) {
                availablePuppets++;
            }
        });

        document.getElementById('totalPuppets').textContent = totalPuppets;
        document.getElementById('availablePuppets').textContent = availablePuppets;
    } catch (error) {
        console.error('Error loading puppet stats:', error);
        document.getElementById('total Puppets').textContent = '-';
    }
}

// ============================================
// Dialogue Statistics
// ============================================

async function loadDialogueStats() {
    try {
        const dialoguesSnapshot = await db.collection('dialogues').get();
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

        document.getElementById('totalDialogues').textContent = totalDialogues;
        document.getElementById('newDialoguesToday').textContent = newDialoguesToday;
    } catch (error) {
        console.error('Error loading dialogue stats:', error);
        document.getElementById('totalDialogues').textContent = '-';
    }
}

// ============================================
// Assessment Statistics
// ============================================

async function loadAssessmentStats() {
    try {
        const assessmentsSnapshot = await db.collection('assessments').get();
        const totalAssessments = assessmentsSnapshot.size;

        const dialoguesSnapshot = await db.collection('dialogues').get();
        const completionRate = totalAssessments > 0
            ? Math.round((dialoguesSnapshot.size / totalAssessments) * 100)
            : 0;

        document.getElementById('totalAssessments').textContent = totalAssessments;
        document.getElementById('completionRate').textContent = completionRate + '%';
    } catch (error) {
        console.error('Error loading assessment stats:', error);
        document.getElementById('totalAssessments').textContent = '-';
    }
}

// ============================================
// Recent Activity
// ============================================

async function loadRecentActivity() {
    const container = document.getElementById('recentActivity');

    try {
        const dialoguesSnapshot = await db.collection('dialogues')
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
            const userDoc = await db.collection('users').doc(data.studentId).get();
            const userName = userDoc.exists ? userDoc.data().name : 'مستخدم';
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

    try {
        const dialoguesSnapshot = await db.collection('dialogues').get();

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
            const puppetDoc = await db.collection('puppets').doc(puppetId).get();
            const puppetData = puppetDoc.exists ? puppetDoc.data() : { name: puppetId, emoji: '🎭' };

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
        console.error('Error loading popular puppets:', error);
        container.innerHTML = '<p class="error-state">حدث خطأ في تحميل البيانات</p>';
    }
}

// ============================================
// System Status
// ============================================

async function checkSystemStatus() {
    const storageStatus = document.getElementById('storageStatus');
    const storageValue = document.getElementById('storageValue');

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
    const then = timestamp.toDate();
    const diff = Math.floor((now - then) / 1000); // seconds

    if (diff < 60) return 'منذ لحظات';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return `منذ ${Math.floor(diff / 604800)} أسبوع`;
}

function handleLogout() {
    auth.signOut().then(() => {
        window.location.href = '../auth/login.html';
    }).catch((error) => {
        console.error('Error logging out:', error);
        alert('حدث خطأ في تسجيل الخروج');
    });
}
