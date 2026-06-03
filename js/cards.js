// js/cards.js - Interactive Cards Activity Script

// Data for STEM & Puppet Cards
const cardsData = [
  {
    id: "water_cycle",
    title: "🔬 دورة المياه في الطبيعة",
    category: "science",
    icon: "🌧️",
    description: "تتحرك المياه باستمرار بين الأرض والغلاف الجوي عبر التبخر والتكثف والهطول. فكرة رائعة لقصة مسرحية علمية!",
    prompt: "الأسد الشجاع يتساءل بغضب عن سبب توقف المطر، والأرنب الذكي يحاول شرح دورة المياه له بتبسيط.",
    question: "كيف يمكنك تمثيل عملية 'التبخر' و'التكثف' باستخدام حركات الدمى والمؤثرات البسيطة؟"
  },
  {
    id: "gravity",
    title: "🍎 الجاذبية الأرضية",
    category: "science",
    icon: "🍏",
    description: "قوة غير مرئية تجذب الأجسام نحو الأرض. اكتشفها نيوتن عندما سقطت التفاحة، وهي أساسية لفهم حركة الكون.",
    prompt: "الأرنب الذكي يسقط تفاحة من الشجرة، ويحاول شرح سبب سقوطها لأسفل بدلاً من طيرانها في الهواء.",
    question: "ما هي الفكرة الإبداعية لتمثيل انعدام الجاذبية على مسرح الدمى (مثلاً رحلة في الفضاء)؟"
  },
  {
    id: "food_chain",
    title: "🥬 السلسلة الغذائية",
    category: "science",
    icon: "🦊",
    description: "انتقال الطاقة الغذائية من كائن حي إلى آخر (من النباتات للحيوانات العاشبة ثم الحيوانات المفترسة).",
    prompt: "حوار تمثيلي بين دودة الأرض، والأرنب العاشب، والثعلب حول مدى أهمية كل كائن للحفاظ على توازن الغابة.",
    question: "اكتب عبارة قصيرة تعبر عن لسان حال النبات وهو ينتج طاقة الشمس للجميع."
  },
  {
    id: "stage_design",
    title: "📐 هندسة مسرح الدمى",
    category: "math-eng",
    icon: "📏",
    description: "تصميم وبناء المسرح يتطلب حساب الأبعاد بدقة (الطول، العرض، والارتفاع) ومساحة الحركة خلف الستارة.",
    prompt: "المهندس الذكي يقوم بقياس أبعاد الخشب والكرتون لبناء مسرح مدرسة مشيرفة، والدمى تساعده في حمل المسطرة.",
    question: "إذا كان طول مسرحك 90 سم وعرضه 60 سم، فما هي مساحة المسرح بالسنتمتر المربع؟"
  },
  {
    id: "lighting_optics",
    title: "💡 زوايا إضاءة المسرح",
    category: "math-eng",
    icon: "🔆",
    description: "الضوء ينتقل في خطوط مستقيمة، وانعكاسه وزواياه يحدد للجمهور أين ينظرون وما هو الوقت (ليل أو نهار).",
    prompt: "الدمى تتناقش حول كيفية تسليط ضوء المصباح بزاوية مائلة لخلق تأثير الظل والغموض في مشهد عاصفة.",
    question: "كيف يمكننا استخدام زوايا الضوء لتكبير حجم ظل دمية صغيرة لتبدو عملاقة ومخيفة؟"
  },
  {
    id: "brave_lion",
    title: "🦁 دمية الأسد الشجاع",
    category: "puppets",
    icon: "🦁",
    description: "شخصية قوية ومحبوبة، يحب مساعدة الآخرين وحماية الغابة، ولكنه أحياناً يتسرع ويحتاج إلى الحكمة والعلم.",
    prompt: "الأسد الشجاع يواجه مشكلة في تلوث مياه النهر ويريد محاربة التلوث بمخالبه، لكنه يدرك أن العلم هو الحل.",
    question: "اكتب تعليقاً أو حواراً قصيراً يطلب فيه الأسد المساعدة العلمية من بقية الحيوانات."
  },
  {
    id: "smart_rabbit",
    title: "🐰 دمية الأرنب المفكر",
    category: "puppets",
    icon: "🐰",
    description: "شخصية ذكية جداً، يقضي وقته في القراءة والتجريب. يمثل التفكير النقدي وحل المشكلات بالمنطق والعلوم.",
    prompt: "الأرنب المفكر يبتكر فكرة عبقرية لتصفية مياه النهر باستخدام الرمل والحصى لتوفير ماء نظيف للغابة.",
    question: "اقترح فكرة لتجربة علمية بسيطة يمكن للأرنب القيام بها أمام الطلاب على المسرح."
  },
  {
    id: "mars_colony",
    title: "🚀 العيش على كوكب المريخ",
    category: "challenges",
    icon: "👽",
    description: "تحدي هندسي وتكنولوجي كبير للعيش في كوكب جاف وقليل الأكسجين وبارد جداً. يتطلب بناء محميات مغلقة.",
    prompt: "مركبة الدمى الفضائية تهبط على المريخ، ويبدأ الطاقم في بناء محمية زجاجية لزراعة النباتات وتوليد الأكسجين.",
    question: "ما هو النظام الهندسي المبتكر الذي تقترحه على الدمى لتوفير مياه الشرب على المريخ؟"
  }
];

// Active State
let activeCardId = null;
let currentUser = null;

// Initialize Elements
const cardsGrid = document.getElementById("cardsGrid");
const filterButtons = document.querySelectorAll(".filter-btn");
const reflectionSection = document.getElementById("reflectionSection");
const activeCardTitle = document.getElementById("activeCardTitle");
const closeReflectionBtn = document.getElementById("closeReflectionBtn");
const commentAuthorName = document.getElementById("commentAuthorName");
const guestNameGroup = document.getElementById("guestNameGroup");
const commentText = document.getElementById("commentText");
const submitCommentBtn = document.getElementById("submitCommentBtn");
const commentsList = document.getElementById("commentsList");
const navAuthLink = document.getElementById("navAuthLink");
const loadingOverlay = document.getElementById("loadingOverlay");

// Check Authentication Status
if (typeof auth !== 'undefined' && auth) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      console.log("Logged in user:", user.email);
      // Hide guest name input, use Firebase profile name
      if (guestNameGroup) guestNameGroup.style.display = "none";
      // Update nav link
      if (navAuthLink) {
        navAuthLink.innerHTML = `<a href="student/dashboard.html" class="btn btn-outline btn-sm">لوحة التحكم 🏠</a>`;
      }
    } else {
      currentUser = null;
      console.log("Visitor/Guest mode");
      if (guestNameGroup) guestNameGroup.style.display = "block";
      if (navAuthLink) {
        navAuthLink.innerHTML = `<a href="auth/login.html" class="btn btn-secondary btn-sm">تسجيل الدخول</a>`;
      }
    }
  });
}

// Render Cards based on Category filter
function renderCards(categoryFilter = "all") {
  cardsGrid.innerHTML = "";
  
  const filteredCards = categoryFilter === "all" 
    ? cardsData 
    : cardsData.filter(card => card.category === categoryFilter);

  if (filteredCards.length === 0) {
    cardsGrid.innerHTML = `<p class="no-comments" style="grid-column: 1/-1;">لا توجد بطاقات في هذا القسم حالياً.</p>`;
    return;
  }

  filteredCards.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.className = `card-container category-${card.category}`;
    cardEl.setAttribute("data-id", card.id);
    
    cardEl.innerHTML = `
      <div class="card-inner">
        <!-- Front Face -->
        <div class="card-front">
          <span class="card-category-label"></span>
          <div class="card-icon-lg">${card.icon}</div>
          <h3>${card.title}</h3>
          <p class="card-prompt-hint">🔍 انقر لقلب البطاقة وكتابة تعليقك</p>
        </div>
        <!-- Back Face -->
        <div class="card-back">
          <div>
            <h4>💡 فكرة المشهد:</h4>
            <p class="card-back-description">"${card.prompt}"</p>
            <div class="card-question-box">
              ❓ سؤال للتفكير: <br>${card.question}
            </div>
          </div>
          <div class="card-back-actions">
            <button class="btn btn-primary btn-sm comment-card-btn" onclick="openCommentSection(event, '${card.id}', '${card.title}')">💬 اكتب تعليقاً</button>
            <button class="btn btn-outline btn-sm" onclick="useIdeaInStory(event, '${card.title}', '${card.prompt}')">✍️ اكتب قصة</button>
          </div>
        </div>
      </div>
    `;

    // Add flip toggle
    cardEl.addEventListener("click", function(e) {
      // Don't flip card if clicked inside button actions
      if (e.target.closest("button") || e.target.closest("a")) return;
      
      // Close comments section when switching or flipping
      closeReflectionSection();

      // Toggle flipped status
      const isFlipped = this.classList.contains("flipped");
      
      // Unflip all other cards first
      document.querySelectorAll(".card-container").forEach(c => c.classList.remove("flipped"));
      
      if (!isFlipped) {
        this.classList.add("flipped");
      }
    });

    cardsGrid.appendChild(cardEl);
  });
}

// Category filter button click handlers
filterButtons.forEach(btn => {
  btn.addEventListener("click", function() {
    filterButtons.forEach(b => b.classList.remove("active"));
    this.classList.add("active");
    const category = this.getAttribute("data-category");
    closeReflectionSection();
    renderCards(category);
  });
});

// Redirect to Story Editor with concept parameters
function useIdeaInStory(event, title, prompt) {
  event.stopPropagation();
  const encodedConcept = encodeURIComponent(title);
  const encodedPrompt = encodeURIComponent(prompt);
  // Redirect to student story editor passing parameters
  window.location.href = `student/story-editor.html?concept=${encodedConcept}&prompt=${encodedPrompt}`;
}

// Open Comment Section
function openCommentSection(event, cardId, cardTitle) {
  if (event) event.stopPropagation();
  
  activeCardId = cardId;
  activeCardTitle.textContent = cardTitle;
  reflectionSection.style.display = "block";
  
  // Smooth scroll to comments section
  reflectionSection.scrollIntoView({ behavior: "smooth", block: "start" });
  
  // Load comments
  loadComments(cardId);
}

// Close Comment Section
function closeReflectionSection() {
  activeCardId = null;
  reflectionSection.style.display = "none";
}

if (closeReflectionBtn) {
  closeReflectionBtn.addEventListener("click", closeReflectionSection);
}

// Load Comments from Firestore for a specific Card
async function loadComments(cardId) {
  commentsList.innerHTML = `<div class="spinner"></div>`;
  
  if (typeof db === 'undefined' || !db) {
    commentsList.innerHTML = `<p class="no-comments">لم يتم تهيئة قاعدة بيانات Firestore بشكل صحيح.</p>`;
    return;
  }

  try {
    const snapshot = await db.collection("cardReflections")
      .where("cardId", "==", cardId)
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    commentsList.innerHTML = "";

    if (snapshot.empty) {
      commentsList.innerHTML = `<p class="no-comments">كن أول من يكتب تعليقاً على هذه البطاقة! 📝</p>`;
      return;
    }

    snapshot.forEach(doc => {
      const comment = doc.data();
      const dateText = comment.timestamp 
        ? new Date(comment.timestamp.seconds * 1000).toLocaleString("ar-EG", { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
        : "الآن";

      const commentEl = document.createElement("div");
      commentEl.className = "comment-item";
      commentEl.innerHTML = `
        <div class="comment-user">👤 ${escapeHtml(comment.authorName)}</div>
        <div class="comment-text">${escapeHtml(comment.commentText)}</div>
        <div class="comment-date">${dateText}</div>
      `;
      commentsList.appendChild(commentEl);
    });
  } catch (error) {
    console.error("Error loading comments:", error);
    commentsList.innerHTML = `<p class="no-comments">حدث خطأ أثناء تحميل التعليقات. تأكد من تفعيل وتحديث القواعد في Firebase Console.</p>`;
  }
}

// Submit Comment to Firestore
async function submitComment() {
  const text = commentText.value.trim();
  if (!text) {
    alert("يرجى كتابة تعليق أولاً!");
    return;
  }

  let authorName = "طالب مبدع";
  if (currentUser) {
    authorName = currentUser.displayName || currentUser.email.split("@")[0];
  } else if (commentAuthorName && commentAuthorName.value.trim()) {
    authorName = commentAuthorName.value.trim();
  }

  if (loadingOverlay) loadingOverlay.style.display = "flex";

  try {
    const commentData = {
      cardId: activeCardId,
      authorId: currentUser ? currentUser.uid : "guest",
      authorName: authorName,
      commentText: text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("cardReflections").add(commentData);
    
    // Clear input field
    commentText.value = "";
    if (commentAuthorName && !currentUser) {
      commentAuthorName.value = "";
    }

    // Reload comments
    await loadComments(activeCardId);

  } catch (error) {
    console.error("Error saving comment:", error);
    alert("فشل حفظ التعليق. يرجى التأكد من تحديث قواعد (Firestore Rules) في الكونسول لتسمح بالكتابة لمجموعة cardReflections.");
  } finally {
    if (loadingOverlay) loadingOverlay.style.display = "none";
  }
}

if (submitCommentBtn) {
  submitCommentBtn.addEventListener("click", submitComment);
}

// Simple HTML escaping helper to prevent XSS
function escapeHtml(string) {
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return String(string).replace(/[&<>"'\/]/g, (match) => htmlEscapes[match]);
}

// Initial Page Load
document.addEventListener("DOMContentLoaded", () => {
  renderCards("all");
});
