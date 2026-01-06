// Simplified Word Export - using HTML format
async function exportToWordSimple() {
    if (!currentDialogue) return;

    const html = `<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="utf-8">
    <title>${currentDialogue.title}</title>
    <style>
        body { font-family: Arial; direction: rtl; padding: 40px; line-height: 2; }
        h1 { color: #8b1538; border-bottom: 3px solid #8b1538; padding-bottom: 15px; }
        .meta { background: #f5f5f5; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .dialogue-line { margin: 20px 0; padding: 15px; border-right: 4px solid #8b1538; background: #fafafa; }
        .speaker { font-weight: bold; color: #8b1538; font-size: 18px; }
        .text { font-size: 16px; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>${currentDialogue.title}</h1>
    <div class="meta">
        <p><strong>اللغة:</strong> ${currentDialogue.language}</p>
        <p><strong>الدمى:</strong> ${currentDialogue.puppets?.map(p => p.name).join(', ') || ''}</p>
        <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
    </div>
    ${currentDialogue.content.map(line => `
        <div class="dialogue-line">
            <div class="speaker">${line.speaker}:</div>
            <div class="text">${line.text}</div>
        </div>
    `).join('')}
</body>
</html>`;

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentDialogue.title || 'dialogue'}.doc`;
    link.click();
    URL.revokeObjectURL(url);
}

// Add this function call to replace the old one
if (typeof exportToWord !== 'undefined') {
    exportToWord = exportToWordSimple;
}
