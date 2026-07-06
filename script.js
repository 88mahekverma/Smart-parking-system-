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

    alert(
        "Reservation Successful!\n\n" +
        "Name: " + name +
        "\nSlot: " + slot
    );

    bookingForm.reset();

});

// ---------- PAYMENT FORM ----------

const paymentForm = document.getElementById("paymentForm");

paymentForm.addEventListener("submit", function(e){

    e.preventDefault();

    alert("Payment Successful!\n\nThank you for using Smart Parking System.");

    paymentForm.reset();

});

// ---------- CONTACT FORM ----------

const contactForm = document.querySelector(".contact form");

contactForm.addEventListener("submit", function(e){

    e.preventDefault();

    alert("Your message has been sent successfully.");

    contactForm.reset();

});
