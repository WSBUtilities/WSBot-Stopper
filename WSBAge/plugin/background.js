// This is to make it that the extension icon only is shown on reddit.
chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
                conditions: [new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostEquals: 'old.reddit.com' },
                    })],
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }, {
                conditions: [new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostEquals: 'www.reddit.com' },
                    })],
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }]);
    });
});
// This will listen to messages from the content scripts and fetch from the databases for them.
// It's not possible to directly access plugin data from content scripts (to my knowledge of course).
chrome.runtime.onConnect.addListener(port => {
    // cscript is short for content script
    if (port.name === "cscript") {
        port.onMessage.addListener(message => {
            if (message.request === "terms") {
                // Check if the terms have been agreed to and setup is done
                if (localStorage.getItem("setupStatus") === "done") {
                    port.postMessage({
                        request: 'terms',
                        terms: localStorage.getItem("terms")
                    });
                }
                else {
                    port.postMessage({
                        request: 'terms',
                        terms: 'not'
                    });
                }
            }
            else if (message.request === 'getAges') {
                // Request the database
                let dbRequest = indexedDB.open("WSBInfo", 1);
                dbRequest.onerror = () => port.postMessage({
                    request: 'getAges',
                    error: true,
                    errorReason: 'Could not open database'
                });
                dbRequest.onsuccess = ev => {
                    // Again, TS won't recognize the result parameter.
                    // I put up with it because it saves me other headaches.
                    // There are no solutions in life, just trade-offs.
                    let db = ev.target['result'];
                    let tx = db.transaction(['users'], 'readonly');
                    let store = tx.objectStore('users');
                    let done = 0;
                    // The array of user info that will be sent
                    let resp = {};
                    for (let i = 0; i < message.users.length; i++) {
                        let request = store.get(message.users[i]);
                        request.onsuccess = () => {
                            // If it is undefined, that is the problem for the content script.
                            resp[message.users[i]] = request.result;
                            // Because these request are done asynchronously, it must wait for all to be done.
                            // Hopefully this isn't a race condition.
                            done++;
                            if (done === message.users.length) {
                                port.postMessage({
                                    request: 'getAges',
                                    error: false,
                                    ages: resp
                                });
                            }
                        };
                    }
                };
            }
        });
    }
});
