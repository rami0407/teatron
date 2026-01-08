// Smart Dramaturg Logic (Powered by Gemini Flash)
// This file handles the interaction for the 3-stage creative workshop.

document.addEventListener('DOMContentLoaded', () => {
    // Stage Transitions
    setupNavigation();

    // Stage 1: Character Builder
    const buildCharBtn = document.getElementById('buildCharBtn');
    buildCharBtn.addEventListener('click', handleCharacterBuild);

    // Stage 2: Dialogue Engine
    const generateSceneBtn = document.getElementById('generateSceneBtn');
    generateSceneBtn.addEventListener('click', handleSceneGeneration);

    // Stage 3: Values Checker
    const checkValuesBtn = document.getElementById('checkValuesBtn');
    checkValuesBtn.addEventListener('click', handleValuesCheck);
});

// ==========================================
// Stage 1: Character Builder Logic
// ==========================================
async function handleCharacterBuild() {
    const name = document.getElementById('charName').value;
    const trait = document.getElementById('charTrait').value;
    const goal = document.getElementById('charGoal').value;

    if (!name || !trait) {
        alert('الرجاء إدخال اسم ومواصفات الدمية على الأقل');
        return;
    }

    showLoading('جاري بناء شخصية الدمية باستخدام الذكاء الاصطناعي...');

    // 1. Construct the System Prompt
    const prompt = `
Act as an expert Puppet Theater Character Designer for children.
Task: Create a detailed character profile based on the input.
Input:
- Name: ${name}
- Trait: ${trait}
- Goal: ${goal}

Output requirements:
1. "Appearance": Describe material, colors, and accessories (visual).
2. "Voice & Performance": Describe tone, speed, and typical movements.
3. Language: Arabic.
4. Format: HTML formatted text (use <strong> for headers).
    `.trim();

    try {
        // 2. Call Gemini API
        const responseText = await geminiAgent.generateContent(prompt);

        // 3. Display Result
        hideLoading();
        document.getElementById('charDescriptionContent').innerHTML = responseText;
        document.getElementById('prompt1').textContent = prompt; // Debug
        document.getElementById('charOutput').classList.add('active');
        document.getElementById('toStage2Btn').style.display = 'inline-block';

    } catch (error) {
        hideLoading();
        console.error(error);
        if (error.message.includes('API Key')) {
            alert('⚠️ لم يتم العثور على مفتاح API. الرجاء إدخاله في ملف js/gemini-service.js');
        } else {
            alert('حدث خطأ في الاتصال بالذكاء الاصطناعي: ' + error.message);
        }
    }
}

// ==========================================
// Stage 2: Dialogue & Action Engine Logic
// ==========================================
async function handleSceneGeneration() {
    const sceneDesc = document.getElementById('sceneDescription').value;
    const charName = document.getElementById('charName').value || 'الدمية';

    if (!sceneDesc) {
        alert('الرجاء وصف المشهد أولاً');
        return;
    }

    showLoading('جاري كتابة السيناريو والحركة...');

    // 1. Construct the System Prompt
    const prompt = `
Act as an expert Puppet Theater Dramaturg.
Task: Convert the scene description into a structured script.
Context:
- Main Character: ${charName}
- Scene: "${sceneDesc}"

Constraints:
- Focus on PHYSICAL ACTION (puppets need movement).
- Keep dialogue short and suitable for kids.
- Characters: "${charName}" and others if implicit in scene.
- Language: Arabic.

Output Format: STRICTLY JSON Array of objects. Do NOT use Markdown formatting.
Example: [{"char": "Name", "dialogue": "Hello", "action": "Waves hand"}]
    `.trim();

    try {
        // 2. Call Gemini API
        let responseText = await geminiAgent.generateContent(prompt);

        // Clean JSON formatting if Gemini adds markdown
        responseText = geminiAgent.cleanJson(responseText);

        // 3. Parse JSON
        let scriptData;
        try {
            scriptData = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse JSON:', responseText);
            throw new Error('فشل في معالجة رد الذكاء الاصطناعي (تنسيق غير صحيح)');
        }

        // 4. Render Table
        let tableHtml = `
        <table class="script-table">
            <thead>
                <tr>
                    <th>الشخصية</th>
                    <th>الحوار (ماذا تقول)</th>
                    <th>الحركة (ماذا تفع)</th>
                </tr>
            </thead>
            <tbody>
        `;

        scriptData.forEach(row => {
            tableHtml += `
            <tr>
                <td class="character-cell">${row.char || row.character}</td>
                <td class="dialogue-cell">${row.dialogue}</td>
                <td class="action-cell">(${row.action})</td>
            </tr>
            `;
        });

        tableHtml += `</tbody></table>`;

        // 5. Display Result
        hideLoading();
        document.getElementById('sceneTableContainer').innerHTML = tableHtml;
        document.getElementById('prompt2').textContent = prompt;
        document.getElementById('sceneOutput').classList.add('active');
        document.getElementById('toStage3Btn').style.display = 'inline-block';

        // Store script for next stage
        window.currentScript = scriptData;

    } catch (error) {
        hideLoading();
        console.error(error);
        alert('حدث خطأ: ' + error.message);
    }
}

// ==========================================
// Stage 3: Values Checker Logic
// ==========================================
async function handleValuesCheck() {
    if (!window.currentScript) {
        alert('لا يوجد نص لتحليله!');
        return;
    }

    showLoading('جاري تحليل القيم التربوية للنص...');

    // 1. Construct the System Prompt
    const scriptText = JSON.stringify(window.currentScript);
    const prompt = `
Act as an Educational Values Expert for Children.
Task: Analyze this puppet show script for values.
Script: ${scriptText}

Check for:
1. Positive Values (e.g., honesty, helping, courage).
2. Negative Behaviors (e.g., lying, aggression).
3. Suggestions for improvement.

Output requirements:
- Language: Arabic.
- Format: HTML div structure with icons.
- Use <div class="values-feedback"> and <h4> for sections.
    `.trim();

    try {
        // 2. Call Gemini API
        const responseText = await geminiAgent.generateContent(prompt);

        // 3. Display Result
        hideLoading();
        document.getElementById('valuesContent').innerHTML = responseText;
        document.getElementById('prompt3').textContent = prompt;
        document.getElementById('valuesOutput').classList.add('active');
        document.getElementById('finishBtn').style.display = 'inline-block';

    } catch (error) {
        hideLoading();
        console.error(error);
        alert('حدث خطأ: ' + error.message);
    }
}


// ==========================================
// Utilities & Navigation
// ==========================================
function setupNavigation() {
    // Buttons to move between stages
    document.getElementById('toStage2Btn').onclick = () => activateStep(2);
    document.getElementById('backToStage1').onclick = () => activateStep(1);
    document.getElementById('toStage3Btn').onclick = () => activateStep(3);
    document.getElementById('backToStage2').onclick = () => activateStep(2);

    // Finish Button
    document.getElementById('finishBtn').onclick = () => {
        alert('تم حفظ المسرحية في ملفك!');
        window.location.href = 'dashboard.html';
    };
}

function activateStep(stepNum) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
    // Show target step
    document.getElementById(`stage${stepNum}`).classList.add('active');

    // Update Progress Bar
    document.querySelectorAll('.progress-step').forEach(el => {
        const step = parseInt(el.dataset.step);
        if (step === stepNum) {
            el.classList.add('active');
            el.classList.remove('completed');
        } else if (step < stepNum) {
            el.classList.add('completed');
            el.classList.remove('active');
        } else {
            el.classList.remove('active', 'completed');
        }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoading(text) {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Debugging: Check Models
const checkModelsBtn = document.getElementById('checkModelsBtn');
if (checkModelsBtn) {
    checkModelsBtn.addEventListener('click', async () => {
        try {
            alert('جاري فحص الموديلات... راجع الـ Console');
            const models = await geminiAgent.listModels();
            console.log(models);
            if (models.models) {
                const modelNames = models.models.map(m => m.name).join('\n');
                alert('الموديلات المتاحة:\n' + modelNames);
            } else {
                alert('لم يتم العثور على موديلات (راجع الخطأ في Console)');
            }
        } catch (error) {
            alert('خطأ في الفحص: ' + error.message);
        }
    });
}
