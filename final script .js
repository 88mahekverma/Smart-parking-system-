
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  set,
  update,
  push,
  onValue,
  runTransaction,
  query,
  orderByChild,
  equalTo
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* =========================================================
   SMARTPARK FIREBASE CONFIGURATION
========================================================= */

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

/*
  FIREBASE ROOT:
  availableSlots/smartParking

  Cities:
  availableSlots/smartParking/cities/surat
  availableSlots/smartParking/cities/navsari

  Reserved-entry requests:
  availableSlots/smartParking/gateRequests/surat
  availableSlots/smartParking/gateRequests/navsari
*/

const ROOT = "availableSlots/smartParking";

const CITIES = ["surat", "navsari"];
const SLOT_IDS = ["slot1", "slot2"];
const DEMO_AMOUNT = 100;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* =========================================================
   APPLICATION STATE
========================================================= */

let currentUser = null;
let userProfile = {};
let selectedCity = "surat";
let authMode = "login";
let pendingBooking = null;
let authListenerVersion = 0;

const cityData = {};
const cityUnsubscribers = {};

const $ = id => document.getElementById(id);

const dbRef = path => ref(db, `${ROOT}/${path}`);

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value ?? "";
}

function show(id) {
  $(id)?.classList.remove("hidden");
}

function hide(id) {
  $(id)?.classList.add("hidden");
}

function message(id, value, isError = false) {
  const element = $(id);
  if (!element) return;

  element.textContent = value;
  element.classList.remove(
    "hidden",
    "message-error",
    "message-success"
  );

  element.classList.add(
    isError ? "message-error" : "message-success"
  );
}

function clearMessage(id) {
  const element = $(id);
  if (!element) return;

  element.textContent = "";
  element.classList.add("hidden");
  element.classList.remove(
    "message-error",
    "message-success"
  );
}

function toast(value, isError = false) {
  const container = $("toastContainer");

  if (!container) {
    console.log(value);
    return;
  }

  const item = document.createElement("div");
  item.className = isError ? "toast toast-error" : "toast";
  item.setAttribute("role", "status");
  item.textContent = value;

  container.appendChild(item);
  window.setTimeout(() => item.remove(), 4200);
}

function cityLabel(city) {
  return city === "navsari" ? "Navsari" : "Surat";
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function dateLabel(value) {
  if (!value) return "Not set";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function validCitySlot(city, slotId) {
  return CITIES.includes(city) && SLOT_IDS.includes(slotId);
}

function statusOf(slot) {
  if (!slot) return "available";

  if (
    slot.sensorOccupied === true ||
    String(slot.status || "").toLowerCase() === "occupied"
  ) {
    return "occupied";
  }

  const status = String(slot.status || "available").toLowerCase();

  return ["available", "reserved", "occupied"].includes(status)
    ? status
    : "available";
}

function openModal(id) {
  const element = $(id);
  if (!element) return;

  element.classList.remove("hidden");
  element.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  const element = $(id);
  if (!element) return;

  element.classList.add("hidden");
  element.setAttribute("aria-hidden", "true");
}

function countsForCity(data) {
  const counts = {
    total: SLOT_IDS.length,
    available: 0,
    reserved: 0,
    occupied: 0
  };

  for (const id of SLOT_IDS) {
    counts[statusOf(data?.slots?.[id])]++;
  }

  return counts;
}

/* =========================================================
   LIVE FIREBASE PARKING LISTENERS
========================================================= */

function startCityListeners() {
  for (const city of CITIES) {
    if (cityUnsubscribers[city]) {
      cityUnsubscribers[city]();
    }

    cityUnsubscribers[city] = onValue(
      dbRef(`cities/${city}`),

      snapshot => {
        if (!snapshot.exists()) {
          delete cityData[city];

          setText(
            "connectionStatus",
            `Waiting for ${cityLabel(city)} database data`
          );

          if (city === selectedCity) {
            setText("parkingLiveStatus", "No data");

            message(
              "parkingError",
              `No data at /${ROOT}/cities/${city}. Check Firebase Data and Rules.`,
              true
            );

            renderMissingSlots();
            renderHero();
          }

          return;
        }

        cityData[city] = snapshot.val();

        setText(
          "connectionStatus",
          "Firebase connected · live updates active"
        );

        renderHero();

        if (city === selectedCity) {
          clearMessage("parkingError");
          setText("parkingLiveStatus", "Live");

          setText(
            "parkingUpdatedAt",
            `Last updated: ${new Date().toLocaleTimeString()}`
          );

          renderCity(cityData[city]);
        }
      },

      error => {
        console.error(`Firebase listener (${city}) failed:`, error);

        setText("connectionStatus", "Firebase read failed");

        if (city === selectedCity) {
          message(
            "parkingError",
            `${error.message}. Check Firebase Database Rules and URL.`,
            true
          );
        }
      }
    );
  }
}

function renderMissingSlots() {
  const box = $("slotsContainer");

  if (box) {
    box.innerHTML = `
      <div class="empty-state">
        <p>
          Parking data was not found at the expected Firebase path.
          Check availableSlots/smartParking/cities.
        </p>
      </div>
    `;
  }
}

function chooseCity(city) {
  if (!CITIES.includes(city)) return;

  selectedCity = city;

  document.querySelectorAll("[data-city]").forEach(button => {
    const active = button.dataset.city === city;

    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  setText("selectedCityName", `${cityLabel(city)} Parking`);
  setText("gateCityName", `${cityLabel(city)} Gate`);

  const data = cityData[city];

  if (data) {
    clearMessage("parkingError");
    setText("parkingLiveStatus", "Live");
    renderCity(data);
  } else {
    setText("parkingLiveStatus", "No data");

    message(
      "parkingError",
      `No data at /${ROOT}/cities/${city}. Check Firebase Data and Rules.`,
      true
    );

    renderMissingSlots();
  }
}

function renderCity(data) {
  const counts = countsForCity(data);

  setText("totalSlots", counts.total);
  setText("availableSlots", counts.available);
  setText("reservedSlots", counts.reserved);
  setText("occupiedSlots", counts.occupied);

  const slots = data?.slots || {};
  const box = $("slotsContainer");

  if (box) {
    box.innerHTML = SLOT_IDS.map(id => {
      const slot = slots[id] || {};
      const status = statusOf(slot);
      const label = status[0].toUpperCase() + status.slice(1);

      const enabled =
        Boolean(currentUser) &&
        status === "available" &&
        userProfile.userType !== "admin";

      const detail =
        status === "available"
          ? "This slot is available to reserve."
          : status === "reserved"
            ? "This slot is reserved for a booking."
            : "The slot sensor detects a vehicle.";

      return `
        <article class="parking-slot ${status}">
          <div class="slot-header">
            <strong>${id.toUpperCase()}</strong>
            <span class="slot-status">${label}</span>
          </div>

          <p class="slot-details">${detail}</p>

          <button
            type="button"
            class="btn btn-primary slot-book-btn"
            data-book-slot="${id}"
            ${enabled ? "" : "disabled"}
          >
            ${
              !currentUser
                ? "Login to book"
                : userProfile.userType === "admin"
                  ? "Admin account"
                  : enabled
                    ? "Reserve slot"
                    : label
            }
          </button>
        </article>
      `;
    }).join("");

    box.querySelectorAll("[data-book-slot]").forEach(button => {
      button.addEventListener("click", () => {
        beginBooking(selectedCity, button.dataset.bookSlot);
      });
    });
  }

  const gate = data?.gate || {};

  const isOpen =
    gate.open === true ||
    String(gate.status || "").toUpperCase() === "OPEN";

  setText(
    "gateStatusText",
    isOpen
      ? `Gate is open${gate.entryType ? ` (${gate.entryType} entry)` : ""}.`
      : "Gate is closed. Waiting for ESP32."
  );

  setText("gateStatusBadge", isOpen ? "OPEN" : "CLOSED");

  $("gateStatusBadge")?.classList.toggle("is-open", isOpen);
  $("gateStatusBadge")?.classList.toggle("is-closed", !isOpen);
  $("gateStatusBadge")?.classList.toggle("live", Boolean(data?.gate));
}

function renderHero() {
  let available = 0;
  let occupied = 0;

  for (const city of CITIES) {
    if (cityData[city]) {
      const counts = countsForCity(cityData[city]);

      available += counts.available;
      occupied += counts.occupied;
    }
  }

  setText("heroTotalSlots", SLOT_IDS.length * CITIES.length);
  setText("heroAvailableSlots", available);
  setText("heroOccupiedSlots", occupied);
}

/* =========================================================
   LOGIN, SIGNUP AND AUTHENTICATION
========================================================= */

function setAuthMode(mode) {
  authMode = mode;

  const signup = mode === "signup";

  setText(
    "authTitle",
    signup ? "Create Your Account" : "Welcome Back"
  );

  setText(
    "authSubtitle",
    signup
      ? "Create your SmartPark account."
      : "Login to your SmartPark account."
  );

  setText("authSubmitBtn", signup ? "Create Account" : "Login");

  setText(
    "authSwitchText",
    signup
      ? "Already have an account?"
      : "Don't have an account?"
  );

  setText("authSwitchBtn", signup ? "Login" : "Create Account");

  $("nameField")?.classList.toggle("hidden", !signup);
  $("fullName")?.toggleAttribute("required", signup);

  $("password")?.setAttribute(
    "autocomplete",
    signup ? "new-password" : "current-password"
  );

  clearMessage("authError");
  clearMessage("authSuccess");
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  show("authSection");

  $("authSection")?.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  $("email")?.focus({ preventScroll: true });
}

function readableAuthError(error) {
  const errors = {
    "auth/email-already-in-use":
      "This email already has an account. Please log in.",
    "auth/invalid-email":
      "Enter a valid email address.",
    "auth/weak-password":
      "Password must contain at least 6 characters.",
    "auth/invalid-credential":
      "Email or password is incorrect.",
    "auth/user-not-found":
      "No account was found for this email.",
    "auth/wrong-password":
      "Email or password is incorrect.",
    "auth/network-request-failed":
      "Network error. Check your connection.",
    "auth/too-many-requests":
      "Too many attempts. Wait a little and try again.",
    "auth/operation-not-allowed":
      "Email/password sign-in is disabled in Firebase Authentication."
  };

  return errors[error?.code] || error?.message || "Authentication failed.";
}

function bindAuth() {
  $("loginNavBtn")?.addEventListener("click", () => openAuth("login"));
  $("signupNavBtn")?.addEventListener("click", () => openAuth("signup"));
  $("heroSignupBtn")?.addEventListener("click", () => openAuth("signup"));

  $("closeAuthBtn")?.addEventListener("click", () => hide("authSection"));

  $("authSwitchBtn")?.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "signup" : "login");
  });

  $("togglePasswordBtn")?.addEventListener("click", () => {
    const field = $("password");
    if (!field) return;

    field.type = field.type === "password" ? "text" : "password";

    setText(
      "togglePasswordBtn",
      field.type === "password" ? "Show" : "Hide"
    );
  });

  $("forgotPasswordBtn")?.addEventListener("click", async () => {
    const email = $("email")?.value.trim();

    if (!email) {
      return message("authError", "Enter your email address first.", true);
    }

    try {
      await sendPasswordResetEmail(auth, email);
      message("authSuccess", "Password reset email sent. Check your inbox.");
    } catch (error) {
      message("authError", readableAuthError(error), true);
    }
  });

  $("logoutBtn")?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      toast("Logged out successfully.");
    } catch (error) {
      toast(readableAuthError(error), true);
    }
  });

  $("authForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const email = $("email")?.value.trim();
    const password = $("password")?.value;
    const name = $("fullName")?.value.trim();
    const button = $("authSubmitBtn");

    if (!email || !password) {
      return message("authError", "Enter your email and password.", true);
    }

    if (authMode === "signup" && !name) {
      return message("authError", "Enter your full name.", true);
    }

    button.disabled = true;
    clearMessage("authError");
    clearMessage("authSuccess");

    try {
      if (authMode === "signup") {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await updateProfile(result.user, { displayName: name });

        /*
          Authentication can succeed even if the profile write fails.
          Keep the user signed in and report the profile problem clearly.
        */
        try {
          await set(dbRef(`users/${result.user.uid}`), {
            uid: result.user.uid,
            name,
            email,
            userType: "local",
            createdAt: new Date().toISOString()
          });
        } catch (profileError) {
          console.error("Profile save failed:", profileError);

          toast(
            "Account created, but the profile could not be saved. Check Firebase Rules.",
            true
          );

          hide("authSection");
          $("authForm")?.reset();
          return;
        }

        toast("Account created successfully.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast("Login successful.");
      }

      hide("authSection");
      $("authForm")?.reset();
    } catch (error) {
      console.error("Authentication error:", error);
      message("authError", readableAuthError(error), true);
    } finally {
      button.disabled = false;
    }
  });
}

/* =========================================================
   USER HEADER AND ADMIN VISIBILITY
========================================================= */

function updateUserUI(user) {
  const loggedIn = Boolean(user);

  $("loginNavBtn")?.classList.toggle("hidden", loggedIn);
  $("signupNavBtn")?.classList.toggle("hidden", loggedIn);
  $("accountActions")?.classList.toggle("hidden", !loggedIn);
  $("welcomePanel")?.classList.toggle("hidden", !loggedIn);

  const displayName =
    userProfile.name || user?.displayName || user?.email || "User";

  setText("headerUserName", displayName);
  setText("welcomeUserName", displayName);

  const isAdmin = userProfile.userType === "admin";

  setText("userTypeLabel", isAdmin ? "Administrator" : "SmartPark User");
  $("adminSection")?.classList.toggle("hidden", !isAdmin);

  if (cityData[selectedCity]) {
    renderCity(cityData[selectedCity]);
  }

  if (isAdmin) renderAdminDashboard();
}

/* =========================================================
   BOOKING
========================================================= */

function beginBooking(city, slotId) {
  if (!currentUser) return openAuth("login");

  if (userProfile.userType === "admin") {
    return toast("Admin accounts cannot make parking bookings.", true);
  }

  if (!validCitySlot(city, slotId)) {
    return toast("Invalid city or parking slot.", true);
  }

  if (statusOf(cityData[city]?.slots?.[slotId]) !== "available") {
    return toast("This slot is no longer available. Choose another slot.", true);
  }

  pendingBooking = { city, slotId };

  setText("bookingCityLabel", `City: ${cityLabel(city)}`);
  setText("bookingSlotLabel", `Slot: ${slotId.toUpperCase()}`);

  if ($("bookingAmount")) {
    $("bookingAmount").value = String(DEMO_AMOUNT);
  }

  const startInput = $("bookingStart");
  const endInput = $("bookingEnd");

  if (!startInput || !endInput) {
    return toast("Booking date fields were not found in index.html.", true);
  }

  const localDateTime = date => {
    const adjusted = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
    return adjusted.toISOString().slice(0, 16);
  };

  const start = new Date(Date.now() + 5 * 60000);

  startInput.min = localDateTime(new Date());
  startInput.value = localDateTime(start);
  endInput.min = localDateTime(start);
  endInput.value = localDateTime(new Date(start.getTime() + 2 * 60 * 60000));

  clearMessage("bookingMessage");
  openModal("bookingModal");
}

async function releaseUnpaidBooking(booking) {
  if (!booking?.bookingId || !currentUser) return;

  try {
    const slotRef = dbRef(
      `cities/${booking.city}/slots/${booking.slotId}`
    );

    const slotSnapshot = await get(slotRef);
    const slot = slotSnapshot.val();

    if (
      slot?.bookingId === booking.bookingId &&
      slot?.bookedBy === currentUser.uid &&
      slot?.sensorOccupied !== true
    ) {
      await update(slotRef, {
        status: "available",
        bookedBy: null,
        bookingId: null,
        bookingTime: null,
        expiryTime: null
      });
    }

    const bookingRef = dbRef(`bookings/${booking.bookingId}`);
    const bookingSnapshot = await get(bookingRef);

    if (
      bookingSnapshot.exists() &&
      bookingSnapshot.val().userId === currentUser.uid &&
      bookingSnapshot.val().status === "awaiting_payment"
    ) {
      await update(bookingRef, {
        status: "cancelled",
        paymentStatus: "cancelled"
      });
    }
  } catch (error) {
    console.error("Could not release unpaid booking:", error);
    toast("Pending booking could not be fully cancelled. Check Firebase Rules.", true);
  }
}

function bindBooking() {
  $("continuePaymentBtn")?.addEventListener("click", async () => {
    if (!currentUser || !pendingBooking || pendingBooking.bookingId) {
      if (!currentUser) {
        message("bookingMessage", "Log in and select a slot first.", true);
      }
      return;
    }

    const startValue = $("bookingStart")?.value;
    const endValue = $("bookingEnd")?.value;
    const start = new Date(startValue);
    const end = new Date(endValue);

    if (
      !startValue ||
      !endValue ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start < new Date(Date.now() - 60000) ||
      end <= start
    ) {
      return message(
        "bookingMessage",
        "Choose a valid start time and an end time after it.",
        true
      );
    }

    const button = $("continuePaymentBtn");
    button.disabled = true;

    let slotRef = null;
    let reservationCreated = false;

    try {
      const { city, slotId } = pendingBooking;

      if (!validCitySlot(city, slotId)) {
        throw new Error("Invalid city or slot.");
      }

      slotRef = dbRef(`cities/${city}/slots/${slotId}`);

      const transaction = await runTransaction(slotRef, slot => {
        if (!slot || statusOf(slot) !== "available") return;

        return {
          ...slot,
          status: "reserved",
          sensorOccupied: slot.sensorOccupied === true,
          bookedBy: currentUser.uid,
          bookingId: "pending",
          bookingTime: start.toISOString(),
          expiryTime: end.toISOString()
        };
      });

      if (!transaction.committed) {
        throw new Error("This slot is no longer available. Choose another slot.");
      }

      reservationCreated = true;

      const bookingRef = push(dbRef("bookings"));
      const bookingId = bookingRef.key;

      const booking = {
        bookingId,
        userId: currentUser.uid,
        userEmail: currentUser.email || "",
        userName: currentUser.displayName || userProfile.name || "",
        city,
        slotId,
        bookingTime: start.toISOString(),
        expiryTime: end.toISOString(),
        createdAt: new Date().toISOString(),
        status: "awaiting_payment",
        amount: DEMO_AMOUNT,
        currency: "INR",
        paymentStatus: "pending"
      };

      await set(bookingRef, booking);
      await update(slotRef, { bookingId });

      pendingBooking = booking;

      closeModal("bookingModal");

      setText(
        "paymentSummary",
        `${cityLabel(city)} — ${slotId.toUpperCase()} — ${money(DEMO_AMOUNT)}. Demo payment only; no real money will be charged.`
      );

      clearMessage("paymentMessage");
      openModal("paymentModal");
      await renderBookings();

    } catch (error) {
      console.error("Booking creation failed:", error);

      message(
        "bookingMessage",
        error.message || "Could not create booking.",
        true
      );

      if (reservationCreated && slotRef) {
        try {
          const snapshot = await get(slotRef);
          const slot = snapshot.val();

          if (
            slot?.bookedBy === currentUser.uid &&
            slot?.bookingId === "pending"
          ) {
            await update(slotRef, {
              status: "available",
              bookedBy: null,
              bookingId: null,
              bookingTime: null,
              expiryTime: null
            });
          }
        } catch (cleanupError) {
          console.error("Reservation cleanup failed:", cleanupError);
        }
      }
    } finally {
      button.disabled = false;
    }
  });
}

/* =========================================================
   DEMO PAYMENT
========================================================= */

function bindPayment() {
  $("confirmDemoPaymentBtn")?.addEventListener("click", async () => {
    const booking = pendingBooking;

    if (
      !currentUser ||
      !booking?.bookingId ||
      booking.status !== "awaiting_payment"
    ) {
      return message(
        "paymentMessage",
        "No pending booking found. Close this window and try booking again.",
        true
      );
    }

    const button = $("confirmDemoPaymentBtn");
    button.disabled = true;

    try {
      const paymentRef = push(dbRef("payments"));
      const paymentId = paymentRef.key;
      const paidAt = new Date().toISOString();

      await set(paymentRef, {
        paymentId,
        bookingId: booking.bookingId,
        userId: currentUser.uid,
        userEmail: currentUser.email || "",
        city: booking.city,
        slotId: booking.slotId,
        amount: DEMO_AMOUNT,
        currency: "INR",
        paymentMethod: "DEMO",
        status: "SUCCESS_DEMO",
        paidAt
      });

      await update(dbRef(`bookings/${booking.bookingId}`), {
        status: "confirmed",
        paymentStatus: "SUCCESS_DEMO",
        paymentId,
        paidAt
      });

      pendingBooking.status = "confirmed";
      pendingBooking.paymentStatus = "SUCCESS_DEMO";

      closeModal("paymentModal");
      pendingBooking = null;

      toast("Demo payment successful. No real money was charged.");

      await renderBookings();
      await renderPayments();

    } catch (error) {
      console.error("Demo payment update failed:", error);

      message(
        "paymentMessage",
        error.message || "Demo payment failed. No real payment was attempted.",
        true
      );
    } finally {
      button.disabled = false;
    }
  });
}

/* =========================================================
   USER BOOKING HISTORY
========================================================= */

async function renderBookings() {
  const box = $("myBookingsContainer");
  if (!box) return;

  if (!currentUser) {
    box.innerHTML = `
      <div class="empty-state">
        <p>Login to view your bookings.</p>
      </div>
    `;
    return;
  }

  try {
    const bookingsQuery = query(
      dbRef("bookings"),
      orderByChild("userId"),
      equalTo(currentUser.uid)
    );

    const snapshot = await get(bookingsQuery);

    const records = Object.values(snapshot.val() || {}).sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );

    if (!records.length) {
      box.innerHTML = `
        <div class="empty-state">
          <p>You have no bookings yet.</p>
        </div>
      `;
      return;
    }

    box.innerHTML = records.map(booking => {
      const expiry = new Date(booking.expiryTime).getTime();
      const start = new Date(booking.bookingTime).getTime();

      const expired =
        !Number.isFinite(expiry) || expiry <= Date.now();

      const notStarted =
        Number.isFinite(start) && start > Date.now();

      const statusText =
        expired && booking.status === "confirmed"
          ? "expired"
          : booking.status || "unknown";

      const canRequestGate =
        booking.status === "confirmed" &&
        !expired &&
        !notStarted &&
        validCitySlot(booking.city, booking.slotId);

      return `
        <article class="booking-card">
          <h4>
            ${escapeHTML(cityLabel(booking.city))}
            — ${escapeHTML(String(booking.slotId || "").toUpperCase())}
          </h4>

          <p>Status: ${escapeHTML(statusText)}</p>
          <p>Start: ${escapeHTML(dateLabel(booking.bookingTime))}</p>
          <p>End: ${escapeHTML(dateLabel(booking.expiryTime))}</p>
          <p>Amount: ${escapeHTML(money(booking.amount))}</p>
          <p>Payment: ${escapeHTML(booking.paymentStatus || "pending")}</p>

          ${
            canRequestGate
              ? `
                <button
                  type="button"
                  class="btn btn-outline request-gate-btn"
                  data-booking-id="${escapeHTML(booking.bookingId)}"
                >
                  I Have Arrived
                </button>
              `
              : notStarted && booking.status === "confirmed"
                ? "<p>Your reservation has not started yet.</p>"
                : ""
          }
        </article>
      `;
    }).join("");

    box.querySelectorAll(".request-gate-btn").forEach(button => {
      button.addEventListener("click", async () => {
        const booking = records.find(
          item => item.bookingId === button.dataset.bookingId
        );

        if (booking) {
          await requestReservedEntry(booking, button);
        }
      });
    });

  } catch (error) {
    console.error("Could not load bookings:", error);

    box.innerHTML = `
      <div class="empty-state">
        <p>Could not load bookings. Confirm your Firebase Database Rules.</p>
      </div>
    `;
  }
}

/* =========================================================
   RESERVED ENTRY: I HAVE ARRIVED
========================================================= */

async function requestReservedEntry(booking, button) {
  if (!currentUser) {
    return toast("Please log in first.", true);
  }

  if (
    booking.userId !== currentUser.uid ||
    booking.status !== "confirmed"
  ) {
    return toast("Only your own confirmed booking can request entry.", true);
  }

  if (!validCitySlot(booking.city, booking.slotId)) {
    return toast("Invalid booking city or slot.", true);
  }

  const start = new Date(booking.bookingTime).getTime();
  const expiry = new Date(booking.expiryTime).getTime();
  const now = Date.now();

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(expiry) ||
    now < start ||
    now >= expiry
  ) {
    return toast(
      "Your booking is not currently valid. Check its start and end times.",
      true
    );
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Sending Request...";

  try {
    const requestRef = dbRef(`gateRequests/${booking.city}`);
    const existing = await get(requestRef);

    if (existing.exists()) {
      const previous = existing.val() || {};

      const previousTime = new Date(
        previous.requestedAt || ""
      ).getTime();

      const isRecent =
        Number.isFinite(previousTime) &&
        now - previousTime < 2 * 60 * 1000;

      const previousStatus = String(
        previous.status || "pending"
      ).toLowerCase();

      const isPending = ![
        "processed",
        "rejected",
        "completed",
        "expired"
      ].includes(previousStatus);

      if (
        isRecent &&
        isPending &&
        previous.userId !== currentUser.uid
      ) {
        throw new Error(
          "Another arrival request is being processed. Please wait and retry."
        );
      }

      if (
        isRecent &&
        isPending &&
        previous.userId === currentUser.uid &&
        previous.bookingId === booking.bookingId
      ) {
        button.textContent = "Arrival Request Sent";

        toast(
          "Your arrival request is already waiting for the ESP32."
        );

        return;
      }
    }

    const requestId = push(dbRef("requestIds")).key;

    await set(requestRef, {
      requestId,
      userId: currentUser.uid,
      bookingId: booking.bookingId,
      city: booking.city,
      slotId: booking.slotId,
      entryType: "reserved",
      status: "pending",
      requestedAt: new Date().toISOString()
    });

    button.textContent = "Arrival Request Sent";

    toast(
      "Arrival request sent. The ESP32 must verify your booking before opening the gate."
    );

  } catch (error) {
    console.error("Reserved entry request failed:", error);

    button.disabled = false;
    button.textContent = originalText;

    toast(
      error.message ||
        "Could not send arrival request. Check Firebase Database Rules.",
      true
    );
  }
}

/* =========================================================
   PAYMENT HISTORY
========================================================= */

async function renderPayments() {
  const box = $("myPaymentsContainer");
  if (!box) return;

  if (!currentUser) {
    box.innerHTML = `
      <div class="empty-state">
        <p>Login to view your payment history.</p>
      </div>
    `;
    return;
  }

  try {
    const paymentsQuery = query(
      dbRef("payments"),
      orderByChild("userId"),
      equalTo(currentUser.uid)
    );

    const snapshot = await get(paymentsQuery);

    const records = Object.values(snapshot.val() || {}).sort((a, b) =>
      String(b.paidAt || "").localeCompare(String(a.paidAt || ""))
    );

    if (!records.length) {
      box.innerHTML = `
        <div class="empty-state">
          <p>No payment records yet.</p>
        </div>
      `;
      return;
    }

    box.innerHTML = records.map(payment => `
      <article class="payment-card">
        <h4>
          ${escapeHTML(cityLabel(payment.city))}
          — ${escapeHTML(String(payment.slotId || "").toUpperCase())}
        </h4>

        <p>Amount: ${escapeHTML(money(payment.amount))}</p>
        <p>Status: ${escapeHTML(payment.status || "unknown")}</p>
        <p>Date: ${escapeHTML(dateLabel(payment.paidAt))}</p>
        <p>Payment ID: ${escapeHTML(payment.paymentId || "")}</p>
      </article>
    `).join("");

  } catch (error) {
    console.error("Could not load payments:", error);

    box.innerHTML = `
      <div class="empty-state">
        <p>Could not load payments. Confirm your Firebase Database Rules.</p>
      </div>
    `;
  }
}

/* =========================================================
   USER PROFILE
========================================================= */

function bindProfile() {
  $("profileBtn")?.addEventListener("click", () => {
    if (!currentUser) return openAuth("login");

    $("profileName").value =
      userProfile.name || currentUser.displayName || "";

    $("profileEmail").value = currentUser.email || "";
    $("profileUserType").value = userProfile.userType || "local";

    clearMessage("profileMessage");
    show("profileSection");

    $("profileSection")?.scrollIntoView({ behavior: "smooth" });
  });

  $("closeProfileBtn")?.addEventListener("click", () => {
    hide("profileSection");
  });

  $("saveProfileBtn")?.addEventListener("click", async () => {
    if (!currentUser) return;

    const name = $("profileName")?.value.trim();

    if (!name) {
      return message("profileMessage", "Enter your name.", true);
    }

    const button = $("saveProfileBtn");
    button.disabled = true;

    try {
      await updateProfile(currentUser, { displayName: name });

      await update(dbRef(`users/${currentUser.uid}`), { name });

      userProfile.name = name;
      setText("headerUserName", name);
      setText("welcomeUserName", name);

      message("profileMessage", "Profile updated successfully.");
    } catch (error) {
      console.error("Profile update failed:", error);

      message(
        "profileMessage",
        error.message || "Could not update profile.",
        true
      );
    } finally {
      button.disabled = false;
    }
  });
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

async function renderAdminDashboard() {
  if (userProfile.userType !== "admin" || !currentUser) return;

  try {
    const [usersSnapshot, bookingsSnapshot, paymentsSnapshot] =
      await Promise.all([
        get(dbRef("users")),
        get(dbRef("bookings")),
        get(dbRef("payments"))
      ]);

    const users = Object.values(usersSnapshot.val() || {});
    const bookings = Object.values(bookingsSnapshot.val() || {});
    const payments = Object.values(paymentsSnapshot.val() || {});

    setText("adminUserCount", users.length);
    setText("adminBookingCount", bookings.length);
    setText("adminPaymentCount", payments.length);

    const bookingsBox = $("adminBookingsContainer");
    const paymentsBox = $("adminPaymentsContainer");

    if (bookingsBox) {
      bookingsBox.innerHTML = bookings.length
        ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>User</th>
                <th>City / Slot</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              ${bookings.map(b => `
                <tr>
                  <td>${escapeHTML(b.bookingId || "")}</td>
                  <td>${escapeHTML(b.userEmail || b.userId || "")}</td>
                  <td>${escapeHTML(cityLabel(b.city))} / ${escapeHTML(b.slotId || "")}</td>
                  <td>${escapeHTML(b.status || "")}</td>
                  <td>${escapeHTML(b.paymentStatus || "")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `
        : "No bookings yet.";
    }

    if (paymentsBox) {
      paymentsBox.innerHTML = payments.length
        ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>Payment</th>
                <th>User</th>
                <th>City / Slot</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${escapeHTML(p.paymentId || "")}</td>
                  <td>${escapeHTML(p.userEmail || p.userId || "")}</td>
                  <td>${escapeHTML(cityLabel(p.city))} / ${escapeHTML(p.slotId || "")}</td>
                  <td>${escapeHTML(money(p.amount))}</td>
                  <td>${escapeHTML(p.status || "")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `
        : "No payment records yet.";
    }

    clearMessage("adminMessage");

  } catch (error) {
    console.error("Admin dashboard error:", error);

    message(
      "adminMessage",
      "Admin access was not granted by Firebase Rules. Check the admin setup.",
      true
    );
  }
}

/* =========================================================
   CLOSE MODALS AND PAGE CONTROLS
========================================================= */

async function cancelPendingPaymentIfNeeded() {
  const booking = pendingBooking;

  if (
    booking?.bookingId &&
    booking.status === "awaiting_payment"
  ) {
    await releaseUnpaidBooking(booking);
    pendingBooking = null;
  } else if (booking && !booking.bookingId) {
    pendingBooking = null;
  }
}

function bindPageControls() {
  $("heroParkingBtn")?.addEventListener("click", () => {
    $("parkingSection")?.scrollIntoView({ behavior: "smooth" });
  });

  $("refreshBookingsBtn")?.addEventListener("click", () => {
    renderBookings();
    renderPayments();
  });

  document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", async () => {
      const modalId = button.dataset.closeModal;

      if (modalId === "paymentModal") {
        await cancelPendingPaymentIfNeeded();
      }

      if (
        modalId === "bookingModal" &&
        pendingBooking &&
        !pendingBooking.bookingId
      ) {
        pendingBooking = null;
      }

      closeModal(modalId);
    });
  });

  document.querySelectorAll("[data-city]").forEach(button => {
    button.addEventListener("click", () => {
      chooseCity(button.dataset.city);
    });
  });

  setText("currentYear", new Date().getFullYear());
}

/* =========================================================
   AUTHENTICATION STATE
========================================================= */

function listenAuth() {
  onAuthStateChanged(auth, async user => {
    const version = ++authListenerVersion;

    currentUser = user;
    userProfile = {};

    if (user) {
      try {
        const profileSnapshot = await get(dbRef(`users/${user.uid}`));

        if (version !== authListenerVersion) return;

        if (profileSnapshot.exists()) {
          userProfile = profileSnapshot.val() || {};
        } else {
          /*
            Do not silently grant admin privileges here.
            New users are always regular users.
          */
          userProfile = {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            userType: "local"
          };

          await set(dbRef(`users/${user.uid}`), {
            ...userProfile,
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Profile load failed:", error);

        userProfile = {
          name: user.displayName || "",
          email: user.email || "",
          userType: "local"
        };

        toast(
          "Logged in, but profile data could not be read or saved. Check Firebase Rules.",
          true
        );
      }
    }

    if (version !== authListenerVersion) return;

    updateUserUI(user);

    await renderBookings();
    await renderPayments();
  });
}

/* =========================================================
   START SMARTPARK
========================================================= */

function start() {
  bindPageControls();
  bindAuth();
  bindProfile();
  bindBooking();
  bindPayment();

  startCityListeners();
  chooseCity("surat");

  listenAuth();
}

start();
