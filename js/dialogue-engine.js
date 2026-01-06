// Dialogue Engine - AI-Powered Dialogue Generation
// Generates personalized puppet theatre dialogues based on student assessment

class DialogueEngine {
    constructor(assessmentData) {
        this.assessment = assessmentData;
        this.language = assessmentData.settings.language;
        this.storyType = assessmentData.settings.storyType;
        this.length = assessmentData.settings.length;
        this.puppets = [];
    }

    async loadPuppets() {
        // Check if we have puppet IDs or full puppet objects
        const firstPuppet = this.assessment.puppets[0];

        // If puppets are already loaded objects (guest mode or Already loaded)
        if (typeof firstPuppet === 'object' && firstPuppet.name) {
            this.puppets = this.assessment.puppets;
            return;
        }

        // Mock puppets for guest mode (fallback)
        const mockPuppets = {
            'lion': { id: 'lion', emoji: '🦁', name: 'الأسد', category: 'animals' },
            'bear': { id: 'bear', emoji: '🐻', name: 'الدب', category: 'animals' },
            'rabbit': { id: 'rabbit', emoji: '🐰', name: 'الأرنب', category: 'animals' },
            'boy': { id: 'boy', emoji: '👦', name: 'الولد', category: 'family' },
            'girl': { id: 'girl', emoji: '👧', name: 'البنت', category: 'family' },
            'scientist': { id: 'scientist', emoji: '👨‍🔬', name: 'العالم', category: 'characters' },
            'teacher': { id: 'teacher', emoji: '👨‍🏫', name: 'المعلم', category: 'characters' },
            'astronaut': { id: 'astronaut', emoji: '👨‍🚀', name: 'رائد الفضاء', category: 'characters' }
        };

        // Try to load from Firestore if IDs are provided
        if (typeof firstPuppet === 'string') {
            try {
                const puppetPromises = this.assessment.puppets.map(async (puppetId) => {
                    // Try Firestore first
                    try {
                        const doc = await firebase.firestore().collection('puppets').doc(puppetId).get();
                        if (doc.exists) {
                            return { id: doc.id, ...doc.data() };
                        }
                    } catch (error) {
                        console.log('Firestore not available, using mock data');
                    }

                    // Fallback to mock data
                    return mockPuppets[puppetId] || mockPuppets['lion'];
                });

                this.puppets = await Promise.all(puppetPromises);
            } catch (error) {
                console.error('Error loading puppets:', error);
                // Final fallback: use mock puppets
                this.puppets = this.assessment.puppets.map(id => mockPuppets[id] || mockPuppets['lion']);
            }
        }
    }

    async generate() {
        await this.loadPuppets();

        // Select appropriate template based on assessment
        const template = this.selectTemplate();

        // Generate dialogue
        const dialogue = this.buildDialogue(template);

        return {
            title: this.generateTitle(),
            language: this.language,
            puppets: this.puppets,
            content: dialogue,
            metadata: this.generateMetadata()
        };
    }

    selectTemplate() {
        const { psychological, educational, behavioral } = this.assessment;

        // Analyze student profile
        const isConfident = psychological.confidence >= 4;
        const isExtrovert = behavioral.introvert >= 4;
        const isLeader = behavioral.leadership >= 4;
        const favoritesTech = educational.favoriteSubjects.includes('science') ||
            educational.favoriteSubjects.includes('technology');

        // Select template based on story type and profile
        const templateKey = `${this.storyType}_${this.language}`;

        return this.getTemplateByType(templateKey, {
            isConfident,
            isExtrovert,
            isLeader,
            favoritesTech
        });
    }

    getTemplateByType(key, profile) {
        const templates = {
            // ========================================
            // ARABIC TEMPLATES
            // ========================================
            'educational_ar': {
                theme: 'scientific_discovery',
                setting: this.getArabicSetting(),
                conflict: this.getArabicConflict(profile),
                resolution: this.getArabicResolution(profile),
                educationalMessage: this.getArabicEducationalMessage()
            },
            'comedy_ar': {
                theme: 'funny_misunderstanding',
                setting: 'في حديقة المدرسة',
                conflict: this.getArabicComedyConflict(),
                resolution: 'يحل المشكلة بطريقة مضحكة',
                humorStyle: profile.isExtrovert ? 'slapstick' : 'wit'
            },
            'adventure_ar': {
                theme: 'exciting_quest',
                setting: this.getArabicAdventureSetting(),
                conflict: 'رحلة مثيرة للبحث عن كنز',
                resolution: profile.isLeader ? 'يقود المجموعة للنجاح' : 'يساعد في إيجاد الحل',
                excitement: 'high'
            },
            'moral_ar': {
                theme: 'ethical_lesson',
                setting: 'في مدرسة أو بيت',
                conflict: this.getArabicMoralConflict(),
                resolution: this.getArabicMoralResolution(),
                moralLesson: this.getArabicMoralLesson()
            },

            // ========================================
            // HEBREW TEMPLATES
            // ========================================
            'educational_he': {
                theme: 'scientific_discovery',
                setting: this.getHebrewSetting(),
                conflict: this.getHebrewConflict(profile),
                resolution: this.getHebrewResolution(profile),
                educationalMessage: this.getHebrewEducationalMessage()
            },
            'comedy_he': {
                theme: 'funny_misunderstanding',
                setting: 'בגן בית הספר',
                conflict: this.getHebrewComedyConflict(),
                resolution: 'פותר את הבעיה בצורה מצחיקה',
                humorStyle: profile.isExtrovert ? 'slapstick' : 'wit'
            },
            'adventure_he': {
                theme: 'exciting_quest',
                setting: this.getHebrewAdventureSetting(),
                conflict: 'מסע מרגש לחיפוש אוצר',
                resolution: profile.isLeader ? 'מוביל את הקבוצה להצלחה' : 'עוזר למצוא את הפתרון',
                excitement: 'high'
            },
            'moral_he': {
                theme: 'ethical_lesson',
                setting: 'בבית הספר או בבית',
                conflict: this.getHebrewMoralConflict(),
                resolution: this.getHebrewMoralResolution(),
                moralLesson: this.getHebrewMoralLesson()
            },

            // ========================================
            // ENGLISH TEMPLATES
            // ========================================
            'educational_en': {
                theme: 'scientific_discovery',
                setting: this.getEnglishSetting(),
                conflict: this.getEnglishConflict(profile),
                resolution: this.getEnglishResolution(profile),
                educationalMessage: this.getEnglishEducationalMessage()
            },
            'comedy_en': {
                theme: 'funny_misunderstanding',
                setting: 'in the school playground',
                conflict: this.getEnglishComedyConflict(),
                resolution: 'solves the problem in a funny way',
                humorStyle: profile.isExtrovert ? 'slapstick' : 'wit'
            },
            'adventure_en': {
                theme: 'exciting_quest',
                setting: this.getEnglishAdventureSetting(),
                conflict: 'an exciting journey to find treasure',
                resolution: profile.isLeader ? 'leads the group to success' : 'helps find the solution',
                excitement: 'high'
            },
            'moral_en': {
                theme: 'ethical_lesson',
                setting: 'at school or home',
                conflict: this.getEnglishMoralConflict(),
                resolution: this.getEnglishMoralResolution(),
                moralLesson: this.getEnglishMoralLesson()
            }
        };

        return templates[key] || templates[`educational_${this.language}`];
    }

    buildDialogue(template) {
        const lineCount = this.getLineCount();
        const puppet1 = this.puppets[0];
        const puppet2 = this.puppets[1] || puppet1; // Monologue if only one puppet

        let dialogue = [];

        // Introduction
        dialogue.push(...this.generateIntroduction(puppet1, puppet2, template));

        // Development
        dialogue.push(...this.generateDevelopment(puppet1, puppet2, template, lineCount));

        // Climax
        dialogue.push(...this.generateClimax(puppet1, puppet2, template));

        // Resolution
        dialogue.push(...this.generateResolution(puppet1, puppet2, template));

        // Conclusion
        dialogue.push(...this.generateConclusion(puppet1, puppet2, template));

        return this.formatDialogue(dialogue);
    }

    generateIntroduction(p1, p2, template) {
        const lines = [];
        const isTwoPuppets = this.puppets.length === 2;

        if (this.language === 'ar') {
            lines.push({ puppet: p1.name, line: `مرحباً! أنا ${p1.name}. ${template.setting}` });
            if (isTwoPuppets) {
                lines.push({ puppet: p2.name, line: `وأنا ${p2.name}! سعيد بلقائك.` });
            }
        } else if (this.language === 'he') {
            lines.push({ puppet: p1.name, line: `שלום! אני ${p1.name}. ${template.setting}` });
            if (isTwoPuppets) {
                lines.push({ puppet: p2.name, line: `ואני ${p2.name}! שמח לפגוש אותך.` });
            }
        } else {
            lines.push({ puppet: p1.name, line: `Hello! I'm ${p1.name}. ${template.setting}` });
            if (isTwoPuppets) {
                lines.push({ puppet: p2.name, line: `And I'm ${p2.name}! Nice to meet you.` });
            }
        }

        return lines;
    }

    generateDevelopment(p1, p2, template, targetLines) {
        const lines = [];
        const developmentLines = Math.floor(targetLines * 0.4);
        const isTwoPuppets = this.puppets.length === 2;

        // Generate dialogue based on story type and student profile
        for (let i = 0; i < developmentLines; i++) {
            const speaker = i % 2 === 0 ? p1 : (isTwoPuppets ? p2 : p1);
            const line = this.generateDevelopmentLine(speaker, template, i);
            lines.push({ puppet: speaker.name, line });
        }

        return lines;
    }

    generateDevelopmentLine(puppet, template, index) {
        const { psychological, educational, behavioral } = this.assessment;
        const topic = educational.scienceTopic;

        // Generate context-aware lines
        if (this.storyType === 'educational' && topic) {
            return this.generateEducationalLine(puppet, topic, index);
        } else if (this.storyType === 'comedy') {
            return this.generateComedyLine(puppet, index);
        } else if (this.storyType === 'adventure') {
            return this.generateAdventureLine(puppet, index);
        } else {
            return this.generateMoralLine(puppet, index);
        }
    }

    generateEducationalLine(puppet, topic, index) {
        const educationalContent = {
            ar: {
                space: [
                    'هل تعلم أن الشمس نجم ضخم؟',
                    'الكواكب تدور حول الشمس!',
                    'القمر يدور حول الأرض.',
                    'في الفضاء لا يوجد هواء للتنفس.'
                ],
                animals: [
                    'الحيوانات تحتاج للماء والطعام.',
                    'بعض الحيوانات تأكل النباتات فقط.',
                    'الحيوانات المفترسة تصطاد لتأكل.',
                    'كل حيوان له بيئة خاصة يعيش فيها.'
                ],
                water_cycle: [
                    'الماء يتبخر من البحار والأنهار.',
                    'البخار يصعد للسماء ويكوّن الغيوم.',
                    'عندما تبرد الغيوم، تمطر!',
                    'المطر يعود للأنهار مرة أخرى.'
                ]
            },
            he: {
                space: [
                    'האם ידעת שהשמש היא כוכב ענק?',
                    'כלכבים מסתובבים סביב השמש!',
                    'הירח מסתובב סביב הארץ.',
                    'בחלל אין אוויר לנשימה.'
                ],
                animals: [
                    'חיות צריכות מים ואוכל.',
                    'חיות מסוימות אוכלות רק צמחים.',
                    'חיות טורפות צדות כדי לאכול.',
                    'לכל חיה יש סביבה מיוחדת שבה היא חיה.'
                ]
            },
            en: {
                space: [
                    'Did you know the Sun is a huge star?',
                    'Planets orbit around the Sun!',
                    'The Moon orbits around Earth.',
                    'There is no air to breathe in space.'
                ],
                animals: [
                    'Animals need water and food.',
                    'Some animals only eat plants.',
                    'Predators hunt for their food.',
                    'Each animal has a special habitat.'
                ]
            }
        };

        const topicLines = educationalContent[this.language][topic] || educationalContent[this.language].space;
        return topicLines[index % topicLines.length];
    }

    generateComedyLine(puppet, index) {
        const comedyLines = {
            ar: [
                'ماذا؟! هذا غريب جداً!',
                'هههه، هذا مضحك!',
                'انتظر، دعني أفكر...',
                'يا للمفاجأة!'
            ],
            he: [
                'מה?! זה מוזר מאוד!',
                'חחח, זה מצחיק!',
                'רגע, תן לי לחשוב...',
                'איזו הפתעה!'
            ],
            en: [
                'What?! That\'s so strange!',
                'Haha, that\'s funny!',
                'Wait, let me think...',
                'What a surprise!'
            ]
        };

        const lines = comedyLines[this.language];
        return lines[index % lines.length];
    }

    generateAdventureLine(puppet, index) {
        const adventureLines = {
            ar: [
                'يجب أن نكون شجعاناً!',
                'ماذا نفعل الآن؟',
                'هيا بنا، لا وقت للتأخير!',
                'أشعر بالقلق قليلاً.'
            ],
            he: [
                'אנחנו צריכים להיות אמיצים!',
                'מה נעשה עכשיו?',
                'בוא, אין זמן להתעכב!',
                'אני מעט מודאג.'
            ],
            en: [
                'We must be brave!',
                'What should we do now?',
                'Come on, no time to waste!',
                'I\'m a little worried.'
            ]
        };

        const lines = adventureLines[this.language];
        return lines[index % lines.length];
    }

    generateMoralLine(puppet, index) {
        const moralLines = {
            ar: [
                'يجب أن نكون صادقين دائماً.',
                'مساعدة الآخرين شيء رائع!',
                'الصداقة كنز ثمين.',
                'يجب احترام الجميع.'
            ],
            he: [
                'אנחנו צריכים תמיד להיות כנים.',
                'לעזור לאחרים זה נפלא!',
                'חברות היא אוצר יקר.',
                'צריך לכבד את כולם.'
            ],
            en: [
                'We must always be honest.',
                'Helping others is wonderful!',
                'Friendship is a precious treasure.',
                'We should respect everyone.'
            ]
        };

        const lines = moralLines[this.language];
        return lines[index % lines.length];
    }

    generateClimax(p1, p2, template) {
        const lines = [];

        if (this.language === 'ar') {
            lines.push({ puppet: p1.name, line: 'هذه هي اللحظة الحاسمة!' });
            if (this.puppets.length === 2) {
                lines.push({ puppet: p2.name, line: 'نعم! يجب أن نعمل معاً!' });
            }
        } else if (this.language === 'he') {
            lines.push({ puppet: p1.name, line: 'זה הרגע המכריע!' });
            if (this.puppets.length === 2) {
                lines.push({ puppet: p2.name, line: 'כן! אנחנו צריכים לעבוד ביחד!' });
            }
        } else {
            lines.push({ puppet: p1.name, line: 'This is the crucial moment!' });
            if (this.puppets.length === 2) {
                lines.push({ puppet: p2.name, line: 'Yes! We must work together!' });
            }
        }

        return lines;
    }

    generateResolution(p1, p2, template) {
        const lines = [];

        if (this.language === 'ar') {
            lines.push({ puppet: p1.name, line: template.resolution || 'نجحنا في حل المشكلة!' });
            if (this.puppets.length === 2) {
                lines.push({ puppet: p2.name, line: 'رائع! تعلمنا شيئاً مهماً اليوم.' });
            }
        } else if (this.language === 'he') {
            lines.push({ puppet: p1.name, line: template.resolution || 'הצלחנו לפתור את הבעיה!' });
            if (this.puppets.length === 2) {
                lines.push({ puppet: p2.name, line: 'נהדר! למדנו משהו חשוב היום.' });
            }
        } else {
            lines.push({ puppet: p1.name, line: template.resolution || 'We solved the problem!' });
            if (this.puppets.length === 2) {
                lines.push({ puppet: p2.name, line: 'Great! We learned something important today.' });
            }
        }

        return lines;
    }

    generateConclusion(p1, p2, template) {
        const lines = [];

        if (this.language === 'ar') {
            lines.push({ puppet: p1.name, line: 'شكراً لكم على المشاهدة!' });
            if (this.puppets.length === 2) {
                lines.push({ puppet: p2.name, line: 'إلى اللقاء!' });
            }
        } else if (this.language === 'he') {
            lines.push({ puppet: p1.name, line: 'תודה שצפיתם!' });
            if (this.puppets.length === 2) {
                lines.push({ puppet: p2.name, line: 'להתראות!' });
            }
        } else {
            lines.push({ puppet: p1.name, line: 'Thank you for watching!' });
            if (this.puppets.length === 2) {
                lines.push({ puppet: p2.name, line: 'Goodbye!' });
            }
        }

        return lines;
    }

    formatDialogue(lines) {
        return lines.map(({ puppet, line }) => ({
            speaker: puppet,
            text: line
        }));
    }

    getLineCount() {
        const counts = {
            short: 10,
            medium: 20,
            long: 35
        };
        return counts[this.length] || 20;
    }

    generateTitle() {
        if (this.assessment.settings.title) {
            return this.assessment.settings.title;
        }

        const titles = {
            ar: {
                educational: 'رحلة تعليمية مثيرة',
                comedy: 'مغامرة مضحكة',
                adventure: 'مغامرة شيقة',
                moral: 'درس في القيم'
            },
            he: {
                educational: 'מסע לימודי מרגש',
                comedy: 'הרפתקה מצחיקה',
                adventure: 'הרפתקה מרתקת',
                moral: 'שיעור בערכים'
            },
            en: {
                educational: 'An Exciting Learning Journey',
                comedy: 'A Funny Adventure',
                adventure: 'An Exciting Quest',
                moral: 'A Lesson in Values'
            }
        };

        return titles[this.language][this.storyType];
    }

    generateMetadata() {
        return {
            gradeLevel: this.assessment.educational.grade,
            topics: this.assessment.educational.favoriteSubjects,
            personalityProfile: {
                confidence: this.assessment.psychological.confidence,
                social: this.assessment.behavioral.introvert,
                leadership: this.assessment.behavioral.leadership
            }
        };
    }

    // Helper methods for getting context-specific content
    getArabicSetting() {
        const topics = this.assessment.educational.scienceTopic;
        const settings = {
            space: 'في محطة فضائية',
            animals: 'في الغابة',
            water_cycle: 'بجانب النهر',
            plants: 'في حديقة جميلة'
        };
        return settings[topics] || 'في مكان مثير';
    }

    getArabicConflict(profile) {
        if (profile.isLeader) {
            return 'يجب قيادة المجموعة لحل المشكلة';
        }
        return 'يجب التعاون لإيجاد الحل';
    }

    getArabicResolution(profile) {
        if (profile.isConfident) {
            return 'يحل المشكلة بثقة وذكاء';
        }
        return 'يتعلم ويكتسب الثقة';
    }

    getArabicEducationalMessage() {
        const topic = this.assessment.educational.scienceTopic;
        const messages = {
            space: 'الفضاء مليء بالعجائب!',
            animals: 'كل حيوان مميز بطريقته!',
            water_cycle: 'الماء أساس الحياة!'
        };
        return messages[topic] || 'العلم ممتع ومفيد!';
    }

    getArabicComedyConflict() {
        return 'سوء فهم مضحك يحدث';
    }

    getArabicAdventureSetting() {
        return 'في رحلة استكشافية مثيرة';
    }

    getArabicMoralConflict() {
        return 'موقف يتطلب اتخاذ قرار أخلاقي';
    }

    getArabicMoralResolution() {
        return 'يتخذ القرار الصحيح';
    }

    getArabicMoralLesson() {
        return 'الصدق والأمانة أساس النجاح';
    }

    // Hebrew helpers
    getHebrewSetting() {
        const topics = this.assessment.educational.scienceTopic;
        const settings = {
            space: 'בתחנת חלל',
            animals: 'ביער',
            water_cycle: 'ליד הנהר'
        };
        return settings[topics] || 'במקום מרגש';
    }

    getHebrewConflict(profile) {
        if (profile.isLeader) {
            return 'צריך להוביל את הקבוצה לפתור את הבעיה';
        }
        return 'צריך לשתף פעולה כדי למצוא פתרון';
    }

    getHebrewResolution(profile) {
        if (profile.isConfident) {
            return 'פותר את הבעיה בביטחון ובחוכמה';
        }
        return 'לומד ומקבל ביטחון';
    }

    getHebrewEducationalMessage() {
        return 'המדע מהנה ושימושי!';
    }

    getHebrewComedyConflict() {
        return 'אי הבנה מצחיקה קורית';
    }

    getHebrewAdventureSetting() {
        return 'במסע גילוי מרגש';
    }

    getHebrewMoralConflict() {
        return 'מצב הדורש קבלת החלטה מוסרית';
    }

    getHebrewMoralResolution() {
        return 'מקבל את ההחלטה הנכונה';
    }

    getHebrewMoralLesson() {
        return 'כנות ויושר הם בסיס להצלחה';
    }

    // English helpers
    getEnglishSetting() {
        const topics = this.assessment.educational.scienceTopic;
        const settings = {
            space: 'at a space station',
            animals: 'in the forest',
            water_cycle: 'by the river'
        };
        return settings[topics] || 'in an exciting place';
    }

    getEnglishConflict(profile) {
        if (profile.isLeader) {
            return 'must lead the group to solve the problem';
        }
        return 'must cooperate to find a solution';
    }

    getEnglishResolution(profile) {
        if (profile.isConfident) {
            return 'solves the problem with confidence and wisdom';
        }
        return 'learns and gains confidence';
    }

    getEnglishEducationalMessage() {
        return 'Science is fun and useful!';
    }

    getEnglishComedyConflict() {
        return 'a funny misunderstanding happens';
    }

    getEnglishAdventureSetting() {
        return 'on an exciting exploration';
    }

    getEnglishMoralConflict() {
        return 'a situation requiring an ethical decision';
    }

    getEnglishMoralResolution() {
        return 'makes the right choice';
    }

    getEnglishMoralLesson() {
        return 'Honesty and integrity are the foundation of success';
    }
}

// Export for use in dialogue-editor.js
window.DialogueEngine = DialogueEngine;
