// Regex for username validation because new reddit is awful, and the best way to get user tags is to see which have
// a URL starting with /user/. However, for ads, there will be links like that that are not the user tag.
let reg = /^[a-zA-Z0-9_-]*$/;
/**
 * The css to add to the flair. I'm not using a stylesheet because that complicates things.
 * margin-left and margin-right are defined even though the documentation says that if only one is defined the other
 * will be like that too because in my experience, it doesn't work like that.
 */
let flairCSS = "display: inline-block; padding: 2px; font-size: 10px; font-weight: bold; text-align: center; " +
    "border-radius: 3px; background-color: orange; margin-left: 2px; margin-right: 2px;";
/**
 * Adds an age flair to a user tag, and marks it as having the age added.
 * @param userTag The <a> tag containing the username
 * @param text    The text for the flair to contain
 */
function addAgeFlair(userTag, text) {
    userTag.insertAdjacentHTML('afterend', `<a style="${flairCSS}">${text}</a>`);
    // Prevent multiple tags from being inserted
    userTag.setAttribute('x-ageadded', 'yes');
}
// If this is not true, it will inform the user in the tags.
let setupComplete = false;
// The user tags fetched. It's declared here and not passed as a function parameter because the length of it needs to
// checked against the length of the new array and only one will exist anyways.
let userTags = null;
// cscript for content script
const port = chrome.runtime.connect({ name: "cscript" });
let pendingUsers = [];
let pendingUserTags = [];
function updateUserTags() {
    for (let i = 0; i < userTags.length; i++) {
        if (userTags[i].getAttribute("x-ageadded") === null) {
            let username = userTags[i].innerHTML;
            if (username.startsWith("/u/"))
                username = username.substring(3);
            else if (username.startsWith("u/"))
                username = username.substring(2);
            // Because new reddit doesn't have an author class, the author tags are gotten
            // by the url. Unfortunately, in some instances, links starting with /user/
            // are not in fact author tags. This checks for that.
            if (reg.test(username)) { // If this passes, it is indeed an author tag
                if (setupComplete) {
                    pendingUsers.push(username);
                    pendingUserTags.push({ username: username, tag: userTags[i] });
                }
                else {
                    addAgeFlair(userTags[i], "WSBot Stopper not set up");
                }
            }
        }
    }
    if (setupComplete) {
        // Send a request to the background script to relay the age information
        port.postMessage({
            request: 'getAges',
            users: pendingUsers
        });
    }
}
/**
 * Checks if the number of users tags has changed
 */
function checkForUpdates() {
    // The second part is needed because new reddit sucks and decides to use random class names
    let newUserTags = document.querySelectorAll('.author,a[href^="/user/"]');
    if (userTags === null || newUserTags.length > userTags.length) {
        userTags = newUserTags;
        updateUserTags();
    }
}
// Only work on WSB
if (window.location.href.indexOf("reddit.com/r/wallstreetbets") != -1) {
    port.postMessage({ request: "terms" });
    setInterval(checkForUpdates, 2000);
}
port.onMessage.addListener(msg => {
    if (msg.request === 'terms') {
        console.log(msg.terms);
        if (msg.terms === "I agree to the terms and conditions.") {
            setupComplete = true;
        }
    }
    else if (msg.request === 'getAges') {
        if (msg.error) {
            console.log('DB error: ' + msg.errorReason);
        }
        else {
            let ages = msg.ages;
            // Add the flairs to all of the tags now
            for (let i = 0; i < pendingUserTags.length; i++) {
                if (ages[pendingUserTags[i].username] !== undefined) {
                    let age = ages[pendingUserTags[i].username].age;
                    // Compute how many days ago (Divide by 86400 bc that how many seconds in a day)
                    let timeAgo = Math.floor(((((new Date()).getTime() / 1000) - age) / 86400));
                    let yearsAgo = Math.floor(timeAgo / 365);
                    let monthsAgo = Math.floor((timeAgo % 365) / 30);
                    let daysAgo = (timeAgo % 365) % 30;
                    let agoString = `${yearsAgo}yr ${monthsAgo}m ${daysAgo}d`;
                    addAgeFlair(pendingUserTags[i].tag, agoString);
                }
                else {
                    // I got the data for up to 2020, so if it is not there, it means that the age is less than 1 year.
                    addAgeFlair(pendingUserTags[i].tag, "<1yr");
                }
            }
            // Clear the arrays now that the user tags have been added.
            pendingUserTags = [];
            pendingUsers = [];
        }
    }
});
