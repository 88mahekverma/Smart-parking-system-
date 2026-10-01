/* ============================================================
   SMARTPARK - SMART PARKING SYSTEM
   FIREBASE + AUTH + BOOKING + PAYMENT
   ============================================================ */


/* ============================================================
   FIREBASE CONFIG
   ============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyDCa1T-htDrZsGygxNbKkZxbrYEhF5JYRQ",
    authDomain: "smart-parking-system-d46c9.firebaseapp.com",
    databaseURL:
        "https://smart-parking-system-d46c9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smart-parking-system-d46c9",
    storageBucket: "smart-parking-system-d46c9.firebasestorage.app",
    messagingSenderId: "456268505088",
    appId: "1:456268505088:web:e577fac7746f3a9bc2f8e5",
    measurementId: "G-DH2755KD5Z"
};


/* ============================================================
   GLOBAL VARIABLES
   ============================================================ */

let app;
let auth;
let db;

let currentUser = null;

let selectedCity = "surat";
let selectedSlot = null;

let firebaseReady = false;


/* ============================================================
   DATABASE PATH
   ============================================================ */

const DATABASE_ROOT =
    "SmartParking/Dashboard/availableSlots/smartParking";


/* ============================================================
   DOM ELEMENTS
   ============================================================ */

/* Navbar */
const loginNavBtn =
    document.getElementById("loginNavBtn");


/* City */
const cityButtons =
    document.querySelectorAll(".city-btn");

const parkingStatus =
    document.getElementById("parkingStatus");

const selectedCityName =
    document.getElementById("selectedCityName");


/* Counts */
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


/* Login */
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


/* Toast */
const toast =
    document.getElementById("toast");


/* ============================================================
   HELPER - TOAST
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
   HELPER - MODALS
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
   HELPER - STATUS
   ============================================================ */

function setParkingStatus(message, type = "loading") {

    if (!parkingStatus) return;

    parkingStatus.textContent = message;

    parkingStatus.classList.remove(
        "success",
        "error",
        "loading"
    );

    parkingStatus.classList.add(type);
}


/* ============================================================
   HELPER - DATE
   ============================================================ */

function formatDateTime(date) {

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

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}


/* ============================================================
   HELPER - NEXT ID
   ============================================================ */

function getNextNumber(object, prefix) {

    let highest = 0;

    if (object) {

        Object.keys(object).forEach(key => {

            if (key.startsWith(prefix)) {

                const number =
                    parseInt(
                        key.replace(prefix, ""),
                        10
                    );

                if (!isNaN(number)) {

                    highest =
                        Math.max(
                            highest,
                            number
                        );
                }
            }
        });
    }

    return highest + 1;
}


/* ============================================================
   HELPER - CITY NAME
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
   FIREBASE INITIALIZATION
   ============================================================ */

async function startFirebase() {

    try {

        setParkingStatus(
            "Connecting to Firebase...",
            "loading"
        );


        const firebaseAppModule =
            await import(
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
            );


        const firebaseAuthModule =
            await import(
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
            );


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


        firebaseAuthModule.onAuthStateChanged(
            auth,
            async user => {

                currentUser = user;


                if (user) {

                    loginNavBtn.textContent =
                        "Logout";

                    await updateUserPanel();

                } else {

                    loginNavBtn.textContent =
                        "Login";

                    hideArrivalPanel();
                }


                await loadParkingData();

                await listenToGate();
            }
        );


        setParkingStatus(
            "Firebase connected",
            "success"
        );


        await loadParkingData();

        await listenToGate();


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
            "Firebase connection failed."
        );
    }
}


/* ============================================================
   LOAD PARKING DATA
   ============================================================ */

async function loadParkingData() {

    if (!firebaseReady || !db) {
        return;
    }


    try {

        const {
            ref,
            get
        } = window.firebaseDatabaseModule;


        const cityRef =
            ref(
                db,
                `${DATABASE_ROOT}/cities/${selectedCity}`
            );


        const snapshot =
            await get(cityRef);


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


        renderParkingData(cityData);


        setParkingStatus(
            `${cityDisplayName(selectedCity)} parking is live`,
            "success"
        );


        await updateUserPanel();


    } catch (error) {

        console.error(
            "Parking loading error:",
            error
        );

        setParkingStatus(
            "Unable to load parking data",
            "error"
        );

        slotContainer.innerHTML = `
            <div class="loading-box">
                Unable to load parking slots.
            </div>
        `;
    }
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
        Number(parking.available ?? 0);

    const reserved =
        Number(parking.reserved ?? 0);

    const occupied =
        Number(parking.occupied ?? 0);

    const totalSlots =
        Number(
            parking.totalSlots ??
            slotList.length
        );


    availableCount.textContent =
        available;

    reservedCount.textContent =
        reserved;

    occupiedCount.textContent =
        occupied;

    totalCount.textContent =
        totalSlots;


    selectedCityName.textContent =
        `${cityDisplayName(selectedCity)} Parking`;


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


    if (
        available === 0 &&
        slotList.length > 0
    ) {

        fullMessage.classList.remove(
            "hidden"
        );

    } else {

        fullMessage.classList.add(
            "hidden"
        );
    }
}


/* ============================================================
   EMPTY PARKING
   ============================================================ */

function renderEmptyParking() {

    slotContainer.innerHTML = `
        <div class="loading-box">
            No parking slots found.
        </div>
    `;
}


/* ============================================================
   CREATE SLOT CARD
   ============================================================ */

function createSlotCard(slotId, slotData) {

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


    if (status === "available") {

        const button =
            document.createElement("button");

        button.className =
            "slot-action reserve-btn";

        button.textContent =
            "Reserve Slot";


        button.addEventListener(
            "click",
            () => {

                reserveSlot(
                    slotId
                );
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


        card.appendChild(
            unavailable
        );
    }


    return card;
}


/* ============================================================
   RESERVE SLOT - OPEN BOOKING MODAL
   ============================================================ */

async function reserveSlot(slotId) {

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


    bookingCity.textContent =
        cityDisplayName(
            selectedCity
        );


    bookingSlot.textContent =
        slotId.replace(
            /^slot/i,
            "Slot "
        );


    bookingUser.textContent =
        currentUser.email;


    /*
       IMPORTANT:
       Open the booking modal immediately.
       We do not wait for Firebase here.
    */

    openModal(
        bookingModal
    );
}


/* ============================================================
   CONTINUE TO PAYMENT
   ============================================================ */

confirmBookingBtn.addEventListener(
    "click",
    () => {

        if (!currentUser) {

            closeModal(
                bookingModal
            );

            openModal(
                loginModal
            );

            return;
        }


        if (!selectedSlot) {

            showToast(
                "Please select a parking slot."
            );

            return;
        }


        closeModal(
            bookingModal
        );


        openModal(
            paymentModal
        );
    }
);


/* ============================================================
   PAYMENT + CREATE BOOKING
   ============================================================ */

payNowBtn.addEventListener(
    "click",
    async () => {

        if (!firebaseReady || !db) {

            showToast(
                "Firebase is not connected."
            );

            return;
        }


        if (!currentUser) {

            showToast(
                "Please login first."
            );

            closeModal(
                paymentModal
            );

            openModal(
                loginModal
            );

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
            } = window.firebaseDatabaseModule;


            /*
             * ------------------------------------------------
             * 1. CHECK SELECTED SLOT
             * ------------------------------------------------
             */

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
                    slotData.status
                ).toLowerCase() !==
                "available"
            ) {

                throw new Error(
                    "This slot is no longer available."
                );
            }


            /*
             * ------------------------------------------------
             * 2. READ EXISTING BOOKINGS + PAYMENTS + USERS
             * ------------------------------------------------
             */

            const bookingsRef =
                ref(
                    db,
                    `${DATABASE_ROOT}/bookings`
                );


            const paymentsRef =
                ref(
                    db,
                    `${DATABASE_ROOT}/payments`
                );


            const usersRef =
                ref(
                    db,
                    `${DATABASE_ROOT}/users`
                );


            const [
                bookingsSnapshot,
                paymentsSnapshot,
                usersSnapshot
            ] =
                await Promise.all([
                    get(bookingsRef),
                    get(paymentsRef),
                    get(usersRef)
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


            /*
             * ------------------------------------------------
             * 3. FIND / CREATE USER ID
             * ------------------------------------------------
             */

                        let userId = null;

            // Find existing user using Firebase Authentication email
            for (const [id, user] of Object.entries(users)) {
                if (user.email === currentUser.email) {
                    userId = id;
                    break;
                }
            }

            // If user does not exist in Realtime Database, create USERxxx
            if (!userId) {
                const userNumbers = Object.keys(users)
                    .filter(id => /^USER\d+$/.test(id))
                    .map(id => parseInt(id.replace("USER", ""), 10))
                    .filter(num => !isNaN(num));

                const nextUserNumber =
                    userNumbers.length > 0
                        ? Math.max(...userNumbers) + 1
                        : 1;

                userId = `USER${String(nextUserNumber).padStart(3, "0")}`;

                updates[
                    `${DATABASE_ROOT}/users/${userId}`
                ] = {
                    city: selectedCity,
                    currentBooking: bookingId,
                    email: currentUser.email,
                    name: currentUser.displayName || currentUser.email.split("@")[0],
                    phone: ""
                };
            } else {
                // Update existing user's current booking
                updates[
                    `${DATABASE_ROOT}/users/${userId}`
                ] = {
                    ...users[userId],
                    city: selectedCity,
                    currentBooking: bookingId
                };
            }


            /*
             * ------------------------------------------------
             * 4. CREATE BOOKING
             * ------------------------------------------------
             */

            const bookingNumbers = Object.keys(bookings)
                .filter(id => /^BOOK\d+$/.test(id))
                .map(id => parseInt(id.replace("BOOK", ""), 10))
                .filter(num => !isNaN(num));

            const nextBookingNumber =
                bookingNumbers.length > 0
                    ? Math.max(...bookingNumbers) + 1
                    : 1;

            const bookingId =
                `BOOK${String(nextBookingNumber).padStart(3, "0")}`;


            /*
             * ------------------------------------------------
             * 5. CREATE PAYMENT ID
             * ------------------------------------------------
             */

            const paymentNumbers = Object.keys(payments)
                .filter(id => /^PAY\d+$/.test(id))
                .map(id => parseInt(id.replace("PAY", ""), 10))
                .filter(num => !isNaN(num));

            const nextPaymentNumber =
                paymentNumbers.length > 0
                    ? Math.max(...paymentNumbers) + 1
                    : 1;

            const paymentId =
                `PAY${String(nextPaymentNumber).padStart(3, "0")}`;


            /*
             * ------------------------------------------------
             * 6. TIME
             * ------------------------------------------------
             */

            const now = new Date();

            const bookingTime =
                formatDateTime(now);

            const expiryDate =
                new Date(now.getTime() + 15 * 60 * 1000);

            const expiryTime =
                formatDateTime(expiryDate);


            /*
             * ------------------------------------------------
             * 7. BOOKING DATA
             * ------------------------------------------------
             */

            updates[
                `${DATABASE_ROOT}/bookings/${bookingId}`
            ] = {
                amount: 100,
                bookingStatus: "Reserved",
                bookingTime: bookingTime,
                city: selectedCity,
                expiryTime: expiryTime,
                paymentStatus: "Paid",
                refundStatus: "Not Refunded",
                slot: selectedSlot,
                userId: userId
            };


            /*
             * ------------------------------------------------
             * 8. PAYMENT DATA
             * ------------------------------------------------
             */

            updates[
                `${DATABASE_ROOT}/payments/${paymentId}`
            ] = {
                amount: 100,
                bookingId: bookingId,
                method: "Demo Payment",
                status: "Paid"
            };


    
