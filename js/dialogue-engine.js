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
     */
    async generate() {
        await this.loadPuppets();

        // Build AI prompt based on assessment
        const prompt = this.buildAIPrompt();

        try {
            // Call Groq AI
            const aiResponse = await geminiAgent.generateContent(prompt);

            // Parse JSON response
            const cleanedResponse = geminiAgent.cleanJson(aiResponse);
            const dialogueData = JSON.parse(cleanedResponse);

            return {
                title: dialogueData.title || this.generateFallbackTitle(),
                language: this.language,
                puppets: this.puppets,
                content: this.formatDialogue(dialogueData.dialogue),
                metadata: this.generateMetadata()
            };

        } catch (error) {
            console.error('AI Generation Error:', error);
            // Fallback to simple dialogue if AI fails
            return this.generateFallbackDialogue();
        }
    }

    /**
     * Build comprehensive AI prompt - ENHANCED for complete theatrical dialogue
     */
    buildAIPrompt() {
        const puppet1 = this.puppets[0];
        const puppet2 = this.puppets[1] || puppet1;

        // Extract meaningful assessment data
        const emotions = this.extractEmotions();
        const preferences = this.extractPreferences();
        const lengthSpec = this.getLengthSpecs();

        const languageNames = {
            'ar': 'Arabic',
            'he': 'Hebrew',
            'en': 'English'
        };

        const storyTypeDescriptions = {
            'educational': {
                'ar': 'تعليمي يعلم الأطفال مهارة أو معلومة',
                'he': 'חינוכי המלמד ילדים מיומנות או ידע',
                'en': 'Educational teaching children a skill or knowledge'
            },
            'comedy': {
                'ar': 'كوميدي مضحك ومسلّي',
                'he': 'קומדיה מצחיקה ומשעה',
                'en': 'Funny and entertaining comedy'
            },
            'adventure': {
                'ar': 'مغامرة مشوقة ومثيرة',
                'he': 'הרפתקה מרגשת',
                'en': 'Exciting adventure'
            },
            'moral': {
                'ar': 'أخلاقي يعلّم قيمة إنسانية',
                'he': 'מוסרי המלמד ערך אנושי',
                'en': 'Moral teaching human values'
            }
        };

        const storyTypeDesc = storyTypeDescriptions[this.storyType][this.language] || storyTypeDescriptions[this.storyType]['ar'];

        const prompt = `You are an expert puppet theater script writer for children aged 6-12.

CONTEXT:
- Student emotional state: ${emotions}
- Student preferences: ${preferences}
- Puppet 1: ${puppet1.name} (${puppet1.description || 'puppet character'})
- Puppet 2: ${puppet2.name} (${puppet2.description || 'puppet character'})
- Story type: ${storyTypeDesc}
- Script length: ${lengthSpec.min}-${lengthSpec.max} dialogue lines
- Language: ${languageNames[this.language]} (${this.language})

TASK: Create a COMPLETE, PERFORMABLE puppet theater show in ${languageNames[this.language]} that can be ACTUALLY PERFORMED on stage.

OUTPUT FORMAT (JSON only, no markdown):
{
  "title": "عنوان المسرحية بالـ ${this.language}",
  "dialogue": [
    {"puppet": "${puppet1.name}", "text": "ما تقوله الدمية", "action": "ما تفعله"},
    {"puppet": "${puppet2.name}", "text": "الرد", "action": "الحركة المسرحية"},
    ...
  ]
}

CRITICAL REQUIREMENTS FOR A COMPLETE THEATRICAL SHOW:
1. Write ENTIRELY in ${languageNames[this.language]} (${this.language})
2. Age-appropriate language (6-12 years)
3. Include DETAILED PHYSICAL ACTIONS for each line (يدخل من اليمين, يقفز, يجلس, ينظر للجمهور, etc.)
4. COMPLETE THEATRICAL STRUCTURE:
   - Opening/Introduction (3-5 lines)
   - Rising Action/Development (main story body)
   - Climax (turning point, 2-3 lines)
   - Falling Action/Resolution (2-3 lines)
   - Conclusion/Closing (2-3 lines)
5. Story Type: ${storyTypeDesc}
6. Make it ENGAGING, INTERACTIVE, and PERFORMABLE
7. Total lines: MINIMUM ${lengthSpec.min}, TARGET ${lengthSpec.max}
8. Each line MUST have both "text" (dialogue) and "action" (stage direction)
9. The show should be READY TO PERFORM immediately - no editing needed
10. Include stage directions like: يدخل, يخرج, يقف, يجلس, يلتفت, يبتسم, يبكي, etc.

Generate the COMPLETE theatrical show now in pure JSON format:`;

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
     */
    getLengthSpecs() {
        const specs = {
            'short': { min: 15, max: 20 },    // Increased from 6-10
            'medium': { min: 25, max: 35 },   // Increased from 12-18
            'long': { min: 40, max: 55 }      // Increased from 20-30
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
     */
    generateFallbackDialogue() {
        const puppet1 = this.puppets[0];
        const puppet2 = this.puppets[1] || puppet1;

        const fallbackLines = {
            'ar': [
                { speaker: puppet1.name, text: `مرحباً! أنا ${puppet1.name}!`, action: 'يلوّح بيده' },
                { speaker: puppet2.name, text: `وأنا ${puppet2.name}! كيف حالك؟`, action: 'يقفز فرحاً' },
                { speaker: puppet1.name, text: 'أنا بخير! هل تريد أن نلعب معاً؟', action: 'يبتسم' },
                { speaker: puppet2.name, text: 'فكرة رائعة! لنذهب في مغامرة!', action: 'يركض' }
            ],
            'he': [
                { speaker: puppet1.name, text: `!שלום! אני ${puppet1.name}`, action: 'מנופף ביד' },
                { speaker: puppet2.name, text: `!ואני ${puppet2.name}! מה שלומך?`, action: 'קופץ בשמחה' },
                { speaker: puppet1.name, text: '?אני בסדר! רוצה לשחק ביחד', action: 'מחייך' },
                { speaker: puppet2.name, text: '!רעיון מעולה! בואו נצא להרפתקה', action: 'רץ' }
            ],
            'en': [
                { speaker: puppet1.name, text: `Hello! I'm ${puppet1.name}!`, action: 'waves hand' },
                { speaker: puppet2.name, text: `And I'm ${puppet2.name}! How are you?`, action: 'jumps happily' },
                { speaker: puppet1.name, text: 'I\'m good! Want to play together?', action: 'smiles' },
                { speaker: puppet2.name, text: 'Great idea! Let\'s go on an adventure!', action: 'runs' }
            ]
        };

        return {
            title: this.generateFallbackTitle(),
            language: this.language,
            puppets: this.puppets,
            content: fallbackLines[this.language] || fallbackLines['ar'],
            metadata: {
                ...this.generateMetadata(),
                generationType: 'fallback'
            }
        };
    }
}
