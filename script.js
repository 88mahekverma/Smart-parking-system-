// ==============================
// SMART PARKING SYSTEM
// script.js (Part 3A)
// ==============================

// Mobile Menu

const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
});
// ==============================
// Parking Slot Selection
// ==============================

const slots = document.querySelectorAll(".slot.available");
const slotSelect = document.getElementById("slot");

slots.forEach(slot => {

    slot.addEventListener("click", () => {

        const slotNumber = slot.querySelector("h3").innerText;

        slotSelect.value = slotNumber;

        slots.forEach(s => {
            s.style.border = "none";
        });

        slot.style.border = "4px solid yellow";

    });

});

// ==============================
// Reservation Form
// ==============================

const bookingForm = document.getElementById("bookingForm");

bookingForm.addEventListener("submit", function(e){

    e.preventDefault();

    const name = document.getElementById("name").value;

    const slot = document.getElementById("slot").value;

    alert(
        "Reservation Successful!\n\n" +
        "Customer: " + name +
        "\nParking Slot: " + slot
    );

    localStorage.setItem("customerName", name);
    localStorage.setItem("parkingSlot", slot);

    bookingForm.reset();

});

// ==============================
// Payment Form
// ==============================

const paymentForm = document.getElementById("paymentForm");

paymentForm.addEventListener("submit", function(e){

    e.preventDefault();

    alert("Payment Successful!\n\nThank you for choosing Smart Parking.");

    paymentForm.reset();

});
