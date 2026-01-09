// Dialogue Engine - AI-Powered Dialogue Generation (Groq Integration)
// Generates personalized puppet theatre dialogues using Groq AI

class DialogueEngine {
    constructor(assessmentData) {
        this.assessment = assessmentData;
        this.language = assessmentData.settings.language;
        this.storyType = assessmentData.settings.storyType;
        this.length = assessmentData.settings.length;
        this.puppets = [];
    }

    async loadPuppets() {
        const puppetIds = this.assessment.puppets;
        this.puppets = [];

        for (const id of puppetIds) {
            try {
                const puppetDoc = await db.collection('puppets').doc(id).get();
                if (puppetDoc.exists) {
                    this.puppets.push({
                        id: id,
                        ...puppetDoc.data()
                    });
                }
            } catch (error) {
                console.error('Error loading puppet:', error);
                // Fallback mock puppet if Firebase fails
                this.puppets.push({
                    id: id,
                    name: `دمية ${id}`,
                    description: 'شخصية مسرحية',
                    category: 'animals'
                });
            }
        }

        // Ensure at least one puppet
        if (this.puppets.length === 0) {
            this.puppets.push({
                id: 'default',
                name: 'الأرنب',
                description: 'أرنب لطيف وذكي',
                category: 'animals'
            });
        }
    }

    /**
     * Main generation method - uses Groq AI
     * ⚠️ INCLUDES LENGTH VALIDATION
     */
    async generate() {
        await this.loadPuppets();

        // ⚠️ CRITICAL: Verify AI service is available
        if (typeof geminiAgent === 'undefined' || !geminiAgent) {
            console.error('❌ CRITICAL ERROR: geminiAgent is not defined!');
            console.error('🔧 FIX: Ensure gemini-service.js is loaded in HTML before dialogue-engine.js');
            console.error('📄 File: student/dialogue-editor.html');
            alert('⚠️ خطأ: خدمة الذكاء الاصطناعي غير متوفرة.\n\nسيتم استخدام حوار احتياطي كامل (30+ سطراً).');
            return this.generateFallbackDialogue();
        }

        // Build AI prompt based on assessment
        const prompt = this.buildAIPrompt();
        const lengthSpec = this.getLengthSpecs();

        try {
            // Call Groq AI
            console.log('🤖 Calling Groq AI to generate dialogue...');
            const aiResponse = await geminiAgent.generateContent(prompt);

            // Parse JSON response with repair capability
            const cleanedResponse = geminiAgent.cleanJson(aiResponse);
            console.log('🧹 Cleaned response length:', cleanedResponse.length);

            let dialogueData;
            try {
                dialogueData = JSON.parse(cleanedResponse);
            } catch (e) {
                console.warn('⚠️ Standard JSON parse failed, attempting advanced repair...');
                dialogueData = this.tryRepairJson(cleanedResponse);
            }

            // ⚠️ VALIDATE LENGTH - CRITICAL CHECK
            let formattedDialogue = this.formatDialogue(dialogueData.dialogue);

            if (formattedDialogue.length < lengthSpec.min) {
                console.warn(`⚠️ Generated dialogue is TOO SHORT: ${formattedDialogue.length} lines (minimum: ${lengthSpec.min})`);
                console.warn('⚠️ Extending dialogue to meet requirements...');
                formattedDialogue = this.extendDialogue(formattedDialogue, lengthSpec.min);
            }

            console.log(`✅ Dialogue generated successfully: ${formattedDialogue.length} lines (target: ${lengthSpec.min}-${lengthSpec.max})`);

            return {
                title: dialogueData.title || this.generateFallbackTitle(),
                language: this.language,
                puppets: this.puppets,
                content: formattedDialogue,
                metadata: this.generateMetadata()
            };

        } catch (error) {
            console.error('❌ AI Generation Error:', error);
            console.error('Error details:', error.message);
            // Don't alert immediately, try to fallback gracefully if possible
            console.warn('⚠️ Switching to fallback dialogue due to critical error.');
            return this.generateFallbackDialogue();
        }
    }

    /**
     * Attempts to repair truncated JSON responses
     */
    tryRepairJson(jsonString) {
        try {
            // 1. Try to find the last valid closing object inside the array
            // Look for the last occurrence of "}," which usually indicates end of a dialogue line obj
            const lastObjectEnd = jsonString.lastIndexOf('},');

            if (lastObjectEnd > -1) {
                // Cut off everything after the last valid object
                let repaired = jsonString.substring(0, lastObjectEnd + 1);
                // Close the array and the main object
                repaired += ']}';

                console.log('🔧 Repaired JSON attempt 1...');
                return JSON.parse(repaired);
            }

            // 2. If that fails, try aggressive regex extraction
            console.log('🔧 JSON repair attempt 2 (Regex extraction)...');
            const titleMatch = jsonString.match(/"title":\s*"([^"]+)"/);
            const title = titleMatch ? titleMatch[1] : "قصة مسرحية";

            // Extract all complete objects {"text":..., "action":...}
            const dialogueRegex = /{[^{}]*"text"[^{}]*"action"[^{}]*}/g;
            const matches = jsonString.match(dialogueRegex);

            if (matches && matches.length > 0) {
                const dialogue = matches.map(m => {
                    try { return JSON.parse(m); } catch (e) { return null; }
                }).filter(d => d);

                if (dialogue.length > 0) {
                    return { title, dialogue };
                }
            }

            throw new Error('Could not repair JSON response');

        } catch (repairError) {
            console.error('❌ JSON Repair Failed:', repairError);
            throw repairError; // Re-throw to trigger fallback
        }
    }
}

/**
 * Build comprehensive AI prompt - ENHANCED for complete theatrical dialogue
 * WITH STRICT LENGTH ENFORCEMENT
 */
buildAIPrompt() {
    const puppet1 = this.puppets[0];
    const puppet2 = this.puppets[1] || puppet1;

    // Extract story details from new assessment structure
    const story = this.assessment.story || {};
    const basic = this.assessment.basic || {};
    const lengthSpec = this.getLengthSpecs();

    const languageNames = {
        'ar': 'Arabic',
        'he': 'Hebrew',
        'en': 'English'
    };

    // Genre descriptions
    const genreDescriptions = {
        'fantasy': { 'ar': 'خيالية مع سحر ومخلوقات', 'he': 'פנטזיה עם קסם ויצורים', 'en': 'Fantasy with magic and creatures' },
        'realistic': { 'ar': 'واقعية من الحياة اليومية', 'he': 'ריאליסטית מהחיים', 'en': 'Realistic from daily life' },
        'adventure': { 'ar': 'مغامرة مشوقة', 'he': 'הרפתקה מרגשת', 'en': 'Exciting adventure' },
        'educational': { 'ar': 'تعليمية STEM', 'he': 'חינוכית STEM', 'en': 'Educational STEM' }
    };

    // Ending types
    const endingDescriptions = {
        'happy': { 'ar': 'نهاية سعيدة', 'he': 'סוף שמח', 'en': 'Happy ending' },
        'open': { 'ar': 'نهاية مفتوحة', 'he': 'סוף פתוח', 'en': 'Open ending' },
        'lesson': { 'ar': 'نهاية تعليمية', 'he': 'סוף חינוכי', 'en': 'Educational ending' },
        'surprise': { 'ar': 'نهاية مفاجئة', 'he': 'סוף מפתיע', 'en': 'Surprise ending' }
    };

    // Location descriptions
    const locationNames = {
        'forest': { 'ar': 'غابة', 'he': 'יער', 'en': 'Forest' },
        'school': { 'ar': 'مدرسة', 'he': 'בית ספר', 'en': 'School' },
        'space': { 'ar': 'الفضاء', 'he': 'חלל', 'en': 'Space' },
        'home': { 'ar': 'البيت', 'he': 'בית', 'en': 'Home' },
        'castle': { 'ar': 'قصر', 'he': 'טירה', 'en': 'Castle' },
        'ocean': { 'ar': 'البحر', 'he': 'ים', 'en': 'Ocean' },
        'custom': { 'ar': story.customLocation || 'مكان خاص', 'he': story.customLocation || 'מקום מיוחד', 'en': story.customLocation || 'Custom location' }
    };

    const genreDesc = genreDescriptions[story.genre]?.[this.language] || story.genre;
    const endingDesc = endingDescriptions[story.ending]?.[this.language] || story.ending;
    const locationDesc = locationNames[story.location]?.[this.language] || story.location;

    const prompt = `You are an EXPERT puppet theater script writer for children aged 6-12.

⚠️⚠️⚠️ CRITICAL LENGTH REQUIREMENT - READ CAREFULLY ⚠️⚠️⚠️
This show MUST be a COMPLETE, FULL-LENGTH theatrical performance with AT LEAST ${lengthSpec.min} DIALOGUE LINES!
ABSOLUTELY NO EXCEPTIONS! Short 5-line dialogues are COMPLETELY UNACCEPTABLE!

🚫 AUTOMATIC REJECTION IF:
- Total dialogue lines are less than ${lengthSpec.min} ❌
- Story is incomplete or rushed ❌
- Missing any of the 5 theatrical structure parts ❌

📚 STUDENT & STORY CONTEXT:
- Student Grade: ${basic.grade || 'General'}
- Favorite Subjects: ${basic.subjects?.join(', ') || 'General'}
- Puppet 1: ${puppet1.name} (${puppet1.description || 'puppet character'})
- Puppet 2: ${puppet2.name} (${puppet2.description || 'puppet character'})
- Language: ${languageNames[this.language]} (${this.language})

🎭 STORY REQUIREMENTS (USE THESE DETAILS):
- Genre: ${genreDesc}
- Topic: ${story.topic || 'Create engaging topic'}
- Main Problem/Challenge: ${story.problem || 'Create interesting conflict'}
- Value/Lesson to Teach: ${story.value || 'Implicit positive message'}
- Ending Type: ${endingDesc}
- Location/Setting: ${locationDesc}

🎯 YOUR MISSION:
Create a dialogue that:
1. Follows the ${genreDesc} genre
2. Explores the topic: "${story.topic}"
3. Centers around this problem: "${story.problem}"
4. Subtly teaches this value: "${story.value || 'friendship/cooperation'}"
5. Ends with a ${endingDesc}
6. Takes place in: ${locationDesc}
7. Is appropriate for Grade ${basic.grade}
8. Incorporates elements from: ${basic.subjects?.join(', ') || 'general education'}

🎭 MANDATORY LENGTH REQUIREMENTS (NON-NEGOTIABLE):
- ABSOLUTE MINIMUM dialogue lines: ${lengthSpec.min} ⚠️ MUST MEET THIS!
- RECOMMENDED dialogue lines: ${lengthSpec.max}
- TARGET: Write ${lengthSpec.max} lines for best quality
- ⚠️⚠️⚠️ SHOWS WITH LESS THAN ${lengthSpec.min} LINES WILL BE COMPLETELY REJECTED ⚠️⚠️⚠️

TASK: Create a COMPLETE, PERFORMABLE, FULL-LENGTH puppet theater show in ${languageNames[this.language]}.

OUTPUT FORMAT (JSON only, no markdown, no code blocks):
{
  "title": "عنوان المسرحية الكامل",
  "dialogue": [
    {"puppet": "${puppet1.name}", "text": "dialogue text", "action": "stage direction"},
    {"puppet": "${puppet2.name}", "text": "dialogue text", "action": "stage direction"},
    ... (continue for AT LEAST ${lengthSpec.min} lines)
  ]
}

🎭 MANDATORY 5-PART THEATRICAL STRUCTURE (EVERY PART IS REQUIRED):

1️⃣ OPENING SCENE (MINIMUM 6-10 lines):
   - Puppets enter the stage with detailed actions
   - Greet each other and the audience warmly
   - Establish the setting, time, and atmosphere
   - Introduce main characters' personalities clearly
   - Set up the main problem/adventure/goal
   - Create curiosity and engagement

2️⃣ RISING ACTION (MINIMUM ${Math.floor(lengthSpec.min * 0.5)}-${Math.floor(lengthSpec.max * 0.5)} lines) - THE LONGEST PART:
   - Develop the story gradually with multiple scenes
   - Build tension and interest progressively
   - Show rich character interactions and dialogue
   - Introduce challenges, conflicts, or obstacles
   - Include educational content naturally
   - Add emotional depth and character development
   - ⚠️ This is the MAIN BODY - make it substantial!

3️⃣ CLIMAX (MINIMUM 6-10 lines):
   - The most exciting and important moment
   - The main problem reaches its peak
   - Critical decision or dramatic action
   - High emotional intensity
   - The turning point of the story

4️⃣ FALLING ACTION (MINIMUM 5-8 lines):
   - Resolution begins to unfold
   - Show consequences of the climax
   - Characters process what happened
   - Tension gradually decreases
   - Lessons become clear

5️⃣ CONCLUSION (MINIMUM 4-7 lines):
   - Clear, satisfying ending with a message
   - Characters reflect on what they learned
   - Say goodbye to each other and audience
   - Leave audience with positive feeling and clear takeaway
   - Proper theatrical closure

📏 LENGTH ENFORCEMENT RULES:
- Count every single dialogue line in the "dialogue" array
- If you have ${lengthSpec.min} lines minimum, you MUST write AT LEAST ${lengthSpec.min} lines
- DO NOT stop at 3, 4, 5, or 10 lines - this is TOO SHORT
- A complete show needs proper development, not just greetings
- ⚠️ SHOWS WITH LESS THAN ${lengthSpec.min} LINES WILL BE REJECTED

🎬 CONTENT REQUIREMENTS:
1. Write ENTIRELY in ${languageNames[this.language]}
2. Age-appropriate language (6-12 years)
3. DETAILED stage directions: يدخل من اليمين، يقفز بفرح، يجلس حزيناً، ينظر للجمهور، يمسك بشيء، يركض، etc.
4. Story type: ${genreDesc}
5. Make it ENGAGING, MEANINGFUL, and EDUCATIONAL
6. Include emotional depth, not just simple greetings
7. Each line MUST have both "text" (what puppet says) and "action" (what puppet does)
8. The show must tell a COMPLETE STORY with beginning, middle, and end
9. Include meaningful dialogue, not filler

❌ UNACCEPTABLE OUTPUT:
- Short greetings-only dialogues (4-5 lines) ❌
- Incomplete stories ❌
- Missing structure elements ❌
- Dialogue shorter than ${lengthSpec.min} lines ❌
- Repetitive or meaningless content ❌

✅ WHAT IS EXPECTED:
- A FULL theatrical show ready to perform ✅
- Complete story arc with all 5 structural elements ✅
- AT LEAST ${lengthSpec.min} meaningful dialogue lines ✅
- Rich, engaging content throughout ✅
- Clear educational or moral message ✅

⚠️⚠️⚠️ FINAL REMINDER - COUNT YOUR LINES CAREFULLY ⚠️⚠️⚠️
Before submitting your response:
1. COUNT how many objects are in your "dialogue" array
2. VERIFY it's AT LEAST ${lengthSpec.min} lines
3. If it's less than ${lengthSpec.min}, ADD MORE CONTENT until you reach the minimum
4. Remember: A complete theatrical show needs substantial development
5. DO NOT submit if you have less than ${lengthSpec.min} dialogue lines!

✅ YOUR GOAL: Generate EXACTLY ${lengthSpec.max} dialogue lines for a perfect show!
✅ MINIMUM ACCEPTABLE: ${lengthSpec.min} dialogue lines
❌ UNACCEPTABLE: Anything less than ${lengthSpec.min} lines

NOW GENERATE THE COMPLETE ${lengthSpec.min}-${lengthSpec.max} LINE THEATRICAL SHOW IN PURE JSON:`;

    return prompt;
}


/**
 * Extract emotional data from assessment
 */
extractEmotions() {
    const emotions = [];
    const assessment = this.assessment.assessment;

    if (assessment) {
        if (assessment.mood) emotions.push(`mood: ${assessment.mood}`);
        if (assessment.energy) emotions.push(`energy: ${assessment.energy}`);
        if (assessment.confidence) emotions.push(`confidence: ${assessment.confidence}`);
    }

    return emotions.length > 0 ? emotions.join(', ') : 'positive and curious';
}

/**
 * Extract preference data
 */
extractPreferences() {
    const prefs = [];
    const assessment = this.assessment.assessment;

    if (assessment) {
        if (assessment.topics && assessment.topics.length > 0) {
            prefs.push(`interests: ${assessment.topics.join(', ')}`);
        }
        if (assessment.favoriteActivities && assessment.favoriteActivities.length > 0) {
            prefs.push(`activities: ${assessment.favoriteActivities.join(', ')}`);
        }
    }

    return prefs.length > 0 ? prefs.join('; ') : 'storytelling and creativity';
}

/**
 * Get length specifications - INCREASED for complete theatrical shows
 * ⚠️ CRITICAL: User requires MINIMUM 30 lines for ANY dialogue
 */
getLengthSpecs() {
    const specs = {
        'short': { min: 30, max: 40 },    // User minimum: 30 lines
        'medium': { min: 40, max: 60 },   // Medium shows: 40-60 lines
        'long': { min: 60, max: 100 }     // Long shows: 60-100 lines
    };
    return specs[this.length] || specs['medium'];
}

/**
 * Format dialogue array
 */
formatDialogue(dialogueArray) {
    if (!Array.isArray(dialogueArray)) {
        console.error('Invalid dialogue format');
        return [];
    }

    return dialogueArray.map(line => ({
        speaker: line.puppet || 'دمية',
        text: line.text || '',
        action: line.action || ''
    }));
}

/**
 * Extend dialogue to meet minimum length requirements
 * ⚠️ Fallback mechanism if AI fails to generate enough lines
 */
extendDialogue(dialogue, minLength) {
    if (!dialogue || dialogue.length >= minLength) {
        return dialogue;
    }

    const extended = [...dialogue];
    const puppet1 = this.puppets[0];
    const puppet2 = this.puppets[1] || puppet1;

    const extensionTemplates = {
        'ar': [
            { text: 'هذا ممتع جداً! دعني أخبرك المزيد...', action: 'ينظر للجمهور بحماس' },
            { text: 'انتظر، لدي فكرة رائعة!', action: 'يقفز من الفرح' },
            { text: 'هل تعلم؟ هناك شيء مهم يجب أن أشاركه معك', action: 'يتحرك أقرب' },
            { text: 'دعني أفكر في هذا للحظة...', action: 'يضع يده على ذقنه' },
            { text: 'هذا يذكرني بشيء مهم!', action: 'يرفع يده' },
            { text: 'واو! لم أفكر في هذا من قبل!', action: 'يبدو متفاجئاً' },
            { text: 'إذاً ماذا نفعل الآن؟', action: 'ينظر حوله' },
            { text: 'أعتقد أن لدينا خطة جيدة!', action: 'يومئ برأسه' },
            { text: 'هل أنت مستعد؟ لنبدأ!', action: 'يستعد للحركة' },
            { text: 'معاً، نستطيع أن نفعل أي شيء!', action: 'يمد يده للمصافحة' }
        ],
        'he': [
            { text: '!זה ממש מעניין! תן לי לספר לך עוד', action: 'מסתכל בקהל בהתלהבות' },
            { text: '!רגע, יש לי רעיון נהדר', action: 'קופץ משמחה' },
            { text: 'את יודע? יש משהו חשוב שאני צריך לשתף איתך', action: 'זז קרוב יותר' },
            { text: '...תן לי לחשוב על זה לרגע', action: 'שם יד על הסנטר' },
            { text: '!זה מזכיר לי משהו חשוב', action: 'מרים יד' }
        ],
        'en': [
            { text: 'This is so exciting! Let me tell you more...', action: 'looks at audience with excitement' },
            { text: 'Wait, I have a great idea!', action: 'jumps with joy' },
            { text: 'You know what? There\'s something important I need to share', action: 'moves closer' },
            { text: 'Let me think about this for a moment...', action: 'puts hand on chin' },
            { text: 'This reminds me of something important!', action: 'raises hand' }
        ]
    };

    const templates = extensionTemplates[this.language] || extensionTemplates['ar'];
    let currentSpeaker = puppet1.name;

    // Add dialogue lines alternating between puppets until we reach minimum
    while (extended.length < minLength) {
        const template = templates[extended.length % templates.length];
        extended.push({
            speaker: currentSpeaker,
            text: template.text,
            action: template.action
        });

        // Alternate speakers
        currentSpeaker = (currentSpeaker === puppet1.name) ? puppet2.name : puppet1.name;
    }

    console.log(`✅ Dialogue extended from ${dialogue.length} to ${extended.length} lines`);
    return extended;
}

/**
 * Generate metadata
 */
generateMetadata() {
    return {
        generationType: 'ai-powered',
        engine: 'groq-llama-3.3',
        timestamp: Date.now(),
        language: this.language,
        storyType: this.storyType,
        puppetCount: this.puppets.length
    };
}

/**
 * Fallback title generation
 */
generateFallbackTitle() {
    const puppet1Name = this.puppets[0]?.name || 'الدمية';
    const titles = {
        'ar': `مغامرة ${puppet1Name}`,
        'he': `ההרפתקה של ${puppet1Name}`,
        'en': `${puppet1Name}'s Adventure`
    };
    return titles[this.language] || titles['ar'];
}

/**
 * Fallback dialogue if AI fails
 * ⚠️ UPDATED: Now generates 30+ lines minimum
 */
generateFallbackDialogue() {
    const puppet1 = this.puppets[0];
    const puppet2 = this.puppets[1] || puppet1;
    const lengthSpec = this.getLengthSpecs();

    const fallbackLines = {
        'ar': [
            // Opening (6 lines)
            { speaker: puppet1.name, text: `مرحباً أيها الأصدقاء! أنا ${puppet1.name}!`, action: 'يدخل من اليمين ويلوّح بيده للجمهور' },
            { speaker: puppet2.name, text: `وأنا ${puppet2.name}! أهلاً بكم جميعاً!`, action: 'يدخل من اليسار ويقفز فرحاً' },
            { speaker: puppet1.name, text: `${puppet2.name}، كيف حالك اليوم؟`, action: 'يتحرك أقرب إلى الدمية الأخرى' },
            { speaker: puppet2.name, text: 'أنا بخير! ولكن لدي سؤال مهم...', action: 'يبدو متحمساً' },
            { speaker: puppet1.name, text: 'ما هو؟ أنا أحب الأسئلة!', action: 'يجلس بانتباه' },
            { speaker: puppet2.name, text: 'هل تريد أن نتعلم شيئاً جديداً اليوم؟', action: 'ينظر للجمهور' },

            // Rising Action (15 lines)
            { speaker: puppet1.name, text: 'فكرة رائعة! ماذا تقترح؟', action: 'يقفز من الحماس' },
            { speaker: puppet2.name, text: 'لنتعلم عن الصداقة والتعاون!', action: 'يرفع يده عالياً' },
            { speaker: puppet1.name, text: 'الصداقة؟ هذا موضوع جميل جداً!', action: 'يبتسم بسعادة' },
            { speaker: puppet2.name, text: 'هل تعلم أن الأصدقاء يساعدون بعضهم البعض؟', action: 'يمشي ذهاباً وإياباً' },
            { speaker: puppet1.name, text: 'نعم! ومثلما نحن نتحدث الآن معاً!', action: 'يومئ برأسه' },
            { speaker: puppet2.name, text: 'بالضبط! هل لديك أصدقاء آخرون؟', action: 'يسأل بفضول' },
            { speaker: puppet1.name, text: 'نعم، لدي العديد من الأصدقاء الرائعين!', action: 'يعد على أصابعه' },
            { speaker: puppet2.name, text: 'وأنا أيضاً! الأصدقاء يجعلون الحياة أجمل!', action: 'يدور في دائرة' },
            { speaker: puppet1.name, text: 'هل تعلم؟ الأصدقاء الحقيقيون يستمعون لبعضهم', action: 'يضع يده على أذنه' },
            { speaker: puppet2.name, text: 'صحيح! وأيضاً يشاركون الألعاب والأفكار', action: 'يقفز ويلعب' },
            { speaker: puppet1.name, text: 'دعني أخبرك قصة عن صديق ساعدني يوماً ما...', action: 'يستعد لحكاية القصة' },
            { speaker: puppet2.name, text: 'أحب القصص! من فضلك احكِ لي!', action: 'يجلس ويستمع بانتباه' },
            { speaker: puppet1.name, text: 'كنت أحاول الوصول إلى شجرة عالية جداً...', action: 'يشير إلى الأعلى' },
            { speaker: puppet2.name, text: 'وماذا حدث بعد ذلك؟', action: 'يبدو متشوقاً' },
            { speaker: puppet1.name, text: 'جاء صديقي وساعدني في الصعود!', action: 'يحرك يديه كأنه يصعد' },
            { speaker: puppet2.name, text: 'واو! هذا هو معنى الصداقة الحقيقية!', action: 'يصفق بيديه' },

            // Climax (5 lines)
            { speaker: puppet1.name, text: 'والآن أفهم أن الأصدقاء قوة عظيمة!', action: 'يقف بفخر' },
            { speaker: puppet2.name, text: 'معاً نستطيع فعل أشياء مذهلة!', action: 'يمسك يد الدمية الأخرى' },
            { speaker: puppet1.name, text: 'هل تريد أن تكون صديقي المقرب؟', action: 'يمد يده' },
            { speaker: puppet2.name, text: 'بكل تأكيد! أنت صديقي المفضل!', action: 'يصافحه بحرارة' },
            { speaker: puppet1.name, text: 'هذا أجمل شيء سمعته اليوم!', action: 'يقفز من الفرح' },

            // Falling Action (3 lines)
            { speaker: puppet2.name, text: 'يجب أن نعلّم الجميع عن الصداقة!', action: 'ينظر للجمهور' },
            { speaker: puppet1.name, text: 'نعم! الصداقة تجعل العالم مكاناً أفضل!', action: 'يفتح ذراعيه' },
            { speaker: puppet2.name, text: 'ماذا تقول لو نشارك قصصنا مع الأطفال؟', action: 'يشير للجمهور' },

            // Conclusion (3 lines)
            { speaker: puppet1.name, text: 'أصدقائي الأطفال، تذكروا دائماً أن تكونوا أصدقاء طيبين!', action: 'يتحدث للجمهور مباشرة' },
            { speaker: puppet2.name, text: 'ساعدوا بعضكم البعض واستمعوا لبعضكم!', action: 'يلوح للجمهور' },
            { speaker: puppet1.name, text: 'وداعاً يا أصدقاء! نراكم قريباً في مغامرة جديدة!', action: 'يخرج من اليمين ويلوح' },
            { speaker: puppet2.name, text: 'إلى اللقاء! كونوا أصدقاء رائعين!', action: 'يخرج من اليسار ويلوح' }
        ],
        'he': [
            { speaker: puppet1.name, text: `!שלום חברים! אני ${puppet1.name}`, action: 'נכנס מימין ומנופף ביד' },
            { speaker: puppet2.name, text: `!ואני ${puppet2.name}! שלום לכולם`, action: 'נכנס משמאל וקופץ בשמחה' },
            { speaker: puppet1.name, text: `${puppet2.name}, מה שלומך היום?`, action: 'זזה קרוב יותר' },
            { speaker: puppet2.name, text: '!אני בסדר! אבל יש לי שאלה חשובה', action: 'נראה נרגש' },
            { speaker: puppet1.name, text: '!מה זה? אני אוהב שאלות', action: 'יושב בתשומת לב' },
            { speaker: puppet2.name, text: '?רוצה ללמוד משהו חדש היום', action: 'מסתכל בקהל' },
            { speaker: puppet1.name, text: '!רעיון מעולה! מה אתה מציע', action: 'קופץ מהתרגשות' },
            { speaker: puppet2.name, text: '!בואו נלמד על חברות ושיתוף פעולה', action: 'מרים יד גבוה' },
            { speaker: puppet1.name, text: '!חברות? זה נושא יפה מאוד', action: 'מחייך בשמחה' },
            { speaker: puppet2.name, text: '?אתה יודע שחברים עוזרים אחד לשני', action: 'הולך קדימה ואחורה' },
            { speaker: puppet1.name, text: '!כן! בדיוק כמו שאנחנו מדברים עכשיו ביחד', action: 'מנהן בראשו' },
            { speaker: puppet2.name, text: '?בדיוק! יש לך חברים אחרים', action: 'שואל בסקרנות' },
            { speaker: puppet1.name, text: '!כן, יש לי הרבה חברים נהדרים', action: 'סופר על אצבעותיו' },
            { speaker: puppet2.name, text: '!גם לי! חברים עושים את החיים יפים יותר', action: 'מסתובב במעגל' },
            { speaker: puppet1.name, text: 'אתה יודע? חברים אמיתיים מקשיבים אחד לשני', action: 'שם יד על אוזן' },
            { speaker: puppet2.name, text: 'נכון! וגם חולקים משחקים ורעיונות', action: 'קופץ ומשחק' },
            { speaker: puppet1.name, text: '...תן לי לספר לך סיפור על חבר שעזר לי פעם', action: 'מתכונן לספר' },
            { speaker: puppet2.name, text: '!אני אוהב סיפורים! בבקשה ספר לי', action: 'יושב ומקשיב בתשומת לב' },
            { speaker: puppet1.name, text: '...ניסיתי להגיע לעץ גבוה מאוד', action: 'מצביע למעלה' },
            { speaker: puppet2.name, text: '?ומה קרה אחר כך', action: 'נראה מתרגש' },
            { speaker: puppet1.name, text: '!החבר שלי בא ועזר לי לטפס', action: 'מניע ידיים כאילו מטפס' },
            { speaker: puppet2.name, text: '!וואו! זה המשמעות של חברות אמיתית', action: 'מוחא כפיים' },
            { speaker: puppet1.name, text: '!ועכשיו אני מבין שחברים הם כוח גדול', action: 'עומד בגאווה' },
            { speaker: puppet2.name, text: '!ביחד אנחנו יכולים לעשות דברים מדהימים', action: 'אוחז ביד השנייה' },
            { speaker: puppet1.name, text: '?רוצה להיות החבר הקרוב שלי', action: 'מושיט יד' },
            { speaker: puppet2.name, text: '!בהחלט! אתה החבר האהוב עליי', action: 'לוחץ ידו בחום' },
            { speaker: puppet1.name, text: '!זה הדבר הכי יפה ששמעתי היום', action: 'קופץ משמחה' },
            { speaker: puppet2.name, text: '!אנחנו צריכים ללמד את כולם על חברות', action: 'מסתכל בקהל' },
            { speaker: puppet1.name, text: '!כן! חברות עושה את העולם מקום טוב יותר', action: 'פותח זרועותיו' },
            { speaker: puppet2.name, text: '?מה אתה אומר אם נשתף את הסיפורים שלנו עם הילדים', action: 'מצביע לקהל' },
            { speaker: puppet1.name, text: '!חברים ילדים, תזכרו תמיד להיות חברים טובים', action: 'מדבר ישירות לקהל' },
            { speaker: puppet2.name, text: '!עזרו אחד לשני והקשיבו אחד לשני', action: 'מנופף לקהל' },
            { speaker: puppet1.name, text: '!להתראות חברים! נתראה בקרוב בהרפתקה חדשה', action: 'יוצא מימין ומנופף' },
            { speaker: puppet2.name, text: '!להתראות! תהיו חברים נהדרים', action: 'יוצא משמאל ומנופף' }
        ],
        'en': [
            { speaker: puppet1.name, text: `Hello friends! I'm ${puppet1.name}!`, action: 'enters from right and waves' },
            { speaker: puppet2.name, text: `And I'm ${puppet2.name}! Welcome everyone!`, action: 'enters from left and jumps happily' },
            { speaker: puppet1.name, text: `${puppet2.name}, how are you today?`, action: 'moves closer' },
            { speaker: puppet2.name, text: 'I\'m great! But I have an important question...', action: 'looks excited' },
            { speaker: puppet1.name, text: 'What is it? I love questions!', action: 'sits attentively' },
            { speaker: puppet2.name, text: 'Do you want to learn something new today?', action: 'looks at audience' },
            { speaker: puppet1.name, text: 'Great idea! What do you suggest?', action: 'jumps with excitement' },
            { speaker: puppet2.name, text: 'Let\'s learn about friendship and cooperation!', action: 'raises hand high' },
            { speaker: puppet1.name, text: 'Friendship? That\'s a beautiful topic!', action: 'smiles happily' },
            { speaker: puppet2.name, text: 'Do you know that friends help each other?', action: 'walks back and forth' },
            { speaker: puppet1.name, text: 'Yes! Just like we\'re talking together now!', action: 'nods head' },
            { speaker: puppet2.name, text: 'Exactly! Do you have other friends?', action: 'asks curiously' },
            { speaker: puppet1.name, text: 'Yes, I have many wonderful friends!', action: 'counts on fingers' },
            { speaker: puppet2.name, text: 'Me too! Friends make life more beautiful!', action: 'spins in circle' },
            { speaker: puppet1.name, text: 'You know what? Real friends listen to each other', action: 'puts hand on ear' },
            { speaker: puppet2.name, text: 'True! And they also share games and ideas', action: 'jumps and plays' },
            { speaker: puppet1.name, text: 'Let me tell you a story about a friend who helped me once...', action: 'prepares to tell story' },
            { speaker: puppet2.name, text: 'I love stories! Please tell me!', action: 'sits and listens carefully' },
            { speaker: puppet1.name, text: 'I was trying to reach a very tall tree...', action: 'points upward' },
            { speaker: puppet2.name, text: 'And what happened next?', action: 'looks excited' },
            { speaker: puppet1.name, text: 'My friend came and helped me climb up!', action: 'moves hands like climbing' },
            { speaker: puppet2.name, text: 'Wow! That\'s what true friendship means!', action: 'claps hands' },
            { speaker: puppet1.name, text: 'And now I understand that friends are a great power!', action: 'stands proudly' },
            { speaker: puppet2.name, text: 'Together we can do amazing things!', action: 'holds the other\'s hand' },
            { speaker: puppet1.name, text: 'Do you want to be my close friend?', action: 'extends hand' },
            { speaker: puppet2.name, text: 'Absolutely! You\'re my favorite friend!', action: 'shakes hand warmly' },
            { speaker: puppet1.name, text: 'That\'s the best thing I\'ve heard today!', action: 'jumps with joy' },
            { speaker: puppet2.name, text: 'We should teach everyone about friendship!', action: 'looks at audience' },
            { speaker: puppet1.name, text: 'Yes! Friendship makes the world a better place!', action: 'opens arms wide' },
            { speaker: puppet2.name, text: 'What do you say we share our stories with the children?', action: 'points to audience' },
            { speaker: puppet1.name, text: 'My dear children friends, always remember to be good friends!', action: 'speaks directly to audience' },
            { speaker: puppet2.name, text: 'Help each other and listen to one another!', action: 'waves to audience' },
            { speaker: puppet1.name, text: 'Goodbye friends! See you soon in a new adventure!', action: 'exits right waving' },
            { speaker: puppet2.name, text: 'Bye! Be wonderful friends!', action: 'exits left waving' }
        ]
    };

    const selectedLines = fallbackLines[this.language] || fallbackLines['ar'];

    // Ensure minimum length using extendDialogue if needed
    let finalContent = selectedLines;
    if (finalContent.length < lengthSpec.min) {
        console.warn(`⚠️ Fallback dialogue is short (${finalContent.length} lines), extending...`);
        finalContent = this.extendDialogue(finalContent, lengthSpec.min);
    }

    return {
        title: this.generateFallbackTitle(),
        language: this.language,
        puppets: this.puppets,
        content: finalContent,
        metadata: {
            ...this.generateMetadata(),
            generationType: 'fallback'
        }
    };
}
}
