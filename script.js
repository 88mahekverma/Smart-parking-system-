// =====================================
// SMART PARKING SYSTEM
// script.js
// =====================================

// ---------- MOBILE MENU ----------

const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn) {
    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });
}

// ---------- PARKING SLOT SELECTION ----------

const slots = document.querySelectorAll(".slot.available");
const slotSelect = document.getElementById("slot");

slots.forEach(slot => {

    slot.addEventListener("click", () => {

        const selectedSlot = slot.querySelector("h3").innerText;

        slotSelect.value = selectedSlot;

        slots.forEach(s => {
            s.style.border = "none";
        });

        slot.style.border = "4px solid #FFD54F";

        alert("Parking Slot " + selectedSlot + " Selected");

    });

});

// ---------- RESERVATION FORM ----------

const bookingForm = document.getElementById("bookingForm");

bookingForm.addEventListener("submit", function(e){

    e.preventDefault();

    const name = document.getElementById("name").value;
    const slot = document.getElementById("slot").value;
// Save booking details (optional)
localStorage.setItem("customerName", name);
localStorage.setItem("selectedSlot", slot);

// Scroll to payment section
document.getElementById("payment").scrollIntoView({
    behavior: "smooth"

});

// ---------- PAYMENT FORM ----------

const paymentForm = document.getElementById("paymentForm");

paymentForm.addEventListener("submit", function(e){

    e.preventDefault();

    const customerName = localStorage.getItem("customerName");
const selectedSlot = localStorage.getItem("selectedSlot");

alert(
    "Payment Successful!\n\n" +
    "Booking Confirmed!\n" +
    "Name: " + customerName +
    "\nSlot: " + selectedSlot
);

paymentForm.reset();
bookingForm.reset();

localStorage.removeItem("customerName");
localStorage.removeItem("selectedSlot");

});

// ---------- CONTACT FORM ----------

const contactForm = document.querySelector(".contact form");

contactForm.addEventListener("submit", function(e){

    e.preventDefault();

    alert("Your message has been sent successfully.");

    contactForm.reset();

});
