// Dialogue Generator - Form Controller
// Handles multi-step form navigation and data collection

let currentStep = 1;
const totalSteps = 3; // Updated: 3 steps instead of 5
let selectedPuppets = [];
const maxPuppets = 2;
let isGuestMode = false; // Guest mode flag

// DOM Elements
const form = document.getElementById('assessmentForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const generateBtn = document.getElementById('generateBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if guest mode
    const urlParams = new URLSearchParams(window.location.search);
    isGuestMode = urlParams.get('mode') === 'guest';

    if (isGuestMode) {
        console.log('Guest mode activated');
        // Update UI for guest mode
        const userGreeting = document.querySelector('.user-greeting');
        if (userGreeting) {
            userGreeting.innerHTML = '<strong>🎭 وضع الضيف</strong>';
        }
    } else {
        // Load user name only if not guest
        loadUserName();
    }

    // Setup back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.href = isGuestMode ? '../index.html' : 'dashboard.html';
        backBtn.textContent = isGuestMode ? 'العودة للصفحة الرئيسية' : 'العودة للوحة التحكم';
    }

    initializeSliders();
    loadPuppets();
    updateNavigation();

    // Event Listeners
    prevBtn.addEventListener('click', previousStep);
    nextBtn.addEventListener('click', nextStep);
    form.addEventListener('submit', handleSubmit);

    // Custom location handler
    const locationSelect = document.getElementById('locationSelect');
    if (locationSelect) {
        locationSelect.addEventListener('change', (e) => {
            const customInput = document.getElementById('customLocationInput');
            if (e.target.value === 'custom') {
                customInput.style.display = 'block';
            } else {
                customInput.style.display = 'none';
                customInput.value = '';
            }
        });
    }
});

// ============================================
// Step Navigation
// ============================================

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            // Move to next step
            hideStep(currentStep);
            currentStep++;
            showStep(currentStep);
            updateNavigation();
            updateProgressBar();
        }
    }
}

function previousStep() {
    if (currentStep > 1) {
        hideStep(currentStep);
        currentStep--;
        showStep(currentStep);
        updateNavigation();
        updateProgressBar();
    }
}

function showStep(stepNumber) {
    const step = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (step) {
        step.classList.add('active');
        step.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function hideStep(stepNumber) {
    const step = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (step) {
        step.classList.remove('active');
    }
}

function updateNavigation() {
    // Show/hide buttons based on current step
    prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-block';
    nextBtn.style.display = currentStep === totalSteps ? 'none' : 'inline-block';
    generateBtn.style.display = currentStep === totalSteps ? 'inline-block' : 'none';
}

function updateProgressBar() {
    // Update progress steps
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNumber = index + 1;

        if (stepNumber < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// ============================================
// Form Validation
// ============================================

function validateCurrentStep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);

    // Safety check
    if (!currentStepElement) {
        console.error('Step element not found:', currentStep);
        return true;
    }

    // Get all required inputs in current step
    const requiredInputs = currentStepElement.querySelectorAll('[required]');

    for (let input of requiredInputs) {
        if (input.type === 'radio') {
            // Check if at least one radio in the group is checked
            const radioGroup = currentStepElement.querySelectorAll(`[name="${input.name}"]`);
            const isChecked = Array.from(radioGroup).some(radio => radio.checked);

            if (!isChecked) {
                alert('الرجاء الإجابة على جميع الأسئلة المطلوبة');
                return false;
            }
        } else if (input.tagName === 'SELECT' && !input.value) {
            alert('الرجاء اختيار إجابة من القائمة');
            input.focus();
            return false;
        }
    }

    // Special validation for step 3 (puppet selection)
    if (currentStep === 3) {
        if (selectedPuppets.length === 0) {
            alert('الرجاء اختيار دمية واحدة على الأقل');
            return false;
        }
    }

    // Check subject selection limit (max 3) - Step 1 now
    if (currentStep === 1) {
        const selectedSubjects = currentStepElement.querySelectorAll('input[name="subjects"]:checked');
        if (selectedSubjects.length > 3) {
            alert('يمكنك اختيار 3 مواد كحد أقصى');
            return false;
        }
    }

    return true;
}

// ============================================
// Slider Handlers
// ============================================

function initializeSliders() {
    // Confidence slider
    const confidenceSlider = document.getElementById('confidenceSlider');
    const confidenceValue = document.getElementById('confidenceValue');

    if (confidenceSlider) {
        confidenceSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const labels = ['منخفضة جداً', 'منخفضة', 'متوسطة', 'عالية', 'عالية جداً'];
            confidenceValue.textContent = labels[value - 1];
        });
    }

    // Introvert slider
    const introvertSlider = document.getElementById('introvertSlider');
    const introvertValue = document.getElementById('introvertValue');

    if (introvertSlider) {
        introvertSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const labels = ['هادئ جداً', 'هادئ', 'متوازن', 'منفتح', 'منفتح جداً'];
            introvertValue.textContent = labels[value - 1];
        });
    }

    // Leadership slider
    const leadershipSlider = document.getElementById('leadershipSlider');
    const leadershipValue = document.getElementById('leadershipValue');

    if (leadershipSlider) {
        leadershipSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const labels = ['تابع', 'يفضل التبعية', 'متوازن', 'يحب القيادة', 'قائد'];
            leadershipValue.textContent = labels[value - 1];
        });
    }

    // Cooperation slider
    const cooperationSlider = document.getElementById('cooperationSlider');
    const cooperationValue = document.getElementById('cooperationValue');

    if (cooperationSlider) {
        cooperationSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const labels = ['فردي جداً', 'يفضل العمل وحده', 'متوازن', 'يحب التعاون', 'جماعي جداً'];
            cooperationValue.textContent = labels[value - 1];
        });
    }
}

// ============================================
// Puppet Loading and Selection
// ============================================

async function loadPuppets() {
    const gallery = document.getElementById('puppetGallery');

    try {
        let puppets = [];

        if (isGuestMode) {
            // Guest mode: use mock puppet data
            puppets = [
                { id: 'lion', emoji: '🦁', name: 'الأسد', category: 'animals' },
                { id: 'bear', emoji: '🐻', name: 'الدب', category: 'animals' },
                { id: 'rabbit', emoji: '🐰', name: 'الأرنب', category: 'animals' },
                { id: 'boy', emoji: '👦', name: 'الولد', category: 'family' },
                { id: 'girl', emoji: '👧', name: 'البنت', category: 'family' },
                { id: 'scientist', emoji: '👨‍🔬', name: 'العالم', category: 'characters' },
                { id: 'teacher', emoji: '👨‍🏫', name: 'المعلم', category: 'characters' },
                { id: 'astronaut', emoji: '👨‍🚀', name: 'رائد الفضاء', category: 'characters' }
            ];
        } else {
            // Registered user: try to load from Firestore first
            const puppetsSnapshot = await firebase.firestore()
                .collection('puppets')
                .where('available', '==', true)
                .get();

            if (!puppetsSnapshot.empty) {
                puppets = puppetsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort by name in JavaScript
                puppets.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            } else {
                // Database is empty - use mock data as fallback
                console.log('No puppets in database, using mock data');
                puppets = [
                    { id: 'lion', emoji: '🦁', name: 'الأسد', category: 'animals' },
                    { id: 'bear', emoji: '🐻', name: 'الدب', category: 'animals' },
                    { id: 'rabbit', emoji: '🐰', name: 'الأرنب', category: 'animals' },
                    { id: 'boy', emoji: '👦', name: 'الولد', category: 'family' },
                    { id: 'girl', emoji: '👧', name: 'البنت', category: 'family' },
                    { id: 'scientist', emoji: '👨‍🔬', name: 'العالم', category: 'characters' },
                    { id: 'teacher', emoji: '👨‍🏫', name: 'المعلم', category: 'characters' },
                    { id: 'astronaut', emoji: '👨‍🚀', name: 'رائد الفضاء', category: 'characters' }
                ];
            }
        }

        gallery.innerHTML = '';
        puppets.forEach(puppet => {
            const puppetCard = createPuppetCard(puppet.id, puppet);
            gallery.appendChild(puppetCard);
        });

    } catch (error) {
        console.error('Error loading puppets:', error);
        gallery.innerHTML = `
            <div class="loading-puppets">
                <p>حدث خطأ في تحميل الدمى. الرجاء المحاولة لاحقاً.</p>
            </div>
        `;
    }
}

function createPuppetCard(puppetId, puppet) {
    const card = document.createElement('div');
    card.className = 'puppet-card';
    card.dataset.puppetId = puppetId;

    card.innerHTML = `
        <div class="puppet-emoji">${puppet.emoji || '🎭'}</div>
        <div class="puppet-name">${puppet.name}</div>
        <div class="puppet-category">${getCategoryName(puppet.category)}</div>
    `;

    card.addEventListener('click', () => togglePuppetSelection(puppetId, card));

    return card;
}

function togglePuppetSelection(puppetId, cardElement) {
    const index = selectedPuppets.indexOf(puppetId);

    if (index > -1) {
        // Deselect
        selectedPuppets.splice(index, 1);
        cardElement.classList.remove('selected');
        updatePuppetCards();
    } else {
        // Select (if limit not reached)
        if (selectedPuppets.length < maxPuppets) {
            selectedPuppets.push(puppetId);
            cardElement.classList.add('selected');
            updatePuppetCards();
        } else {
            alert(`يمكنك اختيار ${maxPuppets} دمية كحد أقصى`);
        }
    }

    updateSelectedCount();
}

function updatePuppetCards() {
    const allCards = document.querySelectorAll('.puppet-card');

    allCards.forEach(card => {
        if (selectedPuppets.length >= maxPuppets && !card.classList.contains('selected')) {
            card.classList.add('disabled');
        } else {
            card.classList.remove('disabled');
        }
    });
}

function updateSelectedCount() {
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
        countElement.textContent = selectedPuppets.length;
    }
}

function getCategoryName(category) {
    const categories = {
        'animals': 'حيوانات',
        'family': 'عائلة',
        'characters': 'شخصيات',
        'objects': 'أشياء'
    };
    return categories[category] || category;
}

// ============================================
// Form Submission
// ============================================

async function handleSubmit(e) {
    e.preventDefault();

    if (!validateCurrentStep()) {
        return;
    }

    // Show loading
    loadingOverlay.style.display = 'flex';

    try {
        // Collect all form data
        const formData = collectFormData();

        if (isGuestMode) {
            // Guest mode: save to localStorage
            const guestAssessment = {
                id: 'guest_' + Date.now(),
                timestamp: new Date().toISOString(),
                mode: 'guest',
                ...formData
            };

            localStorage.setItem('guestAssessment', JSON.stringify(guestAssessment));

            // Redirect to dialogue editor with guest mode
            window.location.href = `dialogue-editor.html?mode=guest&assessment=${guestAssessment.id}`;

        } else {
            // Registered user: save to Firestore
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            // Save assessment data
            const assessmentRef = await firebase.firestore()
                .collection('assessments')
                .add({
                    studentId: user.uid,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    ...formData
                });

            // Redirect to dialogue editor with assessment ID
            window.location.href = `dialogue-editor.html?assessment=${assessmentRef.id}`;
        }

    } catch (error) {
        console.error('Error submitting form:', error);
        loadingOverlay.style.display = 'none';
        alert('حدث خطأ أثناء إرسال البيانات. الرجاء المحاولة مرة أخرى.');
    }
}

function collectFormData() {
    // Updated to collect new story-focused data
    const formData = {
        basic: {
            grade: document.querySelector('[name="grade"]').value,
            subjects: getCheckboxValues('subjects')
        },
        story: {
            genre: getRadioValue('storyGenre'),
            topic: document.querySelector('[name="storyTopic"]').value,
            problem: document.querySelector('[name="storyProblem"]').value,
            value: document.querySelector('[name="storyValue"]').value || '',
            ending: getRadioValue('endingType'),
            location: document.querySelector('[name="location"]').value,
            customLocation: document.querySelector('[name="customLocation"]')?.value || ''
        },
        puppets: selectedPuppets,
        settings: {
            language: getRadioValue('language'),
            length: getRadioValue('length')
        }
    };

    return formData;
}

function getRadioValue(name) {
    const radio = document.querySelector(`[name="${name}"]:checked`);
    return radio ? radio.value : '';
}

function getCheckboxValues(name) {
    const checkboxes = document.querySelectorAll(`[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
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
