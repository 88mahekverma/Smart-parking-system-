// ======================================================
// SMART PARKING SYSTEM
// Firebase + Login + City Selection + Live Parking
// ======================================================

// ---------------- FIREBASE IMPORTS ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getDatabase,
    ref,
    onValue,
    get,
    update
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


// ======================================================
// FIREBASE CONFIG
// ======================================================

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


// ======================================================
// INITIALIZE FIREBASE
// ======================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let selectedCity = "surat";
let currentUser = null;
let currentSlots = {};
let currentReservation = null;


// ======================================================
// GET HTML ELEMENTS
// ======================================================

const loginNavBtn = document.getElementById("loginNavBtn");

const loginModal = document.getElementById("loginModal");
const closeLoginModal = document.getElementById("closeLoginModal");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const showSignup = document.getElementById("showSignup");

const signupModal = document.getElementById("signupModal");
const closeSignupModal = document.getElementById("closeSignupModal");
const signupForm = document.getElementById("signupForm");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupError = document.getElementById("signupError");
const showLogin = document.getElementById("showLogin");

const cityButtons = document.querySelectorAll(".city-btn");

const parkingStatus = document.getElementById("parkingStatus");
const selectedCityName = document.getElementById("selectedCityName");

const availableCount = document.getElementById("availableCount");
const reservedCount = document.getElementById("reservedCount");
const occupiedCount = document.getElementById("occupiedCount");
const totalCount = document.getElementById("totalCount");

const slotContainer = document.getElementById("slotContainer");
const fullMessage = document.getElementById("fullMessage");

const arrivalPanel = document.getElementById("arrivalPanel");
const arriveBtn = document.getElementById("arriveBtn");

const gatePanel = document.getElementById("gatePanel");
const gateIcon = document.getElementById("gateIcon");
const gateStatusText = document.getElementById("gateStatusText");
const gateStatusMessage = document.getElementById("gateStatusMessage");

const bookingModal = document.getElementById("bookingModal");
const closeBookingModal = document.getElementById("closeBookingModal");
const bookingCity = document.getElementById("bookingCity");
const bookingSlot = document.getElementById("bookingSlot");
const bookingUser = document.getElementById("bookingUser");
const confirmBookingBtn = document.getElementById("confirmBookingBtn");

const paymentModal = document.getElementById("paymentModal");
const closePaymentModal = document.getElementById("closePaymentModal");
const payNowBtn = document.getElementById("payNowBtn");

const toast = document.getElementById("toast");


// ======================================================
// TOAST MESSAGE
// ======================================================

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove("hidden");

    setTimeout(() => {
        toast.classList.add("hidden");
    }, 3000);
}


// ======================================================
// MODAL FUNCTIONS
// ======================================================

function openLogin() {
    loginModal.classList.remove("hidden");
    loginError.textContent = "";
}

function closeLogin() {
    loginModal.classList.add("hidden");
}

function openSignup() {
    loginModal.classList.add("hidden");
    signupModal.classList.remove("hidden");
    signupError.textContent = "";
}

function closeSignup() {
    signupModal.classList.add("hidden");
}

function closeBooking() {
    bookingModal.classList.add("hidden");
}

function closePayment() {
    paymentModal.classList.add("hidden");
}


// ======================================================
// LOGIN BUTTON
// ======================================================

if (loginNavBtn) {
    loginNavBtn.addEventListener("click", () => {

        if (currentUser) {
            signOut(auth)
                .then(() => {
                    showToast("Logged out successfully");
                })
                .catch((error) => {
                    console.error(error);
                    showToast("Logout failed");
                });
        } else {
            openLogin();
        }

    });
}


// ======================================================
// CLOSE BUTTONS
// ======================================================

if (closeLoginModal) {
    closeLoginModal.addEventListener("click", closeLogin);
}

if (closeSignupModal) {
    closeSignupModal.addEventListener("click", closeSignup);
}

if (closeBookingModal) {
    closeBookingModal.addEventListener("click", closeBooking);
}

if (closePaymentModal) {
    closePaymentModal.addEventListener("click", closePayment);
}


// ======================================================
// LOGIN → SIGNUP
// ======================================================

if (showSignup) {
    showSignup.addEventListener("click", (event) => {
        event.preventDefault();
        openSignup();
    });
}


// ======================================================
// SIGNUP → LOGIN
// ======================================================

if (showLogin) {
    showLogin.addEventListener("click", (event) => {
        event.preventDefault();
        closeSignup();
        openLogin();
    });
}


// ======================================================
// LOGIN
// ======================================================

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = loginEmail.value.trim();
        const password = loginPassword.value;

        loginError.textContent = "";

        if (!email || !password) {
            loginError.textContent = "Please enter email and password.";
            return;
        }

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            closeLogin();

            loginForm.reset();

            showToast("Login successful");

        } catch (error) {

            console.error("Login error:", error);

            loginError.textContent = getFirebaseError(error);

        }

    });

}


// ======================================================
// SIGNUP
// ======================================================

if (signupForm) {

    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = signupEmail.value.trim();
        const password = signupPassword.value;

        signupError.textContent = "";

        if (!email || !password) {
            signupError.textContent =
                "Please enter email and password.";

            return;
        }

        if (password.length < 6) {
            signupError.textContent =
                "Password must contain at least 6 characters.";

            return;
        }

        try {

            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            closeSignup();

            signupForm.reset();

            showToast("Account created successfully");

        } catch (error) {

            console.error("Signup error:", error);

            signupError.textContent =
                getFirebaseError(error);

        }

    });

}


// ======================================================
// FIREBASE ERROR MESSAGE
// ======================================================

function getFirebaseError(error) {

    switch (error.code) {

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/invalid-email":
            return "Please enter a valid email.";

        case "auth/weak-password":
            return "Password is too weak.";

        default:
            return error.message || "Something went wrong.";

    }
}


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, (user) => {

    currentUser = user;

    if (user) {

        loginNavBtn.textContent = "Logout";

        console.log("Logged in:", user.email);

    } else {

        loginNavBtn.textContent = "Login";

        console.log("No user logged in.");

    }

    findMyReservation();

});


// ======================================================
// CITY BUTTONS
// ======================================================

cityButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const city = button.dataset.city;

        if (!city) return;

        selectedCity = city;

        // Remove active from all buttons
        cityButtons.forEach((btn) => {
            btn.classList.remove("active");
        });

        // Activate clicked button
        button.classList.add("active");

        // Change heading
        selectedCityName.textContent =
            city === "surat"
                ? "Surat Parking"
                : "Navsari Parking";

        // Load selected city's Firebase data
        loadParkingData();

        // Load selected city's gate
        listenToGate();

    });

});


// ======================================================
// PARKING DATA
// ======================================================

function loadParkingData() {

    parkingStatus.textContent =
        "Connecting to Firebase...";

    parkingStatus.classList.remove("success");
    parkingStatus.classList.remove("error");

    slotContainer.innerHTML =
        "<p>Loading parking slots...</p>";

    const slotsRef =
        ref(db, `cities/${selectedCity}/slots`);

    onValue(
        slotsRef,

        (snapshot) => {

            if (!snapshot.exists()) {

                parkingStatus.textContent =
                    "No parking slot data found.";

                parkingStatus.classList.add("error");

                currentSlots = {};

                renderSlots();

                return;
            }

            currentSlots = snapshot.val();

            parkingStatus.textContent =
                "Firebase connected";

            parkingStatus.classList.add("success");

            renderSlots();

            findMyReservation();

        },

        (error) => {

            console.error(
                "Firebase database error:",
                error
            );

            parkingStatus.textContent =
                "Firebase connection failed.";

            parkingStatus.classList.add("error");

            slotContainer.innerHTML =
                "<p>Unable to load parking slots.</p>";

        }
    );

}


// ======================================================
// RENDER PARKING SLOTS
// ======================================================

function renderSlots() {

    slotContainer.innerHTML = "";

    const slotNames = [
        "slot1",
        "slot2",
        "slot3"
    ];

    let available = 0;
    let reserved = 0;
    let occupied = 0;

    slotNames.forEach((slotName) => {

        const slot = currentSlots[slotName];

        const status =
            slot?.status || "available";

        if (status === "available") {
            available++;
        }

        if (status === "reserved") {
            reserved++;
        }

        if (status === "occupied") {
            occupied++;
        }

        const card = document.createElement("div");

        card.className = "slot-card";

        card.innerHTML = `
            <div class="slot-number">
                ${slotName.replace("slot", "Slot ")}
            </div>

            <div class="status-badge ${status}">
                ${capitalize(status)}
            </div>

            ${
                status === "available"
                ? `
                    <button
                        class="reserve-btn"
                        data-slot="${slotName}">
                        Reserve Slot
                    </button>
                  `
                : ""
            }
        `;

        slotContainer.appendChild(card);

    });

    availableCount.textContent = available;
    reservedCount.textContent = reserved;
    occupiedCount.textContent = occupied;
    totalCount.textContent = 3;

    if (available === 0) {

        fullMessage.classList.remove("hidden");

    } else {

        fullMessage.classList.add("hidden");

    }

    // Reserve buttons
    document.querySelectorAll(".reserve-btn")
        .forEach((button) => {

            button.addEventListener("click", () => {

                const slot =
                    button.dataset.slot;

                reserveSlot(slot);

            });

        });

}


// ======================================================
// CAPITALIZE
// ======================================================

function capitalize(text) {

    return text.charAt(0).toUpperCase()
        + text.slice(1);

}


// ======================================================
// RESERVE SLOT
// ======================================================

async function reserveSlot(slotId) {

    if (!currentUser) {

        openLogin();

        showToast(
            "Please login before reserving a slot."
        );

        return;
    }

    const slotRef =
        ref(
            db,
            `cities/${selectedCity}/slots/${slotId}`
        );

    try {

        const snapshot = await get(slotRef);

        if (!snapshot.exists()) {

            showToast("Slot does not exist.");

            return;
        }

        const slot = snapshot.val();

        if (slot.status !== "available") {

            showToast(
                "This slot is no longer available."
            );

            return;
        }

        bookingCity.textContent =
            selectedCity === "surat"
                ? "Surat"
                : "Navsari";

        bookingSlot.textContent =
            slotId.replace("slot", "Slot ");

        bookingUser.textContent =
            currentUser.email;

        bookingModal.classList.remove("hidden");

        confirmBookingBtn.dataset.slot =
            slotId;

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to check parking slot."
        );

    }

}


// ======================================================
// CONFIRM BOOKING
// ======================================================

if (confirmBookingBtn) {

    confirmBookingBtn.addEventListener(
        "click",
        () => {

            if (!currentUser) {

                closeBooking();
                openLogin();

                return;
            }

            paymentModal.classList.remove(
                "hidden"
            );

        }
    );

}


// ======================================================
// PAYMENT
// ======================================================

if (payNowBtn) {

    payNowBtn.addEventListener(
        "click",
        async () => {

            const slotId =
                confirmBookingBtn.dataset.slot;

            if (!slotId || !currentUser) {

                showToast(
                    "Booking information missing."
                );

                return;
            }

            const slotRef =
                ref(
                    db,
                    `cities/${selectedCity}/slots/${slotId}`
                );

            const bookingData = {

                status: "reserved",

                bookedBy: currentUser.uid,

                bookedEmail:
                    currentUser.email,

                bookingTime:
                    Date.now(),

                expiryTime:
                    Date.now() +
                    (2 * 60 * 60 * 1000),

                paymentStatus: "paid",

                paymentAmount: 50

            };

            try {

                const snapshot =
                    await get(slotRef);

                if (!snapshot.exists()) {

                    showToast(
                        "Slot does not exist."
                    );

                    return;
                }

                if (
                    snapshot.val().status !==
                    "available"
                ) {

                    showToast(
                        "Slot is no longer available."
                    );

                    closePayment();

                    return;
                }

                await update(
                    slotRef,
                    bookingData
                );

                closePayment();
                closeBooking();

                showToast(
                    "Parking slot reserved successfully."
                );

                findMyReservation();

            } catch (error) {

                console.error(
                    "Booking error:",
                    error
                );

                showToast(
                    "Booking failed. Please try again."
                );

            }

        }
    );

}


// ======================================================
// FIND CURRENT USER'S RESERVATION
// ======================================================

async function findMyReservation() {

    currentReservation = null;

    arrivalPanel.classList.add("hidden");

    if (!currentUser) return;

    const slotsRef =
        ref(
            db,
            `cities/${selectedCity}/slots`
        );

    try {

        const snapshot =
            await get(slotsRef);

        if (!snapshot.exists()) return;

        const slots = snapshot.val();

        Object.keys(slots).forEach((slotId) => {

            const slot = slots[slotId];

            if (
                slot &&
                slot.status === "reserved" &&
                (
                    slot.bookedBy ===
                    currentUser.uid
                    ||
                    slot.bookedEmail ===
                    currentUser.email
                )
           
