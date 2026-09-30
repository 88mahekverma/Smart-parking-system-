// ======================================================
// SMART PARKING SYSTEM - script.js
// Firebase + Login + Parking + Booking + Arrival Gate
// ======================================================

// ================= FIREBASE IMPORTS =================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getDatabase,
  ref,
  onValue,
  get,
  update,
  push
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


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

let currentUser = null;
let selectedCity = "navsari";
let selectedSlot = null;
let currentSlots = {};


// ================= HTML ELEMENTS =================

const loginNavBtn = document.getElementById("loginNavBtn");

const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");

const togglePassword = document.getElementById("togglePassword");

const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

const selectedCityName = document.getElementById("selectedCityName");

const availableCount = document.getElementById("availableCount");
const reservedCount = document.getElementById("reservedCount");
const occupiedCount = document.getElementById("occupiedCount");
const totalCount = document.getElementById("totalCount");

const parkingStatus = document.getElementById("parkingStatus");
const slotContainer = document.getElementById("slotContainer");
const fullMessage = document.getElementById("fullMessage");

const bookingModal = document.getElementById("bookingModal");
const bookingCity = document.getElementById("bookingCity");
const bookingSlot = document.getElementById("bookingSlot");
const bookingUser = document.getElementById("bookingUser");

const confirmBookingBtn = document.getElementById("confirmBookingBtn");

const paymentModal = document.getElementById("paymentModal");
const payNowBtn = document.getElementById("payNowBtn");

const toast = document.getElementById("toast");
const toastIcon = document.getElementById("toastIcon");
const toastMessage = document.getElementById("toastMessage");

const menuBtn = document.getElementById("menuBtn");


// ================= TOAST =================

function showToast(message, type = "success") {

  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;

  if (toastIcon) {
    toastIcon.textContent = type === "error" ? "!" : "✓";
  }

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


// ================= MODAL FUNCTIONS =================

function openModal(modal) {
  if (modal) {
    modal.classList.add("show");
  }
}

function closeModal(modal) {
  if (modal) {
    modal.classList.remove("show");
  }
}


// Close modal buttons

document.querySelectorAll(".close-modal").forEach(button => {

  button.addEventListener("click", () => {

    const modal = button.closest(".modal");

    closeModal(modal);

  });

});


// Close modal when clicking outside

window.addEventListener("click", event => {

  if (event.target.classList.contains("modal")) {
    closeModal(event.target);
  }

});


// ================= LOGIN BUTTON =================

if (loginNavBtn) {

  loginNavBtn.addEventListener("click", async () => {

    if (currentUser) {

      await signOut(auth);

    } else {

      openModal(loginModal);

    }

  });

}


// ================= SHOW SIGNUP =================

if (showSignup) {

  showSignup.addEventListener("click", event => {

    event.preventDefault();

    closeModal(loginModal);

    openModal(signupModal);

  });

}


// ================= SHOW LOGIN =================

if (showLogin) {

  showLogin.addEventListener("click", event => {

    event.preventDefault();

    closeModal(signupModal);

    openModal(loginModal);

  });

}


// ================= PASSWORD VISIBILITY =================

if (togglePassword) {

  togglePassword.addEventListener("click", () => {

    if (loginPassword.type === "password") {

      loginPassword.type = "text";

      togglePassword.textContent = "Hide";

    } else {

      loginPassword.type = "password";

      togglePassword.textContent = "Show";

    }

  });

}


// ================= SIGN UP =================

if (signupForm) {

  signupForm.addEventListener("submit", async event => {

    event.preventDefault();

    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;

    if (!name || !email || !password) {

      showToast("Please fill all fields.", "error");

      return;

    }

    if (password.length < 6) {

      showToast("Password must contain at least 6 characters.", "error");

      return;

    }

    try {

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      await updateProfile(userCredential.user, {
        displayName: name
      });

      showToast("Account created successfully.");

      closeModal(signupModal);

    } catch (error) {

      showToast(getAuthError(error.code), "error");

    }

  });

}


// ================= LOGIN =================

if (loginForm) {

  loginForm.addEventListener("submit", async event => {

    event.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {

      showToast("Enter email and password.", "error");

      return;

    }

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      showToast("Login successful.");

      closeModal(loginModal);

      loginForm.reset();

    } catch (error) {

      showToast(getAuthError(error.code), "error");

    }

  });

}


// ================= AUTH ERROR MESSAGES =================

function getAuthError(code) {

  switch (code) {

    case "auth/invalid-credential":
      return "Invalid email or password.";

    case "auth/user-not-found":
      return "No account found with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/email-already-in-use":
      return "This email is already registered.";

    case "auth/invalid-email":
      return "Please enter a valid email.";

    case "auth/weak-password":
      return "Password is too weak.";

    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";

    default:
      return "Something went wrong. Please try again.";

  }

}


// ================= AUTH STATE =================

onAuthStateChanged(auth, user => {

  currentUser = user;

  if (loginNavBtn) {

    if (user) {

      loginNavBtn.textContent = "Logout";

      loginNavBtn.classList.add("logged-in");

    } else {

      loginNavBtn.textContent = "Login";

      loginNavBtn.classList.remove("logged-in");

    }

  }

  renderSlots();

});


// ================= CITY BUTTONS =================

document.querySelectorAll(".city-btn").forEach(button => {

  button.addEventListener("click", () => {

    selectedCity = button.dataset.city;

    document
      .querySelectorAll(".city-btn")
      .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    if (selectedCityName) {

      selectedCityName.textContent =
        selectedCity.charAt(0).toUpperCase() +
        selectedCity.slice(1);

    }

    loadParkingData();

  });

});


// ================= LOAD PARKING DATA =================

function loadParkingData() {

  /*
    Existing Firebase structure expected:

    cities
      ├── navsari
      │    └── slots
      │         ├── slot1
      │         ├── slot2
      │         └── slot3
      │
      └── surat
           └── slots
                ├── slot1
                ├── slot2
                └── slot3
  */

  const slotsRef =
    ref(db, `cities/${selectedCity}/slots`);

  onValue(slotsRef, snapshot => {

    currentSlots = snapshot.val() || {};

    renderSlots();

  }, error => {

    console.error(error);

    showToast(
      "Unable to load parking data.",
      "error"
    );

  });

}


// ================= RENDER SLOTS =================

function renderSlots() {

  if (!slotContainer) return;

  slotContainer.innerHTML = "";

  const slots = currentSlots || {};

  let available = 0;
  let reserved = 0;
  let occupied = 0;

  const slotNames = Object.keys(slots);

  slotNames.forEach(slotName => {

    const slot = slots[slotName] || {};

    const status =
      String(slot.status || "available").toLowerCase();

    if (status === "available") {

      available++;

    } else if (status === "reserved") {

      reserved++;

    } else if (status === "occupied") {

      occupied++;

    }

    const card = document.createElement("div");

    card.className = `parking-slot ${status}`;

    const title = document.createElement("h3");

    title.textContent =
      formatSlotName(slotName);

    const statusText = document.createElement("p");

    statusText.textContent =
      capitalize(status);

    card.appendChild(title);
    card.appendChild(statusText);


    // ================= AVAILABLE =================

    if (status === "available") {

      const button =
        document.createElement("button");

      button.textContent = "Book Slot";

      button.className = "book-slot-btn";

      button.addEventListener("click", () => {

        if (!currentUser) {

          showToast(
            "Please login before booking.",
            "error"
          );

          openModal(loginModal);

          return;

        }

        openBooking(slotName);

      });

      card.appendChild(button);

    }


    // ================= RESERVED =================

    else if (status === "reserved") {

      const reservedText =
        document.createElement("strong");

      reservedText.textContent = "Reserved";

      card.appendChild(reservedText);


      // Check whether this reservation belongs
      // to the currently logged-in user.

      if (currentUser && isMyReservation(slot)) {

        const arrivedButton =
          document.createElement("button");

        arrivedButton.textContent =
          "I Have Arrived";

        arrivedButton.className =
          "arrived-btn";

        arrivedButton.addEventListener(
          "click",
          () => openGateForArrival(
            slotName,
            slot
          )
        );

        card.appendChild(arrivedButton);

      }

    }


    // ================= OCCUPIED =================

    else {

      const occupiedText =
        document.createElement("strong");

      occupiedText.textContent =
        "Occupied";

      card.appendChild(occupiedText);

    }


    slotContainer.appendChild(card);

  });


  // ================= COUNTS =================

  const total =
    slotNames.length;

  if (availableCount)
    availableCount.textContent = available;

  if (reservedCount)
    reservedCount.textContent = reserved;

  if (occupiedCount)
    occupiedCount.textContent = occupied;

  if (totalCount)
    totalCount.textContent = total;


  // ================= PARKING STATUS =================

  if (available === 0) {

    if (parkingStatus) {

      parkingStatus.textContent =
        "Parking Full — Entry Closed";

    }

    if (fullMessage) {

      fullMessage.style.display = "block";

      fullMessage.textContent =
        "All parking slots are currently reserved or occupied. Entry is closed for new vehicles.";

    }

  } else {

    if (parkingStatus) {

      parkingStatus.textContent =
        "Parking Available";

    }

    if (fullMessage) {

      fullMessage.style.display = "none";

    }

  }

}


// ================= CHECK RESERVATION OWNER =================

function isMyReservation(slot) {

  if (!currentUser || !slot) {
    return false;
  }

  // Primary method: Firebase UID

  if (
    slot.bookedBy &&
    String(slot.bookedBy) === currentUser.uid
  ) {

    return true;

  }


  // Secondary method: email

  if (
    slot.email &&
    currentUser.email &&
    String(slot.email).toLowerCase() ===
      currentUser.email.toLowerCase()
  ) {

    return true;

  }


  return false;

}


// ================= FORMAT SLOT NAME =================

function formatSlotName(slotName) {

  return String(slotName)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, char => char.toUpperCase());

}


// ================= CAPITALIZE =================

function capitalize(value) {

  return String(value)
    .charAt(0)
    .toUpperCase() +
    String(value).slice(1);

}


// ================= OPEN BOOKING =================

function openBooking(slotName) {

  selectedSlot = slotName;

  if (bookingCity) {

    bookingCity.textContent =
      selectedCity.toUpperCase();

  }

  if (bookingSlot) {

    bookingSlot.textContent =
      formatSlotName(slotName);

  }

  if (bookingUser && currentUser) {

    bookingUser.textContent =
      currentUser.email;

  }

  openModal(bookingModal);

}


// ================= CONFIRM BOOKING =================

if (confirmBookingBtn) {

  confirmBookingBtn.addEventListener(
    "click",
    async () => {

      if (!currentUser) {

        showToast(
          "Please login first.",
          "error"
        );

        return;

      }

      if (!selectedSlot) {

        showToast(
          "No slot selected.",
          "error"
        );

        return;

      }

      try {

        // Re-check the slot before booking.

        const slotRef =
          ref(
            db,
            `cities/${selectedCity}/slots/${selectedSlot}`
          );

        const snapshot =
          await get(slotRef);

        const slot =
          snapshot.val();

        if (!slot) {

          showToast(
            "Slot not found.",
            "error"
          );

          return;

        }

        const status =
          String(
            slot.status || "available"
          ).toLowerCase();

        if (status !== "available") {

          showToast(
            "Sorry, this slot is no longer available.",
            "error"
          );

          closeModal(bookingModal);

          return;

        }


        // Reserve slot.

        await update(slotRef, {

          status: "reserved",

          bookedBy: currentUser.uid,

          email: currentUser.email,

          bookingTime:
            new Date().toISOString(),

          expiryTime:
            Date.now() +
            (60 * 60 * 1000)

        });


        // Optional booking record.
        // This is only used if your existing database
        // has a bookings node.

        try {

          const bookingsRef =
            ref(
              db,
              `bookings/${selectedCity}`
            );

          await push(bookingsRef, {

            slot: selectedSlot,

            userId: currentUser.uid,

            email: currentUser.email,

            bookingTime:
              new Date().toISOString(),

            status: "reserved"

          });

        } catch (bookingError) {

          console.warn(
            "Booking history was not written:",
            bookingError
          );

        }


        closeModal(bookingModal);

        showToast(
          "Slot reserved successfully."
        );


        // Open payment modal if present.

        if (paymentModal) {

          openModal(paymentModal);

        }

      } catch (error) {

        console.error(error);

        showToast(
          "Booking failed. Please try again.",
          "error"
        );

      }

    }
  );

}


// ======================================================
// I HAVE ARRIVED
// ======================================================

async function openGateForArrival(
  slotName,
  slot
) {

  if (!currentUser) {

    showToast(
      "Please login first.",
      "error"
    );

    openModal(loginModal);

    return;

  }


  // Verify reservation belongs to user.

  if (!isMyReservation(slot)) {

    showToast(
      "You do not have permission to open the gate.",
      "error"
    );

    return;

  }


  // Verify status again from Firebase.

  try {

    const slotRef =
      ref(
        db,
        `cities/${selectedCity}/slots/${slotName}`
      );

    const snapshot =
      await get(slotRef);

    const latestSlot =
      snapshot.val();

    if (!latestSlot) {

      showToast(
        "Reservation not found.",
        "error"
      );

      return;

    }

    if (
      String(latestSlot.status).toLowerCase()
      !== "reserved"
    ) {

      showToast(
        "This slot is no longer reserved.",
        "error"
      );

      return;

    }

    if (!isMyReservation(latestSlot)) {

      showToast(
        "This reservation does not belong to you.",
        "error"
      );

      return;

    }


    // ==================================================
    // IMPORTANT
    // ==================================================
    // DO NOT GUESS YOUR ESP32 GATE PATH.
    //
    // Once you send your current ESP32 gate code,
    // this exact section will be changed to the
    // Firebase path/field already used by your ESP32.
    // ==================================================

    showToast(
      "Reservation verified. Gate command is ready to connect.",
      "success"
    );

    console.log(
      "Verified arrival:",
      selectedCity,
      slotName,
      currentUser.uid
    );


    /*
      EXAMPLE ONLY — DO NOT USE YET:

      await update(
        ref(db, `cities/${selectedCity}/gate`),
        {
          open: true
        }
      );

      The above is NOT being executed because
      your exact ESP32 Firebase gate field has
      not yet been confirmed.
    */

  } catch (error) {

    console.error(error);

    showToast(
      "Could not verify your reservation.",
      "error"
    );

  }

}


// ================= PAYMENT =================

if (payNowBtn) {

  payNowBtn.addEventListener("click", () => {

    closeModal(paymentModal);

    showToast(
      "Payment confirmed successfully."
    );

  });

}


// ================= FIND PARKING =================

const findParkingBtn =
  document.getElementById("findParkingBtn");

if (findParkingBtn) {

  findParkingBtn.addEventListener(
    "click",
    () => {

      const parkingSection =
        document.getElementById("parking");

      if (parkingSection) {

        parkingSection.scrollIntoView({
          behavior: "smooth"
        });

      }

    }
  );

}


// ================= MOBILE MENU =================

if (menuBtn) {

  menuBtn.addEventListener("click", () => {

    const nav =
      document.querySelector("nav");

    if (nav) {

      nav.classList.toggle("mobile-open");

    }

  });

}


// ================= START =================

loadParkingData();
