if (localStorage.getItem("terms") === "I agree to the terms and conditions." &&
    localStorage.getItem("setupStatus") === "done") {
    document.getElementById("setUp").style.display = "block";
    document.getElementById("notSetUp").style.display = "none";
    document.body.style.minWidth = "500px";
}
// No else block is needed because the default is to show the view of setup not complete.
