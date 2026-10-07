/* ============================================================
   SMARTPARK - SMART PARKING SYSTEM
   FIREBASE + AUTH + BOOKING + PAYMENT + ARRIVAL + GATE
   =========================================================== */


/* ============================================================
   FIREBASE CONFIG
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
   GLOBAL VARIABLES
   ============================================================ */

let app = null;
let auth = null;
let db = null;

let currentUser = null;

let selectedCity = "surat";
let selectedSlot = null;

let firebaseReady = false;
let gateListenerStarted = false;


/* ============================================================
   DATABASE ROOT
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
   MODALS
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
   PARKING STATUS
   ============================================================ */

function setParkingStatus(message, type = "loading") {

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
   DATE FORMAT
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
   AUTH ERROR MESSAGE
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

    button.addEventListener("click", async () => {

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

        selectedCity =
            city;

        cityButtons.forEach(btn => {
            btn.classList.remove("active");
        });
o
        button.classList.add("active");

        selectedSlot =
            null;

        await loadParkingData();
    });
});


/* ============================================================
   LOGIN BUTTON
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

                openModal(
                    loginModal
                );
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
   SHOW SIGNUP
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
   SHOW LOGIN
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
   LOGIN FORM
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

                closeModal(
                    loginModal
                );

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
   SIGNUP FORM
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

                closeModal(
                    signupModal
                );

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

        const usersRef =
            ref(
                db,
                `${DATABASE_ROOT}/users`
            );

        const snapshot =
            await get(usersRef);

        if (!snapshot.exists()) {

            hideArrivalPanel();

            return;
        }

        const users =
            snapshot.val();

        let userData =
            null;

        for (
            const [id, user]
            of Object.entries(users)
        ) {

            if (
                user &&
                user.email === currentUser.email
            ) {

                userData =
                    user;

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
        arrivalPanel.classList.remove(
            "hidden"
        );
    }
}


function hideArrivalPanel() {

    if (arrivalPanel) {
        arrivalPanel.classList.add(
            "hidden"
        );
    }
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
            firebaseAuthModule.getAuth(
                app
            );


        db =
            firebaseDatabaseModule.getDatabase(
                app
            );


        window.firebaseAuthModule =
            firebaseAuthModule;

        window.firebaseDatabaseModule =
            firebaseDatabaseModule;


        firebaseReady =
            true;


        firebaseAuthModule.onAuthStateChanged(
            auth,
            async user => {

                currentUser =
                    user;


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


                await loadParkingData();

                listenToGate();
            }
        );


        setParkingStatus(
            "Firebase connected",
            "success"
        );


        await loadParkingData();

        listenToGate();


    } catch (error) {

        console.error(
            "Firebase initialization error:",
            error
        );

        firebaseReady =
            false;


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
   LOAD PARKING DATA
   ============================================================ */

async function loadParkingData() {

    if (
        !firebaseReady ||
        !db
    ) {
        return;
    }


    try {

        const {
            ref,
            get
        } =
            window.firebaseDatabaseModule;


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


        renderParkingData(
            cityData
        );


        setParkingStatus(
            `${cityDisplayName(selectedCity)} parking is live`,
            "success"
        );


    }    catch (error) {

        console.error(
            "Parking loading error:",
            error
        );

        setParkingStatus(
            "Unable to load parking data",
            "error"
        );

        if (slotContainer) {

            slotContainer.innerHTML = `
                <div class="loading-box">
                    Unable to load parking slots.
                </div>
            `;
        }
    }
}


/* ============================================================
   RENDER PARKING DATA
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

            slotContainer.appendChild(
                card
            );
        }
    );


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
        statusText =
            "Reserved";
    }

    if (status === "occupied") {
        statusText =
            "Occupied";
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


    top.appendChild(
        slotName
    );

    top.appendChild(
        badge
    );


    card.appendChild(
        top
    );


    /* Available slot */

    if (status === "available") {

        const button =
            document.createElement("button");

        button.type =
            "button";

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


        card.appendChild(
            button
        );

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

        openModal(
            loginModal
        );

        return;
    }


    selectedSlot =
        slotId;


    if (bookingCity) {

        bookingCity.textContent =
            cityDisplayName(
                selectedCity
            );
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


    openModal(
        bookingModal
    );
}


/* ============================================================
   CONFIRM BOOKING
   ============================================================ */

if (confirmBookingBtn) {

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
}


/* ============================================================
   CLOSE BOOKING MODAL
   ============================================================ */

if (closeBookingModal) {

    closeBookingModal.addEventListener(
        "click",
        () => {

            selectedSlot =
                null;

            closeModal(
                bookingModal
            );
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

            selectedSlot =
                null;

            closeModal(
                paymentModal
            );
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


            payNowBtn.disabled =
                true;

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
                   1. CHECK SELECTED SLOT
                   ================================================= */

                const slotRef =
                    ref(
                        db,
                        `${DATABASE_ROOT}/cities/${selectedCity}/slots/${selectedSlot}`
                    );


                const slotSnapshot =
                    await get(
                        slotRef
                    );


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
                   2. READ BOOKINGS
                   ================================================= */

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


                /* =================================================
                   3. BOOKING ID
                   ================================================= */

                const bookingNumbers =
                    Object.keys(bookings)
                        .filter(
                            id =>
                                /^BOOK\d+$/.test(id)
                        )
                        .map(
                            id =>
                                parseInt(
                                    id.replace(
                                        "BOOK",
                                        ""
                                    ),
                                    10
                                )
                        )
                        .filter(
                            number =>
                                !isNaN(number)
                        );


                const nextBookingNumber =
                    bookingNumbers.length > 0
                        ? Math.max(
                            ...bookingNumbers
                        ) + 1
                        : 1;


                const bookingId =
                    `BOOK${String(
                        nextBookingNumber
                    ).padStart(3, "0")}`;


                /* =================================================
                   4. PAYMENT ID
                   ================================================= */

                const paymentNumbers =
                    Object.keys(payments)
                        .filter(
                            id =>
                                /^PAY\d+$/.test(id)
                        )
                        .map(
                            id =>
                                parseInt(
                                    id.replace(
                                        "PAY",
                                        ""
                                    ),
                                    10
                                )
                        )
                        .filter(
                            number =>
                                !isNaN(number)
                        );


                const nextPaymentNumber =
                    paymentNumbers.length > 0
                        ? Math.max(
                            ...paymentNumbers
                        ) + 1
                        : 1;


                const paymentId =
                    `PAY${String(
                        nextPaymentNumber
                    ).padStart(3, "0")}`;


                /* =================================================
                   5. FIND USER
                   ================================================= */

                let userId =
                    null;


                for (
                    const [id, user]
                    of Object.entries(users)
                ) {

                    if (
                        user &&
                        user.email ===
                        currentUser.email
                    ) {

                        userId =
                            id;

                        break;
                    }
                }


                /* =================================================
                   6. UPDATE OBJECT
                   ================================================= */

                const updates =
                    {};


                /* =================================================
                   7. CREATE USER
                   ================================================= */

                if (!userId) {

                    const userNumbers =
                        Object.keys(users)
                            .filter(
                                id =>
                                    /^USER\d+$/.test(id)
                            )
                            .map(
                                id =>
                                    parseInt(
                                        id.replace(
                                            "USER",
                                            ""
                                        ),
                                        10
                                    )
                            )
                            .filter(
                                number =>
                                    !isNaN(number)
                            );


                    const nextUserNumber =
                        userNumbers.length > 0
                            ? Math.max(
                                ...userNumbers
                            ) + 1
                            : 1;


                    userId =
                        `USER${String(
                            nextUserNumber
                        ).padStart(3, "0")}`;


                    updates[
                        `${DATABASE_ROOT}/users/${userId}`
                    ] = {

                        city:
                            selectedCity,

                        currentBooking:
                            bookingId,

                        email:
                            currentUser.email,

                        name:
                            currentUser.displayName ||
                            currentUser.email.split("@")[0],

                        phone:
                            ""
                    };


                } else {

                    updates[
                        `${DATABASE_ROOT}/users/${userId}`
                    ] = {

                        ...users[userId],

                        city:
                            selectedCity,

                        currentBooking:
                            bookingId
                    };
                }


                /* =================================================
                   8. TIME
                   ================================================= */

                const now =
                    new Date();


                const bookingTime =
                    formatDateTime(
                        now
                    );


                const expiryDate =
                    new Date(
                        now.getTime() +
                        15 * 60 * 1000
                    );


                const expiryTime =
                    formatDateTime(
                        expiryDate
                    );


                /* =================================================
                   9. BOOKING
                   ================================================= */

                updates[
                    `${DATABASE_ROOT}/bookings/${bookingId}`
                ] = {

                    amount:
                        100,

                    bookingStatus:
                        "Reserved",

                    bookingTime:
                        bookingTime,

                    city:
                        selectedCity,

                    expiryTime:
                        expiryTime,

                    paymentStatus:
                        "Paid",

                    refundStatus:
                        "Not Refunded",

                    slot:
                        selectedSlot,

                    userId:
                        userId
                };


                /* =================================================
                   10. PAYMENT
                   ================================================= */

                updates[
                    `${DATABASE_ROOT}/payments/${paymentId}`
                ] = {

                    amount:
                        100,

                    bookingId:
                        bookingId,

                    method:
                        "Demo Payment",

                    status:
                        "Paid"
                };


                /* =================================================
                   11. SLOT = RESERVED
                   ================================================= */

                updates[
                    `${DATABASE_ROOT}/cities/${selectedCity}/slots/${selectedSlot}/status`
                ] =
                    "reserved";


                /* =================================================
                   12. PARKING COUNTS
                   ================================================= */

                const parkingRef =
                    ref(
                        db,
                        `${DATABASE_ROOT}/cities/${selectedCity}/parking`
                    );


                const parkingSnapshot =
                    await get(
                        parkingRef
                    );


                if (
                    parkingSnapshot.exists()
                ) {

                    const parking =
                        parkingSnapshot.val();


                    const currentAvailable =
                        Number(
                            parking.available ?? 0
                        );


                    const currentReserved =
                        Number(
                            parking.reserved ?? 0
                        );


                    updates[
                        `${DATABASE_ROOT}/cities/${selectedCity}/parking/available`
                    ] =
                        Math.max(
                            0,
                            currentAvailable - 1
                        );


                    updates[
                        `${DATABASE_ROOT}/cities/${selectedCity}/parking/reserved`
                    ] =
                        currentReserved + 1;
                }


                /* =================================================
                   13. SAVE
                   ================================================= */

                await update(
                    ref(db),
                    updates
                );


                /* =================================================
                   14. SUCCESS
                   ================================================= */

                closeModal(
                    paymentModal
                );


                selectedSlot =
                    null;


                showToast(
                    `Booking confirmed! ${bookingId}`
                );


                await loadParkingData();

                await updateUserPanel();


                payNowBtn.disabled =
                    false;

                payNowBtn.textContent =
                    "Pay Now";


            } catch (error) {

                console.error(
                    "Booking/payment error:",
                    error
                );


                showToast(
                    error.message ||
                    "Booking failed. Please try again."
                );


                payNowBtn.disabled =
                    false;

                payNowBtn.textContent =
                    "Pay Now";
            }
        }
    );
}


/* ============================================================
   ARRIVAL BUTTON
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


                const usersRef =
                    ref(
                        db,
                        `${DATABASE_ROOT}/users`
                    );


                const usersSnapshot =
                    await get(
                        usersRef
                    );


                if (
                    !usersSnapshot.exists()
                ) {

                    showToast(
                        "User record not found."
                    );

                    return;
                }


                const users =
                    usersSnapshot.val();


                let userData =
                    null;


                for (
                    const user
                    of Object.values(users)
                ) {

                    if (
                        user &&
                        user.email ===
                        currentUser.email
                    ) {

                        userData =
                            user;

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


                const bookingRef =
                    ref(
                        db,
                        `${DATABASE_ROOT}/bookings/${bookingId}`
                    );


                const bookingSnapshot =
                    await get(
                        bookingRef
                    );


                if (
                    !bookingSnapshot.exists()
                ) {

                    showToast(
                        "Booking not found."
                    );

                    return;
                }


                const booking =
                    bookingSnapshot.val();


                if (
                    String(
                        booking.bookingStatus || ""
                    ).toLowerCase() !==
                    "reserved"
                ) {

                    showToast(
                        "This booking cannot be used for entry."
                    );

                    return;
                }


                const updates =
                    {};


                updates[
                    `${DATABASE_ROOT}/bookings/${bookingId}/bookingStatus`
                ] =
                    "Arrived";


                updates[
                    `${DATABASE_ROOT}/bookings/${bookingId}/arrivalStatus`
                ] =
                    "Arrived";


                updates[
                    `${DATABASE_ROOT}/gate/open`
                ] =
                    true;


                updates[
                    `${DATABASE_ROOT}/gate/status`
                ] =
                    "open";


                await update(
                    ref(db),
                    updates
                );


                showToast(
                    "Arrival confirmed. Entry gate opened."
                );


            } catch (error) {

                console.error(
                    "Arrival error:",
                    error
                );


                showToast(
                    "Unable to confirm arrival."
                );
            }
        }
    );
}


/* ============================================================
   GATE LISTENER
   ============================================================ */

function listenToGate() {

    if (
        !firebaseReady ||
        !db ||
        gateListenerStarted
    ) {
        return;
    }


    gateListenerStarted =
        true;


    const {
        ref,
        onValue
    } =
        window.firebaseDatabaseModule;


    const gateRef =
        ref(
            db,
            `${DATABASE_ROOT}/gate`
        );


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
                isOpen
            );
        }
    );
}


/* ============================================================
   GATE UI
   ============================================================ */

function updateGateUI(isOpen) {

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

        gateStatusMessage.textContent =
            isOpen
                ? "Entry gate is open."
                : "Entry gate is closed. Confirm arrival to open it.";
    }
}


/* ============================================================
   INITIAL CITY
   ============================================================ */

cityButtons.forEach(
    button => {

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
    }
);


/* ============================================================
   START APPLICATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        startFirebase();

    }
);
