// =====================================
// FIREBASE SETUP
// =====================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCa1T-htDrZsGygxNbKkZxbrYEhF5JYRQ",
  authDomain: "smart-parking-system-d46c9.firebaseapp.com",
  databaseURL: "https://smart-parking-system-d46c9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-parking-system-d46c9",
  storageBucket: "smart-parking-system-d46c9.firebasestorage.app",
  messagingSenderId: "456268505088",
  appId: "1:456268505088:web:e577fac7746f3a9bc2f8e5",
  measurementId: "G-DH2755KD5Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
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

    });

});

// ---------- RESERVATION FORM ----------

const bookingForm = document.getElementById("bookingForm");

bookingForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const vehicle = document.getElementById("vehicle").value;
    const slot = document.getElementById("slot").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    // Save booking in Firebase
    set(ref(database, "bookings/" + slot), {
        name: name,
        email: email,
        phone: phone,
        vehicle: vehicle,
        slot: slot,
        date: date,
        time: time,
        payment: "Pending"
    });

    // Save for payment page
    localStorage.setItem("customerName", name);
    localStorage.setItem("selectedSlot", slot);

    alert("Reservation saved successfully!");

    document.getElementById("payment").scrollIntoView({
        behavior: "smooth"
    });

});

// ---------- PAYMENT FORM ----------

const paymentForm = document.getElementById("paymentForm");

paymentForm.addEventListener("submit", function(e){

    e.preventDefault();

    const customerName = localStorage.getItem("customerName");
    const selectedSlot = localStorage.getItem("selectedSlot");

    // Mark booking as paid
    update(ref(database, "bookings/" + selectedSlot), {
        payment: "Paid"
    });

    // Update parking slot status
    set(ref(database, "parking/" + selectedSlot), {
        status: "Reserved"
    });

    alert(
        "✅ Payment Successful!\n\n" +
        "Booking Confirmed!\n\n" +
        "Name: " + customerName +
        "\nSlot: " + selectedSlot
    );

    paymentForm.reset();
    bookingForm.reset();

    localStorage.removeItem("customerName");
    localStorage.removeItem("selectedSlot");

});// =====================================
// LIVE PARKING STATUS FROM FIREBASE
// =====================================

const parkingRef = ref(database, "parking");

onValue(parkingRef, (snapshot) => {

    const data = snapshot.val();

    if (!data) return;

    document.querySelectorAll(".slot").forEach(slot => {

        const slotName = slot.querySelector("h3").innerText;

        if (data[slotName]) {

            const status = data[slotName].status;

            // Remove old classes
            slot.classList.remove("available");
            slot.classList.remove("occupied");
            slot.classList.remove("reserved");

            // Add new class
            slot.classList.add(status.toLowerCase());

            // Update text
            slot.querySelector("p").innerText = status;

            // Update button
            const btn = slot.querySelector("button");

            if (status === "Available") {
                btn.innerText = "Select";
                btn.disabled = false;
            } else if (status === "Occupied") {
                btn.innerText = "Full";
                btn.disabled = true;
            } else if (status === "Reserved") {
                btn.innerText = "Reserved";
                btn.disabled = true;
            }
        }

    });

});
