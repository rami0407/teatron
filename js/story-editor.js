// Story Editor Logic (Advanced AI Version)

let currentUser = null;
let currentStoryId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const authData = await checkAuth('student');
        currentUser = authData.user;

        setupEventListeners();

        // Check for 'id' parameter for Edit Mode
        const urlParams = new URLSearchParams(window.location.search);
        currentStoryId = urlParams.get('id');

        if (currentStoryId) {
            await loadStoryForEdit(currentStoryId);
        } else {
            // Auto-focus on title only if new story
            document.getElementById('storyTitle').focus();
        }

    } catch (error) {
        console.error('Init error:', error);
    }
});

async function loadStoryForEdit(id) {
    const titleInput = document.getElementById('storyTitle');
    const contentInput = document.getElementById('storyContent');
    const saveBtn = document.getElementById('saveBtn');

    try {
        titleInput.value = 'جاري التحميل...';
        contentInput.disabled = true;

        const doc = await db.collection('dialogues').doc(id).get();
        if (!doc.exists) {
            alert('عذراً، هذه القصة غير موجودة!');
            window.location.href = 'dashboard.html';
            return;
        }

        const data = doc.data();
        if (data.studentId !== currentUser.uid) {
            alert('ليس لديك صلاحية لتعديل هذه القصة!');
            window.location.href = 'dashboard.html';
            return;
        }

        titleInput.value = data.title;
        contentInput.value = data.content || '';
        contentInput.disabled = false;
        saveBtn.textContent = 'تحديث القصة 🔄';

        // Trigger word count update
        contentInput.dispatchEvent(new Event('input'));

    } catch (e) {
        console.error(e);
        alert('حدث خطأ أثناء تحميل القصة.');
    }
}

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

        // Check Limit ONLY if Creating New (not Updating)
        if (!currentStoryId) {
            const snapshot = await db.collection('dialogues')
                .where('studentId', '==', currentUser.uid)
                .get();

            if (snapshot.size >= 10) {
                alert('⚠️ عذراً، لقد وصلت للحد الأقصى المسموح (10 قصص).\nيرجى حذف قصة قديمة لتتمكن من حفظ قصة جديدة.');
                saveBtn.disabled = false;
                return;
            }
        }

        saveBtn.textContent = currentStoryId ? 'جاري التحديث...' : 'جاري الحفظ...';

        const storyData = {
            title: title,
            content: content,
            type: 'free-text',
            status: 'completed',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (currentStoryId) {
            // Update Existing
            await db.collection('dialogues').doc(currentStoryId).update(storyData);
            alert('تم تحديث القصة بنجاح! ✅');
        } else {
            // Create New
            storyData.studentId = currentUser.uid;
            storyData.studentName = currentUser.displayName || 'طالب';
            storyData.createdAt = firebase.firestore.FieldValue.serverTimestamp();

            await db.collection('dialogues').add(storyData);
            alert('تم حفظ قصتك بنجاح! 🌟');
        }

        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Save error:', error);
        alert('حدث خطأ أثناء الحفظ: ' + error.message);
        saveBtn.disabled = false;
        saveBtn.textContent = currentStoryId ? 'تحديث القصة 🔄' : 'حفظ القصة 💾';
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
// AI Script Converter & Enhancer (Advanced)
// ==========================================

let proposedGlobalChange = "";
let originalContentStore = "";

// ==========================================
// AI Script Converter & Enhancer (Advanced Multi-Language)
// ==========================================

function analyzeStoryAI() {
    const textarea = document.getElementById('storyContent');
    const modal = document.getElementById('aiModal');
    const list = document.getElementById('aiSuggestionsList');

    let originalText = textarea.value;

    if (!originalText.trim()) {
        alert('اكتب شيئاً أولاً ليقوم الذكاء الاصطناعي بتحليله!');
        return;
    }

    // Detect Language
    const lang = detectLanguage(originalText);
    const personas = {
        'ar': {
            name: 'معلم اللغة العربية 👳‍♂️',
            msg: 'جاري تدقيق النص وتصحيح الأخطاء النحوية والإملائية...'
        },
        'en': {
            name: 'English Teacher 👩‍🏫',
            msg: 'Reviewing your text for grammar and spelling errors...'
        },
        'he': {
            name: 'מורה לעברית 👨‍🏫',
            msg: 'בודק את הטקסט לשגיאות כתיב ודקדוק...'
        }
    };
    const persona = personas[lang] || personas['ar'];

    originalContentStore = originalText;
    modal.classList.add('active');
    list.innerHTML = `
        <div class="suggestion-item" style="text-align:center;">
            <div class="spinner" style="margin:0 auto 10px;"></div>
            <div class="suggestion-text" style="font-weight:bold; color:var(--primary-color)">${persona.name}</div>
            <div class="suggestion-text">${persona.msg}</div>
        </div>
    `;

    // Simulate thinking time
    setTimeout(() => {
        // 1. Fix Spelling & Grammar based on Language
        let fixedText = fixSpelling(originalText, lang);

        // 2. Convert to Script (Structure) - adapted for language
        let scriptText = convertToScript(fixedText, lang);

        // 3. Develop & Expand
        let finalText = developStory(scriptText, lang);

        proposedGlobalChange = finalText;

        // Insights based on language
        let insights = "";
        if (lang === 'ar') {
            insights = `
                <li>✅ <strong>تصحيح الإملاء:</strong> تم تدقيق الهمزات والتاء المربوطة.</li>
                <li>🎭 <strong>تنسيق مسرحي:</strong> حولت القصة إلى حوار منظم.</li>
                <li>✨ <strong>تحسين الأسلوب:</strong> أضفت مفردات أكثر دقة.</li>
            `;
        } else if (lang === 'en') {
            insights = `
                <li>✅ <strong>Grammar Check:</strong> Corrected capitalization and punctuation.</li>
                <li>🎭 <strong>Script Format:</strong> Converted to dialogue format.</li>
                <li>✨ <strong>Style:</strong> Enhanced vocabulary and flow.</li>
            `;
        } else {
            insights = `
                <li>✅ <strong>תיקון כתיב:</strong> תוקנו שגיאות כתיב ופיסוק.</li>
                <li>🎭 <strong>פורמט תסריט:</strong> הפכתי את הסיפור לדיאלוג.</li>
                <li>✨ <strong>סגנון:</strong> שיפרתי את אוצר המילים.</li>
            `;
        }

        // Render Comparison UI
        list.innerHTML = `
            <div class="ai-comparison-container" style="display:flex; gap:15px; flex-direction:column;">
                
                <div class="ai-insight-box" style="background:#e3f2fd; padding:15px; border-radius:8px; border:1px solid #bbdefb;">
                    <strong>🤖 ${persona.name}:</strong>
                    <ul style="margin-top:5px; padding-right:20px; font-size:0.9rem; color:#0d47a1; list-style-type: none;">
                        ${insights}
                    </ul>
                </div>

                <div class="comparison-view" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <!-- New Version -->
                    <div style="background:#f0fff4; padding:10px; border:1px solid #c6f6d5; border-radius:8px;">
                        <strong style="color:#2f855a; display:block; margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:5px;">✨ ${lang === 'en' ? 'Improved Version' : (lang === 'he' ? 'גרסה משופרת' : 'النسخة المحسنة')}</strong>
                        <div style="font-size:0.9rem; white-space: pre-wrap; max-height:200px; overflow-y:auto; color:#22543d; font-family:'Cairo'; direction:${lang === 'en' ? 'ltr' : 'rtl'}; text-align:${lang === 'en' ? 'left' : 'right'}">${finalText}</div>
                    </div>
                    
                    <!-- Original Version -->
                    <div style="background:#fff5f5; padding:10px; border:1px solid #fed7d7; border-radius:8px; opacity:0.8;">
                        <strong style="color:#c53030; display:block; margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:5px;">📝 ${lang === 'en' ? 'Original' : (lang === 'he' ? 'מקור' : 'الأصل')}</strong>
                        <div style="font-size:0.9rem; white-space: pre-wrap; max-height:200px; overflow-y:auto; color:#742a2a; font-family:'Cairo'; direction:${lang === 'en' ? 'ltr' : 'rtl'}; text-align:${lang === 'en' ? 'left' : 'right'}">${originalText}</div>
                    </div>
                </div>

                <div class="decision-box" style="text-align:center; margin-top:15px; padding-top:15px; border-top:1px solid #eee;">
                    <p style="margin-bottom:10px; font-weight:bold; color:#333;">${lang === 'en' ? 'Apply changes?' : (lang === 'he' ? 'לאשר שינויים?' : 'هل تريد اعتماد التغييرات؟')}</p>
                    <div style="display:flex; justify-content:center; gap:15px;">
                        <button onclick="applyAISuggestions()" class="btn btn-primary">✅ ${lang === 'en' ? 'Yes, Apply' : (lang === 'he' ? 'כן, אשר' : 'نعم، اعتمد')}</button>
                        <button onclick="keepOriginal()" class="btn btn-outline" style="border-color:#ccc; color:#666;">❌ ${lang === 'en' ? 'No, Keep Original' : (lang === 'he' ? 'לא, השאר מקור' : 'لا، أبقِ الأصل')}</button>
                    </div>
                </div>
            </div>
        `;
    }, 2000);
}

function detectLanguage(text) {
    const arabicPattern = /[\u0600-\u06FF]/;
    const hebrewPattern = /[\u0590-\u05FF]/;

    if (hebrewPattern.test(text)) return 'he';
    if (arabicPattern.test(text)) return 'ar';
    return 'en'; // Default to English/Latin
}

// ---------------------------------------------------------
// 1. Spelling Corrector (Multi-Language)
// ---------------------------------------------------------
function fixSpelling(text, lang) {
    if (lang === 'en') return fixSpellingEnglish(text);
    if (lang === 'he') return fixSpellingHebrew(text);
    return fixSpellingArabic(text);
}

function fixSpellingArabic(text) {
    let corrected = text;

    // Fix Broken Words (Space inside words)
    corrected = corrected.replace(/\bال\s+([أ-ي])/g, 'ال$1');
    corrected = corrected.replace(/\bالا\s+([أ-ي])/g, 'الأ$1');
    corrected = corrected.replace(/\bبا لا\s+([أ-ي])/g, 'بالأ$1');

    // Fix user reported errors
    corrected = corrected.replace(/نهايت\b/g, 'نهاية');
    corrected = corrected.replace(/لزيز([أ-ي]*)\b/g, 'لذيذ$1');
    corrected = corrected.replace(/البطط\b/g, 'البط');
    corrected = corrected.replace(/\bاعدته\b/g, 'أعدته');
    corrected = corrected.replace(/قطتاً\b/g, 'قطةً');
    corrected = corrected.replace(/الحيول\b/g, 'الخيول');

    // Common fixes
    corrected = corrected.replace(/لا\s+رنب/g, 'الأرنب');
    corrected = corrected.replace(/لا\s+سد/g, 'الأسد');
    corrected = corrected.replace(/لا\s+نه/g, 'لأنه');
    corrected = corrected.replace(/\bاكل\b/g, 'أكل');
    corrected = corrected.replace(/\bاخذ\b/g, 'أخذ');
    corrected = corrected.replace(/\bامر\b/g, 'أمر');
    corrected = corrected.replace(/\bالى\b/g, 'إلى');
    corrected = corrected.replace(/\bان\b/g, 'أن');
    corrected = corrected.replace(/\bاذا\b/g, 'إذا');
    corrected = corrected.replace(/\bمدرسه\b/g, 'مدرسة');
    corrected = corrected.replace(/\bحديقه\b/g, 'حديقة');
    corrected = corrected.replace(/\bغابه\b/g, 'غابة');
    corrected = corrected.replace(/\bقصة\s/g, 'قصة ');

    // Punctuation
    corrected = corrected.replace(/\s+([،.])/g, '$1');
    corrected = corrected.replace(/([،.])([^\s])/g, '$1 $2');

    return corrected;
}

function fixSpellingEnglish(text) {
    let corrected = text;

    // Capitalization (Start of sentence)
    corrected = corrected.replace(/(^\s*|[.!?]\s*)([a-z])/g, (match, sep, char) => sep + char.toUpperCase());

    // Capitalize "I"
    corrected = corrected.replace(/\b(i)\b/g, 'I');

    // Common Typos
    corrected = corrected.replace(/\bteh\b/g, 'the');
    corrected = corrected.replace(/\band\s+also\b/g, 'and'); // stylistic
    corrected = corrected.replace(/\bgonna\b/g, 'going to');
    corrected = corrected.replace(/\bwanna\b/g, 'want to');
    corrected = corrected.replace(/\bcuz\b/g, 'because');
    corrected = corrected.replace(/\bplz\b/g, 'please');
    corrected = corrected.replace(/\bu\b/g, 'you');
    corrected = corrected.replace(/\br\b/g, 'are');
    corrected = corrected.replace(/\bdont\b/g, "don't");
    corrected = corrected.replace(/\bcant\b/g, "can't");
    corrected = corrected.replace(/\bim\b/g, "I'm");
    corrected = corrected.replace(/\biv\b/g, "I've");

    // Punctuation Spacing
    corrected = corrected.replace(/\s+([,.!?])/g, '$1'); // Remove space before
    corrected = corrected.replace(/([,.!?])([^\s])/g, '$1 $2'); // Add space after

    return corrected;
}

function fixSpellingHebrew(text) {
    let corrected = text;

    // Common Typos & Grammar
    corrected = corrected.replace(/\bאני ילך\b/g, 'אני אלך'); // Future tense aleph mistake
    corrected = corrected.replace(/\bאני יאכל\b/g, 'אני אוכל');
    corrected = corrected.replace(/\bאני יעשה\b/g, 'אני אעשה');
    corrected = corrected.replace(/\bהייתי יושן\b/g, 'ישנתי'); // Incorrect continuous action

    // Spelling
    corrected = corrected.replace(/\bעכשיו\b/g, 'עכשיו'); // often typed with one vav or yod incorrectly, here just normalizing
    corrected = corrected.replace(/\bבישביל\b/g, 'בשביל');
    corrected = corrected.replace(/\bעם\s+הזמן\b/g, 'עם הזמן'); // Ensure spacing

    // Punctuation Spacing
    corrected = corrected.replace(/\s+([,.!?])/g, '$1');
    corrected = corrected.replace(/([,.!?])([^\s])/g, '$1 $2');

    return corrected;
}

// ---------------------------------------------------------
// 2. Story Developer (Multi-Language)
// ---------------------------------------------------------
function developStory(text, lang) {
    let developed = text;

    if (lang === 'ar') {
        const adjectives = {
            'الأسد': 'الأسد القوي ومَلِك الغابة،',
            'الأرنب': 'الأرنب الصغير والذكي',
            'الغابة': 'الغابة الكبيرة المليئة بالأشجار',
            'الثعلب': 'الثعلب المكار',
            'الملك': 'الملك العادل والمحبوب'
        };
        Object.keys(adjectives).forEach(key => {
            if (Math.random() > 0.3) {
                developed = developed.replace(new RegExp(`\\b${key}\\b`, 'g'), adjectives[key]);
            }
        });
    } else if (lang === 'en') {
        const adjectives = {
            'lion': 'the mighty lion, king of the jungle,',
            'rabbit': 'the small and clever rabbit',
            'forest': 'the vast, enchanting forest',
            'fox': 'the sly fox',
            'king': 'the wise and just king'
        };
        Object.keys(adjectives).forEach(key => {
            if (Math.random() > 0.3) {
                developed = developed.replace(new RegExp(`\\b${key}\\b`, 'gi'), adjectives[key]);
            }
        });
    }
    // Hebrew expansions could be added here similarly

    return developed;
}

// ---------------------------------------------------------
// 3. Script Converter (Structure)
// ---------------------------------------------------------
function convertToScript(text, lang) {
    const lines = text.split(/\n+/);
    let script = [];

    const narrator = {
        'ar': 'الراوي',
        'en': 'Narrator',
        'he': 'המספר'
    }[lang];

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        let speaker = narrator;
        let dialogue = line;
        let emotion = "";

        // Detect Emotions
        if (lang === 'ar') {
            if (dialogue.match(/(ضحك|سعيد|فرح)/)) emotion = " (يضحك بسعادة) 😄";
            else if (dialogue.match(/(حزين|بكى|دموع)/)) emotion = " (بصوت حزين) 😢";
            else if (dialogue.match(/(غاضب|صاح|صرخ)/)) emotion = " (بغضب) 😠";
        } else if (lang === 'en') {
            if (dialogue.match(/(laugh|happy|joy)/i)) emotion = " (laughing happily) 😄";
            else if (dialogue.match(/(sad|cry|tears)/i)) emotion = " (sadly) 😢";
            else if (dialogue.match(/(angry|shout|yell)/i)) emotion = " (angrily) 😠";
        } else if (lang === 'he') {
            if (dialogue.match(/(צחק|שמח|אושר)/)) emotion = " (צוחק בשמחה) 😄";
            else if (dialogue.match(/(עצוב|בכה|דמעות)/)) emotion = " (בעצב) 😢";
            else if (dialogue.match(/(כועס|צעק)/)) emotion = " (בכעס) 😠";
        }

        // Extract Speaker
        if (line.includes(':')) {
            const parts = line.split(':');
            if (parts[0].trim().split(' ').length < 5) {
                speaker = parts[0].trim();
                dialogue = parts.slice(1).join(':').trim();
            }
        }

        // Clean up quotes (Multi-lang)
        dialogue = dialogue.replace(/^[:،"«„]/, '').replace(/[:،"»”]$/, '');

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
        textarea.dispatchEvent(new Event('input'));
    }
    closeAIModal();
    alert('✨ تم تطبيق التحسينات! / Changes Applied!');
}

function keepOriginal() {
    closeAIModal();
}

// Expose globals
window.toggleAssistant = toggleAssistant;
window.insertText = insertText;
window.generateStoryIdea = generateStoryIdea;
window.analyzeStoryAI = analyzeStoryAI;
window.closeAIModal = closeAIModal;
window.applyAISuggestions = applyAISuggestions;
window.keepOriginal = keepOriginal;
