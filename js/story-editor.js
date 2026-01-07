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
        saveBtn.textContent = 'جاري التحقق...';

        // Check Story Limit (Max 10 per student)
        const snapshot = await db.collection('dialogues')
            .where('studentId', '==', currentUser.uid)
            .get();

        if (snapshot.size >= 10) {
            alert('⚠️ عذراً، لقد وصلت للحد الأقصى المسموح (10 قصص).\nيرجى حذف قصة قديمة لتتمكن من حفظ قصة جديدة.');
            saveBtn.disabled = false;
            saveBtn.textContent = 'حفظ القصة 💾';
            return;
        }

        saveBtn.textContent = 'جاري الحفظ...';

        const newDoc = {
            title: title,
            studentId: currentUser.uid,
            studentName: currentUser.displayName || 'طالب',
            content: content,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'free-text',
            status: 'completed'
        };

        await db.collection('dialogues').add(newDoc);

        alert('تم حفظ قصتك بنجاح! 🌟\nيمكنك الآن رؤيتها في صفحتك الرئيسية.');
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
// AI Script Converter (Scenario Mode)
// ==========================================

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
    list.innerHTML = '<div class="suggestion-item"><div class="suggestion-text">جاري تحويل قصتك لسيناريو مسرحي... 🎭⏳</div></div>';

    // Simulate thinking time
    setTimeout(() => {
        let newText = convertToScript(originalText);
        proposedGlobalChange = newText;

        list.innerHTML = `
            <div class="suggestion-item" style="display:block;">
                <div style="margin-bottom:15px; color:#2c3e50; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <strong style="font-size:1.1rem;">🤖 تقرير المساعد الذكي:</strong>
                    <p style="color:#666; font-size:0.95rem; margin-top:5px;">
                        قمت بإعادة صياغة النص ليكون مناسباً للعرض المسرحي!
                    </p>
                    <ul style="font-size:0.9rem; color:#555; margin-top:5px; padding-right:20px; list-style-type: disc;">
                        <li>📝 <strong>تحويل للسرد:</strong> تم تقسيم النص إلى حوارات واضحة.</li>
                        <li>🎭 <strong>إضافة المشاعر:</strong> أضفت ملاحظات مثل (يضحك)، (بحزن) لمساعدة الممثلين.</li>
                        <li>🗣️ <strong>تحديد الأدوار:</strong> تم فصل كلام الراوي عن الشخصيات.</li>
                    </ul>
                </div>
                
                <strong style="display:block; margin-bottom:5px;">المعاينة:</strong>
                <div class="suggestion-text" style="white-space: pre-wrap; background:#fcfcfc; border:1px solid #e0e0e0; padding:15px; border-radius:8px; max-height:250px; overflow-y:auto; font-family:'Cairo'; line-height:1.8;">${newText}</div>
            </div>
        `;
    }, 2000);
}

function convertToScript(text) {
    // Advanced heuristic to convert narrative to script
    const lines = text.split(/\n+/);
    let script = [];

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        let speaker = "الراوي";
        let dialogue = line;
        let emotion = "";

        // 1. Detect Emotions based on keywords
        if (dialogue.match(/(ضحك|سعيد|فرح|مبتسم)/)) emotion = " (يضحك بسعادة) 😄";
        else if (dialogue.match(/(حزين|بكى|دموع|متألم)/)) emotion = " (بصوت حزين) 😢";
        else if (dialogue.match(/(غاضب|صاح|صرخ|انزعج)/)) emotion = " (بغضب) 😠";
        else if (dialogue.match(/(همس|بصوت خافت)/)) emotion = " (يهمس) 🤫";
        else if (dialogue.match(/(تفاجأ|دهشة|يا إلهي)/)) emotion = " (بدهشة) 😲";
        else if (dialogue.match(/(سأل|تساءل|استغرب)/)) emotion = " (باستغراب) 🤔";

        // 2. Try to extract Speaker Name
        // Pattern: Name: Dialogue
        if (line.includes(':')) {
            const parts = line.split(':');
            const potentialName = parts[0].trim();
            // Assume it's a name if it's reasonably short (less than 5 words)
            if (potentialName.split(' ').length < 5) {
                speaker = potentialName;
                dialogue = parts.slice(1).join(':').trim();
            }
        }
        // Pattern: Said Name ... or Name said ...
        // "قال أحمد:"
        else if (line.match(/^قال\s+(\w+)\s*[:،]?/)) {
            const match = line.match(/^قال\s+(\w+)\s*[:،]?/);
            speaker = match[1];
            dialogue = line.replace(/^قال\s+\w+\s*[:،]?\s*/, '').replace(/["«»]/g, '');
        }
        // "ردت ليلى:"
        else if (line.match(/^(ردت|أجابت|صاحت)\s+(\w+)\s*[:،]?/)) {
            const match = line.match(/^(ردت|أجابت|صاحت)\s+(\w+)\s*[:،]?/);
            speaker = match[2];
            dialogue = line.replace(/^(ردت|أجابت|صاحت)\s+\w+\s*[:،]?\s*/, '').replace(/["«»]/g, '');
        }

        // Clean up quotes
        dialogue = dialogue.replace(/^["«]/, '').replace(/["»]$/, '');

        // Construct Script Line
        script.push(`**${speaker}:** ${dialogue}${emotion}`);
    });

    return script.join('\n\n');
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
    alert('تم تحويل النص إلى سيناريو! 📜\nيمكنك الآن التعديل عليه يدوياً إذا رغبت.');
}

// Expose globals
window.toggleAssistant = toggleAssistant;
window.insertText = insertText;
window.generateStoryIdea = generateStoryIdea;
window.analyzeStoryAI = analyzeStoryAI;
window.closeAIModal = closeAIModal;
window.applyAISuggestions = applyAISuggestions;
