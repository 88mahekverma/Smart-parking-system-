// =====================================================
// SMART PARKING SYSTEM - script.js
// Firebase + Login + Live Parking + Booking
// =====================================================

// ================= FIREBASE IMPORTS =================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile
} from
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getDatabase,
    ref,
    onValue,
    get,
    update,
    push
} from
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


// ================= YOUR FIREBASE CONFIG =================

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


// ================= INITIALIZE FIREBASE =================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getDatabase(app);


// ================= GLOBAL VARIABLES =================

let selectedCity = "navsari";
let currentUser = null;
let currentSlots = {};


// ================= HTML ELEMENTS =================

const cityButtons = document.querySelectorAll(".city-btn");

const selectedCityName =
    document.getElementById("selectedCityName");

const availableCount =
    document.getElementById("availableCount");

const reservedCount =
    document.getElementById("reservedCount");

const occupiedCount =
    document.getElementById("occupiedCount");

const totalCount =
    document.getElementById("totalCount");

const parkingStatus =
    document.getElementById("parkingStatus");

const slotContainer =
    document.getElementById("slotContainer");

const fullMessage =
    document.getElementById("fullMessage");

const loginMessage =
    document.getElementById("loginMessage");

const loginNavBtn =
    document.getElementById("loginNavBtn");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");


// ================= MODALS =================

const loginModal =
    document.getElementById("loginModal");

const signupModal =
    document.getElementById("signupModal");

const bookingModal =
    document.getElementById("bookingModal");

const paymentModal =
    document.getElementById("paymentModal");


// ================= HELPER: TOAST =================

function showToast(message) {

    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


// ================= MODAL FUNCTIONS =================

function openModal(modal) {

    if (!modal) return;

    modal.classList.add("show");
}


function closeModal(modal) {

    if (!modal) return;

    modal.classList.remove("show");
}


// Close modal when clicking outside

window.addEventListener("click", (event) => {

    if (event.target === loginModal) {
        closeModal(loginModal);
    }

    if (event.target === signupModal) {
        closeModal(signupModal);
    }

    if (event.target === bookingModal) {
        closeModal(bookingModal);
    }

    if (event.target === paymentModal) {
        closeModal(paymentModal);
    }

});


// ================= LOGIN BUTTON =================

if (loginNavBtn) {

    loginNavBtn.addEventListener("click", () => {

        if (currentUser) {

            signOut(auth)
                .then(() => {
                    showToast("Logged out successfully.");
                })
                .catch(() => {
                    showToast("Logout failed.");
                });

        } else {

            openModal(loginModal);

        }

    });

}


// ================= LOGIN =================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            closeModal(loginModal);

            loginForm.reset();

            showToast("Login successful.");

        } catch (error) {

            console.error(error);

            showToast(getFirebaseError(error));

        }

    });

}


// ================= SIGN UP =================

const signupForm =
    document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name =
            document.getElementById("signupName").value.trim();

        const email =
            document.getElementById("signupEmail").value.trim();

        const password =
            document.getElementById("signupPassword").value;

        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            await updateProfile(
                userCredential.user,
                {
                    displayName: name
                }
            );

            closeModal(signupModal);

            signupForm.reset();

            showToast("Account created successfully.");

        } catch (error) {

            console.error(error);

            showToast(getFirebaseError(error));

        }

    });

}


// ================= LOGIN / SIGNUP SWITCH =================

const showSignup =
    document.getElementById("showSignup");

const showLogin =
    document.getElementById("showLogin");


if (showSignup) {

    showSignup.addEventListener("click", (event) => {

        event.preventDefault();

        closeModal(loginModal);

        openModal(signupModal);

    });

}


if (showLogin) {

    showLogin.addEventListener("click", (event) => {

        event.preventDefault();

        closeModal(signupModal);

        openModal(loginModal);

    });

}


// ================= PASSWORD TOGGLE =================

const togglePassword =
    document.getElementById("togglePassword");

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        const passwordInput =
            document.getElementById("loginPassword");

        if (!passwordInput) return;

        passwordInput.type =
            passwordInput.type === "password"
                ? "text"
                : "password";

    });

}


// ================= AUTH STATE =================

onAuthStateChanged(auth, (user) => {

    currentUser = user;

    if (user) {

        if (loginNavBtn) {
            loginNavBtn.textContent = "Logout";
        }

        if (loginMessage) {

            loginMessage.textContent =
                `Logged in as ${user.email}`;

        }

    } else {

        if (loginNavBtn) {
            loginNavBtn.textContent = "Login";
        }

        if (loginMessage) {

            loginMessage.textContent =
                "Login to book a parking slot.";

        }

    }

});


// ================= CITY BUTTONS =================

cityButtons.forEach((button) => {

    button.addEventListener("click", () => {

        cityButtons.forEach((btn) => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        selectedCity =
            button.dataset.city.toLowerCase();

        loadParkingData();

    });

});


// ================= LOAD PARKING DATA =================

function loadParkingData() {

    const cityRef =
        ref(db, `smartParking/cities/${selectedCity}`);

    onValue(cityRef, (snapshot) => {

        if (!snapshot.exists()) {

            showToast(
                `No parking data found for ${selectedCity}.`
            );

            return;
        }

        const cityData = snapshot.val();

        const parking =
            cityData.parking || {};

        currentSlots =
            cityData.slots || {};

        const available =
            Number(parking.available || 0);

        const reserved =
            Number(parking.reserved || 0);

        const occupied =
            Number(parking.occupied || 0);

        const total =
            Number(
                parking.totalSlots ||
                available + reserved + occupied
            );


        // Update counters

        if (availableCount)
            availableCount.textContent = available;

        if (reservedCount)
            reservedCount.textContent = reserved;

        if (occupiedCount)
            occupiedCount.textContent = occupied;

        if (totalCount)
            totalCount.textContent = total;


        if (selectedCityName) {

            selectedCityName.textContent =
                capitalize(selectedCity);

        }


        // Render slots

        renderSlots(currentSlots);


        // Parking status

        if (available > 0) {

            if (parkingStatus) {

                parkingStatus.textContent =
                    "Parking Available";

            }

            if (fullMessage) {

                fullMessage.style.display = "none";

            }

        } else {

            if (parkingStatus) {

                if (
                    reserved === total &&
                    total > 0
                ) {

                    parkingStatus.textContent =
                        "All Slots Reserved — Entry Closed";

                } else {

                    parkingStatus.textContent =
                        "Parking Full — Entry Closed";

                }

            }

            if (fullMessage) {

                fullMessage.style.display = "block";

            }

        }

    });

}


// ================= RENDER SLOTS =================

function renderSlots(slots) {

    if (!slotContainer) return;

    slotContainer.innerHTML = "";

    const slotNames = Object.keys(slots);

    slotNames.forEach((slotKey) => {

        const slot = slots[slotKey] || {};

        const status =
            String(slot.status || "available")
                .toLowerCase();


        const card =
            document.createElement("div");

        card.className =
            `slot-card ${status}`;


        let buttonHTML = "";

        if (status === "available") {

            buttonHTML = `
                <button
                    class="book-slot-btn"
                    data-slot="${slotKey}">
                    Book Slot
                </button>
            `;

        } else if (status === "reserved") {

            buttonHTML = `
                <button
                    class="book-slot-btn disabled"
                    disabled>
                    Reserved
                </button>
            `;

        } else {

            buttonHTML = `
                <button
                    class="book-slot-btn disabled"
                    disabled>
                    Occupied
                </button>
            `;

        }


        card.innerHTML = `

            <div class="slot-icon">
                <i class="fa-solid fa-car"></i>
            </div>

            <h3>${slotKey.toUpperCase()}</h3>

            <span class="slot-status">
                ${capitalize(status)}
            </span>

            ${buttonHTML}

        `;


        slotContainer.appendChild(card);

    });


    // Add booking button events

    document
        .querySelectorAll(".book-slot-btn:not(.disabled)")
        .forEach((button) => {

            button.addEventListener("click", () => {

                const slot =
                    button.dataset.slot;

                openBooking(slot);

            });

        });

}


// ================= OPEN BOOKING =================

function openBooking(slot) {

    if (!currentUser) {

        showToast("Please login first.");

        openModal(loginModal);

        return;

    }


    const slotData =
        currentSlots[slot];

    const status =
        String(slotData?.status || "available")
            .toLowerCase();


    if (status !== "available") {

        showToast(
            "Sorry, this slot is no longer available."
        );

        return;

    }


    const bookingCity =
        document.getElementById("bookingCity");

    const bookingSlot =
        document.getElementById("bookingSlot");

    const bookingUser =
        document.getElementById("bookingUser");


    if (bookingCity)
        bookingCity.textContent =
            capitalize(selectedCity);

    if (bookingSlot)
        bookingSlot.textContent =
            slot.toUpperCase();

    if (bookingUser)
        bookingUser.textContent =
            currentUser.email;


    openModal(bookingModal);

}


// ================= CONFIRM BOOKING =================

const confirmBookingBtn =
    document.getElementById("confirmBookingBtn");


if (confirmBookingBtn) {

    confirmBookingBtn.addEventListener(
        "click",
        () => {

            closeModal(bookingModal);

            openModal(paymentModal);

        }
    );

}


// ================= PAYMENT / BOOKING =================

const payNowBtn =
    document.getElementById("payNowBtn");


if (payNowBtn) {

    payNowBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                closeModal(paymentModal);

                openModal(loginModal);

                return;

            }


            const slotElement =
                document.getElementById("bookingSlot");

            if (!slotElement) return;


            const slot =
                slotElement.textContent
                    .toLowerCase();


            try {

                // Check the latest Firebase status

                const slotRef =
                    ref(
                        db,
                        `smartParking/cities/${selectedCity}/slots/${slot}`
                    );

                const snapshot =
                    await get(slotRef);


                if (!snapshot.exists()) {

                    showToast(
                        "Slot does not exist."
                    );

                    return;

                }


                const latestSlot =
                    snapshot.val();


                const latestStatus =
                    String(
                        latestSlot.status ||
                        "available"
                    ).toLowerCase();


                if (latestStatus !== "available") {

                    closeModal(paymentModal);

                    showToast(
                        "This slot is no longer available."
                    );

                    return;

                }


                // Update slot to RESERVED

                await update(slotRef, {

                    status: "reserved",

                    reservedBy:
                        currentUser.uid,

                    reservedEmail:
                        currentUser.email,

                    bookingTime:
                        Date.now()

                });


                // Create booking record

                const bookingRef =
                    push(
                        ref(
                            db,
                            "smartParking/bookings"
                        )
                    );


                await update(
                    bookingRef,
                    {

                        city:
                            selectedCity,

                        slot:
                            slot,

                        userId:
                            currentUser.uid,

                        email:
                            currentUser.email,

                        status:
                            "reserved",

                        payment:
                            "Paid",

                        bookingTime:
                            Date.now()

                    }
                );


                closeModal(paymentModal);

                showToast(
                    `${slot.toUpperCase()} booked successfully.`
                );


            } catch (error) {

                console.error(error);

                showToast(
                    "Booking failed. Please try again."
                );

            }

        }
    );

}


// ================= HERO COUNTERS =================

function updateHeroCounters() {

    const cityRef =
        ref(db, `smartParking/cities/${selectedCity}/parking`);

    onValue(cityRef, (snapshot) => {

        if (!snapshot.exists()) return;

        const data = snapshot.val();

        const heroAvailable =
            document.getElementById("heroAvailable");

        const heroReserved =
            document.getElementById("heroReserved");

        const heroOccupied =
            document.getElementById("heroOccupied");


        if (heroAvailable)
            heroAvailable.textContent =
                data.available || 0;

        if (heroReserved)
            heroReserved.textContent =
                data.reserved || 0;

        if (heroOccupied)
            heroOccupied.textContent =
                data.occupied || 0;

    });

}


// ================= FIND PARKING BUTTON =================

const findParkingBtn =
    document.getElementById("findParkingBtn");


if (findParkingBtn) {

    findParkingBtn.addEventListener("click", () => {

        const parkingSection =
            document.getElementById("parking");

        if (parkingSection) {

            parkingSection.scrollIntoView({
                behavior: "smooth"
            });

        }

    });

}


// ================= MOBILE MENU =================

const menuToggle =
    document.getElementById("menuToggle");

const navLinks =
    document.getElementById("navLinks");


if (menuToggle && navLinks) {

    menuToggle.addEventListener("click", () => {

        navLinks.classList.toggle("active");

    });

}


// ================= HELPER FUNCTIONS =================

function capitalize(text) {

    if (!text) return "";

    return text.charAt(0).toUpperCase()
        + text.slice(1);

}


function getFirebaseError(error) {

    switch (error.code) {

        case "auth/invalid-email":
            return "Invalid email address.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password should be at least 6 characters.";

        case "auth/invalid-credential":
            return "Invalid email or password.";

        default:
            return error.message || "Something went wrong.";

    }

}


// ================= START =================

loadParkingData();
updateHeroCounters();
