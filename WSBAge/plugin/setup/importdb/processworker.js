var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Some genius decided that await could only be used in a function, so that is why this code only run once
 *      is in it's own function. Personally, I still think this is cleaner than the alternative.
 */
function processData() {
    return __awaiter(this, void 0, void 0, function* () {
        let dataResp = yield fetch("users.txt");
        /**
         * The string which contains all the users and ages. About 280,000 users contained.
         */
        let userInfo = yield dataResp.text();
        // Delete the old database if it exits
        indexedDB.deleteDatabase("WSBInfo");
        // Create the new database
        let dbRequest = indexedDB.open("WSBInfo", 1);
        dbRequest.onupgradeneeded = event => {
            // IDBVersionChangeEvent doesn't have the result attribute in TS. Sometimes I wonder if TS is worth the hassle.
            let db = event.target["result"];
            db.createObjectStore("users", { "keyPath": "username" });
        };
        dbRequest.onerror = () => {
            // @ts-ignore
            postMessage('{"message":"dbOpenError"}');
        };
        // Here all of the data in the bundled file will be stored into the IDBDatabase
        dbRequest.onsuccess = event => {
            // Open the transaction
            let db = event.target["result"];
            let tx = db.transaction(["users"], "readwrite");
            let store = tx.objectStore("users");
            // Loop through the text file. It is delimited, but String.split is too slow.
            // Not entirely sure if declaring outside of loop improves performance in JS but better safe than sorry.
            // Trying to hurry so won't benchmark.
            let colon = userInfo.indexOf(':');
            let semiColon = -1;
            let usersDone = 0;
            let age;
            let username;
            // Keep going until no more colons are found in the file. Semicolons could also work but would require extra
            // less efficient code.
            while (colon != -1) {
                // Find the next username and age. Pairs are split by semicolons with the names and ages separated by colons
                username = userInfo.substring(semiColon + 1, colon);
                semiColon = userInfo.indexOf(';', colon);
                age = userInfo.substring(colon + 1, semiColon);
                colon = userInfo.indexOf(':', semiColon);
                store.add({ "username": username, "age": age });
                // There are about 279082 values. Progress will only be updated every 2048 to increase performance.
                // Coincidentally this is about 1%.
                usersDone++;
                if ((usersDone & 2047) === 0) {
                    // @ts-ignore
                    postMessage(JSON.stringify({
                        message: "progress",
                        percent: (semiColon / userInfo.length * 100).toFixed(0),
                        textInfo: `Processing ${(colon / 1000000).toFixed(1)}MB/${(userInfo.length / 1000000).toFixed(1)}MB`
                    }));
                }
            }
            // Prepare to submit to the database.
            // I really don't like how this works. The transactions should have
            // a submit() method, not rely on implied submission.
            // @ts-ignore
            postMessage('{"message":"posting"}');
            tx.oncomplete = () => {
                // @ts-ignore
                postMessage('{"message":"done"}');
            };
            tx.onerror = () => {
                // @ts-ignore
                postMessage('{"message":"dbStoreError"}');
            };
        };
    });
}
processData();
