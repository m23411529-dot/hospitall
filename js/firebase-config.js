/**
 * Firebase Integration for Nabd Al-Amal
 * Initialized with project: shop-sport-b9462
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

// Web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDe0SNqObOnF_CT1Vad8WZ45EKxloZjLMc",
  authDomain: "shop-sport-b9462.firebaseapp.com",
  projectId: "shop-sport-b9462",
  storageBucket: "shop-sport-b9462.firebasestorage.app",
  messagingSenderId: "954231451908",
  appId: "1:954231451908:web:cfd28f7cefb8036238e051",
  measurementId: "G-6WJPLKHNGR"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (if supported in current environment)
let analytics = null;
try {
  analytics = getAnalytics(app);
  console.log("✅ Firebase Analytics initialized.");
} catch (err) {
  console.warn("⚠️ Firebase Analytics could not be initialized:", err.message);
}
export { analytics };

// Initialize Firestore Database
export const db = getFirestore(app);
console.log("✅ Firebase Firestore connected to project: " + firebaseConfig.projectId);

/**
 * Save a new donation to Firestore
 * @param {Object} donationData 
 * @returns {Promise<{id: string, success: boolean}>}
 */
export async function saveDonation(donationData) {
  try {
    const docRef = await addDoc(collection(db, "donations"), {
      ...donationData,
      amount: Number(donationData.amount) || 0,
      currency: "SAR",
      status: "completed",
      createdAt: serverTimestamp(),
      clientTimestamp: new Date().toISOString()
    });
    console.log("✨ Donation saved successfully with ID:", docRef.id);
    
    // Save locally as backup / cache
    cacheLocalDonation({ id: docRef.id, ...donationData });

    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("❌ Error saving donation to Firestore:", error);
    // Fallback to localStorage so donor's journey is not interrupted
    const fallbackId = "offline-" + Date.now();
    cacheLocalDonation({ id: fallbackId, ...donationData, offline: true });
    return { id: fallbackId, success: true, offline: true, error: error.message };
  }
}

/**
 * Subscribe user email to newsletter
 * @param {string} email 
 * @returns {Promise<{id: string, success: boolean}>}
 */
export async function subscribeNewsletter(email) {
  try {
    const docRef = await addDoc(collection(db, "newsletter_subscribers"), {
      email: email.trim().toLowerCase(),
      createdAt: serverTimestamp(),
      active: true
    });
    console.log("📧 Newsletter subscription recorded:", docRef.id);
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("❌ Error saving newsletter subscription:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Save hero sponsorship or wish fulfillment
 * @param {Object} sponsorData 
 * @returns {Promise<{id: string, success: boolean}>}
 */
export async function saveSponsorship(sponsorData) {
  try {
    const docRef = await addDoc(collection(db, "sponsorships"), {
      ...sponsorData,
      createdAt: serverTimestamp()
    });
    console.log("🌟 Sponsorship recorded:", docRef.id);
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("❌ Error saving sponsorship:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Save hospital/medical partner request
 * @param {Object} partnerData 
 * @returns {Promise<{id: string, success: boolean}>}
 */
export async function submitPartnerRequest(partnerData) {
  try {
    const docRef = await addDoc(collection(db, "partner_requests"), {
      ...partnerData,
      createdAt: serverTimestamp(),
      status: "pending_review"
    });
    console.log("🏥 Partner inquiry recorded:", docRef.id);
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("❌ Error saving partner request:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Real-time listener for recent donations
 * @param {Function} callback 
 */
export function listenRecentDonations(callback) {
  try {
    const q = query(collection(db, "donations"), orderBy("createdAt", "desc"), limit(5));
    return onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      callback(items);
    }, (err) => {
      console.warn("Realtime listener error:", err.message);
      // fallback to cached donations
      callback(getLocalDonations());
    });
  } catch (e) {
    console.warn("Could not attach snapshot listener:", e);
    callback(getLocalDonations());
    return () => {};
  }
}

function cacheLocalDonation(item) {
  try {
    const existing = JSON.parse(localStorage.getItem("nabd_donations") || "[]");
    existing.unshift(item);
    localStorage.setItem("nabd_donations", JSON.stringify(existing.slice(0, 20)));
  } catch (e) {}
}

function getLocalDonations() {
  try {
    return JSON.parse(localStorage.getItem("nabd_donations") || "[]");
  } catch (e) {
    return [];
  }
}
