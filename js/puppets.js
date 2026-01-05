// Puppets Management JavaScript

let allPuppets = [];
let filteredPuppets = [];
let currentFilter = 'all';
let currentUser = null;

// Emoji mapping for puppet types
const puppetEmojis = {
    animal: ['🦁', '🐻', '🐰', '🐯', '🐼', '🦊', '🐺', '🦌', '🐘', '🦒'],
    family: ['👨', '👩', '👦', '👧', '👴', '👵', '👶'],
    character: ['🤡', '👑', '🎩', '🎭', '🧙', '🧚', '🦸', '🧛']
};

// Initialize
async function initPuppets() {
    try {
        // Check auth
        const authData = await checkAuth();
        currentUser = authData.user;

        if (authData.userData) {
            document.getElementById('userName').textContent = authData.userData.name;
        }

        // Load puppets
        await loadPuppets();

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Init error:', error);
    }
}

// Load puppets from Firestore
async function loadPuppets() {
    try {
        const puppetsSnapshot = await db.collection('puppets')
            .orderBy('name', 'asc')
            .get();

        allPuppets = [];

        if (puppetsSnapshot.empty) {
            // No puppets yet, create some sample ones
            await createSamplePuppets();
            await loadPuppets(); // Reload
            return;
        }

        puppetsSnapshot.forEach(doc => {
            allPuppets.push({
                id: doc.id,
                ...doc.data()
            });
        });

        filteredPuppets = [...allPuppets];
        displayPuppets();

    } catch (error) {
        console.error('Error loading puppets:', error);
        document.getElementById('puppetsGrid').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <p>حدث خطأ في تحميل الدمى</p>
            </div>
        `;
    }
}

// Create sample puppets for testing
async function createSamplePuppets() {
    const samplePuppets = [
        // Animals
        { name: 'الأسد الشجاع', type: 'animal', description: 'أسد قوي وشجاع، ملك الغابة', tags: ['حيوان', 'غابة', 'قوة'], emoji: '🦁' },
        { name: 'الدب اللطيف', type: 'animal', description: 'دب بني لطيف ومحبوب', tags: ['حيوان', 'غابة', 'لطيف'], emoji: '🐻' },
        { name: 'الأرنب السريع', type: 'animal', description: 'أرنب صغير سريع ونشيط', tags: ['حيوان', 'سرعة', 'نشاط'], emoji: '🐰' },
        { name: 'النمر البرّي', type: 'animal', description: 'نمر قوي من الغابة', tags: ['حيوان', 'غابة', 'قوة'], emoji: '🐯' },
        { name: 'الباندا الحكيم', type: 'animal', description: 'باندا حكيم يحب الخيزران', tags: ['حيوان', 'حكمة', 'صين'], emoji: '🐼' },
        { name: 'الثعلب الماكر', type: 'animal', description: 'ثعلب ذكي وماكر', tags: ['حيوان', 'ذكاء', 'مكر'], emoji: '🦊' },

        // Family
        { name: 'الأب الحنون', type: 'family', description: 'أب محب ومسؤول', tags: ['عائلة', 'أب', 'حب'], emoji: '👨' },
        { name: 'الأم الحنونة', type: 'family', description: 'أم طيبة القلب', tags: ['عائلة', 'أم', 'حنان'], emoji: '👩' },
        { name: 'الابن النشيط', type: 'family', description: 'ولد نشيط ومرح', tags: ['عائلة', 'ابن', 'نشاط'], emoji: '👦' },
        { name: 'البنت الذكية', type: 'family', description: 'بنت ذكية ومجتهدة', tags: ['عائلة', 'بنت', 'ذكاء'], emoji: '👧' },
        { name: 'الجد الحكيم', type: 'family', description: 'جد مليء بالحكمة', tags: ['عائلة', 'جد', 'حكمة'], emoji: '👴' },
        { name: 'الجدة الطيبة', type: 'family', description: 'جدة طيبة القلب', tags: ['عائلة', 'جدة', 'طيبة'], emoji: '👵' },

        // Characters
        { name: 'المهرّج المضحك', type: 'character', description: 'مهرّج يحب إضحاك الناس', tags: ['شخصية', 'مرح', 'ضحك'], emoji: '🤡' },
        { name: 'الملك العادل', type: 'character', description: 'ملك حكيم وعادل', tags: ['شخصية', 'ملك', 'عدل'], emoji: '👑' },
        { name: 'الساحر الطيّب', type: 'character', description: 'ساحر يستخدم السحر للخير', tags: ['شخصية', 'سحر', 'خير'], emoji: '🧙' },
        { name: 'الجنية الطيبة', type: 'character', description: 'جنية تحقق الأمنيات', tags: ['شخصية', 'جنية', 'أمنيات'], emoji: '🧚' }
    ];

    console.log('Creating sample puppets...');

    for (const puppet of samplePuppets) {
        await db.collection('puppets').add({
            name: puppet.name,
            type: puppet.type,
            description: puppet.description,
            tags: puppet.tags,
            emoji: puppet.emoji,
            imageUrl: null,
            dateAdded: firebase.firestore.FieldValue.serverTimestamp(),
            usageCount: 0,
            available: true
        });
    }

    console.log('Sample puppets created!');
}

// Display puppets
function displayPuppets() {
    const grid = document.getElementById('puppetsGrid');
    const emptyState = document.getElementById('emptyState');

    if (filteredPuppets.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = filteredPuppets.map(puppet => `
        <div class="puppet-card" data-puppet-id="${puppet.id}">
            <div class="puppet-image">
                <div class="puppet-placeholder">${puppet.emoji || '🎭'}</div>
                <span class="puppet-type-badge">${getTypeLabel(puppet.type)}</span>
            </div>
            <div class="puppet-info">
                <h3 class="puppet-name">${puppet.name}</h3>
                <p class="puppet-description">${puppet.description}</p>
                <div class="puppet-stats">
                    <span>استُخدمت ${puppet.usageCount || 0} مرة</span>
                    <span>${puppet.available ? '✅ متاحة' : '❌ محجوزة'}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Add click listeners to cards
    document.querySelectorAll('.puppet-card').forEach(card => {
        card.addEventListener('click', () => {
            const puppetId = card.dataset.puppetId;
            showPuppetDetail(puppetId);
        });
    });
}

// Get type label in Arabic
function getTypeLabel(type) {
    const labels = {
        animal: 'حيوان',
        family: 'عائلة',
        character: 'شخصية'
    };
    return labels[type] || type;
}

// Show puppet detail modal
function showPuppetDetail(puppetId) {
    const puppet = allPuppets.find(p => p.id === puppetId);
    if (!puppet) return;

    document.getElementById('modalPuppetIcon').textContent = puppet.emoji || '🎭';
    document.getElementById('modalPuppetName').textContent = puppet.name;
    document.getElementById('modalPuppetType').textContent = getTypeLabel(puppet.type);
    document.getElementById('modalUsageCount').textContent = puppet.usageCount || 0;
    document.getElementById('modalPuppetDescription').textContent = puppet.description;

    // Tags
    const tagsContainer = document.getElementById('modalPuppetTags');
    tagsContainer.innerHTML = (puppet.tags || []).map(tag =>
        `<span class="puppet-tag">${tag}</span>`
    ).join('');

    // Show modal
    document.getElementById('puppetModal').style.display = 'flex';

    // Store current puppet ID for selection
    document.getElementById('selectPuppetBtn').dataset.puppetId = puppetId;
}

// Setup event listeners
function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', debounce((e) => {
        const query = e.target.value.trim().toLowerCase();
        filterPuppets(currentFilter, query);
    }, 300));

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.type;
            const query = document.getElementById('searchInput').value.trim().toLowerCase();
            filterPuppets(currentFilter, query);
        });
    });

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', closeModal);

    // Select puppet button
    document.getElementById('selectPuppetBtn').addEventListener('click', () => {
        const puppetId = document.getElementById('selectPuppetBtn').dataset.puppetId;
        // This would integrate with story editor
        showToast('تم اختيار الدمية بنجاح! ✅', 'success');
        closeModal();
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Filter puppets
function filterPuppets(type, query = '') {
    filteredPuppets = allPuppets.filter(puppet => {
        const matchesType = type === 'all' || puppet.type === type;
        const matchesQuery = query === '' ||
            puppet.name.toLowerCase().includes(query) ||
            puppet.description.toLowerCase().includes(query) ||
            (puppet.tags && puppet.tags.some(tag => tag.toLowerCase().includes(query)));
        return matchesType && matchesQuery;
    });

    displayPuppets();
}

// Close modal
function closeModal() {
    document.getElementById('puppetModal').style.display = 'none';
}

// Initialize on page load
initPuppets();
