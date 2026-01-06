// Admin Users Management
// Display and manage all system users

let db, auth;
let allUsers = [];
let filteredUsers = [];

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

            document.getElementById('userName').textContent = userDoc.data().name || 'المدير';
            await loadUsers();
        } catch (error) {
            console.error('Error checking permissions:', error);
        }
    });

    // Event Listeners
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('searchInput').addEventListener('input', filterUsers);
    document.getElementById('roleFilter').addEventListener('change', filterUsers);
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', () => {
        document.getElementById('userDetailsModal').style.display = 'none';
    });
});

// ============================================
// Load All Users
// ============================================

async function loadUsers() {
    try {
        const usersSnapshot = await db.collection('users').get();

        allUsers = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort by name in JavaScript
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
        document.getElementById('usersTableBody').innerHTML = `
            <tr><td colspan="6" class="error-state">حدث خطأ في تحميل المستخدمين</td></tr>
        `;
    }
}

// ============================================
// Update Statistics
// ============================================

function updateStats() {
    const students = allUsers.filter(u => u.role === 'student').length;
    const teachers = allUsers.filter(u => u.role === 'teacher').length;
    const admins = allUsers.filter(u => u.role === 'admin').length;

    document.getElementById('totalUsers').textContent = allUsers.length;
    document.getElementById('studentCount').textContent = students;
    document.getElementById('teacherCount').textContent = teachers;
    document.getElementById('adminCount').textContent = admins;
}

// ============================================
// Display Users
// ============================================

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">لا توجد نتائج</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
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
                <button class="btn-icon" onclick="viewUserDetails('${user.id}')" title="عرض التفاصيل">
                    👁️
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// Filter Users
// ============================================

function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;

    filteredUsers = allUsers.filter(user => {
        const matchesSearch = !searchTerm ||
            (user.name && user.name.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm));

        const matchesRole = !roleFilter || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    displayUsers(filteredUsers);
}

// ============================================
// View User Details
// ============================================

window.viewUserDetails = async function (userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('userDetailsModal');
    const content = document.getElementById('userDetailsContent');

    // Get user's dialogues count
    let dialoguesCount = 0;
    try {
        const dialoguesSnapshot = await db.collection('dialogues')
            .where('studentId', '==', userId)
            .get();
        dialoguesCount = dialoguesSnapshot.size;
    } catch (error) {
        console.error('Error counting dialogues:', error);
    }

    content.innerHTML = `
        <div class="user-details-grid">
            <div class="detail-section">
                <h3>المعلومات الأساسية</h3>
                <div class="detail-row">
                    <span class="detail-label">الاسم:</span>
                    <span class="detail-value">${user.name || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">البريد الإلكتروني:</span>
                    <span class="detail-value">${user.email || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">الدور:</span>
                    <span class="detail-value"><span class="role-badge role-${user.role}">${getRoleText(user.role)}</span></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">تاريخ التسجيل:</span>
                    <span class="detail-value">${formatDate(user.createdAt)}</span>
                </div>
            </div>

            <div class="detail-section">
                <h3>الإحصائيات</h3>
                <div class="detail-row">
                    <span class="detail-label">الحوارات المنشأة:</span>
                    <span class="detail-value">${dialoguesCount}</span>
                </div>
            </div>

            ${user.grade ? `
            <div class="detail-section">
                <h3>معلومات إضافية</h3>
                <div class="detail-row">
                    <span class="detail-label">الصف:</span>
                    <span class="detail-value">${user.grade || '-'}</span>
                </div>
            </div>
            ` : ''}
        </div>
    `;

    modal.style.display = 'flex';
};

// ============================================
// Export to Excel
// ============================================

function exportToExcel() {
    // Simple CSV export
    let csv = 'الاسم,البريد الإلكتروني,الدور,تاريخ التسجيل\n';

    filteredUsers.forEach(user => {
        csv += `${user.name || ''},${user.email || ''},${getRoleText(user.role)},${formatDate(user.createdAt)}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// ============================================
// Helper Functions
// ============================================

function getUserInitial(name) {
    if (!name) return '👤';
    return name.charAt(0).toUpperCase();
}

function getRoleText(role) {
    const roles = {
        'student': 'طالب',
        'teacher': 'معلم',
        'admin': 'مدير'
    };
    return roles[role] || 'مستخدم';
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function handleLogout() {
    auth.signOut().then(() => {
        window.location.href = '../auth/login.html';
    }).catch((error) => {
        console.error('Error logging out:', error);
    });
}
