// Check if license has been agreed to
if (localStorage.getItem("terms") !== "I agree to the terms and conditions.") {
    window.location.assign("../terms/terms.html");
}

/**
 * The button that starts the processing
 */
let goButton = document.getElementById("beginProcessing");
/**
 * The div that needs to be shown when processing and includes the progress bar
 */
let processingInfoDiv = document.getElementById("processingInformation");
let progressBar: HTMLInputElement = <HTMLInputElement>document.getElementById("processingProgressbar");
/**
 * A text element that shows detailed information about the progress.
 * It's pretty much just how many MB have been done and a wrapping up message.
 */
let progressInfo = document.getElementById("processingPercent");

/**
 * Shows the go button and hides the progress information. Used when an error happens, and the process needs to be done again.
 */
function restoreState() {
    goButton.style.display = 'block';
    processingInfoDiv.style.display = 'none';
}

/**
 * Takes all of the information contained in the bundled file and stores it in IndexedDB.
 * IndexedDB is used because it doesn't require spending time on parsing after the initial one, unlike storing an object
 *      in localstorage. Localstorage also slows down with many keys and over 250,000 is quite a lot.
 * The processing is done in a processworker to not freeze the main page because some genius decided that the main page
 *      and javascript code should be done on the same thread.
 */
async function processData() {
    // Hide the importdb button and show the progress bar
    goButton.style.display = 'none';
    processingInfoDiv.style.display = 'block';

    // Start processing
    progressInfo.innerText = 'Preparing...';
    // It's offloaded to a different thread to not freeze the page
    let worker: Worker = new Worker("processworker.js");
    // Interpret messages from the worker
    worker.onmessage = event => {
        let message = JSON.parse(event.data);
        if (message.message === "progress") {
            progressBar.value = message.percent;
            progressInfo.innerText = message.textInfo;
        } else if (message.message === "posting") {
            // This means that the values have been inserted into a transaction and the
            // transaction just needs to be executed.
            // I'm unsure of how to get a progress bar for this. They probably didn't forsee someone inserting so many
            // values, but doing it in one go is much faster than many smaller transactions.
            progressInfo.innerText = "Wrapping up... This should be less than a minute";
        } else if (message.message === "done") {
            localStorage.setItem("setupStatus", "done");
            window.location.assign('../setupcomplete.html');
        } else if (message.message === "dbStoreError") {
            document.getElementById("dbStoreError").style.display = "block";
            restoreState();
        } else if (message.message === "dbOpenError") {
            document.getElementById("dbOpenError").style.display = "block";
            restoreState();
        }
    }
}

// So many times I have forgotten to add the event listener and just scratched my head wondering why
// my code wasn't working. Now it's the first thing I do.
goButton.addEventListener("click", processData);