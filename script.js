// =====================================================
// SMARTPARK - FIREBASE + WEBSITE LOGIC
// =====================================================


// =====================================================
// 1. FIREBASE IMPORTS
// =====================================================

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  onValue,
  get,
  update
} from
  "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";


// =====================================================
// 2. YOUR FIREBASE CONFIGURATION
// =====================================================

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


// =====================================================
// 3. INITIALIZE FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


// =====================================================
// 4. WEBSITE SETTINGS
// =====================================================

const CITIES = {

  surat: "Surat",

  navsari: "Navsari"

};


const SLOT_IDS = [

  "slot1",

  "slot2",

  "slot3"

];


let selectedCity = "surat";

let currentSlots = {};

let currentUser = null;

let selectedSlot = null;

let authMode = "login";

let stopSlotsListener = null;


// =====================================================
// 5. SHORT HTML SELECTOR
// =====================================================

const $ = (id) => {

  return document.getElementById(id);

};


// =====================================================
// 6. CITY BUTTONS
// =====================================================

const cityButtons =
  document.querySelectorAll(".city-btn");


// =====================================================
// 7. TOAST MESSAGE
// =====================================================

function showToast(message) {

  const toast = $("toast");

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {

    toast.classList.remove("show");

  }, 3000);

}


// =====================================================
// 8. FIREBASE CONNECTION STATUS
// =====================================================

function setFirebaseStatus(online, message) {

  $("firebaseStatus").innerHTML = `

    <span
      class="status-dot"
      style="
        background:${online ? "#12b76a" : "#f04438"};
      ">
    </span>

    ${message}

  `;


  $("connectionDot").style.background =
    online ? "#12b76a" : "#f04438";

}


// =====================================================
// 9. CONVERT FIREBASE STATUS INTO STANDARD STATUS
// =====================================================

function normalizeStatus(slot) {

  const status =
    String(slot?.status || "available").toLowerCase();


  if (
    status === "occupied" ||
    status === "full"
  ) {

    return "occupied";

  }


  if (
    status === "reserved" ||
    status === "reserve" ||
    status === "booked"
  ) {

    return "reserved";

  }


  return "available";

}


// =====================================================
// 10. STATUS TEXT
// =====================================================

function statusText(status) {

  if (status === "occupied") {

    return "Occupied";

  }


  if (status === "reserved") {

    return "Reserved";

  }


  return "Available";

}


// =====================================================
// 11. CHECK WHETHER SLOT BELONGS TO CURRENT USER
// =====================================================

function isMyReservation(slot) {

  if (!currentUser || !slot) {

    return false;

  }


  return (

    slot.bookedBy === currentUser.uid ||

    slot.bookedBy === currentUser.email ||

    slot.bookedEmail === currentUser.email

  );

}


// =====================================================
// 12. FORMAT BOOKING TIME
// =====================================================

function formatDate(value) {

  if (!value) {

    return "";

  }


  const date =
    new Date(Number(value));


  if (Number.isNaN(date.getTime())) {

    return "";

  }


  return date.toLocaleString("en-IN", {

    day: "2-digit",

    month: "short",

    hour: "2-digit",

    minute: "2-digit"

  });

}


// =====================================================
// 13. DISPLAY PARKING SLOTS
// =====================================================

function renderSlots() {

  const grid = $("slotsGrid");

  grid.innerHTML = "";


  let available = 0;

  let occupied = 0;

  let reserved = 0;

  let myReservation = null;


  SLOT_IDS.forEach((slotId) => {

    const slot =
      currentSlots[slotId] || {};


    const status =
      normalizeStatus(slot);


    // Count statuses

    if (status === "available") {

      available++;

    }


    if (status === "occupied") {

      occupied++;

    }


    if (status === "reserved") {

      reserved++;

    }


    // Check current user's reservation

    if (isMyReservation(slot)) {

      myReservation = {

        slotId,

        slot

      };

    }


    // Create card

    const card =
      document.createElement("article");


    card.className =
      `slot-card ${status}`;


    // Reserve button

    let reserveButton;


    if (status === "available") {

      reserveButton = `

        <button
          class="btn btn-primary full-width reserve-btn"
          data-slot="${slotId}">

          Reserve Slot

        </button>

      `;

    }

    else {

      reserveButton = `

        <button
          class="btn btn-outline full-width"
          disabled>

          ${
            status === "occupied"
              ? "Occupied"
              : "Reserved"
          }

        </button>

      `;

    }


    // Slot information

    let slotInfo;


    if (status === "reserved") {

      slotInfo = `

        <div class="slot-info">

          ${
            isMyReservation(slot)
              ? "Reserved by you"
              : "Reserved"
          }

          ${
            slot.bookingTime
              ? " • " + formatDate(slot.bookingTime)
              : ""
          }

        </div>

      `;

    }

    else {

      slotInfo = `

        <div class="slot-info">

          ${
            status === "occupied"
              ? "Vehicle detected in this slot"
              : "Ready for reservation"
          }

        </div>

      `;

    }


    // Complete card

    card.innerHTML = `

      <div class="slot-top">

        <span class="slot-number">

          ${slotId.replace("slot", "Slot ")}

        </span>


        <span class="status-badge ${status}">

          ${statusText(status)}

        </span>

      </div>


      <div class="slot-visual">

        ${
          status === "available"
            ? "P"
            : status === "occupied"
              ? "●"
              : "R"
        }

      </div>


      ${slotInfo}


      ${reserveButton}

    `;


    grid.appendChild(card);

  });


  // ===================================================
  // RESERVE BUTTON EVENTS
  // ===================================================

  document
    .querySelectorAll(".reserve-btn")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          openPayment(
            button.dataset.slot
          );

        }
      );

    });


  // ===================================================
  // SUMMARY
  // ===================================================

  $("parkingSummary").innerHTML = `

    <span class="pill available">

      ${available} Available

    </span>


    <span class="pill occupied">

      ${occupied} Occupied

    </span>


    <span class="pill reserved">

      ${reserved} Reserved

    </span>

  `;


  // Hero number

  $("heroAvailable").textContent =
    available;


  // ===================================================
  // FULL PARKING
  // ===================================================

  const parkingFull =
    available === 0;


  $("fullNotice")
    .classList
    .toggle(
      "hidden",
      !parkingFull
    );


  // ===================================================
  // ARRIVAL BUTTON
  // ===================================================

  if (myReservation) {

    $("arrivalPanel")
      .classList
      .remove("hidden");


    $("arrivalTitle").textContent =

      `${CITIES[selectedCity]} • ${
        myReservation.slotId
          .replace("slot", "Slot ")
      }`;


    $("arrivalText").textContent =

      "Your reservation is valid. Tap only when you are physically at the entry gate.";


    $("arriveBtn").disabled = false;

  }

  else {

    $("arrivalPanel")
      .classList
      .add("hidden");

  }

}


// =====================================================
// 14. LISTEN TO FIREBASE PARKING DATA
// =====================================================

function listenToSlots() {

  if (stopSlotsListener) {

    stopSlotsListener();

  }


  $("slotsGrid").innerHTML = `

    <div class="loading-card">

      Loading ${CITIES[selectedCity]} parking data...

    </div>

  `;


  const slotsRef =
    ref(
      db,
      `cities/${selectedCity}/slots`
    );


  stopSlotsListener = onValue(

    slotsRef,

    (snapshot) => {

      currentSlots =
        snapshot.val() || {};


      renderSlots();


      setFirebaseStatus(
        true,
        "Firebase connected"
      );

    },


    (error) => {

      console.error(error);


      setFirebaseStatus(
        false,
        "Firebase database error"
      );


      $("slotsGrid").innerHTML = `

        <div class="loading-card">

          Unable to read parking data.

          <br><br>

          Please check your Firebase
          Realtime Database rules.

        </div>

      `;

    }

  );


  listenToGate();

}


// =====================================================
// 15. LISTEN TO ENTRY GATE
// =====================================================

function listenToGate() {

  const gateRef =
    ref(
      db,
      `cities/${selectedCity}/gate`
    );


  onValue(

    gateRef,

    (snapshot) => {

      const gate =
        snapshot.val() || {};


      const isOpen =
        gate.open === true;


      $("gatePanel")
        .classList
        .toggle(
          "open",
          isOpen
        );


      $("gateStatusText")
        .textContent =

        isOpen
          ? "Gate Open"
          : "Gate Closed";


      $("gateStatusMessage")
        .textContent =

        isOpen

          ? "Entry gate has been opened for a valid arrival request."

          : "The gate stays closed until a valid reserved user confirms arrival.";


      $("gateIcon")
        .textContent =

        isOpen
          ? "↥"
          : "▣";

    }

  );

}


// =====================================================
// 16. SELECT CITY
// =====================================================

function selectCity(city) {

  selectedCity = city;


  cityButtons.forEach((button) => {

    button.classList.toggle(

      "active",

      button.dataset.city === city

    );

  });


  $("cityTitle").textContent =

    `${CITIES[city]} Parking`;


  $("cityMessage").textContent =

    "Live slot status";


  $("arrivalPanel")
    .classList
    .add("hidden");


  listenToSlots();

}


// =====================================================
// 17. OPEN PAYMENT / RESERVATION
// =====================================================

async function openPayment(slotId) {

  // User must log in

  if (!currentUser) {

    showToast(
      "Please log in before reserving a slot."
    );


    openModal("authModal");

    return;

  }


  const slotRef =
    ref(
      db,
      `cities/${selectedCity}/slots/${slotId}`
    );


  try {

    // Get latest slot value

    const snapshot =
      await get(slotRef);


    const slot =
      snapshot.val() || {};


    // Make sure slot is still available

    if (
      normalizeStatus(slot)
      !== "available"
    ) {

      showToast(
        "Sorry, this slot is no longer available."
      );

      return;

    }


    selectedSlot = slotId;


    $("payCity").textContent =
      CITIES[selectedCity];


    $("paySlot").textContent =
      slotId.replace(
        "slot",
        "Slot "
      );


    $("paymentMessage").textContent =
      "";


    openModal(
      "paymentModal"
    );

  }

  catch (error) {

    console.error(error);


    showToast(
      "Could not verify the slot. Please try again."
    );

  }

}


// =====================================================
// 18. PAYMENT + RESERVATION
// =====================================================

async function completePaymentAndReservation() {

  if (
    !currentUser ||
    !selectedSlot
  ) {

    return;

  }


  const payButton =
    $("payBtn");


  const message =
    $("paymentMessage");


  payButton.disabled = true;

  payButton.textContent =
    "Processing...";


  const slotRef =
    ref(
      db,
      `cities/${selectedCity}/slots/${selectedSlot}`
    );


  try {

    // Check again before booking

    const snapshot =
      await get(slotRef);


    const slot =
      snapshot.val() || {};


    if (
      normalizeStatus(slot)
      !== "available"
    ) {

      message.textContent =
        "This slot was just taken. Please choose another slot.";

      return;

    }


    const now =
      Date.now();


    const expiry =
      now +
      (2 * 60 * 60 * 1000);


    // =================================================
    // WRITE RESERVATION TO FIREBASE
    // =================================================

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


    closeModal(
      "paymentModal"
    );


    showToast(

      `${CITIES[selectedCity]} ${
        selectedSlot.replace(
          "slot",
          "Slot "
        )
      } reserved successfully.`

    );

  }

  catch (error) {

    console.error(error);


    message.textContent =
      error.message ||
      "Reservation failed. Check Firebase rules.";

  }

  finally {

    payButton.disabled = false;

    payButton.textContent =
      "Pay ₹50 & Reserve";

  }

}


// =====================================================
// 19. I HAVE ARRIVED
// =====================================================

async function handleArrival() {

  if (!currentUser) {

    showToast(
      "Please log in first."
    );

    return;

  }


  // Find user's reservation

  const mySlotEntry =

    SLOT_IDS

      .map((slotId) => ({

        slotId,

        slot:
          currentSlots[slotId] || {}

      }))

      .find(({ slot }) =>

        isMyReservation(slot)

      );


  // No reservation

  if (!mySlotEntry) {

    showToast(
      "No valid reservation found for your account."
    );

    return;

  }


  const arriveButton =
    $("arriveBtn");


  arriveButton.disabled = true;

  arriveButton.textContent =
    "Opening Gate...";


  try {

    // =================================================
    // OPEN FIREBASE GATE
    // =================================================

    await update(

      ref(
        db,
        `cities/${selectedCity}/gate`
      ),

      {

        open: true,

        openedBy:
          currentUser.uid,

        openedEmail:
          currentUser.email,

        openedSlot:
          mySlotEntry.slotId,

        openedAt:
          Date.now()

      }

    );


    showToast(
      "Arrival confirmed. Entry gate opened."
    );


    // =================================================
    // CLOSE GATE COMMAND AFTER 8 SECONDS
    // =================================================

    setTimeout(
      async () => {

        try {

          await update(

            ref(
              db,
              `cities/${selectedCity}/gate`
            ),

            {
              open: false
            }

          );

        }

        catch (error) {

          console.error(
            "Gate close update failed:",
            error
          );

        }

      },
      8000
    );

  }

  catch (error) {

    console.error(error);


    showToast(
      "Could not open the gate. Check Firebase rules."
    );

  }

  finally {

    setTimeout(
      () => {

        arriveButton.disabled =
          false;

        arriveButton.textContent =
          "I Have Arrived";

      },
      2500
    );

  }

}


// =====================================================
// 20. OPEN MODAL
// =====================================================

function openModal(id) {

  $(id)
    .classList
    .remove("hidden");

}


// =====================================================
// 21. CLOSE MODAL
// =====================================================

function closeModal(id) {

  $(id)
    .classList
    .add("hidden");

}


// =====================================================
// 22. LOGIN / REGISTER MODE
// =====================================================

function setAuthMode(mode) {

  authMode = mode;


  $("authTitle").textContent =

    mode === "login"
      ? "Login"
      : "Create Account";


  $("authSubtitle").textContent =

    mode === "login"

      ? "Log in to reserve a parking slot."

      : "Create your SmartPark account.";


  $("authSubmit").textContent =

    mode === "login"
      ? "Login"
      : "Create Account";


  $("toggleAuthMode").textContent =

    mode === "login"

      ? "Create a new account"

      : "Already have an account? Login";


  $("authMessage").textContent =
    "";

}


// =====================================================
// 23. LOGIN / REGISTER
// =====================================================

async function handleAuth(event) {

  event.preventDefault();


  const email =
    $("emailInput").value.trim();


  const password =
    $("passwordInput").value;


  const message =
    $("authMessage");


  const button =
    $("authSubmit");


  button.disabled = true;


  button.textContent =

    authMode === "login"
      ? "Logging in..."
      : "Creating...";


  try {

    if (
      authMode === "login"
    ) {

      await signInWithEmailAndPassword(

        auth,

        email,

        password

      );


      showToast(
        "Login successful."
      );

    }

    else {

      await createUserWithEmailAndPassword(

        auth,

        email,

        password

      );


      showToast(
        "Account created successfully."
      );

    }


    $("authForm").reset();


    closeModal(
      "authModal"
    );

  }

  catch (error) {

    console.error(error);


    const friendlyMessages = {

      "auth/invalid-credential":
        "Invalid email or password.",

      "auth/email-already-in-use":
        "This email is already registered.",

      "auth/weak-password":
        "Password must be at least 6 characters.",

      "auth/invalid-email":
        "Please enter a valid email address.",

      "auth/network-request-failed":
        "Network error. Check your internet connection."

    };


    m
