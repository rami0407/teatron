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

        // Load recent productions
        await loadRecentProductions();

    } catch (error) {
        console.error('Dashboard init error:', error);
    }
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



// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
});

// Initialize dashboard on page load
initDashboard();
