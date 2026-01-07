// Story Editor JavaScript (Free Write Mode)

let currentUser = null;
let selectedPuppets = [];
let allPuppetsData = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const authData = await checkAuth('student');
        currentUser = authData.user;

        await loadPuppets();

        // Add first empty line
        addDialogueLine();

        setupEventListeners();

    } catch (error) {
        console.error('Init error:', error);
    }
});

function setupEventListeners() {
    // Add Line Button
    document.getElementById('addLineBtn').addEventListener('click', () => {
        addDialogueLine();
    });

    // Form Submit
    document.getElementById('storyForm').addEventListener('submit', handleSaveStory);
}

// Load Puppets
async function loadPuppets() {
    const container = document.getElementById('charactersList');
    try {
        const snapshot = await db.collection('puppets')
            .where('available', '==', true)
            .get();

        allPuppetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (allPuppetsData.length === 0) {
            container.innerHTML = '<p>لا توجد دمى متاحة حالياً.</p>';
            return;
        }

        container.innerHTML = allPuppetsData.map(puppet => `
            <div>
                <input type="checkbox" id="p-${puppet.id}" value="${puppet.id}" class="character-checkbox" onchange="updateSelectedPuppets()">
                <label for="p-${puppet.id}" class="character-label">
                    <span class="char-emoji">${puppet.emoji || '🎭'}</span>
                    <span class="char-name">${puppet.name}</span>
                </label>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading puppets:', error);
        container.innerHTML = '<p class="error-text">حدث خطأ في تحميل الشخصيات</p>';
    }
}

// Update selected puppets list and update all dropdowns
function updateSelectedPuppets() {
    const checkboxes = document.querySelectorAll('.character-checkbox:checked');
    selectedPuppets = Array.from(checkboxes).map(cb => {
        const puppet = allPuppetsData.find(p => p.id === cb.value);
        return puppet;
    });

    // Update all existing speaker dropdowns
    const selects = document.querySelectorAll('.speaker-select');
    selects.forEach(select => {
        const currentValue = select.value;
        updateSpeakerSelectOptions(select);
        select.value = currentValue; // Try to keep selection
    });
}

// Helper to populate a select element with selected puppets
function updateSpeakerSelectOptions(selectElement) {
    // Keep 'Narrator' always
    let options = '<option value="الراوي">🎙️ الراوي</option>';

    selectedPuppets.forEach(p => {
        options += `<option value="${p.name}">${p.emoji} ${p.name}</option>`;
    });

    selectElement.innerHTML = options;
}

// Add a new dialogue line
function addDialogueLine() {
    const container = document.getElementById('dialogueContainer');
    const lineId = Date.now(); // Unique ID for the line

    const div = document.createElement('div');
    div.className = 'dialogue-line';
    div.id = `line-${lineId}`;

    div.innerHTML = `
        <div class="line-speaker">
            <select class="speaker-select input-field" name="speaker" required>
                <!-- Options populated by JS -->
            </select>
        </div>
        <div class="line-text">
            <textarea placeholder="ماذا تقول الشخصية؟" required></textarea>
        </div>
        <div class="line-actions">
            <button type="button" class="btn-remove-line" onclick="removeLine('${lineId}')" title="حذف السطر">&times;</button>
        </div>
    `;

    container.appendChild(div);

    // Populate dropdown
    const select = div.querySelector('.speaker-select');
    updateSpeakerSelectOptions(select);

    // Smooth scroll to new line
    div.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

window.removeLine = function (id) {
    const line = document.getElementById(`line-${id}`);
    if (line) {
        line.remove();
    }

    // Ensure at least one line remains? No, user can delete all if they want to start over
    // But maybe good UX to have one
    if (document.getElementById('dialogueContainer').children.length === 0) {
        addDialogueLine();
    }
};

// Save Story
async function handleSaveStory(e) {
    e.preventDefault();

    if (selectedPuppets.length === 0) {
        alert('الرجاء اختيار شخصية واحدة على الأقل!');
        return;
    }

    const title = document.getElementById('storyTitle').value.trim();
    if (!title) return;

    // Collect dialogue
    const script = [];
    const lines = document.querySelectorAll('.dialogue-line');

    lines.forEach(line => {
        const speaker = line.querySelector('.speaker-select').value;
        const text = line.querySelector('textarea').value.trim();

        if (text) {
            script.push({
                speaker: speaker,
                text: text,
                emotion: 'neutral' // Default
            });
        }
    });

    if (script.length === 0) {
        alert('القصة فارغة! أضف بعض الحوارات.');
        return;
    }

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'جاري الحفظ...';

    try {
        const newDoc = {
            title: title,
            studentId: currentUser.uid,
            studentName: currentUser.displayName || 'طالب', // fallback
            script: script,
            puppets: selectedPuppets.map(p => p.id),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'manual', // Distinguish from generated
            status: 'completed'
        };

        await db.collection('dialogues').add(newDoc);

        // Add points? Optional

        alert('تم حفظ قصتك بنجاح! 🎉');
        window.location.href = 'dashboard.html'; // Or to view the story

    } catch (error) {
        console.error('Save error:', error);
        alert('حدث خطأ أثناء الحفظ.');
        saveBtn.disabled = false;
        saveBtn.textContent = 'حفظ القصة 💾';
    }
}
