document.getElementById('btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => scrapeBookInfo() });
    const result = results[0]?.result;

    if (result) {
        document.getElementById('output').value = result;
        // Αυτόματη αντιγραφή στο clipboard
        navigator.clipboard.writeText(result);

        // Οπτική επιβεβαίωση στο κουμπί
        const btn = document.getElementById('btn');
        btn.innerText = "✅ Αντιγράφηκε!";
        btn.style.backgroundColor = "#28a745"; // Πράσινο χρώμα επιτυχίας

        // Επαναφορά μετά από 2 δευτερόλεπτα
        setTimeout(() => {
            btn.innerText = "Δημιουργία Reference";
            btn.style.backgroundColor = "#0053a0"; // Αρχικό μπλε χρώμα
        }, 2000);
    } else {
        alert("Δεν βρέθηκαν δεδομένα. Είστε στη σωστή σελίδα;");
    }
});