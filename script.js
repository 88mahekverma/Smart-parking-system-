// ============================================================
// SMARTPARK - SMART PARKING SYSTEM
// FINAL FIREBASE JAVASCRIPT
// ============================================================


// ============================================================
// 1. FIREBASE IMPORTS
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
    update,
    set
} from
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


// ============================================================
// 2. YOUR EXACT FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDCa1T-htDrZsGygxNbKkZxbrYEhF5JYRQ",

    authDomain:
        "smart-parking-system-d46c9.firebaseapp.com",

    databaseURL:
        "https://smart-parking-system-d46c9-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId:
        "smart-parking-system-d46c9",

    storageBucket:
        "smart-parking-system-d46c9.firebasestorage.app",

    messagingSenderId:
        "456268505088",

    appId:
        "1:456268505088:web:e577fac7746f3a9bc2f8e5",

    measurementId:
        "G-DH2755KD5Z"
};


// ============================================================
// 3. INITIALIZE FIREBASE
// ============================================================

const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);

const database =
    getDatabase(firebaseApp);


// ============================================================
// 4. APPLICATION VARIABLES
// ============================================================

let selectedCity = "surat";

let currentUser = null;

let currentSlots = {};

let selectedBookingSlot = null;

let slotListener = null;

let gateListener = null;


// ============================================================
// 5. HTML ELEMENTS
// ============================================================

// Navbar
const loginNavBtn =
    document.getElementById("loginNavBtn");


// Login
const loginModal =
    document.getElementById("loginModal");

const closeLoginModal =
    document.getElementById("closeLoginModal");

const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginError =
    document.getElementById("loginError");

const showSignup =
    document.getElementById("showSignup");


// Signup
const signupModal =
    document.getElementById("signupModal");

const closeSignupModal =
    document.getElementById("closeSignupModal");

const signupForm =
    document.getElementById("signupForm");

const signupEmail =
    document.getElementById("signupEmail");

const signupPassword =
    document.getElementById("signupPassword");

const signupError =
    document.getElementById("signupError");

const showLogin =
    document.getElementById("showLogin");


// City
const cityButtons =
    document.querySelectorAll(".city-btn");

const selectedCityName =
    document.getElementById("selectedCityName");


// Firebase status
const parkingStatus =
    document.getElementById("parkingStatus");


// Slots
const slotContainer =
    document.getElementById("slotContainer");


// Counts
const availableCount =
    document.getElementById("availableCount");

const reservedCount =
    document.getElementById("reservedCount");

const occupiedCount =
    document.getElementById("occupiedCount");

const totalCount =
    document.getElementById("totalCount");


// Full message
const fullMessage =
    document.getElementById("fullMessage");


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
// 6. BASIC HELPERS
// ============================================================

function showModal(modal) {

    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");
}


function hideModal(modal) {

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
}


function showToast(message) {

    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);
}


function setParkingStatus(message, type) {

    if (!parkingStatus) {
        return;
    }

    parkingStatus.textContent =
        message;

    parkingStatus.classList.remove(
        "loading",
        "success",
        "error"
    );

    parkingStatus.classList.add(
        type
    );
}


// ============================================================
// 7. STATUS NORMALIZATION
// ============================================================

function getSlotStatus(slot) {

    if (!slot) {
        return "available";
    }

    const status =
        String(
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
// 8. LOGIN BUTTON
// ============================================================

loginNavBtn.addEventListener(
    "click",
    async () => {

        if (currentUser) {

            try {

                await signOut(auth);

                showToast(
                    "You have been logged out."
                );

            } catch (error) {

                console.error(error);

                showToast(
                    "Logout failed."
                );

            }

            return;
        }


        showModal(loginModal);

    }
);


// ============================================================
// 9. CLOSE LOGIN MODAL
// ============================================================

closeLoginModal.addEventListener(
    "click",
    () => {

        hideModal(loginModal);

        loginError.textContent = "";

    }
);


// ============================================================
// 10. LOGIN
// ============================================================

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            loginEmail.value.trim();

        const password =
            loginPassword.value;


        loginError.textContent = "";


        if (!email || !password) {

            loginError.textContent =
                "Please enter your email and password.";

            return;
        }


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            hideModal(loginModal);


            loginForm.reset();


            showToast(
                "Login successful."
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            loginError.textContent =
                getFirebaseErrorMessage(
                    error
                );

        }

    }
);


// ============================================================
// 11. OPEN SIGNUP
// ============================================================

showSignup.addEventListener(
    "click",
    () => {

        hideModal(loginModal);

        signupError.textContent = "";

        showModal(signupModal);

    }
);


// ============================================================
// 12. CLOSE SIGNUP
// ============================================================

closeSignupModal.addEventListener(
    "click",
    () => {

        hideModal(signupModal);

        signupError.textContent = "";

    }
);


// ============================================================
// 13. OPEN LOGIN FROM SIGNUP
// ============================================================

showLogin.addEventListener(
    "click",
    () => {

        hideModal(signupModal);

        loginError.textContent = "";

        showModal(loginModal);

    }
);


// ============================================================
// 14. SIGNUP
// ============================================================

signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            signupEmail.value.trim();

        const password =
            signupPassword.value;


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


            hideModal(signupModal);


            signupForm.reset();


            showToast(
                "Account created successfully."
            );


        } catch (error) {

            console.error(
                "Signup error:",
                error
            );


            signupError.textContent =
                getFirebaseErrorMessage(
                    error
                );

        }

    }
);


// ============================================================
// 15. FIREBASE AUTH ERROR MESSAGES
// ============================================================

function getFirebaseErrorMessage(error) {

    const code =
        error?.code || "";


    if (
        code ===
        "auth/invalid-credential"
    ) {

        return "Incorrect email or password.";

    }


    if (
        code ===
        "auth/invalid-email"
    ) {

        return "Please enter a valid email.";

    }


    if (
        code ===
        "auth/email-already-in-use"
    ) {

        return "This email is already registered.";

    }


    if (
        code ===
        "auth/weak-password"
    ) {

        return "Password must contain at least 6 characters.";

    }


    if (
        code ===
        "auth/user-not-found"
    ) {

        return "No account exists with this email.";

    }


    if (
        code ===
        "auth/wrong-password"
    ) {

        return "Incorrect password.";

    }


    return (
        error?.message ||
        "Something went wrong."
    );

}


// ============================================================
// 16. AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    (user) => {

        currentUser = user;


        if (user) {

            loginNavBtn.textContent =
                "Logout";

        } else {

            loginNavBtn.textContent =
                "Login";

        }


        updateArrivalPanel();

    }
);


// ============================================================
// 17. CITY BUTTONS
// ============================================================

cityButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const city =
                    button.dataset.city;


                if (
                    city !== "surat" &&
                    city !== "navsari"
                ) {

                    return;

                }


                selectedCity =
                    city;


                cityButtons.forEach(
                    (item) => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                updateCityTitle();


                loadParkingData();


            }
        );

    }
);


// ============================================================
// 18. UPDATE CITY TITLE
// ============================================================

function updateCityTitle() {

    if (!selectedCityName) {
        return;
    }


    if (
        selectedCity ===
        "surat"
    ) {

        selectedCityName.textContent =
            "Surat Parking";

    } else {

        selectedCityName.textContent =
            "Navsari Parking";

    }

}


// ============================================================
// 19. LOAD PARKING DATA
// ============================================================

function loadParkingData() {

    updateCityTitle();


    setParkingStatus(
        `Connecting to ${
            selectedCity === "surat"
                ? "Surat"
                : "Navsari"
        } Firebase data...`,
        "loading"
    );


    if (slotListener) {

        slotListener();

        slotListener = null;

    }


    if (gateListener) {

        gateListener();

        gateListener = null;

    }


    currentSlots = {};


    /*
       IMPORTANT FIREBASE PATH

       Surat:
       cities/surat/slots

       Navsari:
       cities/navsari/slots
    */

    const slotsReference =
        ref(
            database,
            `cities/${selectedCity}/slots`
        );


    slotListener =
        onValue(

            slotsReference,

            (snapshot) => {

                const data =
                    snapshot.val();


                console.log(
                    `${selectedCity} slot data:`,
                    data
                );


                if (
                    data === null ||
                    data === undefined
                ) {

                    currentSlots = {};


                    setParkingStatus(
                        "Firebase connected, but no slot data was found.",
                        "error"
                    );


                    renderSlots();


                    updateArrivalPanel();


                    return;

                }


                currentSlots =
                    data;


                setParkingStatus(
                    "Connected to Firebase",
                    "success"
                );


                renderSlots();


                updateArrivalPanel();

            },


            (error) => {

                console.error(
                    "Firebase Database Error:",
                    error
                );


                setParkingStatus(
                    "Firebase connection failed.",
                    "error"
                );


                slotContainer.innerHTML = `

                    <div class="loading-box">

                        Unable to load parking slots.

                        <br><br>

                        Check your Firebase
                        Realtime Database rules
                        and database structure.

                    </div>

                `;

            }

        );


    loadGateData();

}


// ============================================================
// 20. RENDER THREE PARKING SLOTS
// ============================================================

function renderSlots() {

    if (!slotContainer) {
        return;
    }


    slotContainer.innerHTML = "";


    const slotIds = [
        "slot1",
        "slot2",
        "slot3"
    ];


    let available = 0;

    let reserved = 0;

    let occupied = 0;


    slotIds.forEach(
        (slotId) => {

            const slot =
                currentSlots[slotId] || {};


            const status =
                getSlotStatus(slot);


            if (
                status ===
                "available"
            ) {

                available++;

            }


            if (
                status ===
                "reserved"
            ) {

                reserved++;

            }


            if (
                status ===
                "occupied"
            ) {

                occupied++;

            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "slot-card";


            let statusText =
                "Available";


            if (
                status ===
                "reserved"
            ) {

                statusText =
                    "Reserved";

            }


            if (
                status ===
                "occupied"
            ) {

                statusText =
                    "Occupied";

            }


            const slotNumber =
                slotId.replace(
                    "slot",
                    ""
                );


            card.innerHTML = `

                <div class="slot-top">

                    <div class="slot-name">
                        Slot ${slotNumber}
                    </div>

                    <span
                        class="status-badge ${status}">
                        ${statusText}
                    </span>

                </div>


                <div class="slot-bottom">

                    ${
                        status === "available"

                        ?

                        `
                        <button
                            class="slot-action reserve-btn"
                            data-slot="${slotId}">
                            Reserve
                        </button>
                        `

                        :

                        `
                        <span
                            class="slot-unavailable">
                            ${statusText}
                        </span>
                        `
                    }

                </div>

            `;


            slotContainer.appendChild(
                card
            );

        }
    );


    availableCount.textContent =
        available;


    reservedCount.textContent =
        reserved;


    occupiedCount.textContent =
        occupied;


    totalCount.textContent =
        "3";


    if (
        available === 0
    ) {

        fullMessage.classList.remove(
            "hidden"
        );

    } else {

        fullMessage.classList.add(
            "hidden"
        );

    }


    const reserveButtons =
        document.querySelectorAll(
            ".reserve-btn"
        );


    reserveButtons.forEach(
        (button) => {

            button.addEventListener(
                "c
