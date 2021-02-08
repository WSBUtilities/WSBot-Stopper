// This, including the id names, is just a bunch of stuff to try to limit my legal liability.
function IAgreeToTheTermsAndConditions() {
    if (document.getElementById("IAgreeToTheTermsAndConditions").checked) {
        localStorage.setItem("terms", "I agree to the terms and conditions.");
        window.location.assign("../importdb/importdb.html");
    }
}
document.getElementById("IAgreeToTheTermsAndConditionsIrrevocably").addEventListener("click", IAgreeToTheTermsAndConditions);
document.getElementById("IAgreeToTheTermsAndConditions").addEventListener("change", ev => {
    if (document.getElementById("IAgreeToTheTermsAndConditions").checked) {
        document.getElementById("IAgreeToTheTermsAndConditionsIrrevocably").removeAttribute("disabled");
    }
    else {
        document.getElementById("IAgreeToTheTermsAndConditionsIrrevocably").setAttribute("disabled", "");
    }
});
