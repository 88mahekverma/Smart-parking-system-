
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  set,
  update,
  push,
  onValue,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ======================================================
// SMARTPARK FIREBASE CONFIGURATION
// Copy these values from Firebase Console > Project settings
// ======================================================

const firebaseConfig = {
  apiKey: "PASTE_YOUR_FIREBASE_API_KEY",
  authDomain: "smart-parking-system-d46c9.firebaseapp.com",
  databaseURL: "https://smart-parking-system-d46c9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-parking-system-d46c9",
  storageBucket: "smart-parking-system-d46c9.firebasestorage.app",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
  appId: "PASTE_YOUR_FIREBASE_APP_ID"
};

const ROOT = "smartParking";
const CITIES = ["surat", "navsari"];
const SLOT_IDS = ["slot1", "slot2"];

let app;
let auth;
let db;
let currentUser = null;
let selectedCity = "surat";
let cityUnsubscribe = null;
let authMode = "login";
let pendingBooking = null;
let cityCache = {};

// ======================================================
// COMMON HELPERS
// ======================================================

const $ = id => document.getElementById(id);

const dbRef = path => ref(db, `${ROOT}/${path}`);

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value ?? "";
}

function showModal(id) {
  const element = $(id);
  if (!element) return;

  if (typeof element.showModal === "function") {
    if (!element.open) element.showModal();
  } else {
    element.hidden = false;
  }
}

function closeModal(id) {
  const element = $(id);
  if (!element) return;

  if (typeof element.close === "function" && element.open) {
    element.close();
  } else {
    element.hidden = true;
  }
}

function showError(id, message) {
  setText(id, message);
}

function toast(message, error = false) {
  const element = $("toastRegion");

  if (!element) {
    console.log(message);
    return;
  }

  element.textContent = message;
  element.classList.toggle("is-error", error);
  element.classList.add("is-visible");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    element.classList.remove("is-visible");
  }, 3500);
}

function cityName(city) {
  return city === "navsari" ? "Navsari" : "Surat";
}

function getSlotStatus(slot) {
  if (!slot) return "available";

  if (slot.sensorOccupied === true) return "occupied";

  return String(slot.status || "available").toLowerCase();
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatDate(value) {
  if (!value) return "Not set";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

function isFirebaseConfigMissing() {
  return (
    firebaseConfig.apiKey.startsWith("PASTE_") ||
    firebaseConfig.appId.startsWith("PASTE_") ||
    firebaseConfig.messagingSenderId.startsWith("PASTE_")
  );
}

// ======================================================
// INITIALIZE FIREBASE
// ======================================================

function initializeFirebase() {
  if (isFirebaseConfigMissing()) {
    setText("connectionStatus", "Firebase config required");

    toast(
      "Paste your real Firebase web configuration into script.js.",
      true
    );

    return false;
  }

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);

    return true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);

    setText("connectionStatus", "Firebase setup error");

    toast("Firebase initialization failed.", true);

    return false;
  }
}

// ======================================================
// CREATE MISSING FIREBASE STARTER DATA
// Does not overwrite existing values.
// ======================================================

async function initializeParkingData() {
  for (const city of CITIES) {
    const parkingRef = dbRef(`cities/${city}/parking`);
    const parkingSnapshot = await get(parkingRef);

    if (!parkingSnapshot.exists()) {
      await set(parkingRef, {
        totalSlots: 2,
        available: 2,
        reserved: 0,
        occupied: 0,
        parkingFull: false
      });
    }

    const gateRef = dbRef(`cities/${city}/gate`);
    const gateSnapshot = await get(gateRef);

    if (!gateSnapshot.exists()) {
      await set(gateRef, {
        open: false,
        status: "CLOSED",
        parkingFull: false,
        entryAllowed: false,
        entryType: "",
        requestId: null,
        lastOpenedAt: null
      });
    }

    for (const slotId of SLOT_IDS) {
      const slotRef = dbRef(`cities/${city}/slots/${slotId}`);
      const slotSnapshot = await get(slotRef);

      if (!slotSnapshot.exists()) {
        await set(slotRef, {
          status: "available",
          sensorOccupied: false,
          bookingId: null,
          bookedBy: null,
          bookingTime: null,
          expiryTime: null
        });
      }
    }
  }

  const thresholdRef = dbRef("system/ultrasonicThresholdCm");

  if (!(await get(thresholdRef)).exists()) {
    await set(thresholdRef, 10);
  }

  const countRef = dbRef("system/slotCountPerCity");

  if (!(await get(countRef)).exists()) {
    await set(countRef, 2);
  }
}

// ======================================================
// CITY SELECTION
// ======================================================

function selectCity(city) {
  if (!CITIES.includes(city)) return;

  selectedCity = city;

  document.querySelectorAll("[data-city]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.city === city
    );

    button.setAttribute(
      "aria-pressed",
      String(button.dataset.city === city)
    );
  });

  if ($("bookingCity")) {
    $("bookingCity").value = city;
  }

  setText("selectedCityName", cityName(city));

  subscribeToCity();
}

function bindCityButtons() {
  document.querySelectorAll("[data-city]").forEach(button => {
    button.addEventListener("click", () => {
      selectCity(button.dataset.city);
    });
  });

  $("citySuratBtn")?.addEventListener("click", () => {
    selectCity("surat");
  });

  $("cityNavsariBtn")?.addEventListener("click", () => {
    selectCity("navsari");
  });
}

// ======================================================
// LIVE FIREBASE CITY DATA
// Reads /smartParking/cities/surat or navsari
// ======================================================

function subscribeToCity() {
  if (!db) return;

  if (cityUnsubscribe) {
    cityUnsubscribe();
    cityUnsubscribe = null;
  }

  const cityRef = dbRef(`cities/${selectedCity}`);

  cityUnsubscribe = onValue(
    cityRef,
    snapshot => {
      if (!snapshot.exists()) {
        setText("connectionStatus", "City data not found");

        const slots = $("parkingSlots");

        if (slots) {
          slots.textContent =
            `No data found at /${ROOT}/cities/${selectedCity}.`;
        }

        return;
      }

      cityCache[selectedCity] = snapshot.val();

      setText("connectionStatus", "Firebase live");

      renderCity(snapshot.val());
      renderAllCityTotals();
    },
    error => {
      console.error("Firebase read error:", error);

      setText("connectionStatus", "Firebase read failed");

      toast(
        "Cannot read parking data. Check Firebase Database rules.",
        true
      );
    }
  );
}

function renderCity(data) {
  const parking = data.parking || {};

  setText("cityAvailable", parking.available ?? 0);
  setText("cityReserved", parking.reserved ?? 0);
  setText("cityOccupied", parking.occupied ?? 0);
  setText("cityTotal", parking.totalSlots ?? 2);

  setText(
    "cityParkingFull",
    parking.parkingFull ? "Parking full" : "Spaces available"
  );

  renderSlots(data.slots || {});
  renderGate(data.gate || {});
  updateBookingSlotOptions(data.slots || {});
}

function renderSlots(slots) {
  const container = $("parkingSlots");

  if (!container) return;

  container.innerHTML = SLOT_IDS.map(slotId => {
    const slot = slots[slotId] || {};
    const status = getSlotStatus(slot);

    const occupied = status === "occupied";
    const reserved = status === "reserved";

    const className = occupied
      ? "occupied"
      : reserved
        ? "reserved"
        : "available";

    const label = occupied
      ? "Occupied"
      : reserved
        ? "Reserved"
        : "Available";

    const disabled = !currentUser || occupied || reserved;

    return `
      <article class="slot-card slot-${className}">
        <div class="slot-card-top">
          <span class="slot-number">${slotId.toUpperCase()}</span>
          <span class="slot-status status-${className}">${label}</span>
        </div>

        <div class="slot-car-icon" aria-hidden="true">▰</div>

        <h3>${label}</h3>

        <p>
          ${occupied
            ? "A vehicle is detected in this space."
            : reserved
              ? "This space has a reservation."
              : "This space is ready to reserve."}
        </p>

        <button
          type="button"
          class="btn btn-primary slot-book-btn"
          data-book-slot="${slotId}"
          ${disabled ? "disabled" : ""}
        >
          ${!currentUser
            ? "Login to book"
            : occupied || reserved
              ? label
              : "Reserve slot"}
        </button>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-book-slot]").forEach(button => {
    button.addEventListener("click", () => {
      startBooking(selectedCity, button.dataset.bookSlot);
    });
  });
}

function renderGate(gate) {
  const open =
    gate.open === true ||
    String(gate.status).toUpperCase() === "OPEN";

  setText("gateStatus", open ? "GATE OPEN" : "GATE CLOSED");

  setText(
    "gateStatusText",
    open ? "Entry approved" : "Waiting for an entry request"
  );

  $("gateStatus")?.classList.toggle("is-open", open);
  $("gateStatus")?.classList.toggle("is-closed", !open);
}

function renderAllCityTotals() {
  let available = 0;
  let reserved = 0;
  let occupied = 0;

  for (const city of CITIES) {
    const parking = cityCache[city]?.parking;

    if (!parking) continue;

    available += Number(parking.available) || 0;
    reserved += Number(parking.reserved) || 0;
    occupied += Number(parking.occupied) || 0;
  }

  setText("availableAll", available);
  setText("reservedAll", reserved);
  setText("occupiedAll", occupied);
  setText("totalAll", 4);
}

function updateBookingSlotOptions(slots) {
  const select = $("bookingSlot");

  if (!select) return;

  const previousValue = select.value;

  select.innerHTML = SLOT_IDS.map(slotId => {
    const status = getSlotStatus(slots[slotId] || {});
    const disabled = status !== "available";

    return `
      <option
        value="${slotId}"
        ${disabled ? "disabled" : ""}
      >
        ${slotId.toUpperCase()} — ${status}
      </option>
    `;
  }).join("");

  if (
    previousValue &&
    SLOT_IDS.includes(previousValue) &&
    getSlotStatus(slots[previousValue] || {}) === "available"
  ) {
    select.value = previousValue;
  }
}

// ======================================================
// LOGIN, SIGNUP AND LOGOUT
// Firebase Authentication handles passwords.
// Never store passwords in Realtime Database.
// ======================================================

function setAuthMode(mode) {
  authMode = mode;

  const signup = mode === "signup";

  setText(
    "authTitle",
    signup ? "Create your SmartPark account" : "Welcome back"
  );

  setText(
    "authSubmitBtn",
    signup ? "Create account" : "Login"
  );

  setText(
    "authSwitchBtn",
    signup
      ? "Already have an account? Login"
      : "New here? Create account"
  );

  if ($("authNameField")) {
    $("authNameField").hidden = !signup;
  }

  if ($("authName")) {
    $("authName").required = signup;
  }

  showError("authError", "");
}

function bindAuthentication() {
  $("loginBtn")?.addEventListener("click", () => {
    setAuthMode("login");
    showModal("authModal");
  });

  $("signupBtn")?.addEventListener("click", () => {
    setAuthMode("signup");
    showModal("authModal");
  });

  $("logoutBtn")?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      toast("Logged out successfully.");
    } catch (error) {
      toast(error.message, true);
    }
  });

  $("authSwitchBtn")?.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "signup" : "login");
  });

  $("authForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const email = $("authEmail")?.value.trim();
    const password = $("authPassword")?.value || "";
    const name = $("authName")?.value.trim() || "";

    const button = $("authSubmitBtn");

    if (button) button.disabled = true;

    showError("authError", "");

    try {
      if (authMode === "signup") {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        if (name) {
          await updateProfile(result.user, {
            displayName: name
          });
        }

        await set(dbRef(`users/${result.user.uid}`), {
          uid: result.user.uid,
          name,
          email,
          createdAt: new Date().toISOString()
        });

        toast("Account created successfully.");
      } else {
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        toast("Login successful.");
      }

      closeModal("authModal");
      $("authForm")?.reset();

    } catch (error) {
      console.error(error);

      const messages = {
        "auth/email-already-in-use":
          "This email already has an account. Please log in.",
        "auth/invalid-email":
          "Enter a valid email address.",
        "auth/weak-password":
          "Use a password with at least 6 characters.",
        "auth/invalid-credential":
          "Email or password is incorrect.",
        "auth/network-request-failed":
          "Network error. Check your internet connection."
      };

      showError(
        "authError",
        messages[error.code] || error.message || "Authentication failed."
      );

    } finally {
      if (button) button.disabled = false;
    }
  });
}

function updateUserPanel(user) {
  if ($("loginBtn")) $("loginBtn").hidden = Boolean(user);
  if ($("signupBtn")) $("signupBtn").hidden = Boolean(user);
  if ($("logoutBtn")) $("logoutBtn").hidden = !user;
  if ($("myBookingsBtn")) $("myBookingsBtn").hidden = !user;

  setText(
    "userName",
    user?.displayName || user?.email || "Guest"
  );

  setText(
    "userPanelName",
    user?.displayName || user?.email || "Guest"
  );

  if (cityCache[selectedCity]) {
    renderCity(cityCache[selectedCity]);
  }
}

// ======================================================
// BOOKING
// Demo tariff: ₹20 per started hour.
// This is not a real payment.
// ======================================================

function setDefaultBookingDates() {
  const start = $("bookingStart");
  const end = $("bookingEnd");

  if (!start || !end) return;

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

  const startTime = now.toISOString().slice(0, 16);

  const finish = new Date(
    now.getTime() + 2 * 60 * 60 * 1000
  );

  finish.setMinutes(
    finish.getMinutes() - finish.getTimezoneOffset()
  );

  start.value = startTime;
  end.value = finish.toISOString().slice(0, 16);
  start.min = startTime;
  end.min = startTime;
}

function startBooking(city, slotId) {
  if (!currentUser) {
    setAuthMode("login");
    showModal("authModal");
    toast("Please log in before booking.", true);
    return;
  }

  selectCity(city);

  if ($("bookingCity")) $("bookingCity").value = city;
  if ($("bookingSlot")) $("bookingSlot").value = slotId;

  setDefaultBookingDates();

  pendingBooking = { city, slotId };

  showError("bookingError", "");
  showModal("bookingModal");
}

function bookingAmount(start, end) {
  const hours = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / 3600000)
  );

  return hours * 20;
}

async function refreshCityCounts(city) {
  const snapshot = await get(dbRef(`cities/${city}/slots`));

  if (!snapshot.exists()) return;

  const slots = snapshot.val();

  let available = 0;
  let reserved = 0;
  let occupied = 0;

  for (const slotId of SLOT_IDS) {
    const status = getSlotStatus(slots[slotId]);

    if (status === "available") available++;
    else if (status === "reserved") reserved++;
    else if (status === "occupied") occupied++;
  }

  await update(dbRef(`cities/${city}/parking`), {
    totalSlots: 2,
    available,
    reserved,
    occupied,
    parkingFull: available === 0
  });
}

function bindBooking() {
  $("bookingForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser) {
      toast("Please log in first.", true);
      return;
    }

    const city = $("bookingCity")?.value || selectedCity;
    const slotId = $("bookingSlot")?.value;
    const startRaw = $("bookingStart")?.value;
    const endRaw = $("bookingEnd")?.value;

    const start = new Date(startRaw);
    const end = new Date(endRaw);

    if (!CITIES.includes(city) || !SLOT_IDS.includes(slotId)) {
      showError("bookingError", "Select a valid city and slot.");
      return;
    }

    if (
      !startRaw ||
      !endRaw ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start < new Date(Date.now() - 60000) ||
      end <= start
    ) {
      showError(
        "bookingError",
        "Choose a valid start time and an end time after it."
      );
      return;
    }

    const button =
      $("bookingSubmitBtn") ||
      $("bookingForm").querySelector('[type="submit"]');

    if (button) button.disabled = true;

    try {
      const slotRef = dbRef(`cities/${city}/slots/${slotId}`);

      const transaction = await runTransaction(
        slotRef,
        slot => {
          if (!slot || getSlotStatus(slot) !== "available") {
            return;
          }

          return {
            ...slot,
            status: "reserved",
            bookingId: "pending",
            bookedBy: currentUser.uid,
            bookingTime: start.toISOString(),
            expiryTime: end.toISOString()
          };
        }
      );

      if (!transaction.committed) {
        throw new Error(
          "This slot is unavailable. Please choose another."
        );
      }

      const bookingRef = push(dbRef("bookings"));
      const bookingId = bookingRef.key;
      const amount = bookingAmount(start, end);

      const booking = {
        bookingId,
        userId: currentUser.uid,
        userEmail: currentUser.email || "",
        userName: currentUser.displayName || "",
        city,
        slotId,
        bookingTime: start.toISOString(),
        expiryTime: end.toISOString(),
        createdAt: new Date().toISOString(),
        status: "awaiting_payment",
        amount,
        currency: "INR",
        paymentStatus: "pending"
      };

      await set(bookingRef, booking);

      await update(slotRef, {
        bookingId
      });

      pendingBooking = booking;

      await refreshCityCounts(city);

      closeModal("bookingModal");
      openPayment(booking);

    } catch (error) {
      console.error(error);

      showError(
        "bookingError",
        error.message || "Booking failed. Please try again."
      );

      await refreshCityCounts(city).catch(console.error);

    } finally {
      if (button) button.disabled = false;
    }
  });

  $("myBookingsBtn")?.addEventListener("click", () => {
    showModal("bookingsModal");
    loadMyBookings();
  });
}

// ======================================================
// DEMO PAYMENT
// No payment gateway. No real money is charged.
// ======================================================

function openPayment(booking) {
  setText(
    "paymentBookingSummary",
    `${cityName(booking.city)} · ${booking.slotId.toUpperCase()} · ${formatMoney(booking.amount)}`
  );

  setText("paymentAmount", formatMoney(booking.amount));

  setText(
    "paymentNotice",
    "Demo payment only. No real money will be charged."
  );

  if ($("paymentMethod")) {
    $("paymentMethod").value = "demo";
  }

  showError("paymentError", "");
  showModal("paymentModal");
}

function bindPayment() {
  $("paymentForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser || !pendingBooking?.bookingId) {
      showError(
        "paymentError",
        "No pending booking found. Please book a slot again."
      );
      return;
    }

    const button =
      $("demoPaymentConfirm") ||
      $("paymentForm").querySelector('[type="submit"]');

    if (button) button.disabled = true;

    const booking = pendingBooking;
    const now = new Date().toISOString();

    try {
      // SIMULATED payment record. No money is transferred.
      const paymentRef = push(dbRef("payments"));
      const paymentId = paymentRef.key;

      await set(paymentRef, {
        paymentId,
        bookingId: booking.bookingId,
        userId: currentUser.uid,
        amount: booking.amount,
        currency: "INR",
        status: "success",
        paymentMethod: "demo",
        createdAt: now,
        paidAt: now,
        note: "College project demo; no real money charged."
      });

      await update(dbRef(`bookings/${booking.bookingId}`), {
        status: "confirmed",
        paymentStatus: "success",
        paymentId,
        paidAt: now
      });

      await update(
        dbRef(`cities/${booking.city}/slots/${booking.slotId}`),
        {
          status: "reserved",
          bookingId: booking.bookingId,
          bookedBy: currentUser.uid,
          bookingTime: booking.bookingTime,
          expiryTime: booking.expiryTime
        }
      );

      await refreshCityCounts(booking.city);

      closeModal("paymentModal");

      toast(
        "Demo payment successful. Reservation confirmed."
      );

      pendingBooking = null;
      loadMyBookings();

    } catch (error) {
      console.error(error);

      showError(
        "paymentError",
        "Could not save demo payment. Check Firebase rules."
      );

    } finally {
      if (button) button.disabled = false;
    }
  });
}

// ======================================================
// MY BOOKINGS
// ======================================================

async function loadMyBookings() {
  const container = $("myBookingsList");

  if (!container || !currentUser) return;

  container.textContent = "Loading bookings…";

  try {
    const snapshot = await get(dbRef("bookings"));
    const allBookings = snapshot.val() || {};

    const bookings = Object.values(allBookings)
      .filter(booking => booking.userId === currentUser.uid)
      .sort((a, b) =>
        String(b.createdAt || "").localeCompare(
          String(a.createdAt || "")
        )
      );

    if (!bookings.length) {
      container.innerHTML = "<p>You have no bookings yet.</p>";
      return;
    }

    container.innerHTML = bookings.map(booking => {
      const expiry = new Date(booking.expiryTime).getTime();
      const active =
        booking.status === "confirmed" &&
        Number.isFinite(expiry) &&
        expiry > Date.now();

      return `
        <article class="booking-item">
          <div>
            <strong>
              ${cityName(booking.city)} ·
              ${escapeHTML(String(booking.slotId || "").toUpperCase())}
            </strong>

            <p>Start: ${escapeHTML(formatDate(booking.bookingTime))}</p>
            <p>End: ${escapeHTML(formatDate(booking.expiryTime))}</p>
            <p>Status: ${escapeHTML(booking.status || "unknown")}</p>
            <p>Payment: ${escapeHTML(booking.paymentStatus || "pending")}</p>
            <p>Amount: ${formatMoney(booking.amount)}</p>
          </div>

          <div class="booking-actions">
            ${active ? `
              <button
                type="button"
                class="btn btn-primary"
                data-entry-request="${escapeHTML(booking.bookingId)}"
              >
                Request Entry
              </button>

              <button
                type="button"
                class="btn btn-secondary"
                data-cancel-booking="${escapeHTML(booking.bookingId)}"
              >
                Cancel
              </button>
            ` : ""}
          </div>
        </article>
      `;
    }).join("");

    container.querySelectorAll("[data-entry-request]").forEach(button => {
      button.addEventListener("click", () => {
        requestReservedEntry(button.dataset.entryRequest);
      });
    });

    container.querySelectorAll("[data-cancel-booking]").forEach(button => {
      button.addEventListener("click", () => {
        cancelBooking(button.dataset.cancelBooking);
      });
    });

  } catch (error) {
    console.error(error);

    container.innerHTML =
      "<p>Could not load bookings. Check Firebase rules.</p>";
  }
}

// ======================================================
// RESERVED ENTRY REQUEST
// Website sends a request; it does not directly open the gate.
// ESP32 must validate the booking before opening the servo.
// ======================================================

async function requestReservedEntry(bookingId) {
  if (!currentUser) {
    toast("Please log in first.", true);
    return;
  }

  try {
    const snapshot = await get(dbRef(`bookings/${bookingId}`));
    const booking = snapshot.val();

    if (!booking || booking.userId !== currentUser.uid) {
      throw new Error("Booking not found for this account.");
    }

    if (
      booking.status !== "confirmed" ||
      booking.paymentStatus !== "success"
    ) {
      throw new Error("Your booking is not confirmed.");
    }

    if (new Date(booking.expiryTime).getTime() < Date.now()) {
      throw new Error("Your reservation has expired.");
    }

    const slotSnapshot = await get(
      dbRef(`cities/${booking.city}/slots/${booking.slotId}`)
    );

    const slot = slotSnapshot.val();

    if (
      !slot ||
      slot.bookingId !== bookingId ||
      slot.bookedBy !== currentUser.uid
    ) {
      throw new Error("The reserved slot could not be verified.");
    }

    const requestRef = push(dbRef("gateRequests"));
    const requestId = requestRef.key;

    await set(requestRef, {
      requestId,
      bookingId,
      userId: currentUser.uid,
      city: booking.city,
      slotId: booking.slotId,
      type: "reserved",
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: booking.expiryTime
    });

    await update(dbRef(`cities/${booking.city}/gate`), {
      entryAllowed: true,
      entryType: "reserved",
      requestId
    });

    toast(
      "Entry request sent. Waiting for ESP32 verification."
    );

  } catch (error) {
    console.error(error);
    toast(error.message || "Entry request failed.", true);
  }
}

// ======================================================
// CANCEL RESERVATION
// ======================================================

async function cancelBooking(bookingId) {
  if (!currentUser) return;

  if (!confirm("Cancel this reservation?")) return;

  try {
    const snapshot = await get(dbRef(`bookings/${bookingId}`));
    const booking = snapshot.val();

    if (!booking || booking.userId !== currentUser.uid) {
      throw new Error("Booking not found.");
    }

    if (
      !["confirmed", "awaiting_payment"].includes(booking.status)
    ) {
      throw new Error("This booking cannot be cancelled.");
    }

    await update(dbRef(`bookings/${bookingId}`), {
      status: "cancelled",
      cancelledAt: new Date().toISOString()
    });

    const slotRef = dbRef(
      `cities/${booking.city}/slots/${booking.slotId}`
    );

    const slotSnapshot = await get(slotRef);
    const slot = slotSnapshot.val();

    // Avoid clearing a slot if it no longer belongs to this booking.
    if (slot && slot.bookingId === bookingId) {
      await update(slotRef, {
        status: slot.sensorOccupied ? "occupied" : "available",
        bookingId: null,
        bookedBy: null,
        bookingTime: null,
        expiryTime: null
      });
    }

    await refreshCityCounts(booking.city);

    toast("Reservation cancelled.");
    loadMyBookings();

  } catch (error) {
    console.error(error);
    toast(error.message || "Cancellation failed.", true);
  }
}

// ======================================================
// ENTRY CONTROLS
// Local gate opening is controlled by the ESP32 sensor logic.
// Sensor threshold: 10 cm.
// ======================================================

function bindEntryControls() {
  $("localEntryBtn")?.addEventListener("click", () => {
    const parking = cityCache[selectedCity]?.parking || {};

    if (Number(parking.available) < 1) {
      toast(
        `${cityName(selectedCity)} parking is full. Gate must remain closed.`,
        true
      );
      return;
    }

    toast(
      "Local entry uses the ESP32 ultrasonic sensor. The gate should open when a car is detected within 10 cm and a slot is available."
    );
  });

  $("reservedEntryBtn")?.addEventListener("click", () => {
    if (!currentUser) {
      setAuthMode("login");
      showModal("authModal");
      return;
    }

    showModal("bookingsModal");
    loadMyBookings();
  });
}

// ======================================================
// MODAL CLOSE BUTTONS AND MOBILE NAVIGATION
// ======================================================

function bindCloseButtons() {
  document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => {
      closeModal(button.dataset.closeModal);
    });
  });

  [
    "authModal",
    "bookingModal",
    "paymentModal",
    "bookingsModal"
  ].forEach(id => {
    const dialog = $(id);

    dialog?.addEventListener("click", event => {
      if (event.target === dialog) closeModal(id);
    });
  });

  $("mobileMenuBtn")?.addEventListener("click", () => {
    document.querySelector(".site-nav")?.classList.toggle("is-open");
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", () => {
      document.querySelector(".site-nav")?.classList.remove("is-open");
    });
  });
}

// ======================================================
// AUTH STATE AND CONNECTION STATUS
// ======================================================

function bindConnectionStatus() {
  onValue(ref(db, ".info/connected"), snapshot => {
    const connected = snapshot.val() === true;

    setText(
      "connectionStatus",
      connected ? "Firebase live" : "Connecting to Firebase…"
    );
  });
}

function bindAuthState() {
  onAuthStateChanged(auth, async user => {
    currentUser = user;

    updateUserPanel(user);

    if (user) {
      try {
        const userRef = dbRef(`users/${user.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
          await set(userRef, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("User profile record could not be saved:", error);
      }
    }
  });
}

// ======================================================
// START SMARTPARK
// ======================================================

async function startSmartPark() {
  bindCityButtons();
  bindAuthentication();
  bindBooking();
  bindPayment();
  bindEntryControls();
  bindCloseButtons();

  setAuthMode("login");

  if (!initializeFirebase()) return;

  bindConnectionStatus();
  bindAuthState();

  try {
    await initializeParkingData();

    for (const city of CITIES) {
      const snapshot = await get(dbRef(`cities/${city}`));

      if (snapshot.exists()) {
        cityCache[city] = snapshot.val();
      }
    }

    renderAllCityTotals();
    selectCity("surat");

  } catch (error) {
    console.error("SmartPark Firebase error:", error);

    setText("connectionStatus", "Firebase permission error");

    toast(
      "Firebase data could not be loaded. Check your web config and Realtime Database rules.",
      true
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    startSmartPark,
    { once: true }
  );
} else {
  startSmartPark();
}
