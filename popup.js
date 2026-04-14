document.getElementById('btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: "getRef" }, (response) => {
        if (response && response.result) {
            document.getElementById('output').value = response.result;
            // Αυτόματη αντιγραφή στο clipboard
            navigator.clipboard.writeText(response.result);
        } else {
            alert("Δεν βρέθηκαν δεδομένα. Είστε στη σωστή σελίδα;");
        }
    });
});