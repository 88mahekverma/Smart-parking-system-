/* ============================================================
   SMARTPARK - SMART PARKING SYSTEM
   Firebase + Authentication + Booking + Payment + Arrival + Gate
   ============================================================ */


/* ============================================================
   FIREBASE CONFIGURATION
   ============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyDCa1T-htDrZsGygxNbKkZxbrYEhF5JYRQ",
    authDomain: "smart-parking-system-d46c9.firebaseapp.com",
    databaseURL:
        "https://smart-parking-system-d46c9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smart-parking-system-d46c9",
    storageBucket:
        "smart-parking-system-d46c9.firebasestorage.app",
    messagingSenderId: "456268505088",
    appId: "1:456268505088:web:e577fac7746f3a9bc2f8e5",
    measurementId: "G-DH2755KD5Z"
};


/* ============================================================
   IMPORTANT:
   THIS IS YOUR ACTUAL FIREBASE PATH
   ============================================================ */

const DATABASE_ROOT =
    "availableSlots/availableSlots/smartParking";


/* ============================================================
   GLOBAL VARIABLES
   ============================================================ */

let app = null;
let auth = null;
let db = null;

let currentUser = null;

let selectedCity = "surat";
let selectedSlot = null;

let firebaseReady = false;

let parkingListenerUnsubscribe = null;
let gateListenerUnsubscribe = null;


/* ============================================================
   DOM ELEMENTS
   ============================================================ */

/* Login */
const loginNavBtn =
    document.getElementById("loginNavBtn");

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


/* Signup */
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


/* Cities */
const cityButtons =
    document.querySelectorAll(".city-btn");

const selectedCityName =
    document.getElementById("selectedCityName");

const parkingStatus =
    document.getElementById("parkingStatus");


/* Parking counts */
const availableCount =
    document.getElementById("availableCount");

const reservedCount =
    document.getElementById("reservedCount");

const occupiedCount =
    document.getElementById("occupiedCount");

const totalCount =
    document.getElementById("totalCount");


/* Slots */
const slotContainer =
    document.getElementById("slotContainer");

const fullMessage =
    document.getElementById("fullMessage");


/* Booking */
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


/* Payment */
const paymentModal =
    document.getElementById("paymentModal");

const closePaymentModal =
    document.getElementById("closePaymentModal");

const payNowBtn =
    document.getElementById("payNowBtn");


/* Arrival */
const arrivalPanel =
    document.getElementById("arrivalPanel");

const arriveBtn =
    document.getElementById("arriveBtn");


/* Gate */
const gatePanel =
    document.getElementById("gatePanel");

const gateIcon =
    document.getElementById("gateIcon");

const gateStatusText =
    document.getElementById("gateStatusText");

const gateStatusMessage =
    document.getElementById("gateStatusMessage");


/* Toast */
const toast =
    document.getElementById("toast");


/* ============================================================
   TOAST
   ============================================================ */

function showToast(message) {

    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* ============================================================
   MODAL FUNCTIONS
   ============================================================ */

function openModal(modal) {

    if (modal) {
        modal.classList.remove("hidden");
    }
}


function closeModal(modal) {

    if (modal) {
        modal.classList.add("hidden");
    }
}


/* ============================================================
   CITY NAME
   ============================================================ */

function cityDisplayName(city) {

    if (city === "surat") {
        return "Surat";
    }

    if (city === "navsari") {
        return "Navsari";
    }

    return city;
}


/* ============================================================
   PARKING STATUS
   ============================================================ */

function setParkingStatus(
    message,
    type = "loading"
) {

    if (!parkingStatus) {
        return;
    }

    parkingStatus.textContent = message;

    parkingStatus.classList.remove(
        "success",
        "error",
        "loading"
    );

    parkingStatus.classList.add(type);
}


/* ============================================================
   LOCAL DATE/TIME
   Firebase booking format:
   2026-10-08T12:30:00
   ============================================================ */

function getLocalISOTime(date = new Date()) {

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    const hours =
        String(date.getHours()).padStart(2, "0");

    const minutes =
        String(date.getMinutes()).padStart(2, "0");

    const seconds =
        String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}


/* ============================================================
   AUTH ERROR
   ============================================================ */

function getAuthErrorMessage(error) {

    const code =
        error?.code || "";

    if (
        code.includes("invalid-credential") ||
        code.includes("wrong-password") ||
        code.includes("user-not-found")
    ) {
        return "Invalid email or password.";
    }

    if (
        code.includes("email-already-in-use")
    ) {
        return "This email is already registered.";
    }

    if (
        code.includes("weak-password")
    ) {
        return "Password must be at least 6 characters.";
    }

    if (
        code.includes("invalid-email")
    ) {
        return "Please enter a valid email.";
    }

    return error?.message ||
        "Authentication failed.";
}


/* ============================================================
   CITY BUTTONS
   ============================================================ */

cityButtons.forEach(button => {

    button.addEventListener("click", () => {

        const city =
            String(
                button.dataset.city || ""
            ).toLowerCase();

        if (
            city !== "surat" &&
            city !== "navsari"
        ) {
            return;
        }

        selectedCity = city;
        selectedSlot = null;

        cityButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        listenToParkingData();
    });
});


/* ============================================================
   LOGIN NAV BUTTON
   ============================================================ */

if (loginNavBtn) {

    loginNavBtn.addEventListener(
        "click",
        async () => {

            if (currentUser) {

                try {

                    const {
                        signOut
                    } =
                        window.firebaseAuthModule;

                    await signOut(auth);

                    showToast(
                        "Logged out successfully."
                    );

                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    showToast(
                        "Logout failed."
                    );
                }

            } else {

                openModal(loginModal);
            }
        }
    );
}


/* ============================================================
   CLOSE LOGIN
   ============================================================ */

if (closeLoginModal) {

    closeLoginModal.addEventListener(
        "click",
        () => {
            closeModal(loginModal);
        }
    );
}


/* ============================================================
   OPEN SIGNUP
   ============================================================ */

if (showSignup) {

    showSignup.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeModal(loginModal);
            openModal(signupModal);
        }
    );
}


/* ============================================================
   CLOSE SIGNUP
   ============================================================ */

if (closeSignupModal) {

    closeSignupModal.addEventListener(
        "click",
        () => {
            closeModal(signupModal);
        }
    );
}


/* ============================================================
   OPEN LOGIN
   ============================================================ */

if (showLogin) {

    showLogin.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeModal(signupModal);
            openModal(loginModal);
        }
    );
}


/* ============================================================
   LOGIN
   ============================================================ */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            if (!firebaseReady) {

                if (loginError) {
                    loginError.textContent =
                        "Firebase is not connected yet.";
                }

                return;
            }

            const email =
                loginEmail?.value.trim();

            const password =
                loginPassword?.value;

            if (!email || !password) {

                if (loginError) {
                    loginError.textContent =
                        "Please enter email and password.";
                }

                return;
            }

            try {

                if (loginError) {
                    loginError.textContent = "";
                }

                const {
                    signInWithEmailAndPassword
                } =
                    window.firebaseAuthModule;

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                closeModal(loginModal);

                loginForm.reset();

                showToast(
                    "Login successful."
                );

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                if (loginError) {
                    loginError.textContent =
                        getAuthErrorMessage(error);
                }
            }
        }
    );
}


/* ============================================================
   SIGNUP
   ============================================================ */

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            if (!firebaseReady) {

                if (signupError) {
                    signupError.textContent =
                        "Firebase is not connected yet.";
                }

                return;
            }

            const email =
                signupEmail?.value.trim();

            const password =
                signupPassword?.value;

            if (!email || !password) {

                if (signupError) {
                    signupError.textContent =
                        "Please enter email and password.";
                }

                return;
            }

            try {

                if (signupError) {
                    signupError.textContent = "";
                }

                const {
                    createUserWithEmailAndPassword
                } =
                    window.firebaseAuthModule;

                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                closeModal(signupModal);

                signupForm.reset();

                showToast(
                    "Account created successfully."
                );

            } catch (error) {

                console.error(
                    "Signup error:",
                    error
                );

                if (signupError) {
                    signupError.textContent =
                        getAuthErrorMessage(error);
                }
            }
        }
    );
}


/* ============================================================
   FIREBASE INITIALIZATION
   ============================================================ */

async function startFirebase() {

    try {

        setParkingStatus(
            "Connecting to Firebase...",
            "loading"
        );


        /* Firebase App */

        const firebaseAppModule =
            await import(
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
            );


        /* Firebase Authentication */

        const firebaseAuthModule =
            await import(
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
            );


        /* Firebase Realtime Database */

        const firebaseDatabaseModule =
            await import(
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js"
            );


        app =
            firebaseAppModule.initializeApp(
                firebaseConfig
            );


        auth =
            firebaseAuthModule.getAuth(app);


        db =
            firebaseDatabaseModule.getDatabase(
                app
            );


        window.firebaseAuthModule =
            firebaseAuthModule;

        window.firebaseDatabaseModule =
            firebaseDatabaseModule;


        firebaseReady = true;


        /* ====================================================
           AUTH STATE
           ==================================================== */

        firebaseAuthModule.onAuthStateChanged(
            auth,
            async user => {

                currentUser = user;

                if (user) {

                    if (loginNavBtn) {
                        loginNavBtn.textContent =
                            "Logout";
                    }

                    await updateUserPanel();

                } else {

                    if (loginNavBtn) {
                        loginNavBtn.textContent =
                            "Login";
                    }

                    hideArrivalPanel();
                }
            }
        );


        /* Start live listeners */

        listenToParkingData();
        listenToGate();


        setParkingStatus(
            "Firebase connected",
            "success"
        );

    } catch (error) {

        console.error(
            "Firebase initialization error:",
            error
        );

        firebaseReady = false;

        setParkingStatus(
            "Firebase connection failed",
            "error"
        );

        showToast(
            "Firebase connection failed. Check Console."
        );
    }
}


/* ============================================================
   LIVE PARKING LISTENER
   ============================================================

   VERY IMPORTANT:

   The website DOES NOT control local vehicle entry.

   ESP32:
   Ultrasonic → detects local car
            → checks Firebase
            → opens physical gate
            → changes Firebase

   Website:
   Firebase → listens
           → displays new status

   ============================================================ */

function listenToParkingData() {

    if (!firebaseReady || !db) {
        return;
    }


    const {
        ref,
        onValue
    } =
        window.firebaseDatabaseModule;


    /* Remove previous city listener */

    if (parkingListenerUnsubscribe) {

        parkingListenerUnsubscribe();

        parkingListenerUnsubscribe = null;
    }


    const cityRef =
        ref(
            db,
            `${DATABASE_ROOT}/cities/${selectedCity}`
        );


    parkingListenerUnsubscribe =
        onValue(
            cityRef,

            snapshot => {

                if (!snapshot.exists()) {

                    renderEmptyParking();

                    setParkingStatus(
                        `${cityDisplayName(selectedCity)} data not found`,
                        "error"
                    );

                    return;
                }


                const cityData =
                    snapshot.val();


                renderParkingData(
                    cityData
                );


                setParkingStatus(
                    `${cityDisplayName(selectedCity)} parking is live`,
                    "success"
                );
            },

            error => {

                console.error(
                    "Parking listener error:",
                    error
                );

                setParkingStatus(
                    "Unable to listen to parking data",
                    "error"
                );
            }
        );
}


/* ============================================================
   RENDER PARKING
   ============================================================ */

function renderParkingData(cityData) {

    const parking =
        cityData.parking || {};

    const slots =
        cityData.slots || {};

    const slotList =
        Object.entries(slots);


    const available =
        Number(
            parking.available ?? 0
        );

    const reserved =
        Number(
            parking.reserved ?? 0
        );

    const occupied =
        Number(
            parking.occupied ?? 0
        );

    const totalSlots =
        Number(
            parking.totalSlots ??
            slotList.length
        );


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
            totalSlots;
    }


    if (selectedCityName) {

        selectedCityName.textContent =
            `${cityDisplayName(selectedCity)} Parking`;
    }


    if (fullMessage) {

        if (available === 0) {
            fullMessage.classList.remove("hidden");
        } else {
            fullMessage.classList.add("hidden");
        }
    }


    if (!slotContainer) {
        return;
    }


    slotContainer.innerHTML = "";


    if (slotList.length === 0) {

        renderEmptyParking();

        return;
    }


    slotList.forEach(
        ([slotId, slotData]) => {

            const card =
                createSlotCard(
                    slotId,
                    slotData || {}
                );

            slotContainer.appendChild(card);
        }
    );
}


/* ============================================================
   EMPTY PARKING
   ============================================================ */

function renderEmptyParking() {

    if (!slotContainer) {
        return;
    }

    slotContainer.innerHTML = `
        <div class="loading-box">
            No parking slots found.
        </div>
    `;
}


/* ============================================================
   CREATE SLOT CARD
   ============================================================ */

function createSlotCard(
    slotId,
    slotData
) {

    const card =
        document.createElement("div");

    card.className =
        "slot-card";


    const status =
        String(
            slotData.status ||
            "available"
        ).toLowerCase();


    let statusText =
        "Available";

    if (status === "reserved") {
        statusText = "Reserved";
    }

    if (status === "occupied") {
        statusText = "Occupied";
    }


    const top =
        document.createElement("div");

    top.className =
        "slot-top";


    const slotName =
        document.createElement("div");

    slotName.className =
        "slot-name";

    slotName.textContent =
        slotId.replace(
            /^slot/i,
            "Slot "
        );


    const badge =
        document.createElement("span");

    badge.className =
        `status-badge ${status}`;

    badge.textContent =
        statusText;


    top.appendChild(slotName);
    top.appendChild(badge);

    card.appendChild(top);


    /* ========================================================
       AVAILABLE SLOT
       ======================================================== */

    if (status === "available") {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "slot-action reserve-btn";

        button.textContent =
            "Reserve Slot";


        button.addEventListener(
            "click",
            () => {

                reserveSlot(slotId);
            }
        );


        card.appendChild(button);

    } else {

        const unavailable =
            document.createElement("div");

        unavailable.className =
            "slot-unavailable";


        unavailable.textContent =
            status === "reserved"
                ? "Currently Reserved"
                : "Currently Occupied";


        card.appendChild(unavailable);
    }


    return card;
}


/* ============================================================
   RESERVE SLOT
   ============================================================ */

function reserveSlot(slotId) {

    if (!firebaseReady) {

        showToast(
            "Firebase is not connected yet."
        );

        return;
    }


    if (!currentUser) {

        showToast(
            "Please login before reserving a slot."
        );

        openModal(loginModal);

        return;
    }


    selectedSlot =
        slotId;


    if (bookingCity) {

        bookingCity.textContent =
            cityDisplayName(selectedCity);
    }


    if (bookingSlot) {

        bookingSlot.textContent =
            slotId.replace(
                /^slot/i,
                "Slot "
            );
    }


    if (bookingUser) {

        bookingUser.textContent =
            currentUser.email;
    }


    openModal(bookingModal);
}


/* ============================================================
   CONFIRM BOOKING
   ============================================================ */

if (confirmBookingBtn) {

    confirmBookingBtn.addEventListener(
        "click",
        () => {

            if (!currentUser) {

                closeModal(bookingModal);
                openModal(loginModal);

                return;
            }


            if (!selectedSlot) {

                showToast(
                    "Please select a parking slot."
                );

                return;
            }


            closeModal(bookingModal);

            openModal(paymentModal);
        }
    );
}


/* ============================================================
   CLOSE BOOKING MODAL
   ============================================================ */

if (closeBookingModal) {

    closeBookingModal.addEventListener(
        "click",
        () => {

            selectedSlot = null;

            closeModal(bookingModal);
        }
    );
}


/* ============================================================
   CLOSE PAYMENT MODAL
   ============================================================ */

if (closePaymentModal) {

    closePaymentModal.addEventListener(
        "click",
        () => {

            selectedSlot = null;

            closeModal(paymentModal);
        }
    );
}


/* ============================================================
   PAYMENT + CREATE BOOKING
   ============================================================ */

if (payNowBtn) {

    payNowBtn.addEventListener(
        "click",
        async () => {

            if (
                !firebaseReady ||
                !db
            ) {

                showToast(
                    "Firebase is not connected."
                );

                return;
            }


            if (!currentUser) {

                closeModal(paymentModal);

                openModal(loginModal);

                return;
            }


            if (!selectedSlot) {

                showToast(
                    "No slot selected."
                );

                return;
            }


            payNowBtn.disabled = true;

            payNowBtn.textContent =
                "Processing...";


            try {

                const {
                    ref,
                    get,
                    update
                } =
                    window.firebaseDatabaseModule;


                /* =================================================
                   CHECK SELECTED SLOT
                   ================================================= */

                const slotRef =
                    ref(
                        db,
                        `${DATABASE_ROOT}/cities/${selectedCity}/slots/${selectedSlot}`
                    );


                const slotSnapshot =
                    await get(slotRef);


                if (!slotSnapshot.exists()) {

                    throw new Error(
                        "Selected slot does not exist."
                    );
                }


                const slotData =
                    slotSnapshot.val();


                if (
                    String(
                        slotData.status || ""
                    ).toLowerCase() !==
                    "available"
                ) {

                    throw new Error(
                        "This slot is no longer available."
                    );
                }


                /* =================================================
                   READ BOOKINGS, PAYMENTS, USERS
                   ================================================= */

                const [
                    bookingsSnapshot,
                    paymentsSnapshot,
                    usersSnapshot
                ] =
                    await Promise.all([

                        get(
                            ref(
                                db,
                                `${DATABASE_ROOT}/bookings`
                            )
                        ),

                        get(
                            ref(
                                db,
                                `${DATABASE_ROOT}/payments`
                            )
                        ),

                        get(
                            ref(
                                db,
                                `${DATABASE_ROOT}/users`
                            )
                        )
                    ]);


                const bookings =
                    bookingsSnapshot.exists()
                        ? bookingsSnapshot.val()
                        : {};

                const payments =
                    paymentsSnapshot.exists()
                        ? paymentsSnapshot.val()
                        : {};

                const users =
                    usersSnapshot.exists()
                        ? usersSnapshot.val()
                        : {};


                /* =================================================
                   FIND NEXT BOOKING ID
                   ================================================= */

                const bookingNumbers =
                    Object.keys(bookings)
                        .filter(
                            id =>
                                /^BOOK\d+$/.test(id)
                        )
                        .map(
                            id =>
                                Number(
                                    id.replace(
                                        "BOOK",
                                        ""
                                    )
                                )
                        )
                        .filter(
                            n =>
                                !isNaN(n)
                        );


                const nextBookingNumber =
                    bookingNumbers.length
                        ? Math.max(
                            ...bookingNumbers
                        ) + 1
                        : 1;


                const bookingId =
                    `BOOK${String(
                        nextBookingNumber
                    ).padStart(3, "0")}`;


                /* =================================================
                   FIND NEXT PAYMENT ID
                   ================================================= */

                const paymentNumbers =
                    Object.keys(payments)
                        .filter(
                            id =>
                                /^PAY\d+$/.test(id)
                        )
                        .map(
                            id =>
                                Number(
                                    id.replace(
                                        "PAY",
                                        ""
                                    )
                                )
                        )
                        .filter(
                            n =>
                                !isNaN(n)
                        );


                const nextPaymentNumber =
                    paymentNumbers.length
                        ? Math.max(
                            ...paymentNumbers
                        ) + 1
                        : 1;


                const paymentId =
                    `PAY${String(
                        nextPaymentNumber
                    ).padStart(3, "0")}`;


                /* =================================================
                   FIND OR CREATE USER
                   ================================================= */

                let userId = null;


                for (
                    const [id, user]
                    of Object.entries(users)
                ) {

                    if (
                        user &&
                        user.email ===
                        currentUser.email
                    ) {

                        userId = id;

                        break;
                    }
                }


                if (!userId) {

                    const userNumbers =
                        Object.keys(users)
                            .filter(
                                id =>
                                    /^USER\d+$/.test(id)
                            )
                            .map(
                                id =>
                                    Number(
                                        id.replace(
                                            "USER",
                                            ""
                                        )
                                    )
                            )
                            .filter(
                                n =>
                                    !isNaN(n)
                            );


                    const nextUserNumber =
                        userNumbers.length
                            ? Math.max(
                                ...userNumbers
                            ) + 1
                            : 1;


                    userId =
                        `USER${String(
                            nextUserNumber
                        ).padStart(3, "0")}`;
                }


                /* =================================================
                   TIME
                   ================================================= */

                const now =
                    new Date();


                const expiry =
                    new Date(
                        now.getTime() +
                        15 * 60 * 1000
                    );


                const bookingTime =
                    getLocalISOTime(now);


                const expiryTime =
                    getLocalISOTime(expiry);


                /* =================================================
                   PARKING COUNTS
                   ================================================= */

                const parkingSnapshot =
                    await get(
                        ref(
                            db,
                            `${DATABASE_ROOT}/cities/${selectedCity}/parking`
                        )
                    );


                const parking =
                    parkingSnapshot.exists()
                        ? parkingSnapshot.val()
                        : {};


                const available =
                    Number(
                        parking.available ?? 0
                    );

                const reserved =
                    Number(
                        parking.reserved ?? 0
                    );


                if (available <= 0) {

                    throw new Error(
                        "No available parking slots."
                    );
                }


                /* =================================================
                   MULTI-PATH FIREBASE UPDATE
                   ================================================= */

                const updates = {};


                /* User */

                updates[
                    `${DATABASE_ROOT}/users/${userId}`
                ] = {

                    name:
                        users[userId]?.name ||
                        currentUser.displayName ||
                        currentUser.email.split("@")[0],

                    email:
                        currentUser.email,

                    currentBooking:
                        bookingId,

                    city:
                        selectedCity,

                    userType:
                        "reserved"
                };


                /* Booking */

                updates[
                    `${DATABASE_ROOT}/bookings/${bookingId}`
                ] = {

                    amount:
                        100,

                    bookingStatus:
                        "confirmed",

                    bookingTime:
                        bookingTime,

                    city:
                        selectedCity,

                    expiryTime:
                        expiryTime,

                    paymentStatus:
                        "paid",

                    refundStatus:
                        "not_required",

                    slot:
                        selectedSlot,

                    userId:
                        userId
                };


                /* Payment */

                updates[
                    `${DATABASE_ROOT}/payments/${paymentId}`
                ] = {

                    amount:
                        100,

                    bookingId:
                        bookingId,

                    paymentStatus:
                        "paid",

                    userId:
                        userId,

                    paymentTime:
                        bookingTime
                };


                /* Slot */

                updates[
                    `${DATABASE_ROOT}/cities/${selectedCity}/slots/${selectedSlot}/status`
                ] =
                    "reserved";


                updates[
                    `${DATABASE_ROOT}/cities/${selectedCity}/slots/${selectedSlot}/bookedBy`
                ] =
                    userId;


                updates[
                    `${DATABASE_ROOT}/cities/${selectedCity}/slots/${selectedSlot}/bookingTime`
                ] =
                    bookingTime;


                updates[
                    `${DATABASE_ROOT}/cities/${selectedCity}/slots/${selectedSlot}/expiryTime`
                ] =
                    expiryTime;


                /* Parking */

                updates[
                    `${DATABASE_ROOT}/cities/${selectedCity}/parking/available`
                ] =
                    Math.max(
                        0,
                        available - 1
                    );


                updates[
                    `${DATABASE_ROOT}/cities/${selectedCity}/parking/reserved`
                ] =
                    reserved + 1;


                /* Save everything */

                await update(
                    ref(db),
                    updates
                );


                selectedSlot = null;


                closeModal(paymentModal);


                showToast(
                    `Booking confirmed: ${bookingId}`
                );


                await updateUserPanel();


            } catch (error) {

                console.error(
                    "Booking/payment error:",
                    error
                );

                showToast(
                    error.message ||
                    "Booking failed."
                );

            } finally {

                payNowBtn.disabled =
                    false;

                payNowBtn.textContent =
                    "Pay Now";
            }
        }
    );
}


/* ============================================================
   UPDATE USER PANEL
   ============================================================ */

async function updateUserPanel() {

    if (!currentUser) {

        hideArrivalPanel();

        return;
    }


    if (!firebaseReady || !db) {
        return;
    }


    try {

        const {
            ref,
            get
        } =
            window.firebaseDatabaseModule;


        const snapshot =
            await get(
                ref(
                    db,
                    `${DATABASE_ROOT}/users`
                )
            );


        if (!snapshot.exists()) {

            hideArrivalPanel();

            return;
        }


        const users =
            snapshot.val();


        let userData = null;


        for (
            const user
            of Object.values(users)
        ) {

            if (
                user &&
                user.email ===
                currentUser.email
            ) {

                userData = user;

                break;
            }
        }


        if (
            userData &&
            userData.currentBooking
        ) {

            showArrivalPanel();

        } else {

            hideArrivalPanel();
        }

    } catch (error) {

        console.error(
            "User panel error:",
            error
        );

        hideArrivalPanel();
    }
}


/* ============================================================
   ARRIVAL PANEL
   ============================================================ */

function showArrivalPanel() {

    if (arrivalPanel) {
        arrivalPanel.classList.remove("hidden");
    }
}


function hideArrivalPanel() {

    if (arrivalPanel) {
        arrivalPanel.classList.add("hidden");
    }
}


/* ============================================================
   RESERVED USER ARRIVAL
   ============================================================

   IMPORTANT:

   This is ONLY for a user who already reserved a slot.

   A local vehicle NEVER uses this function.

   ============================================================ */

if (arriveBtn) {

    arriveBtn.addEventListener(
        "click",
        async () => {

            if (
                !firebaseReady ||
                !db ||
                !currentUser
            ) {

                showToast(
                    "Please login first."
                );

                return;
            }


            try {

                const {
                    ref,
                    get,
                    update
                } =
                    window.firebaseDatabaseModule;


                /* Find current user */

                const usersSnapshot =
                    await get(
                        ref(
                            db,
                            `${DATABASE_ROOT}/users`
                        )
                    );


                if (!usersSnapshot.exists()) {

                    showToast(
                        "User record not found."
                    );

                    return;
                }


                const users =
                    usersSnapshot.val();


                let userId = null;
                let userData = null;


                for (
                    const [id, user]
                    of Object.entries(users)
                ) {

                    if (
                        user &&
                        user.email ===
                        currentUser.email
                    ) {

                        userId = id;
                        userData = user;

                        break;
                    }
                }


                if (
                    !userData ||
                    !userData.currentBooking
                ) {

                    showToast(
                        "You do not have an active booking."
                    );

                    return;
                }


                const bookingId =
                    userData.currentBooking;


                /* Get booking */

                const bookingSnapshot =
                    await get(
                        ref(
                            db,
                            `${DATABASE_ROOT}/bookings/${bookingId}`
                        )
                    );


                if (!bookingSnapshot.exists()) {

                    showToast(
                        "Booking not found."
                    );

                    return;
                }


                const booking =
                    bookingSnapshot.val();


                const bookingStatus =
                    String(
                        booking.bookingStatus || ""
                    ).toLowerCase();


                if (
                    bookingStatus !== "reserved" &&
                    bookingStatus !== "confirmed"
                ) {

                    showToast(
                        "This booking cannot be used for entry."
                    );

                    return;
                }


                /* Check expiry */

                if (
                    booking.expiryTime &&
                    new Date(
                        booking.expiryTime
                    ).getTime() < Date.now()
                ) {

                    showToast(
                        "This booking has expired."
                    );

                    return;
                }


                const city =
                    booking.city;

                const slot =
                    booking.slot;


                if (!city || !slot) {

                    showToast(
                        "Booking city or slot is missing."
                    );

                    return;
                }


                /* Get slot */

                const slotSnapshot =
                    await get(
                        ref(
                            db,
                            `${DATABASE_ROOT}/cities/${city}/slots/${slot}`
                        )
                    );


                if (!slotSnapshot.exists()) {

                    showToast(
                        "Reserved slot not found."
                    );

                    return;
                }


                const slotData =
                    slotSnapshot.val();


                if (
                    String(
                        slotData.status || ""
                    ).toLowerCase() !==
                    "reserved"
                ) {

                    showToast(
                        "This slot is not reserved."
                    );

                    return;
                }


                /* Get parking */

                const parkingSnapshot =
                    await get(
                        ref(
                            db,
                            `${DATABASE_ROOT}/cities/${city}/parking`
                        )
                    );


                const parking =
                    parkingSnapshot.exists()
                        ? parkingSnapshot.val()
                        : {};


                const reserved =
                    Number(
                        parking.reserved ?? 0
                    );

                const occupied =
                    Number(
                        parking.occupied ?? 0
                    );


                /* =================================================
                   RESERVED ARRIVAL UPDATES
                   ================================================= */

                const updates = {};


                /* Booking */

                updates[
                    `${DATABASE_ROOT}/bookings/${bookingId}/bookingStatus`
                ] =
                    "Arrived";


                updates[
                    `${DATABASE_ROOT}/bookings/${bookingId}/arrivalStatus`
                ] =
                    "Arrived";


                updates[
                    `${DATABASE_ROOT}/bookings/${bookingId}/entryType`
                ] =
                    "reserved";


                /* Slot */

                updates[
                    `${DATABASE_ROOT}/cities/${city}/slots/${slot}/status`
                ] =
                    "occupied";


                updates[
                    `${DATABASE_ROOT}/cities/${city}/slots/${slot}/bookedBy`
                ] =
                    userId;


                /* Parking */

                updates[
                    `${DATABASE_ROOT}/cities/${city}/parking/reserved`
                ] =
                    Math.max(
                        0,
                        reserved - 1
                    );


                updates[
                    `${DATABASE_ROOT}/cities/${city}/parking/occupied`
                ] =
                    occupied + 1;


                /* Global gate */

                updates[
                    `${DATABASE_ROOT}/gate/open`
                ] =
                    true;


                updates[
                    `${DATABASE_ROOT}/gate/parkingFull`
                ] =
                    false;


                updates[
                    `${DATABASE_ROOT}/gate/entryAllowed`
                ] =
                    true;


                updates[
                    `${DATABASE_ROOT}/gate/status`
                ] =
                    "OPEN";


                updates[
                    `${DATABASE_ROOT}/gate/entryType`
                ] =
                    "reserved";


                /* City gate */

                updates[
                    `${DATABASE_ROOT}/cities/${city}/gate/open`
                ] =
                    true;


                updates[
                    `${DATABASE_ROOT}/cities/${city}/gate/parkingFull`
                ] =
                    false;


                updates[
                    `${DATABASE_ROOT}/cities/${city}/gate/entryAllowed`
                ] =
                    true;


                updates[
                    `${DATABASE_ROOT}/cities/${city}/gate/status`
                ] =
                    "OPEN";


                updates[
                    `${DATABASE_ROOT}/cities/${city}/gate/entryType`
                ] =
                    "reserved";


                /* Save */

                await update(
                    ref(db),
                    updates
                );


                hideArrivalPanel();


                showToast(
                    "Arrival confirmed. Entry gate opened."
                );

            } catch (error) {

                console.error(
                    "Arrival error:",
                    error
                );

                showToast(
                    error.message ||
                    "Unable to confirm arrival."
                );
            }
        }
    );
}


/* ============================================================
   GATE LISTENER
   ============================================================

   IMPORTANT:

   WEBSITE ONLY READS THE GATE STATE.

   For a LOCAL vehicle:

   Ultrasonic
        ↓
      ESP32
        ↓
   Firebase gate
        ↓
     Website

   The website does NOT open the local gate.

   ============================================================ */

function listenToGate() {

    if (
        !firebaseReady ||
        !db
    ) {
        return;
    }


    const {
        ref,
        onValue
    } =
        window.firebaseDatabaseModule;


    if (gateListenerUnsubscribe) {

        gateListenerUnsubscribe();

        gateListenerUnsubscribe = null;
    }


    const gateRef =
        ref(
            db,
            `${DATABASE_ROOT}/gate`
        );


    gateListenerUnsubscribe =
        onValue(
            gateRef,

            snapshot => {

                const gateData =
                    snapshot.exists()
                        ? snapshot.val()
                        : {};


                const isOpen =
                    gateData.open === true ||
                    String(
                        gateData.status || ""
                    ).toLowerCase() ===
                    "open";


                updateGateUI(
                    isOpen,
                    gateData.entryType || ""
                );
            },

            error => {

                console.error(
                    "Gate listener error:",
                    error
                );
            }
        );
}


/* ============================================================
   GATE UI
   ============================================================ */

function updateGateUI(
    isOpen,
    entryType = ""
) {

    if (gatePanel) {

        gatePanel.classList.remove(
            "hidden"
        );
    }


    if (gateIcon) {

        gateIcon.textContent =
            isOpen
                ? "OPEN"
                : "CLOSED";
    }


    if (gateStatusText) {

        gateStatusText.textContent =
            isOpen
                ? "Gate Open"
                : "Gate Closed";
    }


    if (gateStatusMessage) {

        if (
            isOpen &&
            entryType === "local"
        ) {

            gateStatusMessage.textContent =
                "Gate opened automatically for a local vehicle.";

        } else if (
            isOpen &&
            entryType === "reserved"
        ) {

            gateStatusMessage.textContent =
                "Gate opened for a reserved vehicle.";

        } else {

            gateStatusMessage.textContent =
                "Entry gate is closed.";
        }
    }
}


/* ============================================================
   INITIAL CITY
   ============================================================ */

cityButtons.forEach(button => {

    const city =
        String(
            button.dataset.city || ""
        ).toLowerCase();


    if (
        city === selectedCity
    ) {

        button.classList.add(
            "active"
        );
    }
});


/* ============================================================
   START APPLICATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        startFirebase();
    }
);
