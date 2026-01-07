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

        // Process and Sort Client-Side (to avoid Index error)
        const stories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort descending by date
        stories.sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt ? b.createdAt.toMillis() : 0;
            return dateB - dateA;
        });

        storiesList.innerHTML = stories.map(story => {
            const date = story.createdAt ? story.createdAt.toDate().toLocaleDateString('ar-EG') : 'الآن';
            const statusBadge = story.status === 'submitted'
                ? `<span class="badge" style="background:#e3f2fd; color:#0d47a1; font-size:0.8rem;">📤 أرسلت لـ ${story.teacherName || 'المعلم'}</span>`
                : '';

            return `
                <div class="story-card action-card">
                    <div class="story-icon">📜</div>
                    <h3>${story.title}</h3>
                    <p class="text-muted" style="font-size: 0.9rem;">${date}</p>
                    ${statusBadge}
                    <div class="story-actions" style="margin-top: 15px; display:flex; gap:10px;">
                        <a href="story-editor.html?id=${story.id}" class="btn btn-sm btn-outline">تعديل</a>
                        <button onclick="openTeacherModal('${story.id}')" class="btn btn-sm btn-primary">📤 إرسال</button>
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
// Initialize dashboard on page load
initDashboard();

// ==========================================
// Teacher Submission Logic
// ==========================================

let selectedStoryIdToSubmit = null;

function openTeacherModal(storyId) {
    selectedStoryIdToSubmit = storyId;
    const modal = document.getElementById('teacherModal');
    const list = document.getElementById('teachersList');

    modal.style.display = 'block';

    // Fetch Teachers
    db.collection('users').where('role', '==', 'teacher').get()
        .then(snapshot => {
            if (snapshot.empty) {
                list.innerHTML = '<p>لا يوجد معلمين مسجلين حالياً.</p>';
                return;
            }

            list.innerHTML = snapshot.docs.map(doc => {
                const teacher = doc.data();
                return `
                <div class="teacher-card-select" onclick="submitStoryToTeacher('${doc.id}', '${teacher.name}')" style="cursor:pointer; border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:8px; display:flex; align-items:center; gap:10px; transition:0.2s;">
                    <div style="font-size:1.5rem;">👨‍🏫</div>
                    <div>
                        <strong>${teacher.name || 'معلم'}</strong>
                        <div style="font-size:0.8rem; color:#666;">إرسال القصة</div>
                    </div>
                </div>
            `;
            }).join('');
        })
        .catch(err => {
            console.error(err);
            list.innerHTML = '<p style="color:red">حدث خطأ في تحميل المعلمين</p>';
        });
}

function closeTeacherModal() {
    document.getElementById('teacherModal').style.display = 'none';
    selectedStoryIdToSubmit = null;
}

async function submitStoryToTeacher(teacherId, teacherName) {
    if (!confirm(`هل أنت متأكد أنك تريد إرسال القصة للمعلم: ${teacherName}؟`)) return;

    try {
        await db.collection('dialogues').doc(selectedStoryIdToSubmit).update({
            submittedTo: teacherId,
            teacherName: teacherName,
            status: 'submitted',
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('✅ تم إرسال القصة بنجاح!');
        closeTeacherModal();
        loadMyStories(); // Refresh list

    } catch (error) {
        console.error(error);
        alert('❌ حدث خطأ أثناء الإرسال');
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('teacherModal');
    if (event.target == modal) {
        closeTeacherModal();
    }
}
