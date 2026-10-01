// ============================================================
// SMART PARKING - FINAL SCRIPT
// Firebase + Login + City Selection + Live Slots + Booking
// ============================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getDatabase,
    ref,
    onValue,
    get,
    set,
    update
} from
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


// ============================================================
// FIREBASE CONFIG - YOUR PROJECT
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyDCa1T-htDrZsGygxNbKkZxbrYEh5JYRQ",
    authDomain: "smart-parking-system-d46c9.firebaseapp.com",
    databaseURL:
        "https://smart-parking-system-d46c9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smart-parking-system-d46c9",
    storageBucket: "smart-parking-system-d46c9.firebasestorage.app",
    messagingSenderId: "456268505088",
    appId: "1:456268505088:web:e577fac7746f3a9bc2f8e5",
    measurementId: "G-DH2755KD5Z"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let selectedCity = "surat";
let currentUser = null;
let currentSlots = {};

let stopSlotListener = null;
let stopGateListener = null;

let selectedBookingSlot = null;


// ============================================================
// HTML ELEMENTS
// ============================================================

const loginNavBtn = document.getElementById("loginNavBtn");
const loginModal = document.getElementById("loginModal");
const closeLoginModal = document.getElementById("closeLoginModal");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const loginMessage = document.getElementById("loginMessage");
const loginMessageBtn = document.getElementById("loginMessageBtn");

const showSignup = document.getElementById("showSignup");

const signupModal = document.getElementById("signupModal");
const closeSignupModal = document.getElementById("closeSignupModal");
const signupForm = document.getElementById("signupForm");

const showLogin = document.getElementById("showLogin");

const cityButtons = document.querySelectorAll(".city-btn");

const selectedCityName =
    document.getElementById("selectedCityName");

const parkingStatus =
    document.getElementById("parkingStatus");

const slotContainer =
    document.getElementById("slotContainer");

const availableCount =
    document.getElementById("availableCount");

const reservedCount =
    document.getElementById("reservedCount");

const occupiedCount =
    document.getElementById("occupiedCount");

const totalCount =
    document.getElementById("totalCount");

const fullMessage =
    document.getElementById("fullMessage");

const loginMessageButton =
    document.getElementById("loginMessageBtn");


// Booking
const bookingModal =
    document.getElementById("bookingModal");

const closeBookingModal =
    document.getElementById("closeBookingModal");

const bookingCity =
    document.getElementById("bookingCity");

const bookingSlot =
    document.getElementById("bookingSlot");

const bookingUser =
    document.getElementById("bookingUser");

const confirmBookingBtn =
    document.getElementById("confirmBookingBtn");


// Payment
const paymentModal =
    document.getElementById("paymentModal");

const closePaymentModal =
    document.getElementById("closePaymentModal");

const payNowBtn =
    document.getElementById("payNowBtn");


// Arrival
const arrivalPanel =
    document.getElementById("arrivalPanel");

const arriveBtn =
    document.getElementById("arriveBtn");


// Gate
const gatePanel =
    document.getElementById("gatePanel");

const gateIcon =
    document.getElementById("gateIcon");

const gateStatusText =
    document.getElementById("gateStatusText");

const gateStatusMessage =
    document.getElementById("gateStatusMessage");


// Toast
const toast =
    document.getElementById("toast");


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


function openModal(modal) {
    if (!modal) return;

    modal.classList.add("show");
}


function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("show");
}


function setParkingStatus(message, type = "loading") {
    if (!parkingStatus) return;

    parkingStatus.textContent = message;

    parkingStatus.classList.remove(
        "loading",
        "success",
        "error"
    );

    parkingStatus.classList.add(type);
}


function normalizeStatus(slot) {

    if (!slot) {
        return "available";
    }

    let status = String(
        slot.status || "available"
    ).toLowerCase().trim();

    if (
        status === "reserved" ||
        status === "booked"
    ) {
        return "reserved";
    }

    if (
        status === "occupied" ||
        status === "full"
    ) {
        return "occupied";
    }

    return "available";
}


// ============================================================
// LOGIN MODAL
// ============================================================

if (loginNavBtn) {

    loginNavBtn.addEventListener("click", () => {

        if (currentUser) {
            signOut(auth);
            return;
        }

        openModal(loginModal);

    });

}


// Close login
if (closeLoginModal) {

    closeLoginModal.addEventListener("click", () => {
        closeModal(loginModal);
    });

}


// Login form
if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = loginEmail.value.trim();
        const password = loginPassword.value;

        if (!email || !password) {
            showToast("Please enter email and password.");
            return;
        }

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            closeModal(loginModal);

            showToast("Login successful.");

        } catch (error) {

            console.error(error);

            showToast(
                "Login failed: " + error.message
            );

        }

    });

}


// ============================================================
// SIGN UP
// ============================================================

if (showSignup) {

    showSignup.addEventListener("click", () => {

        closeModal(loginModal);
        openModal(signupModal);

    });

}


if (showLogin) {

    showLogin.addEventListener("click", () => {

        closeModal(signupModal);
        openModal(loginModal);

    });

}


if (closeSignupModal) {

    closeSignupModal.addEventListener("click", () => {
        closeModal(signupModal);
    });

}


if (signupForm) {

    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const emailInput =
            document.getElementById("signupEmail");

        const passwordInput =
            document.getElementById("signupPassword");

        const email =
            emailInput?.value.trim();

        const password =
            passwordInput?.value;

        if (!email || !password) {

            showToast(
                "Please enter email and password."
            );

            return;
        }

        try {

            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            closeModal(signupModal);

            showToast("Account created successfully.");

        } catch (error) {

            console.error(error);

            showToast(
                "Signup failed: " + error.message
            );

        }

    });

}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(auth, (user) => {

    currentUser = user;

    if (!loginNavBtn) return;

    if (user) {

        loginNavBtn.textContent = "Logout";

    } else {

        loginNavBtn.textContent = "Login";

    }

    updateArrivalButton();

});


// ============================================================
// CITY BUTTONS - IMPORTANT FIX
// ============================================================

cityButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const city =
            button.dataset.city;

        if (!city) return;

        // ACTUALLY CHANGE THE CITY
        selectedCity = city.toLowerCase();

        // Change active button
        cityButtons.forEach((btn) => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        // Change heading
        if (selectedCityName) {

            selectedCityName.textContent =
                city.charAt(0).toUpperCase() +
                city.slice(1) +
                " Parking";

        }

        // Reset display
        if (slotContainer) {

            slotContainer.innerHTML =
                `<div class="loading-box">
                    Loading parking data...
                </div>`;

        }

        // Load selected city
        loadCity(selectedCity);

    });

});


// ============================================================
// LOAD CITY
// ============================================================

function loadCity(city) {

    selectedCity = city.toLowerCase();

    console.log(
        "Loading city:",
        selectedCity
    );

    if (selectedCityName) {

        selectedCityName.textContent =
            selectedCity === "surat"
                ? "Surat Parking"
                : "Navsari Parking";

    }

    setParkingStatus(
        `Connecting to ${selectedCityName?.textContent || selectedCity}...`,
        "loading"
    );


    // Stop previous listener
    if (stopSlotListener) {

        stopSlotListener();
        stopSlotListener = null;

    }


    // Stop previous gate listener
    if (stopGateListener) {

        stopGateListener();
        stopGateListener = null;

    }


    // EXACT FIREBASE PATH
    const slotsRef =
        ref(
            db,
            `cities/${selectedCity}/slots`
        );


    stopSlotListener = onValue(
        slotsRef,

        (snapshot) => {

            console.log(
                "Firebase slot data:",
                snapshot.val()
            );

            const data =
                snapshot.val();

            if (!data) {

                currentSlots = {};

                setParkingStatus(
                    `${selectedCityName?.textContent || selectedCity} connected, but no slot data was found.`,
                    "error"
                );

                renderSlots();

                return;
            }


            currentSlots = data;

            setParkingStatus(
                "Connected to Firebase",
                "success"
            );

            renderSlots();

            updateArrivalButton();

        },

        (error) => {

            console.error(
                "Firebase slot error:",
                error
            );

            setParkingStatus(
                "Firebase connection error.",
                "error"
            );

            if (slotContainer) {

                slotContainer.innerHTML =
                    `<div class="loading-box">
                        Unable to load parking data.
                    </div>`;

            }

        }
    );


    loadGate(city);

}


// ============================================================
// RENDER SLOTS
// ============================================================

function renderSlots() {

    if (!slotContainer) return;


    const slotIds = [
        "slot1",
        "slot2",
        "slot3"
    ];


    let available = 0;
    let reserved = 0;
    let occupied = 0;


    slotContainer.innerHTML = "";


    slotIds.forEach((slotId) => {

        const slot =
            currentSlots[slotId] || {};

        const status =
            normalizeStatus(slot);


        if (status === "available") {
            available++;
        }

        if (status === "reserved") {
            reserved++;
        }

        if (status === "occupied") {
            occupied++;
        }


        const card =
            document.createElement("div");

        card.className =
            "slot-card";


        const readableSlot =
            slotId
                .replace("slot", "Slot ");


        let statusText =
            "Available";


        if (status === "reserved") {
            statusText = "Reserved";
        }

        if (status === "occupied") {
            statusText = "Occupied";
        }


        card.innerHTML = `

            <div class="slot-top">

                <div class="slot-name">
                    ${readableSlot}
                </div>

                <span class="status-badge ${status}">
                    ${statusText}
                </span>

            </div>

            <div class="slot-bottom">

                ${
                    status === "available"
                    ?
                    `<button
                        class="slot-action reserve-btn"
                        data-slot="${slotId}">
                        Reserve
                    </button>`
                    :
                    `<span class="slot-unavailable">
                        ${statusText}
                    </span>`
                }

            </div>
        `;


        slotContainer.appendChild(card);

    });


    // Counts
    if (availableCount) {
        availableCount.textContent =
            available;
    }

    if (reservedCount) {
        reservedCount.textContent =
            reserved;
    }

    if (occupiedCount) {
        occupiedCount.textContent =
            occupied;
    }

    if (totalCount) {
        totalCount.textContent =
            slotIds.length;
    }


    // Full message
    if (fullMessage) {

        if (available === 0) {

            fullMessage.classList.remove(
                "hidden"
            );

        } else {

            fullMessage.classList.add(
                "hidden"
            );

        }

    }


    // Reserve buttons
    document
        .querySelectorAll(".reserve-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const slotId =
                        button.dataset.slot;

                    startBooking(slotId);

                }
            );

        });

}


// ============================================================
// START BOOKING
// ============================================================

function startBooking(slotId) {

    if (!currentUser) {

        openModal(loginModal);

        showToast(
            "Please login before reserving a slot."
        );

        return;
    }


    selectedBookingSlot =
        slotId;


    const slot =
        currentSlots[slotId];


    if (!slot) return;


    if (
        normalizeStatus(slot) !==
        "available"
    ) {

        showToast(
            "This slot is no longer available."
        );

        return;

    }


    if (bookingCity) {

        bookingCity.textContent =
            selectedCity === "surat"
                ? "Surat"
                : "Navsari";

    }


    if (bookingSlot) {

        bookingSlot.textContent =
            slotId
                .replace("slot", "Slot ");

    }


    if (bookingUser) {

        bookingUser.textContent =
            currentUser.email;

    }


    openModal(bookingModal);

}


// ============================================================
// CLOSE BOOKING MODAL
// ============================================================

if (closeBookingModal) {

    closeBookingModal.addEventListener(
        "click",
        () => {
            closeModal(bookingModal);
        }
    );

}


// ============================================================
// CONFIRM BOOKING
// ============================================================

if (confirmBookingBtn) {

    confirmBookingBtn.addEventListener(
        "click",
        () => {

            if (!currentUser) {

                closeModal(bookingModal);
                openModal(loginModal);

                return;

            }


            closeModal(bookingModal);

            openModal(paymentModal);

        }
    );

}


// ============================================================
// CLOSE PAYMENT
// ============================================================

if (closePaymentModal) {

    closePaymentModal.addEventListener(
        "click",
        () => {
            closeModal(paymentModal);
        }
    );

}


// ============================================================
// PAYMENT + RESERVATION
// ============================================================

if (payNowBtn) {

    payNowBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                closeModal(paymentModal);
                openModal(loginModal);

                return;

            }


            if (!selectedBookingSlot) {

                showToast(
                    "Please select a slot."
                );

                return;

            }


            const slotRef =
                ref(
                    db,
                    `cities/${selectedCity}/slots/${selectedBookingSlot}`
                );


            try {

                // Check latest Firebase value
                const snapshot =
                    await get(slotRef);


                const latestSlot =
                    snapshot.val();


                if (
                    normalizeStatus(latestSlot) !==
                    "available"
                ) {

                    closeModal(paymentModal);

                    showToast(
                        "Sorry, this slot was just booked."
                    );

                    return;

                }


                const now =
                    Date.now();


                const expiry =
                    now +
                    (2 * 60 * 60 * 1000);


                await update(
                    slotRef,
                    {

                        status: "reserved",

                        bookedBy:
                            currentUser.uid,

                        bookedEmail:
                            currentUser.email,

                        bookingTime:
                            now,

                        expiryTime:
                            expiry,

                        paymentStatus:
                            "paid",

                        paymentAmount:
                            50

                    }
                );


                closeModal(paymentModal);


                showToast(
                    "Payment successful. Slot reserved!"
                );


                selectedBookingSlot =
                    
