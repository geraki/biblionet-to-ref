// Αφαίρεση τόνων και μετατροπή σε πεζά για ασφαλή σύγκριση
const normalize = (str) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s/g, ' ');

// Διαχωρισμός ονόματος: Πρώτη λέξη = first, υπόλοιπες = last
const splitName = (fullName) => {
    if (!fullName) return { first: '', last: '' };
    const parts = fullName.trim().split(/\s+/).filter(p => p.length > 0);
    if (parts.length === 1) return { first: '', last: parts[0] };
    return { first: parts[0], last: parts.slice(1).join(' ') };
};

// Εξαγωγή ονομάτων από links <a> μέσα σε ένα li
const getNamesFromLi = (li) => {
    const links = Array.from(li.querySelectorAll('a'));
    if (links.length > 0) {
        return links.map(a => a.innerText.trim()).filter(t => t.length > 0);
    }
    // Fallback αν δεν έχει links αλλά έχει strong
    const strong = li.querySelector('strong');
    return strong ? [strong.innerText.trim()] : [];
};

function scrapeBookInfo() {
    const data = {
        authors: [],
        editors: [],
        translators: [],
        title: document.querySelector('h1')?.innerText.trim(),
        publisher: '',
        dateRaw: '',
        location: '',
        isbn: '',
        series: ''
    };
    
    // 1. Σάρωση Συντελεστών (Συγγραφείς, Επιμελητές, κλπ)
    const contributorLis = Array.from(document.querySelectorAll('.contributors-list li'));
    contributorLis.forEach(li => {
        const normText = normalize(li.innerText);
        if (normText.includes('συγγραφεας')) {
            data.authors = getNamesFromLi(li);
        } else if (normText.includes('επιμελεια')) {
            data.editors = getNamesFromLi(li);
        } else if (normText.includes('μεταφραση')) {
            data.translators = getNamesFromLi(li);
        }
    });

    // 2. Σάρωση Χαρακτηριστικών (Εκδότης, ISBN, Σειρά κλπ)
    const attrLis = Array.from(document.querySelectorAll('.book_attr_list li'));
    attrLis.forEach(li => {
        const normText = normalize(li.innerText);
        const strong = li.querySelector('strong');
        const val = strong ? strong.innerText.trim() : '';

        if (normText.includes('εκδοτης')) data.publisher = val;
        if (normText.includes('ημ. εκδοσης')) data.dateRaw = val;
        if (normText.includes('περιοχη')) data.location = val;
        if (normText.includes('isbn')) data.isbn = val;
        if (normText.includes('σειρα')) data.series = val;
    });

    // --- Κατασκευή Template ---
    let parts = [];

    // Συγγραφείς: last1, first1, last2...
    data.authors.forEach((name, i) => {
        const { first, last } = splitName(name);
        parts.push(`last${i+1}=${last}`);
        parts.push(`first${i+1}=${first}`);
    });

    if (data.title) parts.push(`title=${data.title}`);

    // Επιμελητές: Wikipedia standard (editor-last, editor-first)
    data.editors.forEach((name, i) => {
        const { first, last } = splitName(name);
        const suffix = i === 0 ? '' : i + 1;
        parts.push(`editor-last${suffix}=${last}`);
        parts.push(`editor-first${suffix}=${first}`);
    });

    // Μεταφραστές
    if (data.translators.length > 0) {
        parts.push(`translator=${data.translators.join(', ')}`);
    }

    if (data.publisher) parts.push(`publisher=${data.publisher}`);
    if (data.location) parts.push(`location=${data.location}`);
    if (data.series) parts.push(`series=${data.series}`);
    
    const year = data.dateRaw ? data.dateRaw.split('/').pop() : '';
    if (year) parts.push(`year=${year}`);
    if (data.isbn) parts.push(`isbn=${data.isbn}`);
    
    // URL και Access Date
    const cleanUrl = window.location.href.split('?')[0];
    const accessDate = new Date().toISOString().split('T')[0];
    
    parts.push(`url=${cleanUrl}`);
    parts.push(`access-date=${accessDate}`);

    return `<ref>{{cite book | ${parts.join(' | ')} }}</ref>`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getRef") {
        sendResponse({ result: scrapeBookInfo() });
    }
});