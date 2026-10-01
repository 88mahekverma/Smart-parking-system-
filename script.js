// ======================================================
// SMART PARKING SYSTEM
// FINAL SCRIPT
// ======================================================

// ======================================================
// GLOBAL VARIABLES
// ======================================================

let selectedCity = "surat";
let currentUser = null;
let currentSlots = {};
let currentReservation = null;

let auth = null;
let db = null;

let firebaseReady = false;


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
// TOAST
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
// LOGIN MODAL
// ======================================================

function openLogin() {

    if (!loginModal) return;

    loginModal.classList.remove("hidden");

    if (loginError) {
        loginError.textContent = "";
    }
}


function closeLogin() {

    if (!loginModal) return;

    loginModal.classList.add("hidden");
}


// ======================================================
// SIGNUP MODAL
// ======================================================

function openSignup() {

    if (!signupModal) return;

    if (loginModal) {
        loginModal.classList.add("hidden");
    }

    signupModal.classList.remove("hidden");

    if (signupError) {
        signupError.textContent = "";
    }
}


function closeSignup() {

    if (!signupModal) return;

    signupModal.classList.add("hidden");
}


// ======================================================
// BOOKING / PAYMENT
// ======================================================

function closeBooking() {

    if (bookingModal) {
        bookingModal.classList.add("hidden");
    }
}


function closePayment() {

    if (paymentModal) {
        paymentModal.classList.add("hidden");
    }
}


// ======================================================
// LOGIN BUTTON
// ======================================================

if (loginNavBtn) {

    loginNavBtn.addEventListener("click", async () => {

        if (!currentUser) {

            openLogin();

            return;
        }

        if (!auth) {

            return;
        }

        try {

            const { signOut } =
                await import(
                    "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
                );

            await signOut(auth);

            showToast("Logged out successfully");

        } catch (error) {

            console.error("Logout error:", error);

            showToast("Logout failed");

        }

    });

}


// ======================================================
// CITY BUTTONS
// ======================================================

cityButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const city = button.dataset.city;

        if (!city) return;

        selectedCity = city;

        cityButtons.forEach((btn) => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        if (selectedCityName) {

            selectedCityName.textContent =
                city === "surat"
                    ? "Surat Parking"
                    : "Navsari Parking";

        }

        // If Firebase is ready, load data
        if (firebaseReady) {

            loadParkingData();
            listenToGate();

        } else {

            if (parkingStatus) {
                parkingStatus.textContent =
                    "Firebase is still connecting...";
            }

        }

    });

});


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
// CLOSE BUTTONS
// ======================================================

if (closeLoginModal) {
    closeLoginModal.addEventListener(
        "click",
        closeLogin
    );
}

if (closeSignupModal) {
    closeSignupModal.addEventListener(
        "click",
        closeSignup
    );
}

if (closeBookingModal) {
    closeBookingModal.addEventListener(
        "click",
        closeBooking
    );
}

if (closePaymentModal) {
    closePaymentModal.addEventListener(
        "click",
        closePayment
    );
}


// ======================================================
// LOGIN FORM
// ======================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (!auth) {

                loginError.textContent =
                    "Firebase is not ready yet.";

                return;
            }

            const email =
                loginEmail.value.trim();

            const password =
                loginPassword.value;

            loginError.textContent = "";

            try {

                const {
                    signInWithEmailAndPassword
                } = await import(
                    "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
                );

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                closeLogin();

                loginForm.reset();

                showToast("Login successful");

            } catch (error) {

                console.error(error);

                loginError.textContent =
                    getFirebaseError(error);

            }

        }
    );

}


// ======================================================
// SIGNUP FORM
// ======================================================

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (!auth) {

                signupError.textContent =
                    "Firebase is not ready yet.";

                return;
            }

            const email =
                signupEmail.value.trim();

            const password =
                signupPassword.value;

            signupError.textContent = "";

            if (password.length < 6) {

                signupError.textContent =
                    "Password must contain at least 6 characters.";

                return;
            }

            try {

                const {
                    createUserWithEmailAndPassword
                } = await import(
                    "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
                );

                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                closeSignup();

                signupForm.reset();

                showToast(
                    "Account created successfully"
                );

            } catch (error) {

                console.error(error);

                signupError.textContent =
                    getFirebaseError(error);

            }

        }
    );

}


// ======================================================
// FIREBASE ERROR
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
            return "Invalid email address.";

        case "auth/weak-password":
            return "Password must contain at least 6 characters.";

        default:
            return error.message ||
                "Something went wrong.";

    }

}


// ======================================================
// FIREBASE INITIALIZATION
// ======================================================

async function startFirebase() {

    try {

        parkingStatus.textContent =
            "Connecting to Firebase...";

        const {
            initializeApp
        } = await import(
            "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"
        );

        const {
            getAuth,
            onAuthStateChanged
        } = await import(
            "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
        );

        const {
            getDatabase
        } = await import(
            "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"
        );

        const app =
            initializeApp(firebaseConfig);

        auth = getAuth(app);

        db = getDatabase(app);

        firebaseReady = true;

        console.log(
            "Firebase initialized successfully."
        );

        onAuthStateChanged(
            auth,
            (user) => {

                currentUser = user;

                if (loginNavBtn) {

                    loginNavBtn.textContent =
                        user
                            ? "Logout"
                            : "Login";

                }

                findMyReservation();

            }
        );

        loadParkingData();

        listenToGate();

    } catch (error) {

        console.error(
            "Firebase initialization error:",
            error
        );

        parkingStatus.textContent =
            "Firebase connection failed.";

        parkingStatus.classList.add("error");

        slotContainer.innerHTML = `
            <p>
                Firebase could not be loaded.
            </p>
        `;

    }

}


// ======================================================
// LOAD PARKING DATA
// ======================================================

async function loadParkingData() {

    if (!db) return;

    try {

        const {
            ref,
            onValue
        } = await import(
            "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"
        );

        const slotsRef =
            ref(
                db,
                `cities/${selectedCity}/slots`
            );

        onValue(
            slotsRef,

            (snapshot) => {

                if (!snapshot.exists()) {

                    parkingStatus.textContent =
                        "No parking slot data found.";

                    currentSlots = {};

                    renderSlots();

                    return;
                }

                currentSlots =
                    snapshot.val();

                parkingStatus.textContent =
                    "Firebase connected";

                parkingStatus.classList.add(
                    "success"
                );

                renderSlots();

                findMyReservation();

            },

            (error) => {

                console.error(error);

                parkingStatus.textContent =
                    "Firebase connection failed.";

                parkingStatus.classList.add(
                    "error"
                );

            }
        );

    } catch (error) {

        console.error(
            "Parking data error:",
            error
        );

    }

}


// ======================================================
// RENDER SLOTS
// ======================================================

function renderSlots() {

    if (!slotContainer) return;

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

        const slot =
            currentSlots[slotName];

        const status =
            slot?.status || "available";

        if (status === "available")
            available++;

        if (status === "reserved")
            reserved++;

        if (status === "occupied")
            occupied++;

        const card =
            document.createElement("div");

        card.className =
            "slot-card";

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

    availableCount.textContent =
        available;

    reservedCount.textContent =
        reserved;

    occupiedCount.textContent =
        occupied;

    totalCount.textContent = "3";

    if (available === 0) {

        fullMessage.classList.remove(
            "hidden"
        );

    } else {

        fullMessage.classList.add(
            "hidden"
        );

    }

    document
        .querySelectorAll(".reserve-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    reserveSlot(
                        button.dataset.slot
                    );

                }
            );

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
            "Please login before reserving."
        );

        return;
    }

    try {

        const {
            ref,
            get
        } = await import(
            "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"
        );

        const slotRef =
            ref(
                db,
                `cities/${selectedCity}/slots/${slotId}`
            );

        const snapshot =
            await get(slotRef);

        if (!snapshot.exists()) {

            showToast(
                "Slot does not exist."
            );

            return;
        }

        const slot =
            snapshot.val();

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
            slotId.replace(
                "slot",
                "Slot "
            );

        bookingUser.textContent =
            currentUser.email;

        confirmBookingBtn.dataset.slot =
            slotId;

        bookingModal.classList.remove(
            "hidden"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to check slot."
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

                        if (!currentUser) {

                openLogin();

                return;
            }

            const slotId =
                confirmBookingBtn.dataset.slot;

            try {

                const {
                    ref,
                    get,
                    update
                } = await import(
                    "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"
                );

                const slotRef =
                    ref(
                        db,
                        `cities/${selectedCity}/slots/${slotId}`
                    );

                const snapshot =
                    await get(slotRef);

                if (
                    !snapshot.exists() ||
                    snapshot.val().status !== "available"
                ) {

                    showToast(
                        "Slot is no longer available."
                    );

                    return;
                }

                await update(
                    slotRef,
                    {
                        status: "reserved",
                        bookedBy: currentUser.uid,
                        bookedEmail: currentUser.email,
                        bookingTime: Date.now(),
                        expiryTime:
                            Date.now() + 2 * 60 * 60 * 1000,
                        paymentStatus: "paid",
                        paymentAmount: 50
                    }
                );

                closePayment();
                closeBooking();

                showToast(
                    "Parking slot reserved successfully."
                );

            } catch (error) {

                console.error(
                    "Booking error:",
                    error
                );

                showToast(
                    "Booking failed."
                );
            }

        }
    );

}


// ======================================================
// FIND MY RESERVATION
// ======================================================

async function findMyReservation() {

    if (!currentUser || !db) return;

    try {

        const {
            ref,
            get
        } = await import(
            "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"
        );

        const slotsRef =
            ref(
                db,
                `cities/${selectedCity}/slots`
            );

        const snapshot =
            await get(slotsRef);

        if (!snapshot.exists()) return;

        const slots = snapshot.val();

        currentReservation = null;

        Object.keys(slots).forEach((slotId) => {

            const slot = slots[slotId];

            if (
                slot &&
                slot.status === "reserved" &&
                (
                    slot.bookedBy === currentUser.uid ||
                    slot.bookedEmail === currentUser.email
                )
            ) {

                currentReservation = {
                    slotId: slotId,
                    city: selectedCity,
                    ...slot
                };

            }

        });

        if (currentReservation) {

            arrivalPanel.classList.remove("hidden");

        } else {

            arrivalPanel.classList.add("hidden");

        }

    } catch (error) {

        console.error(
            "Reservation error:",
            error
        );

    }

}


// ======================================================
// I HAVE ARRIVED
// ======================================================

if (arriveBtn) {

    arriveBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                openLogin();

                return;
            }

            if (!currentReservation) {

                showToast(
                    "No valid reservation found."
                );

                return;
            }

            try {

                const {
                    ref,
                    update
                } = await import(
                    "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"
                );

                const gateRef =
                    ref(
                        db,
                        `cities/${selectedCity}/gate`
                    );

                await update(
                    gateRef,
                    {
                        open: true,
                        openedBy: currentUser.uid,
                        openedEmail: currentUser.email,
                        openedSlot: currentReservation.slotId,
                        openedAt: Date.now()
                    }
                );

                showToast("Gate opened.");

                setTimeout(
                    async () => {

                        await update(
                            gateRef,
                            {
                                open: false
                            }
                        );

                    },
                    8000
                );

            } catch (error) {

                console.error(
                    "Gate error:",
                    error
                );

                showToast(
                    "Unable to open gate."
                );

            }

        }
    );

}


// ======================================================
// GATE LISTENER
// ======================================================

async function listenToGate() {

    if (!db) return;

    try {

        const {
            ref,
            onValue
        } = await import(
            "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"
        );

        const gateRef =
            ref(
                db,
                `cities/${selectedCity}/gate`
            );

        onValue(
            gateRef,
            (snapshot) => {

                const gate = snapshot.val();

                const isOpen =
                    gate?.open === true;

                if (isOpen) {

                    gatePanel.classList.add("gate-open");

                    gateIcon.textContent = "OPEN";

                    gateStatusText.textContent =
                        "Gate Open";

                    gateStatusMessage.textContent =
                        "Entry gate is currently open.";

                } else {

                    gatePanel.classList.remove("gate-open");

                    gateIcon.textContent = "CLOSED";

                    gateStatusText.textContent =
                        "Gate Closed";

                    gateStatusMessage.textContent =
                        "Gate is closed.";

                }

            }
        );

    } catch (error) {

        console.error(
            "Gate listener error:",
            error
        );

    }

}


// ======================================================
// CLOSE MODALS WHEN CLICKING OUTSIDE
// ======================================================

window.addEventListener("click", (event) => {

    if (event.target === loginModal) {
        closeLogin();
    }

    if (event.target === signupModal) {
        closeSignup();
    }

    if (event.target === bookingModal) {
        closeBooking();
    }

    if (event.target === paymentModal) {
        closePayment();
    }

});


// ======================================================
// START
// ======================================================

console.log(
    "SmartPark interface loaded successfully."
);

startFirebase();
