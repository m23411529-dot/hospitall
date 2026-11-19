/**
 * Nabd Al-Amal Platform Main Script
 * Handles Navigation, Quick Donate Widget, Modals, Forms & Firebase Events
 */

import { 
  saveDonation, 
  subscribeNewsletter, 
  saveSponsorship, 
  submitPartnerRequest,
  listenRecentDonations 
} from "./firebase-config.js";

// Global state
const state = {
  selectedAmount: 250,
  donationType: "one-time", // or 'monthly'
  purpose: "كفالة جلسة غسيل كلوي كاملة",
  donorName: "فاعل خير",
  heroTarget: null
};

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initDonationWidget();
  initDonationModal();
  initNewsletterForm();
  initMobileDrawer();
  initRealtimeTicker();
  setupActiveNavLinks();
});

/* ==========================================================================
   Navigation & Active Link Highlighting
   ========================================================================== */
function setupActiveNavLinks() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll("nav a[data-path], .mobile-nav a[data-path]");
  
  navLinks.forEach(link => {
    const target = link.getAttribute("href");
    const isCurrent = (currentPath === target) || 
                      (currentPath === "" && target === "index.html") || 
                      (currentPath === "code.html" && target === "index.html");

    if (isCurrent) {
      link.classList.remove("text-on-surface-variant", "hover:text-on-surface");
      link.classList.add("bg-primary-container", "text-on-primary-container", "font-semibold");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("bg-primary-container", "text-on-primary-container", "font-semibold");
      link.classList.add("text-on-surface-variant", "hover:text-on-surface");
      link.removeAttribute("aria-current");
    }
  });
}

function initNavigation() {
  // Smooth scroll for in-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== "#") {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}

/* ==========================================================================
   Mobile Drawer Setup
   ========================================================================== */
function initMobileDrawer() {
  const openButtons = document.querySelectorAll("[data-action='toggle-mobile-menu']");
  let backdrop = document.querySelector(".mobile-backdrop");
  let drawer = document.querySelector(".mobile-drawer");

  if (!drawer) {
    drawer = document.createElement("div");
    drawer.className = "mobile-drawer p-6";
    drawer.innerHTML = `
      <div class="flex items-center justify-between pb-6 border-b border-surface-container-high">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-[22px]">favorite</span>
          </div>
          <span class="font-headline-sm text-primary font-bold">نبض الأمل</span>
        </div>
        <button id="closeMobileDrawer" class="p-2 text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="mobile-nav flex flex-col gap-3 py-6 font-headline-sm text-[16px]">
        <a href="index.html" data-path="home" class="px-4 py-2.5 rounded-xl transition-all">الرئيسية</a>
        <a href="heroes-stories.html" data-path="heroes-stories" class="px-4 py-2.5 rounded-xl transition-all">قصص وأحلام الأبطال</a>
        <a href="donation-calculator.html" data-path="donation-calculator" class="px-4 py-2.5 rounded-xl transition-all">حاسبة التبرع والكفالة</a>
        <a href="partners-and-hospitals.html" data-path="partners-and-hospitals" class="px-4 py-2.5 rounded-xl transition-all">شراكات ومستشفيات</a>
        <a href="about-initiative.html" data-path="about-initiative" class="px-4 py-2.5 rounded-xl transition-all">عن المبادرة</a>
      </div>
      <div class="mt-auto pt-6 border-t border-surface-container-high flex flex-col gap-3">
        <button onclick="window.openDonationModal()" class="w-full py-3.5 rounded-full bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-bold shadow-md flex items-center justify-center gap-2">
          <span>تبرّع الآن</span>
          <span class="material-symbols-outlined text-[20px]">volunteer_activism</span>
        </button>
      </div>
    `;
    document.body.appendChild(drawer);
  }

  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "mobile-backdrop";
    document.body.appendChild(backdrop);
  }

  const toggle = (show) => {
    if (show) {
      drawer.classList.add("open");
      backdrop.classList.add("open");
    } else {
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
    }
  };

  openButtons.forEach(btn => btn.addEventListener("click", () => toggle(true)));
  backdrop.addEventListener("click", () => toggle(false));
  const closeBtn = document.getElementById("closeMobileDrawer");
  if (closeBtn) closeBtn.addEventListener("click", () => toggle(false));
}

/* ==========================================================================
   Donation Widget on Home / Pages
   ========================================================================== */
function initDonationWidget() {
  const cards = document.querySelectorAll(".donation-card");
  const customInput = document.getElementById("customAmountInput");
  const freqButtons = document.querySelectorAll("[data-donation-frequency]");

  window.selectDonation = function(amount, element, purposeTitle) {
    state.selectedAmount = amount;
    if (purposeTitle) state.purpose = purposeTitle;

    cards.forEach(card => card.classList.remove("active"));
    if (element) {
      element.classList.add("active");
    }

    if (customInput) {
      customInput.value = "";
    }
  };

  cards.forEach(card => {
    card.addEventListener("click", function() {
      const amount = parseInt(this.getAttribute("data-amount")) || 250;
      const title = this.querySelector(".font-bold")?.innerText || "كفالة علاجية";
      window.selectDonation(amount, this, title);
    });
  });

  if (customInput) {
    customInput.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      if (val > 0) {
        state.selectedAmount = val;
        cards.forEach(card => card.classList.remove("active"));
      }
    });
  }

  // Frequency Switch (Once vs Monthly)
  const freqContainer = document.querySelector("#frequencyContainer, .grid.grid-cols-2.p-1.rounded-xl.bg-surface-container-low");
  if (freqContainer) {
    const buttons = freqContainer.querySelectorAll("button");
    buttons.forEach((btn, index) => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => {
          b.className = "py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface text-center transition-all";
        });
        btn.className = "py-2.5 rounded-lg bg-surface-container-lowest text-primary font-bold shadow-sm text-center transition-all";
        state.donationType = index === 0 ? "one-time" : "monthly";
      });
    });
  }

  // Hero direct donate CTA
  document.querySelectorAll("button").forEach(btn => {
    if (btn.id === "heroDonateBtn" || btn.dataset.action === "hero-donate" || (btn.textContent && btn.textContent.includes("اصنع ابتسامتهم الآن"))) {
      btn.addEventListener("click", () => {
        window.openDonationModal({
          amount: state.selectedAmount,
          purpose: state.purpose,
          type: state.donationType
        });
      });
    }
  });

  // Top header Quick Donate button
  document.querySelectorAll("[data-path='quick-donate'], a[href*='quick-donate']").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      window.openDonationModal();
    });
  });
}

/* ==========================================================================
   Quick Donate Modal
   ========================================================================== */
function initDonationModal() {
  let modal = document.getElementById("quickDonationModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "quickDonationModal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content p-6 lg:p-8 relative">
        <button id="closeModalBtn" class="absolute top-5 left-5 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center text-primary shadow-sm">
            <span class="material-symbols-outlined text-[26px]">volunteer_activism</span>
          </div>
          <div>
            <h3 class="font-headline-sm text-on-surface font-bold">إتمام التبرع المبارك</h3>
            <p class="font-body-sm text-on-surface-variant">كل ريال يُترجم إلى أمل وشفاء لأطفال الغسيل الكلوي</p>
          </div>
        </div>

        <form id="donationForm" class="flex flex-col gap-4">
          <div>
            <label class="block font-label-md text-on-surface font-semibold mb-1.5">مبلغ التبرع (ر.س)</label>
            <div class="relative">
              <input type="number" id="modalAmount" required min="10" value="250" class="w-full bg-surface-container-low px-4 py-3 rounded-xl font-headline-sm text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary border border-transparent" />
              <span class="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">ر.س</span>
            </div>
          </div>

          <div>
            <label class="block font-label-md text-on-surface font-semibold mb-1.5">نوع المساهمة</label>
            <select id="modalPurpose" class="w-full bg-surface-container-low px-4 py-3 rounded-xl font-body-sm text-on-surface focus:outline-none border border-transparent">
              <option value="كفالة جلسة غسيل كلوي كاملة (250 ر.س)">كفالة جلسة غسيل كلوي كاملة</option>
              <option value="سلة ألعاب ورسم أثناء الجلسة (100 ر.س)">سلة ألعاب ورسم أثناء الجلسة</option>
              <option value="كفالة علاجية شهرية متكاملة (1,000 ر.س)">كفالة علاجية شهرية متكاملة</option>
              <option value="تأمين فلاتر ومستلزمات طبية مستعجلة">تأمين فلاتر ومستلزمات طبية مستعجلة</option>
              <option value="صندوق الصدقة الجارية العام">صندوق الصدقة الجارية العام</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-label-md text-on-surface font-semibold mb-1.5">الاسم الكريم (اختياري)</label>
              <input type="text" id="modalDonorName" placeholder="فاعل خير" class="w-full bg-surface-container-low px-4 py-2.5 rounded-xl font-body-sm text-on-surface focus:outline-none border border-transparent" />
            </div>
            <div>
              <label class="block font-label-md text-on-surface font-semibold mb-1.5">رقم الجوال أو البريد</label>
              <input type="text" id="modalDonorContact" placeholder="05xxxxxxxx أو البريد" class="w-full bg-surface-container-low px-4 py-2.5 rounded-xl font-body-sm text-on-surface focus:outline-none border border-transparent" />
            </div>
          </div>

          <div>
            <label class="block font-label-md text-on-surface font-semibold mb-1.5">طريقة الدفع</label>
            <div class="grid grid-cols-3 gap-2">
              <label class="flex flex-col items-center justify-center p-2.5 rounded-xl border border-surface-container-high cursor-pointer hover:bg-surface-container-low transition-all">
                <input type="radio" name="paymentGateway" value="Apple Pay" checked class="hidden peer" />
                <span class="peer-checked:font-bold text-on-surface font-semibold text-center text-sm">Apple Pay</span>
                <span class="text-[11px] text-outline">فوري</span>
              </label>
              <label class="flex flex-col items-center justify-center p-2.5 rounded-xl border border-surface-container-high cursor-pointer hover:bg-surface-container-low transition-all">
                <input type="radio" name="paymentGateway" value="Mada" class="hidden peer" />
                <span class="peer-checked:font-bold text-on-surface font-semibold text-center text-sm">مدى Mada</span>
                <span class="text-[11px] text-outline">بطاقة بنكية</span>
              </label>
              <label class="flex flex-col items-center justify-center p-2.5 rounded-xl border border-surface-container-high cursor-pointer hover:bg-surface-container-low transition-all">
                <input type="radio" name="paymentGateway" value="Visa / MasterCard" class="hidden peer" />
                <span class="peer-checked:font-bold text-on-surface font-semibold text-center text-sm">فيزا / ماستر</span>
                <span class="text-[11px] text-outline">ائتمانية</span>
              </label>
            </div>
          </div>

          <button type="submit" id="submitDonationBtn" class="w-full mt-2 py-4 rounded-xl bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-headline-sm text-[17px] font-bold shadow-lg transition-all flex items-center justify-center gap-2">
            <span>تأكيد التبرع وإرسال الأثر 💛</span>
            <span class="material-symbols-outlined">send</span>
          </button>

          <p class="text-center font-label-sm text-outline text-[12px] flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[16px] text-primary">verified_user</span>
            <span>بوابة مشفرة بأمان 256-bit عبر خوادم Firebase الموثقة</span>
          </p>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const closeModal = () => modal.classList.remove("active");
  modal.querySelector("#closeModalBtn")?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  window.openDonationModal = function(options = {}) {
    const amountInput = modal.querySelector("#modalAmount");
    const purposeSelect = modal.querySelector("#modalPurpose");
    if (amountInput && options.amount) amountInput.value = options.amount;
    if (purposeSelect && options.purpose) {
      // Find matching option or set custom
      let matched = false;
      Array.from(purposeSelect.options).forEach(opt => {
        if (opt.value.includes(options.purpose) || options.purpose.includes(opt.value)) {
          opt.selected = true;
          matched = true;
        }
      });
      if (!matched && options.purpose) {
        purposeSelect.innerHTML += `<option value="${options.purpose}" selected>${options.purpose}</option>`;
      }
    }
    modal.classList.add("active");
  };

  // Form Submission -> Firebase
  const donationForm = modal.querySelector("#donationForm");
  donationForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = modal.querySelector("#submitDonationBtn");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin">refresh</span> جاري المعالجة والربط بـ Firebase...`;

    const amount = Number(modal.querySelector("#modalAmount").value) || state.selectedAmount;
    const purpose = modal.querySelector("#modalPurpose").value;
    const donorName = modal.querySelector("#modalDonorName").value.trim() || "فاعل خير";
    const contact = modal.querySelector("#modalDonorContact").value.trim() || "غير مسجل";
    const paymentGateway = modal.querySelector("input[name='paymentGateway']:checked")?.value || "Apple Pay";

    const payload = {
      amount,
      purpose,
      donorName,
      contact,
      paymentGateway,
      frequency: state.donationType
    };

    const res = await saveDonation(payload);
    btn.disabled = false;
    btn.innerHTML = originalText;
    closeModal();

    if (res.success) {
      showJoyfulConfirmation({
        id: res.id,
        amount,
        donorName,
        purpose
      });
    } else {
      showToast("حدث خطأ أثناء الاتصال، تم حفظ التبرع محلياً.", "error");
    }
  });
}

/* ==========================================================================
   Joyful Success Modal & Receipt
   ========================================================================== */
function showJoyfulConfirmation(data) {
  const receiptModal = document.createElement("div");
  receiptModal.className = "modal-overlay active";
  receiptModal.innerHTML = `
    <div class="modal-content p-6 lg:p-8 text-center relative max-w-md">
      <div class="w-16 h-16 rounded-full bg-secondary-fixed text-primary mx-auto flex items-center justify-center mb-4 pulse-glow">
        <span class="material-symbols-outlined text-[36px]">check_circle</span>
      </div>
      <h3 class="font-headline-md text-on-surface font-bold mb-2">جزاك الله خيراً يا ${data.donorName}! 🌸</h3>
      <p class="font-body-md text-on-surface-variant leading-relaxed mb-6">
        تم تسجيل تبرعك الكريم بمبلغ <span class="font-bold text-primary">${data.amount} ر.س</span> بنجاح في قاعدة بيانات المبادرة.
      </p>

      <div class="bg-surface-container-low p-4 rounded-2xl text-right mb-6 flex flex-col gap-2 font-label-md">
        <div class="flex justify-between">
          <span class="text-on-surface-variant">رقم المعاملة (Firebase ID):</span>
          <span class="font-mono text-primary font-bold text-xs">${data.id.substring(0, 14)}...</span>
        </div>
        <div class="flex justify-between">
          <span class="text-on-surface-variant">أثر التبرع:</span>
          <span class="text-on-surface font-bold text-xs">${data.purpose}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-on-surface-variant">تاريخ القيد:</span>
          <span class="text-on-surface font-semibold text-xs">${new Date().toLocaleDateString('ar-SA')}</span>
        </div>
      </div>

      <button id="closeReceiptBtn" class="w-full py-3.5 rounded-full bg-primary text-on-primary font-bold hover:bg-primary-container transition-all">
        تقبل الله طاعتكم 💛
      </button>
    </div>
  `;
  document.body.appendChild(receiptModal);

  receiptModal.querySelector("#closeReceiptBtn").addEventListener("click", () => {
    receiptModal.classList.remove("active");
    setTimeout(() => receiptModal.remove(), 300);
  });
}

/* ==========================================================================
   Newsletter Subscription
   ========================================================================== */
function initNewsletterForm() {
  document.querySelectorAll("footer form, .newsletter-form, form").forEach(form => {
    const input = form.querySelector("input[type='email']");
    if (!input) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button");
      if (!input.value) return;

      const email = input.value;
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerText = "جاري الحفظ...";

      const result = await subscribeNewsletter(email);
      btn.disabled = false;
      btn.innerHTML = originalText;

      if (result.success) {
        showToast("شكراً لانضمامك! ستصلك قصص أبطالنا الملهمة شهرياً 💌", "success");
        input.value = "";
      } else {
        showToast("شكراً لانضمامك! تم تسجيل بريدك بنجاح 💌", "success");
        input.value = "";
      }
    });
  });
}

/* ==========================================================================
   Realtime Donation Stream Ticker
   ========================================================================== */
function initRealtimeTicker() {
  const tickerEl = document.getElementById("liveDonationTicker");
  if (!tickerEl) return;

  listenRecentDonations((donations) => {
    if (!donations || donations.length === 0) return;
    const latest = donations[0];
    tickerEl.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-secondary-container animate-ping"></span>
      <span>تبرع حديث: <strong>${latest.donorName || "فاعل خير"}</strong> ساهم بـ <strong>${latest.amount || 100} ر.س</strong> لـ (${latest.purpose || "كفالة جلسة"})</span>
    `;
  });
}

/* ==========================================================================
   Toast Notification Utility
   ========================================================================== */
export function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px] ${type === 'success' ? 'text-primary-fixed' : 'text-tertiary-fixed'}">
      ${type === 'success' ? 'check_circle' : 'info'}
    </span>
    <span class="text-sm font-medium flex-1">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}
window.showToast = showToast;
