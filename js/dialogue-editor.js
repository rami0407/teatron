// Dialogue Editor - Display and Text-to-Speech
// Handles dialogue display, editing, and voice reading

let currentDialogue = null;
let currentAssessment = null;
let synth = window.speechSynthesis;
let currentUtterance = null;
let availableVoices = [];
let isGuestMode = false;

// DOM Elements
const loadingGeneration = document.getElementById('loadingGeneration');
const editorLayout = document.getElementById('editorLayout');
const dialogueContent = document.getElementById('dialogueContent');
const ttsCard = document.getElementById('ttsCard');
const voiceSelector = document.getElementById('voiceSelector');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const ttsStatus = document.getElementById('ttsStatus');
const saveBtn = document.getElementById('saveBtn');
const exportTxtBtn = document.getElementById('exportTxtBtn');
const newDialogueBtn = document.getElementById('newDialogueBtn');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check if guest mode
    const urlParams = new URLSearchParams(window.location.search);
    isGuestMode = urlParams.get('mode') === 'guest';
    const assessmentId = urlParams.get('assessment');

    if (!assessmentId) {
        alert('خطأ: لم يتم العثور على بيانات التقييم');
        window.location.href = 'dialogue-generator.html';
        return;
    }

    // Update UI for guest mode
    if (isGuestMode) {
        const userGreeting = document.querySelector('.user-greeting');
        if (userGreeting) {
            userGreeting.innerHTML = '<strong>🎭 وضع الضيف</strong>';
        }
        // Hide save button for guests
        if (saveBtn) {
            saveBtn.style.display = 'none';
        }
    } else {
        loadUserName();
    }

    // Load assessment and generate dialogue
    await loadAssessmentAndGenerate(assessmentId);

    // Initialize TTS
    initializeTTS();

    // Event listeners
    playBtn.addEventListener('click', playDialogue);
    pauseBtn.addEventListener('click', pauseDialogue);
    stopBtn.addEventListener('click', stopDialogue);
    saveBtn.addEventListener('click', saveDialogue);
    exportTxtBtn.addEventListener('click', exportToTxt);

    const exportDocxBtn = document.getElementById('exportDocxBtn');
    if (exportDocxBtn) {
        exportDocxBtn.addEventListener('click', exportToWord);
    }

    newDialogueBtn.addEventListener('click', () => {
        window.location.href = 'dialogue-generator.html';
    });
});

// ============================================
// Load Assessment and Generate Dialogue
// ============================================

async function loadAssessmentAndGenerate(assessmentId) {
    try {
        if (isGuestMode) {
            // Guest mode: load from localStorage
            const guestData = localStorage.getItem('guestAssessment');
            if (!guestData) {
                throw new Error('لم يتم العثور على بيانات التقييم');
            }

            currentAssessment = JSON.parse(guestData);

        } else {
            // Registered user: load from Firestore
            const assessmentDoc = await firebase.firestore()
                .collection('assessments')
                .doc(assessmentId)
                .get();

            if (!assessmentDoc.exists) {
                throw new Error('لم يتم العثور على بيانات التقييم');
            }

            currentAssessment = {
                id: assessmentId,
                ...assessmentDoc.data()
            };
        }

        // Generate dialogue using the engine
        const engine = new DialogueEngine(currentAssessment);
        currentDialogue = await engine.generate();

        // Display the dialogue
        displayDialogue();

        // Hide loading, show editor
        loadingGeneration.style.display = 'none';
        editorLayout.style.display = 'grid';

    } catch (error) {
        console.error('Error loading assessment:', error);
        alert('حدث خطأ في تحميل البيانات: ' + error.message);
        window.location.href = 'dialogue-generator.html';
    }
}

// ============================================
// Display Dialogue
// ============================================

function displayDialogue() {
    if (!currentDialogue) return;

    // Set title
    document.getElementById('dialogueTitle').textContent = currentDialogue.title;

    // Set metadata
    document.getElementById('puppetCount').textContent = currentDialogue.puppets.length;
    document.getElementById('dialogueLanguage').textContent = getLanguageName(currentDialogue.language);
    document.getElementById('dialogueLength').textContent = getLengthName(currentAssessment.settings.length);
    document.getElementById('dialogueType').textContent = getTypeName(currentAssessment.settings.storyType);

    // Display dialogue lines
    dialogueContent.innerHTML = '';
    currentDialogue.content.forEach((line, index) => {
        const lineElement = createDialogueLine(line, index);
        dialogueContent.appendChild(lineElement);
    });

    // Display puppet info
    displayPuppetInfo();
}

function createDialogueLine(line, index) {
    const div = document.createElement('div');
    div.className = 'dialogue-line';
    div.style.animationDelay = `${index * 0.1}s`;

    // Find puppet for this speaker
    const puppet = currentDialogue.puppets.find(p => p.name === line.speaker);
    const emoji = puppet ? puppet.emoji : '🎭';

    div.innerHTML = `
        <div class="speaker-avatar">${emoji}</div>
        <div class="line-content">
            <div class="speaker-name">${line.speaker}</div>
            <div class="line-text">${line.text}</div>
        </div>
    `;

    return div;
}

function displayPuppetInfo() {
    const puppetInfo = document.getElementById('puppetInfo');
    puppetInfo.innerHTML = '';

    currentDialogue.puppets.forEach(puppet => {
        const div = document.createElement('div');
        div.className = 'puppet-item';
        div.innerHTML = `
            <div class="puppet-item-emoji">${puppet.emoji || '🎭'}</div>
            <div class="puppet-item-name">${puppet.name}</div>
        `;
        puppetInfo.appendChild(div);
    });
}

function getLanguageName(lang) {
    const languages = {
        'ar': 'العربية',
        'he': 'עברית',
        'en': 'English'
    };
    return languages[lang] || lang;
}

function getLengthName(length) {
    const lengths = {
        'short': 'قصير',
        'medium': 'متوسط',
        'long': 'طويل'
    };
    return lengths[length] || length;
}

function getTypeName(type) {
    const types = {
        'educational': 'تعليمي',
        'comedy': 'كوميدي',
        'adventure': 'مغامرة',
        'moral': 'أخلاقي'
    };
    return types[type] || type;
}

// ============================================
// Text-to-Speech Functionality
// ============================================

function initializeTTS() {
    // Check if TTS is supported
    if (!('speechSynthesis' in window)) {
        console.log('Text-to-Speech not supported');
        return;
    }

    // Only show TTS for Hebrew and English
    if (currentDialogue.language === 'he' || currentDialogue.language === 'en') {
        ttsCard.style.display = 'block';
        loadVoices();
    }
}

function loadVoices() {
    // Load available voices
    availableVoices = synth.getVoices();

    if (availableVoices.length === 0) {
        // Voices not loaded yet, wait for them
        synth.addEventListener('voiceschanged', () => {
            availableVoices = synth.getVoices();
            populateVoiceSelector();
        });
    } else {
        populateVoiceSelector();
    }
}

function populateVoiceSelector() {
    const targetLang = currentDialogue.language === 'he' ? 'he' : 'en';

    // Filter voices for the selected language
    const filteredVoices = availableVoices.filter(voice =>
        voice.lang.startsWith(targetLang) || voice.lang.startsWith(targetLang.toUpperCase())
    );

    // Clear existing options
    voiceSelector.innerHTML = '<option value="">اختر الصوت...</option>';

    if (filteredVoices.length === 0) {
        // No voices for this language, show all voices
        availableVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelector.appendChild(option);
        });
    } else {
        // Show filtered voices
        filteredVoices.forEach(voice => {
            const index = availableVoices.indexOf(voice);
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelector.appendChild(option);
        });

        // Select first available voice
        if (filteredVoices.length > 0) {
            voiceSelector.selectedIndex = 1;
        }
    }
}

function playDialogue() {
    if (!currentDialogue) return;

    const selectedVoiceIndex = voiceSelector.value;
    if (!selectedVoiceIndex) {
        alert('الرجاء اختيار صوت أولاً');
        return;
    }

    // Stop any current speech
    synth.cancel();

    // Get full dialogue text
    const fullText = currentDialogue.content
        .map(line => `${line.speaker}: ${line.text}`)
        .join('. ');

    // Create utterance
    currentUtterance = new SpeechSynthesisUtterance(fullText);
    currentUtterance.voice = availableVoices[selectedVoiceIndex];
    currentUtterance.rate = 0.9; // Slightly slower for clarity
    currentUtterance.pitch = 1.0;
    currentUtterance.volume = 1.0;

    // Event handlers
    currentUtterance.onstart = () => {
        playBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        ttsStatus.textContent = '🎙️ جارٍ القراءة...';
    };

    currentUtterance.onend = () => {
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        ttsStatus.textContent = 'انتهت القراءة ✅';
    };

    currentUtterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        ttsStatus.textContent = 'حدث خطأ في القراءة ❌';
    };

    // Start speaking
    synth.speak(currentUtterance);
}

function pauseDialogue() {
    if (synth.speaking && !synth.paused) {
        synth.pause();
        ttsStatus.textContent = 'تم الإيقاف مؤقتاً ⏸️';
        playBtn.textContent = '▶️ متابعة';
        playBtn.disabled = false;
    } else if (synth.paused) {
        synth.resume();
        ttsStatus.textContent = '🎙️ جارٍ القراءة...';
        playBtn.textContent = '▶️ تشغيل';
        playBtn.disabled = true;
    }
}

function stopDialogue() {
    synth.cancel();
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    playBtn.textContent = '▶️ تشغيل';
    ttsStatus.textContent = 'تم الإيقاف ⏹️';
}

// ============================================
// Save and Export
// ============================================

async function saveDialogue() {
    if (!currentDialogue || !currentAssessment) return;

    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }

        // Save dialogue to Firestore
        const dialogueData = {
            studentId: user.uid,
            assessmentId: currentAssessment.id,
            title: currentDialogue.title,
            language: currentDialogue.language,
            puppets: currentDialogue.puppets.map(p => p.id),
            content: currentDialogue.content,
            type: currentAssessment.settings.storyType,
            length: currentAssessment.settings.length,
            status: 'draft',
            metadata: currentDialogue.metadata,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await firebase.firestore()
            .collection('dialogues')
            .add(dialogueData);

        alert('✅ تم حفظ الحوار بنجاح!');

        // Redirect to dialogues list (we'll create this later)
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Error saving dialogue:', error);
        alert('حدث خطأ في حفظ الحوار: ' + error.message);
    }
}

function exportToTxt() {
    if (!currentDialogue) return;

    // Create text content
    let textContent = `${currentDialogue.title}\n`;
    textContent += `${'='.repeat(currentDialogue.title.length)}\n\n`;
    textContent += `اللغة: ${getLanguageName(currentDialogue.language)}\n`;
    textContent += `النوع: ${getTypeName(currentAssessment.settings.storyType)}\n`;
    textContent += `الطول: ${getLengthName(currentAssessment.settings.length)}\n`;
    textContent += `الدمى: ${currentDialogue.puppets.map(p => p.name).join(', ')}\n\n`;
    textContent += `${'-'.repeat(50)}\n\n`;

    currentDialogue.content.forEach(line => {
        textContent += `${line.speaker}:\n${line.text}\n\n`;
    });

    // Create download
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDialogue.title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
}

async function exportToWord() {
    if (!currentDialogue) return;

    try {
        const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

        // Create document with RTL support for Arabic
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,
                            right: 1440,
                            bottom: 1440,
                            left: 1440
                        }
                    }
                },
                children: [
                    // Title
                    new Paragraph({
                        text: currentDialogue.title,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                        bidirectional: currentDialogue.language === 'ar' || currentDialogue.language === 'he'
                    }),

                    // Metadata
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `اللغة: ${getLanguageName(currentDialogue.language)}`,
                                bold: true
                            })
                        ],
                        spacing: { after: 200 },
                        bidirectional: true
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `النوع: ${getTypeName(currentAssessment.settings.storyType)}`,
                                bold: true
                            })
                        ],
                        spacing: { after: 200 },
                        bidirectional: true
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `الطول: ${getLengthName(currentAssessment.settings.length)}`,
                                bold: true
                            })
                        ],
                        spacing: { after: 200 },
                        bidirectional: true
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `الدمى: ${currentDialogue.puppets.map(p => p.name).join(', ')}`,
                                bold: true
                            })
                        ],
                        spacing: { after: 400 },
                        bidirectional: true
                    }),

                    // Separator
                    new Paragraph({
                        text: '─'.repeat(50),
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    // Dialogue content
                    ...currentDialogue.content.flatMap(line => [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${line.speaker}:`,
                                    bold: true,
                                    color: '6366f1',
                                    size: 28
                                })
                            ],
                            spacing: { before: 200, after: 100 },
                            bidirectional: currentDialogue.language === 'ar' || currentDialogue.language === 'he'
                        }),
                        new Paragraph({
                            text: line.text,
                            spacing: { after: 300 },
                            indent: { left: 400 },
                            bidirectional: currentDialogue.language === 'ar' || currentDialogue.language === 'he'
                        })
                    ])
                ]
            }]
        });

        // Generate and download
        const blob = await docx.Packer.toBlob(doc);
        saveAs(blob, `${currentDialogue.title}.docx`);

    } catch (error) {
        console.error('Error exporting to Word:', error);
        alert('حدث خطأ في تصدير الملف. الرجاء المحاولة مرة أخرى.');
    }
}

// ============================================
// User Info
// ============================================

async function loadUserName() {
    const user = firebase.auth().currentUser;
    if (user) {
        try {
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                document.getElementById('userName').textContent = userData.name || 'الطالب';
            }
        } catch (error) {
            console.error('Error loading user name:', error);
        }
    }
}
