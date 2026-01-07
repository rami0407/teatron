// Story Editor Logic (Simplified Free Text Version)

let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const authData = await checkAuth('student');
        currentUser = authData.user;

        setupEventListeners();

        // Auto-focus on title
        document.getElementById('storyTitle').focus();

    } catch (error) {
        console.error('Init error:', error);
    }
});

function setupEventListeners() {
    // Form Submit
    document.getElementById('storyForm').addEventListener('submit', handleSaveStory);

    // Word Count
    const textarea = document.getElementById('storyContent');
    const wordCountDisplay = document.getElementById('wordCount');

    if (textarea && wordCountDisplay) {
        textarea.addEventListener('input', () => {
            const text = textarea.value.trim();
            const count = text ? text.split(/\s+/).length : 0;
            wordCountDisplay.textContent = count;
        });
    }
}

// ==========================================
// Save Story Logic
// ==========================================

async function handleSaveStory(e) {
    e.preventDefault();

    const title = document.getElementById('storyTitle').value.trim();
    const content = document.getElementById('storyContent').value;
    const saveBtn = document.getElementById('saveBtn');

    if (!title || !content.trim()) {
        alert('الرجاء كتابة عنوان وقصة!');
        return;
    }

    try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'جاري الحفظ...';

        const newDoc = {
            title: title,
            studentId: currentUser.uid,
            studentName: currentUser.displayName || 'طالب', // Ensure name is saved
            content: content, // Single text block
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'free-text', // New type to distinguish
            status: 'completed'
        };

        await db.collection('dialogues').add(newDoc);

        alert('تم حفظ قصتك بنجاح! 🌟');
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Save error:', error);
        alert('حدث خطأ أثناء الحفظ: ' + error.message);
        saveBtn.disabled = false;
        saveBtn.textContent = 'حفظ القصة 💾';
    }
}

// ==========================================
// Creative Assistant Features
// ==========================================

const STORY_IDEAS = [
    "قصة عن دمية اكتشفت أنها تستطيع الكلام مع الحيوانات.",
    "مغامرة في مدرسة تحولت فجأة إلى قلعة من الحلوى.",
    "حوار بين الشمس والقمر حول من هو الأهم.",
    "رحلة البحث عن الكنز المفقود في حديقة المنزل.",
    "قصة عن روبوت يحاول تعلم كيفية الضحك."
];

function toggleAssistant() {
    const sidebar = document.getElementById('creativeSidebar');
    sidebar.classList.toggle('open');
}

function insertText(text) {
    const textarea = document.getElementById('storyContent');

    // Insert at cursor position
    if (textarea.selectionStart || textarea.selectionStart == '0') {
        var startPos = textarea.selectionStart;
        var endPos = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, startPos)
            + text
            + textarea.value.substring(endPos, textarea.value.length);

        // Move cursor after inserted text
        textarea.selectionStart = startPos + text.length;
        textarea.selectionEnd = startPos + text.length;
        textarea.focus();
    } else {
        textarea.value += text;
        textarea.focus();
    }

    // Trigger input event to update word count
    textarea.dispatchEvent(new Event('input'));

    // Auto close sidebar on mobile
    if (window.innerWidth < 768) {
        toggleAssistant();
    }
}

function generateStoryIdea() {
    const ideaBox = document.getElementById('ideaDisplay');
    const randomIdea = STORY_IDEAS[Math.floor(Math.random() * STORY_IDEAS.length)];

    ideaBox.textContent = randomIdea;
    ideaBox.style.display = 'block';

    // Auto fill title if empty
    const titleInput = document.getElementById('storyTitle');
    if (!titleInput.value) {
        titleInput.value = "قصة: " + randomIdea.substring(0, 20) + "...";
    }
}

// ==========================================
// AI Enhancer Logic (Simulation)
// ==========================================

const EMOJI_MAP = {
    'مرحبا': '👋', 'اهلا': '👋', 'سلام': '✌️',
    'شكرا': '🙏', 'عفوا': '🌸',
    'حب': '❤️', 'صداقة': '🤝', 'سعيد': '😊', 'فرح': '🎉',
    'حزين': '😢', 'غاضب': '😡', 'خائف': '😨',
    'فكرة': '💡', 'سؤال': '❓', 'لماذا': '🤔',
    'نعم': '✅', 'لا': '❌', 'واو': '🤩',
    'شمس': '☀️', 'قمر': '🌙', 'نجمة': '⭐',
    'لعب': '🧸', 'ركض': '🏃', 'اكل': '🍎',
    'صوت': '🔊', 'سر': '🤫'
};

const WORD_IMPROVEMENTS = {
    'قال': ['أضاف', 'أجاب', 'عقب', 'تساءل', 'هتف'],
    'ذهب': ['انطلق', 'توجه', 'سار', 'هرع'],
    'رأى': ['شاهد', 'لمح', 'لاحظ', 'تأمل'],
    'جميل': ['رائع', 'بديع', 'ساحر', 'مذهل'],
    'كبير': ['عملاق', 'ضخم', 'هائل', 'شاسع']
};

let proposedGlobalChange = "";

function analyzeStoryAI() {
    const textarea = document.getElementById('storyContent');
    const modal = document.getElementById('aiModal');
    const list = document.getElementById('aiSuggestionsList');

    let originalText = textarea.value;

    if (!originalText.trim()) {
        alert('اكتب شيئاً أولاً ليقوم الذكاء الاصطناعي بتحليله!');
        return;
    }

    modal.classList.add('active');
    list.innerHTML = '<div class="suggestion-item"><div class="suggestion-text">جاري تحليل قصتك... ⏳</div></div>';

    // Simulate thinking time
    setTimeout(() => {
        let newText = originalText;
        let changesLog = [];

        // 1. Emoji Suggestions
        Object.keys(EMOJI_MAP).forEach(keyword => {
            if (newText.includes(keyword) && !newText.includes(EMOJI_MAP[keyword])) {
                const regex = new RegExp(`(${keyword})`, 'gi');
                // Replace globally but be careful not to double add if run multiple times (simple check)
                newText = newText.replace(regex, `$1 ${EMOJI_MAP[keyword]}`);
                if (!changesLog.includes('إضافة تعبيرات')) changesLog.push('إضافة تعبيرات');
            }
        });

        // 2. Word Improvements
        Object.keys(WORD_IMPROVEMENTS).forEach(word => {
            // Check if word exists as a whole word
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(newText)) {
                if (Math.random() > 0.4) { // 60% chance to suggest
                    const alternatives = WORD_IMPROVEMENTS[word];
                    const betterWord = alternatives[Math.floor(Math.random() * alternatives.length)];
                    newText = newText.replace(regex, betterWord);
                    changesLog.push(`تحسين مفردات: "${word}" ⬅️ "${betterWord}"`);
                }
            }
        });

        // 3. Punctuation Fixes (Basic)
        // Ensure paragraphs end with punctuation
        newText = newText.replace(/([^\.\!\?\،\n])\n/g, '$1.\n');
        if (!/[.!?،]$/.test(newText.trim())) {
            newText = newText.trim() + '.';
            changesLog.push('إضافة علامات ترقيم');
        }

        proposedGlobalChange = newText;

        if (originalText === newText) {
            list.innerHTML = `
                <div style="text-align:center; padding: 20px;">
                    <div style="font-size: 3rem;">✨</div>
                    <h3>قصتك ممتازة!</h3>
                    <p>لم أجد أي اقتراحات إضافية. لغتك سليمة!</p>
                </div>
            `;
        } else {
            list.innerHTML = `
                <div class="suggestion-item" style="display:block;">
                    <strong style="display:block; margin-bottom:10px;">النص المقترح:</strong>
                    <div class="suggestion-text" style="white-space: pre-wrap; font-family:inherit;">${diffText(originalText, newText)}</div>
                    <div style="margin-top:10px; font-size: 0.85rem; color: #666; border-top:1px solid #eee; padding-top:5px;">
                        <strong>التحسينات:</strong> ${changesLog.join('، ') || 'تحسينات عامة'}
                    </div>
                </div>
             `;
        }

    }, 1500);
}

// Simple diff highlighter
function diffText(oldText, newText) {
    // For simplicity, just show the new text, maybe highlighting isn't strictly necessary for whole block or it's too complex to implement perfectly in JS snippet.
    // Let's just return newText but wrapped in a way that suggests change.
    // Actually, showing the WHOLE new text is safer than trying to diff char-by-char visually here.
    return newText;
}

function closeAIModal() {
    document.getElementById('aiModal').classList.remove('active');
}

function applyAISuggestions() {
    const textarea = document.getElementById('storyContent');
    if (proposedGlobalChange) {
        textarea.value = proposedGlobalChange;
        // update word count
        textarea.dispatchEvent(new Event('input'));
    }
    closeAIModal();
    alert('تم تطبيق التعديلات! 🚀');
}

// Expose globals
window.toggleAssistant = toggleAssistant;
window.insertText = insertText;
window.generateStoryIdea = generateStoryIdea;
window.analyzeStoryAI = analyzeStoryAI;
window.closeAIModal = closeAIModal;
window.applyAISuggestions = applyAISuggestions;
