// Συνάρτηση για αφαίρεση τόνων και μετατροπή σε πεζά
const normalize = (str) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const getValue = (li) => {
    const strong = li.querySelector('strong');
    return strong ? strong.innerText.trim() : '';
};

// Διαχωρισμός ονόματος σε first και last
const splitName = (fullName) => {
    if (!fullName) return { first: '', last: '' };
    const parts = fullName.split(/\s+/).filter(p => p.length > 0);
    if (parts.length === 1) return { first: '', last: parts[0] };
    // Το πρώτο μέρος ως first, τα υπόλοιπα ως last
    return { first: parts[0], last: parts.slice(1).join(' ') };
};

function scrapeBookInfo() {
    const data = {};
    data.title = document.querySelector('h1')?.innerText.trim();
    
    // Σάρωση όλων των li για εύρεση πεδίων
    const allLis = Array.from(document.querySelectorAll('li'));
    
    allLis.forEach(li => {
        const normText = normalize(li.innerText);
        
        if (normText.includes('συγγραφεας:')) data.authorRaw = getValue(li);
        if (normText.includes('μεταφραση:')) data.translator = getValue(li);
        if (normText.includes('εκδοτης:')) data.publisher = getValue(li);
        if (normText.includes('ημ. εκδοσης:')) data.dateRaw = getValue(li);
        if (normText.includes('περιοχη:')) data.location = getValue(li);
        if (normText.includes('isbn:')) data.isbn = getValue(li);
    });

    // Επεξεργασία
    const { first, last } = splitName(data.authorRaw);
    const year = data.dateRaw ? data.dateRaw.split('/').pop() : '';
    const accessDate = new Date().toISOString().split('T')[0];

    // Δημιουργία παραμέτρων
    let parts = [];
    if (last) parts.push(`last=${last}`);
    if (first) parts.push(`first=${first}`);
    if (data.title) parts.push(`title=${data.title}`);
    if (data.translator) parts.push(`translator=${data.translator}`);
    if (data.publisher) parts.push(`publisher=${data.publisher}`);
    if (data.location) parts.push(`location=${data.location}`);
    if (year) parts.push(`year=${year}`);
    if (data.isbn) parts.push(`isbn=${data.isbn}`);
    
    const cleanUrl = window.location.href.split('?')[0];
    parts.push(`url=${cleanUrl}`);
    parts.push(`access-date=${accessDate}`);

    return `<ref>{{cite book |${parts.join(' | ')}}}</ref>`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getRef") {
        sendResponse({ result: scrapeBookInfo() });
    }
});