// Admin Puppets Management JavaScript

let allPuppets = [];
let currentUser = null;
let editingPuppetId = null;

// Initialize
async function initAdmin() {
    try {
        // Check auth - admin only
        const authData = await checkAuth('admin');
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
        // Will redirect to login if not admin
    }
}

// Load all puppets
async function loadPuppets() {
    try {
        const puppetsSnapshot = await db.collection('puppets')
            .orderBy('name', 'asc')
            .get();

        allPuppets = [];

        puppetsSnapshot.forEach(doc => {
            allPuppets.push({
                id: doc.id,
                ...doc.data()
            });
        });

        updateStats();
        displayPuppetsTable();

    } catch (error) {
        console.error('Error loading puppets:', error);
    }
}

// Update statistics
function updateStats() {
    document.getElementById('totalPuppets').textContent = allPuppets.length;

    const available = allPuppets.filter(p => p.available).length;
    document.getElementById('availablePuppets').textContent = available;

    // Find most used
    if (allPuppets.length > 0) {
        const mostUsed = allPuppets.reduce((prev, current) =>
            (current.usageCount || 0) > (prev.usageCount || 0) ? current : prev
        );
        document.getElementById('mostUsed').textContent = mostUsed.name;
    }
}

// Display puppets in table format
function displayPuppetsTable() {
    const container = document.getElementById('puppetsTable');

    if (allPuppets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎭</div>
                <p>لا توجد دمى بعد</p>
                <button class="btn btn-primary" onclick="showPuppetForm()">أضف الدمية الأولى</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>الرمز</th>
                    <th>الاسم</th>
                    <th>النوع</th>
                    <th>الاستخدام</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${allPuppets.map(puppet => `
                    <tr>
                        <td><span style="font-size: 2rem;">${puppet.emoji || '🎭'}</span></td>
                        <td><strong>${puppet.name}</strong></td>
                        <td>${getTypeLabel(puppet.type)}</td>
                        <td>${puppet.usageCount || 0} مرة</td>
                        <td>${puppet.available ? '<span class="badge badge-success">متاحة</span>' : '<span class="badge badge-warning">محجوزة</span>'}</td>
                        <td>
                            <button class="btn-icon" onclick="editPuppet('${puppet.id}')" title="تعديل">✏️</button>
                            <button class="btn-icon" onclick="deletePuppet('${puppet.id}', '${puppet.name}')" title="حذف">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Get type label
function getTypeLabel(type) {
    const labels = {
        animal: 'حيوان',
        family: 'عائلة',
        character: 'شخصية'
    };
    return labels[type] || type;
}

// Show puppet form modal
function showPuppetForm(puppetId = null) {
    editingPuppetId = puppetId;
    const modal = document.getElementById('puppetFormModal');
    const form = document.getElementById('puppetForm');

    if (puppetId) {
        // Edit mode
        const puppet = allPuppets.find(p => p.id === puppetId);
        document.getElementById('formTitle').textContent = 'تعديل الدمية';
        document.getElementById('puppetName').value = puppet.name;
        document.getElementById('puppetType').value = puppet.type;
        document.getElementById('puppetEmoji').value = puppet.emoji || '';
        document.getElementById('puppetDescription').value = puppet.description;
        document.getElementById('puppetTags').value = (puppet.tags || []).join('، ');
        document.getElementById('puppetAvailable').checked = puppet.available;
    } else {
        // Add mode
        document.getElementById('formTitle').textContent = 'إضافة دمية جديدة';
        form.reset();
    }

    modal.style.display = 'flex';
}

// Hide puppet form
function hidePuppetForm() {
    document.getElementById('puppetFormModal').style.display = 'none';
    editingPuppetId = null;
}

// Save puppet
async function savePuppet(e) {
    e.preventDefault();

    const puppetData = {
        name: document.getElementById('puppetName').value.trim(),
        type: document.getElementById('puppetType').value,
        emoji: document.getElementById('puppetEmoji').value.trim(),
        description: document.getElementById('puppetDescription').value.trim(),
        tags: document.getElementById('puppetTags').value.split('،').map(t => t.trim()).filter(t => t),
        available: document.getElementById('puppetAvailable').checked
    };

    try {
        document.getElementById('loadingOverlay').style.display = 'flex';

        if (editingPuppetId) {
            // Update
            await db.collection('puppets').doc(editingPuppetId).update({
                ...puppetData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('تم تحديث الدمية بنجاح ✅', 'success');
        } else {
            // Create
            await db.collection('puppets').add({
                ...puppetData,
                dateAdded: firebase.firestore.FieldValue.serverTimestamp(),
                usageCount: 0,
                imageUrl: null
            });
            showToast('تم إضافة الدمية بنجاح ✅', 'success');
        }

        hidePuppetForm();
        await loadPuppets();

    } catch (error) {
        console.error('Error saving puppet:', error);
        showToast('حدث خطأ أثناء الحفظ ❌', 'error');
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Edit puppet
window.editPuppet = function (puppetId) {
    showPuppetForm(puppetId);
};

// Delete puppet
window.deletePuppet = async function (puppetId, puppetName) {
    if (!confirm(`هل أنت متأكد من حذف الدمية "${puppetName}"؟`)) {
        return;
    }

    try {
        document.getElementById('loadingOverlay').style.display = 'flex';
        await db.collection('puppets').doc(puppetId).delete();
        showToast('تم حذف الدمية بنجاح ✅', 'success');
        await loadPuppets();
    } catch (error) {
        console.error('Error deleting puppet:', error);
        showToast('حدث خطأ أثناء الحذف ❌', 'error');
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
};

// Setup event listeners
function setupEventListeners() {
    // Add puppet button
    document.getElementById('addPuppetBtn').addEventListener('click', () => showPuppetForm());

    // Form submit
    document.getElementById('puppetForm').addEventListener('submit', savePuppet);

    // Cancel button
    document.getElementById('cancelFormBtn').addEventListener('click', hidePuppetForm);

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', hidePuppetForm);
    document.querySelector('.modal-overlay').addEventListener('click', hidePuppetForm);

    // Search
    document.getElementById('searchInput').addEventListener('input', debounce((e) => {
        const query = e.target.value.trim().toLowerCase();
        searchPuppets(query);
    }, 300));

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Search puppets
function searchPuppets(query) {
    const filtered = allPuppets.filter(puppet =>
        puppet.name.toLowerCase().includes(query) ||
        puppet.description.toLowerCase().includes(query) ||
        (puppet.tags && puppet.tags.some(tag => tag.toLowerCase().includes(query)))
    );

    // Update table with filtered results
    const container = document.getElementById('puppetsTable');
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>لم يتم العثور على نتائج</p>
            </div>
        `;
        return;
    }

    // Temporarily replace allPuppets for display
    const temp = allPuppets;
    allPuppets = filtered;
    displayPuppetsTable();
    allPuppets = temp;
}

// Expose showPuppetForm globally for onclick
window.showPuppetForm = showPuppetForm;

// Initialize
initAdmin();
