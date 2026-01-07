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

        // Load content
        loadMyStories();

    } catch (error) {
        console.error('Dashboard init error:', error);
    }
}

async function loadMyStories() {
    try {
        const storiesList = document.getElementById('myStoriesList');
        const countBadge = document.getElementById('storiesCountBadge');

        const snapshot = await db.collection('dialogues')
            .where('studentId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const count = snapshot.size;
        countBadge.textContent = `${count} / 10`;

        // Save count to session storage for editor limit check
        sessionStorage.setItem('storyCount', count);

        if (snapshot.empty) {
            storiesList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff5f5; border-radius: 12px; border: 2px dashed #fcd5ce;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📝</div>
                    <h3>لا توجد قصص محفوظة بعد</h3>
                    <p>ابدأ بكتابة قصتك الأولى الآن!</p>
                    <a href="story-editor.html" class="btn btn-primary" style="margin-top: 15px;">كتابة قصة جديدة</a>
                </div>
            `;
            return;
        }

        storiesList.innerHTML = snapshot.docs.map(doc => {
            const story = doc.data();
            const date = story.createdAt ? story.createdAt.toDate().toLocaleDateString('ar-EG') : 'الآن';
            return `
                <div class="story-card action-card">
                    <div class="story-icon">📜</div>
                    <h3>${story.title}</h3>
                    <p class="text-muted" style="font-size: 0.9rem;">${date}</p>
                    <div class="story-actions" style="margin-top: 15px;">
                        <a href="#" class="btn btn-sm btn-outline" onclick="alert('خاصية التعديل قادمة قريباً!')">تعديل</a>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading stories:', error);
        document.getElementById('myStoriesList').innerHTML = '<p class="error-text">حدث خطأ في تحميل القصص</p>';
    }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
});

// Initialize dashboard on page load
initDashboard();
