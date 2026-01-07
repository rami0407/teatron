// Admin Users Management
// Display and manage all system users

// NOTE: db and auth are initialized in firebase-config.js
// We assume firebase-config.js is loaded before this script

let allUsers = [];
let filteredUsers = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // We access the global firebase auth object directly to be safe
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '../auth/login.html';
            return;
        }

        try {
            // Use global db object from firebase-config.js
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'admin') {
                alert('ليس لديك صلاحيات الوصول لهذه الصفحة');
                window.location.href = '../index.html';
                return;
            }

            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = userDoc.data().name || 'المدير';
            }

            await loadUsers();
        } catch (error) {
            console.error('Error checking permissions:', error);
        }
    });

    // Event Listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }

    // Filter
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', filterUsers);
    }

    // Export
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }

    // Modal Close Buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
}

// ============================================
// Load All Users
// ============================================

async function loadUsers() {
    try {
        const usersSnapshot = await firebase.firestore().collection('users').get();

        allUsers = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort by name
        allUsers.sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        filteredUsers = [...allUsers];

        updateStats();
        displayUsers(filteredUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr><td colspan="6" class="error-state">حدث خطأ في تحميل المستخدمين: ${error.message}</td></tr>
            `;
        }
    }
}

// ============================================
// Update Statistics
// ============================================

function updateStats() {
    const students = allUsers.filter(u => u.role === 'student').length;
    const teachers = allUsers.filter(u => u.role === 'teacher').length;
    const admins = allUsers.filter(u => u.role === 'admin').length;

    const setContent = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setContent('totalUsers', allUsers.length);
    setContent('studentCount', students);
    setContent('teacherCount', teachers);
    setContent('adminCount', admins);
}

// ============================================
// Display Users
// ============================================

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">لا توجد نتائج</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr id="row-${user.id}">
            <td>
                <div class="user-cell">
                    <div class="user-avatar">${getUserInitial(user.name)}</div>
                    <div class="user-info">
                        <div class="user-name">${user.name || 'بدون اسم'}</div>
                        <div class="user-id">${user.id.substring(0, 8)}...</div>
                    </div>
                </div>
            </td>
            <td>${user.email || '-'}</td>
            <td><span class="role-badge role-${user.role || 'student'}">${getRoleText(user.role)}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td><span class="status-badge status-active">نشط</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="viewUserDetails('${user.id}')" title="عرض التفاصيل">👁️</button>
                    <button class="btn-icon" onclick="openEditUserModal('${user.id}')" title="تعديل المستخدم">✏️</button>
                    <button class="btn-icon btn-delete" onclick="deleteUser('${user.id}')" title="حذف المستخدم">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// Filter Users
// ============================================

function filterUsers() {
    const searchInput = document.getElementById('searchInput');
    const roleFilter = document.getElementById('roleFilter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const roleValue = roleFilter ? roleFilter.value : '';

    filteredUsers = allUsers.filter(user => {
        const matchesSearch = !searchTerm ||
            (user.name && user.name.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm));

        const matchesRole = !roleValue || user.role === roleValue;

        return matchesSearch && matchesRole;
    });

    displayUsers(filteredUsers);
}

// ============================================
// Actions: View, Edit, Delete
// ============================================

window.viewUserDetails = async function (userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('userDetailsModal');
    const content = document.getElementById('userDetailsContent');

    if (!modal || !content) return;

    // Get user's dialogues count (optional, don't block UI)
    let dialoguesCount = 0;
    try {
        const dialoguesSnapshot = await firebase.firestore().collection('dialogues')
            .where('studentId', '==', userId)
            .get();
        dialoguesCount = dialoguesSnapshot.size;
    } catch (e) {
        // Silently fail or log debug
        console.debug('Could not count dialogues', e);
    }

    content.innerHTML = `
        <div class="user-details-grid">
            <div class="detail-section">
                <h3>المعلومات الأساسية</h3>
                <div class="detail-row"><span class="detail-label">الاسم:</span><span class="detail-value">${user.name || '-'}</span></div>
                <div class="detail-row"><span class="detail-label">البريد:</span><span class="detail-value">${user.email || '-'}</span></div>
                <div class="detail-row"><span class="detail-label">الدور:</span><span class="detail-value">${getRoleText(user.role)}</span></div>
                <div class="detail-row"><span class="detail-label">التسجيل:</span><span class="detail-value">${formatDate(user.createdAt)}</span></div>
            </div>
            <div class="detail-section">
                <h3>الإحصائيات</h3>
                <div class="detail-row"><span class="detail-label">الحوارات:</span><span class="detail-value">${dialoguesCount}</span></div>
            </div>
            ${user.grade ? `
            <div class="detail-section">
                <h3>معلومات إضافية</h3>
                <div class="detail-row"><span class="detail-label">الصف:</span><span class="detail-value">${user.grade || '-'}</span></div>
                <div class="detail-row"><span class="detail-label">الشعبة:</span><span class="detail-value">${user.section || '-'}</span></div>
            </div>` : ''}
        </div>
    `;

    modal.style.display = 'flex';
};

window.openEditUserModal = function (userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    // Use specific edit modal or create one dynamically if you prefer.
    // Here we'll create a dynamic one to ensure it exists.
    let modal = document.getElementById('editUserModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'editUserModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="document.getElementById('editUserModal').remove()">&times;</button>
            <h2>تعديل البيانات</h2>
            <form id="editUserForm">
                <div class="form-group">
                    <label>الاسم</label>
                    <input type="text" id="editName" value="${user.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>الدور</label>
                    <select id="editRole">
                        <option value="student" ${user.role === 'student' ? 'selected' : ''}>طالب</option>
                        <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>معلم</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>مدير</option>
                    </select>
                </div>
                <!-- Optional grade/section if student -->
                <div class="form-group">
                   <label>الصف (للطلاب)</label>
                   <input type="text" id="editGrade" value="${user.grade || ''}">
                </div>
                <div class="form-actions" style="margin-top:20px">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('editUserModal').remove()">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('editName').value;
        const newRole = document.getElementById('editRole').value;
        const newGrade = document.getElementById('editGrade').value;

        try {
            await firebase.firestore().collection('users').doc(userId).update({
                name: newName,
                role: newRole,
                grade: newGrade
            });
            alert('تم الحفظ');
            modal.remove();
            loadUsers();
        } catch (err) {
            alert('خطأ: ' + err.message);
        }
    });
};

window.deleteUser = async function (userId) {
    if (!confirm('حذف المستخدم نهائياً؟')) return;
    try {
        await firebase.firestore().collection('users').doc(userId).delete();
        alert('تم الحذف');
        document.getElementById(`row-${userId}`).remove();
        allUsers = allUsers.filter(u => u.id !== userId);
        updateStats();
    } catch (err) {
        alert('حدث خطأ: ' + err.message);
    }
};

// ============================================
// Utilities
// ============================================

function getUserInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '👤';
}

function getRoleText(role) {
    const roles = { 'student': 'طالب', 'teacher': 'معلم', 'admin': 'مدير' };
    return roles[role] || role;
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    // Firestore Timestamp to Date
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('ar-SA');
}

function handleLogout() {
    firebase.auth().signOut().then(() => {
        window.location.href = '../auth/login.html'; // Go to login page
    }).catch(error => {
        console.error('Logout failed:', error);
        alert('فشل تسجيل الخروج');
    });
}

// Export excel
function exportToExcel() {
    let csv = '\ufeffالاسم,البريد,الدور\n';
    filteredUsers.forEach(u => {
        csv += `${u.name},${u.email},${u.role}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
}
