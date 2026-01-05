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

        // Load recent stories
        await loadRecentStories();

        // Load recent productions
        await loadRecentProductions();

        // Load active challenges
        await loadActiveChallenges();

    } catch (error) {
        console.error('Dashboard init error:', error);
    }
}

// Load recent stories
async function loadRecentStories() {
    try {
        const storiesSnapshot = await db.collection('stories')
            .where('author', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(3)
            .get();

        const container = document.getElementById('recentStories');

        if (storiesSnapshot.empty) {
            // Show empty state
            return;
        }

        container.innerHTML = '';

        storiesSnapshot.forEach(doc => {
            const story = doc.data();
            const storyCard = createStoryCard(doc.id, story);
            container.appendChild(storyCard);
        });

    } catch (error) {
        console.error('Error loading stories:', error);
    }
}

// Create story card element
function createStoryCard(id, story) {
    const card = document.createElement('div');
    card.className = 'story-card';

    const statusClass = story.status === 'published' ? 'published' : '';
    const statusText = story.status === 'published' ? 'منشورة' : 'مسودة';

    card.innerHTML = `
        <div class="story-header">
            <div>
                <h3 class="story-title">${story.title}</h3>
                <div class="story-meta">
                    ${story.stemTopic} • ${formatDate(story.createdAt)}
                </div>
            </div>
            <span class="story-badge ${statusClass}">${statusText}</span>
        </div>
        <p class="story-description">${story.description || 'لا يوجد وصف'}</p>
        <div class="story-footer">
            <span class="story-meta">🎭 ${story.puppetsUsed?.length || 0} دمية</span>
            <div class="story-actions">
                <a href="../stories/editor.html?id=${id}" class="btn btn-outline btn-sm">تعديل</a>
                <a href="../stories/view.html?id=${id}" class="btn btn-primary btn-sm">عرض</a>
            </div>
        </div>
    `;

    return card;
}

// Load recent productions
async function loadRecentProductions() {
    try {
        const productionsSnapshot = await db.collection('productions')
            .where('students', 'array-contains', currentUser.uid)
            .orderBy('uploadDate', 'desc')
            .limit(3)
            .get();

        const container = document.getElementById('recentProductions');

        if (productionsSnapshot.empty) {
            return;
        }

        container.innerHTML = '';

        productionsSnapshot.forEach(doc => {
            const production = doc.data();
            const productionCard = createProductionCard(doc.id, production);
            container.appendChild(productionCard);
        });

    } catch (error) {
        console.error('Error loading productions:', error);
    }
}

// Create production card element
function createProductionCard(id, production) {
    const card = document.createElement('div');
    card.className = 'production-card';

    card.innerHTML = `
        <div class="production-thumbnail">
            🎬
            <div class="production-overlay">
                <div class="play-button">▶</div>
            </div>
        </div>
        <div class="production-content">
            <h3 class="production-title">${production.title}</h3>
            <div class="production-info">
                <span>📅 ${formatDate(production.uploadDate)}</span>
                <span>👁️ ${production.views || 0}</span>
                <span>⭐ ${production.rating || 0}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        window.location.href = `../productions/player.html?id=${id}`;
    });

    return card;
}

// Load active challenges
async function loadActiveChallenges() {
    try {
        const now = new Date();

        const challengesSnapshot = await db.collection('challenges')
            .where('endDate', '>=', firebase.firestore.Timestamp.fromDate(now))
            .where('status', '==', 'active')
            .orderBy('endDate', 'asc')
            .limit(2)
            .get();

        const container = document.getElementById('activeChallenges');

        if (challengesSnapshot.empty) {
            return;
        }

        container.innerHTML = '';

        challengesSnapshot.forEach(doc => {
            const challenge = doc.data();
            const challengeCard = createChallengeCard(doc.id, challenge);
            container.appendChild(challengeCard);
        });

    } catch (error) {
        console.error('Error loading challenges:', error);
        // If index is missing, just skip
        if (error.code === 'failed-precondition') {
            console.log('Challenges index not ready yet');
        }
    }
}

// Create challenge card element
function createChallengeCard(id, challenge) {
    const card = document.createElement('div');
    card.className = 'challenge-card';

    const daysLeft = Math.ceil((challenge.endDate.toDate() - new Date()) / (1000 * 60 * 60 * 24));

    card.innerHTML = `
        <h3 class="challenge-title">🏆 ${challenge.title}</h3>
        <p class="challenge-description">${challenge.description}</p>
        <div class="challenge-meta">
            <span>⏰ ${daysLeft} يوم متبقي</span>
            <span>🎁 ${challenge.points} نقطة</span>
        </div>
    `;

    card.addEventListener('click', () => {
        window.location.href = `../challenges/view.html?id=${id}`;
    });

    card.style.cursor = 'pointer';

    return card;
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
});

// Initialize dashboard on page load
initDashboard();
