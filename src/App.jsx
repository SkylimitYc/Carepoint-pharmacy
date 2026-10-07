import { useEffect, useMemo, useState } from "react";
import "./App.css";

/* ---------- Config ---------- */
// Apna asli number daalo (country code ke saath, bina + ya spaces ke)
const WHATSAPP_NUMBER = "91XXXXXXXXXX";
const PHONE_NUMBER = "+910000000000";
const MAX_FILE_MB = 5;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const waLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

const NAV_LINKS = [
  ["#home", "Home"],
  ["#categories", "Categories"],
  ["#products", "Products"],
  ["#services", "Services"],
  ["#about", "About"],
  ["#faq", "FAQ"],
  ["#contact", "Contact"],
];

/* ---------- Symptom guide ---------- */
const normalize = (v) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}]+/g, " ")
    .trim();

const prep = (list) => list.map(normalize);
const hasAny = (text, words) => words.some((w) => ` ${text} `.includes(` ${w} `));

const CRISIS = prep([
  "suicide", "suicidal", "self harm", "khudkushi", "marna chahta", "marna chahti",
  "जान देना", "खुदकुशी", "मरना चाहता", "मरना चाहती",
]);

const URGENT = prep([
  "chest pain", "chest mein dard", "seene mein dard", "chest tightness",
  "breathless", "breathing problem", "difficulty breathing", "saans nahi",
  "saans lene mein dikkat", "saans phool",
  "behosh", "unconscious", "seizure", "fit aa", "one side weakness", "ek side kamzor",
  "sudden severe headache", "worst headache", "confusion", "feeling confused",
  "blood in vomit", "blood in stool", "heavy bleeding", "poison", "overdose",
  "allergic reaction", "face swelling", "throat swelling",
  "सीने में दर्द", "सांस", "बेहोश", "दौरा",
]);

const RULES = [
  {
    keys: prep(["headache", "headaches", "head pain", "sir dard", "sar dard", "migraine", "सिर दर्द", "सर दर्द"]),
    title: "For a mild headache",
    text: "Rest, drink water, eat regular meals, and take a break from screens. Seek urgent care for a sudden extremely painful headache, weakness, vision or speech problems, confusion, stiff neck, or headache after a head injury. Talk to a clinician if it keeps returning or gets worse.",
    source: "https://www.nhs.uk/symptoms/headaches/",
  },
  {
    keys: prep(["body pain", "body ache", "muscle pain", "muscle ache", "joint pain", "joint ache", "back pain", "badan dard", "body mein dard", "jodo ka dard", "jodon ka dard", "बदन दर्द", "कमर दर्द"]),
    title: "For mild muscle or joint aches",
    text: "Rest the sore area, keep gently moving as you can, and drink fluids. For a minor recent strain, a wrapped cold pack for up to 20 minutes may help. Get medical advice for severe pain, a hot or swollen joint, pain after a serious injury, or symptoms that persist or worsen.",
    source: "https://www.nhs.uk/symptoms/joint-pain/",
  },
  {
    keys: prep(["fever", "temperature", "bukhar", "बुखार"]),
    title: "For a fever",
    text: "Rest and drink fluids to avoid dehydration. Contact a clinician if the fever is high, lasts more than a few days, worsens, or you have a serious long-term condition. A baby under 3 months with a temperature of 38°C or higher needs urgent medical advice.",
    source: "https://medlineplus.gov/ency/article/003090.htm",
  },
  {
    keys: prep(["cold", "cough", "coughing", "sore throat", "gala dard", "khansi", "naak band", "runny nose", "flu", "सर्दी", "खांसी"]),
    title: "For mild cold or throat symptoms",
    text: "Rest, drink fluids, and avoid close contact with others while you feel unwell. Seek medical advice if you have trouble breathing, chest pain, symptoms that become severe, or symptoms that are not improving.",
  },
  {
    keys: prep(["stomach", "pet dard", "stomach ache", "stomach pain", "diarrhea", "diarrhoea", "loose motion", "vomiting", "vomit", "ulti", "nausea", "पेट दर्द", "उल्टी"]),
    title: "For mild stomach upset",
    text: "Take small, frequent sips of water or oral rehydration solution and rest. Seek urgent care for severe or worsening pain, blood in vomit or stool, fainting, or if you cannot keep fluids down. Ask a clinician if symptoms persist.",
  },
];

function getSymptomGuidance(value) {
  const symptom = normalize(value);

  if (hasAny(symptom, CRISIS)) {
    return {
      urgent: true,
      title: "You're not alone — please reach out now",
      text: "If you are thinking about harming yourself, call 112 or Tele-MANAS (14416) right away, or go to the nearest hospital and tell someone near you.",
    };
  }
  if (hasAny(symptom, URGENT)) {
    return {
      urgent: true,
      title: "Please seek urgent medical help",
      text: "These symptoms can need immediate assessment. Call 112 (or your local ambulance number) or go to the nearest emergency department now. Do not wait for this website for medical advice.",
    };
  }
  const rule = RULES.find((r) => hasAny(symptom, r.keys));
  if (rule) return rule;

  return {
    title: "Let’s get a little more specific",
    text: "I can share basic guidance for headache, body or joint pain, fever, cold, cough, sore throat, and mild stomach upset. If your symptom is severe, getting worse, or worrying you, contact a doctor or pharmacist.",
  };
}

const SYMPTOM_SUGGESTIONS = ["Headache", "Fever", "Cough", "Body pain", "Stomach pain"];

/* ---------- Static data ---------- */
const CATEGORIES = [
  "Pain Relief", "Cold & Flu", "Vitamins & Supplements", "Personal Care",
  "Baby Care", "First Aid", "Diabetes Care", "Wellness Products",
];
const CATEGORY_ICONS = {
  "Vitamins & Supplements": "✦",
  "Baby Care": "♡",
  "First Aid": "✚",
  "Personal Care": "◌",
  "Diabetes Care": "⌁",
};

// category ab CATEGORIES list se match karti hai, taaki filter kaam kare
const PRODUCTS = [
  { name: "Vitamin C Tablets", category: "Vitamins & Supplements", price: "₹199", tag: "Wellness" },
  { name: "Daily Multivitamins", category: "Vitamins & Supplements", price: "₹349", tag: "Wellness" },
  { name: "Hand Sanitizer", category: "Personal Care", price: "₹99", tag: "OTC" },
  { name: "Digital Thermometer", category: "First Aid", price: "₹299", tag: "Essential" },
  { name: "First Aid Kit", category: "First Aid", price: "₹499", tag: "Essential" },
  { name: "ORS Sachets", category: "Wellness Products", price: "₹120", tag: "OTC" },
];

const SERVICES = [
  "Home Delivery", "Prescription Fulfilment", "Health & Wellness Products",
  "Medicine Availability Enquiry", "WhatsApp Ordering", "Pharmacist Assistance",
];

const TRUST = [
  "Genuine Product Focus", "Trusted Service Approach", "Fast Local Delivery",
  "Easy WhatsApp Ordering", "Secure Prescription Handling",
];

const FAQS = [
  { question: "Do you offer home delivery?", answer: "This demo website shows how a pharmacy can present local delivery information." },
  { question: "Can I upload my prescription?", answer: "Yes. The demo includes a prescription upload interface, but it does not actually submit or store documents." },
  { question: "Can I check medicine availability?", answer: "The pharmacy contact options can be used for availability enquiries." },
  { question: "Do you sell wellness products?", answer: "The demo displays common wellness and everyday healthcare product categories." },
  { question: "Are prescription medicines available without a prescription?", answer: "No. Prescription medicines require a valid prescription and pharmacy verification." },
];

/* ---------- App ---------- */
function App() {
  const [symptom, setSymptom] = useState("");
  const [guidance, setGuidance] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [file, setFile] = useState(null);
  const [fileMessage, setFileMessage] = useState(null); // { type: "error" | "success", text }

  // Escape se mobile menu band ho
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const visibleProducts = useMemo(
    () =>
      activeCategory === "All"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === activeCategory),
    [activeCategory]
  );

  function runGuide(text) {
    if (!text.trim()) return;
    setGuidance(getSymptomGuidance(text.trim()));
  }

  function handleSymptomSubmit(event) {
    event.preventDefault();
    runGuide(symptom);
  }

  function handleSymptomChange(event) {
    setSymptom(event.target.value);
    if (guidance) setGuidance(null);
  }

  function handleSuggestion(text) {
    setSymptom(text);
    runGuide(text);
  }

  function handleFileChange(event) {
    const selected = event.target.files?.[0];
    setFileMessage(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(selected.type)) {
      setFile(null);
      event.target.value = "";
      setFileMessage({ type: "error", text: "Please choose a JPG, PNG or PDF file." });
      return;
    }
    if (selected.size > MAX_FILE_MB * 1024 * 1024) {
      setFile(null);
      event.target.value = "";
      setFileMessage({ type: "error", text: `File is too large. Maximum size is ${MAX_FILE_MB} MB.` });
      return;
    }
    setFile(selected);
  }

  function handleUpload() {
    if (!file) {
      setFileMessage({ type: "error", text: "Select a prescription file first." });
      return;
    }
    // Demo: file kahin upload nahi hoti
    setFileMessage({
      type: "success",
      text: `"${file.name}" selected. This is a demo, so nothing was uploaded. Use WhatsApp to share it with the pharmacy.`,
    });
  }

  function chooseCategory(category) {
    setActiveCategory(category);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app">
      {/* Navbar */}
      <header className="navbar">
        <div className="container navbar-inner">
          <a className="brand" href="#home" aria-label="CarePoint Pharmacy home">
            <img className="brand-logo" src="/carepoint-mark.svg" alt="CarePoint Pharmacy logo" />
            <div>
              <h2>CarePoint Pharmacy</h2>
              <span>Trusted Care. Everyday Essentials.</span>
            </div>
          </a>

          <nav
            id="main-nav"
            className={`nav-links${menuOpen ? " open" : ""}`}
            aria-label="Main navigation"
          >
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={closeMenu}>{label}</a>
            ))}
          </nav>

          <a href={waLink()} className="nav-btn" target="_blank" rel="noreferrer">
            WhatsApp
          </a>

          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero" id="home">
          <div className="container hero-grid">
            <div className="hero-content">
              <span className="eyebrow"><i className="status-dot" /> YOUR NEIGHBORHOOD, HEALTHIER</span>

              <h1>
                Better health,
                <span> Closer to Home.</span>
              </h1>

              <p>
                A clean and convenient pharmacy experience for wellness products,
                everyday essentials, prescription fulfilment enquiries and local
                support.
              </p>

              <div className="hero-actions">
                <a href="#products" className="btn btn-primary">Shop Essentials</a>
                <a href="#prescription" className="btn btn-secondary">Upload Prescription</a>
              </div>

              <div className="hero-points">
                <span>✓ Wellness Essentials</span>
                <span>✓ Prescription Enquiries</span>
                <span>✓ Local Support</span>
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-card main-card">
                <div className="medicine-icon">✚</div>
                <h3>CarePoint Pharmacy</h3>
                <p>Thoughtful care, made simple.</p>
                <div className="hero-card-bottom">
                  <span className="avatar-stack"><b>✚</b><b>♥</b><b>+</b></span>
                  <span>
                    <strong>Care that comes closer</strong>
                    <small>Here for your everyday health</small>
                  </span>
                </div>
              </div>

              <div className="visual-card floating-card card-one"><span>Vitamins</span></div>
              <div className="visual-card floating-card card-two"><span>First Aid</span></div>
              <div className="visual-card floating-card card-three"><span>Wellness</span></div>
            </div>
          </div>
        </section>

        {/* Symptom guide */}
        <section className="ai-strip" id="health-guide" aria-label="Health guide">
          <div className="container ai-panel">
            <div className="ai-copy">
              <span className="ai-label">✦ EVERYDAY HEALTH SUPPORT</span>
              <h2>A little guidance, when you need it</h2>
              <p>
                Share a common symptom to see simple self-care tips and signs that
                mean it’s time to speak with a health professional.
              </p>
              <a href="#symptom-input" className="ai-link">Try the health guide <span>↓</span></a>
              <small>Basic information only; this guide does not diagnose or recommend treatment.</small>
            </div>

            <div className="assistant-card">
              <div className="assistant-head">
                <span className="assistant-avatar">✦</span>
                <span>
                  <strong>CarePoint Health Guide</strong>
                  <small><i className="status-dot" /> Basic symptom help</small>
                </span>
              </div>

              <div className="chat-bubble">
                Hi there! 👋 What are you feeling today? I can share basic self-care tips.
              </div>

              <div className="chip-row" aria-label="Quick symptom suggestions">
                {SYMPTOM_SUGGESTIONS.map((s) => (
                  <button type="button" key={s} className="chip" onClick={() => handleSuggestion(s)}>
                    {s}
                  </button>
                ))}
              </div>

              <form className="symptom-form" onSubmit={handleSymptomSubmit}>
                <label htmlFor="symptom-input">Type your symptom here</label>
                <div className="chat-input">
                  <input
                    id="symptom-input"
                    value={symptom}
                    onChange={handleSymptomChange}
                    placeholder="e.g. sir dard, body pain, fever"
                    maxLength={120}
                    autoComplete="off"
                  />
                  <button type="submit" aria-label="Get basic guidance" disabled={!symptom.trim()}>↑</button>
                </div>
              </form>

              <div aria-live="polite" role="status">
                {guidance && (
                  <div className={`guidance-result${guidance.urgent ? " guidance-urgent" : ""}`}>
                    <strong>{guidance.title}</strong>
                    <p>{guidance.text}</p>
                    {guidance.source && (
                      <a href={guidance.source} target="_blank" rel="noreferrer">
                        Read trusted health guidance ↗
                      </a>
                    )}
                  </div>
                )}
              </div>

              <small className="medical-note">
                General information only—not a diagnosis or treatment. Don’t enter
                personal or medical record details. For children, pregnancy, chronic
                illness, or medicines, check with a clinician or pharmacist.
              </small>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="section" id="categories">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">Explore Categories</span>
              <h2>Everyday healthcare essentials</h2>
              <p>
                Browse common wellness and pharmacy categories through this
                portfolio demo interface.
              </p>
            </div>

            <div className="card-grid categories-grid">
              {CATEGORIES.map((category) => (
                <article
                  className="category-card"
                  key={category}
                  role="button"
                  tabIndex={0}
                  onClick={() => chooseCategory(category)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      chooseCategory(category);
                    }
                  }}
                >
                  <div className="category-icon">{CATEGORY_ICONS[category] ?? "＋"}</div>
                  <h3>{category}</h3>
                  <p>Explore everyday products and wellness essentials.</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="section section-soft" id="products">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">Featured Products</span>
              <h2>Popular essentials</h2>
              <p>Demo OTC and wellness products shown for portfolio presentation.</p>
            </div>

            <div className="chip-row chip-row-center" aria-label="Filter products by category">
              {["All", ...CATEGORIES].map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`chip${activeCategory === c ? " chip-active" : ""}`}
                  aria-pressed={activeCategory === c}
                  onClick={() => setActiveCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            {visibleProducts.length > 0 ? (
              <div className="products-grid">
                {visibleProducts.map((product) => (
                  <article className="product-card" key={product.name}>
                    <div className="product-image"><span>+</span></div>
                    <div className="product-body">
                      <span className="product-tag">{product.tag}</span>
                      <h3>{product.name}</h3>
                      <p>{product.category}</p>
                      <div className="product-bottom">
                        <strong>{product.price}</strong>
                        <a
                          className="order-btn"
                          href={waLink(`Hi CarePoint, I'd like to order: ${product.name}`)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Order ${product.name} on WhatsApp`}
                        >
                          Order
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No demo products in this category yet.</p>
                <a
                  href={waLink(`Hi CarePoint, do you have products in: ${activeCategory}?`)}
                  className="btn btn-secondary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Ask on WhatsApp
                </a>
              </div>
            )}

            <p className="demo-note">
              Product names and prices shown above are demo placeholders only.
            </p>
          </div>
        </section>

        {/* Prescription */}
        <section className="section" id="prescription">
          <div className="container">
            <div className="prescription-box">
              <div className="prescription-content">
                <span className="eyebrow">Prescription Support</span>
                <h2>Upload Your Prescription</h2>
                <p>Share prescription details with the pharmacy team for fulfilment enquiries.</p>
                <div className="notice">
                  Prescription medicines are supplied only against a valid prescription.
                </div>
                <p className="small-text">
                  This demo upload interface does not submit or store medical documents.
                </p>
              </div>

              <div className="upload-card">
                <label htmlFor="prescription-file">Select prescription image or PDF</label>
                <input
                  type="file"
                  id="prescription-file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                />
                {file && <p className="file-name">Selected: {file.name}</p>}
                <div aria-live="polite" role="status">
                  {fileMessage && (
                    <p className={`file-message file-message-${fileMessage.type}`}>
                      {fileMessage.text}
                    </p>
                  )}
                </div>
                <button type="button" className="btn btn-primary full-width" onClick={handleUpload}>
                  Upload Prescription
                </button>
                <a
                  href={waLink("Hi CarePoint, I have a prescription enquiry.")}
                  className="btn btn-secondary full-width"
                  target="_blank"
                  rel="noreferrer"
                >
                  Contact Pharmacy
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="section section-soft" id="services">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">Services</span>
              <h2>Convenient pharmacy support</h2>
            </div>

            <div className="card-grid services-grid">
              {SERVICES.map((service) => (
                <article className="service-card" key={service}>
                  <div className="service-icon">✦</div>
                  <h3>{service}</h3>
                  <p>
                    Convenient support for product availability, everyday
                    essentials and pharmacy enquiries.
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">Our Service Principles</span>
              <h2>Built around convenience and trust</h2>
            </div>

            <div className="trust-grid">
              {TRUST.map((item) => (
                <div className="trust-card" key={item}>
                  <span>✓</span>
                  <h3>{item}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section className="section section-soft" id="about">
          <div className="container about-grid">
            <div>
              <span className="eyebrow">About CarePoint</span>
              <h2>A modern neighborhood pharmacy concept</h2>
              <p>
                CarePoint Pharmacy is a demo neighborhood pharmacy concept focused
                on convenient access to everyday healthcare essentials, wellness
                products, prescription fulfilment enquiries and local support.
              </p>
              <p>
                This project has been created as a portfolio demonstration for
                K&amp;P Tech Solutions.
              </p>
            </div>

            <div className="hours-card">
              <h3>Opening Hours</h3>
              <div className="hours-row">
                <span>Monday – Saturday</span>
                <strong>8:00 AM – 10:00 PM</strong>
              </div>
              <div className="hours-row">
                <span>Sunday</span>
                <strong>9:00 AM – 8:00 PM</strong>
              </div>
              <small>Demo timings for portfolio presentation.</small>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq">
          <div className="container faq-container">
            <div className="section-heading">
              <span className="eyebrow">FAQ</span>
              <h2>Frequently asked questions</h2>
            </div>

            {FAQS.map((faq) => (
              <details className="faq-item" key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="section section-soft" id="contact">
          <div className="container contact-grid">
            <div>
              <span className="eyebrow">Contact</span>
              <h2>Get in touch with CarePoint Pharmacy</h2>
              <p>
                Demo contact information is shown below and should be replaced
                with actual business details before real-world use.
              </p>

              <div className="contact-actions">
                <a href={`tel:${PHONE_NUMBER}`} className="btn btn-primary">Call</a>
                <a href={waLink()} className="btn btn-secondary" target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="contact-card">
              <div><span>Phone</span><strong>+91 XXXXX XXXXX</strong></div>
              <div><span>Email</span><strong>hello@carepointpharmacy.demo</strong></div>
              <div><span>Address</span><strong>Demo Local Market, Your City, India</strong></div>
              <div><span>Opening Hours</span><strong>Demo timings displayed above</strong></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <h3>
              <img className="footer-logo" src="/carepoint-mark.svg" alt="" />
              CarePoint Pharmacy
            </h3>
            <p>Trusted Care. Everyday Essentials.</p>
            <p className="footer-disclaimer">
              CarePoint Pharmacy is a concept/demo project created for the K&amp;P
              Tech Solutions portfolio. Business details, products, prices,
              timings and contact information shown on this website are
              placeholders unless stated otherwise.
            </p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <a href="#home">Home</a>
            <a href="#categories">Categories</a>
            <a href="#products">Products</a>
            <a href="#services">Services</a>
          </div>

          <div>
            <h4>Support</h4>
            <a href="#prescription">Prescription</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>This website does not provide medical diagnosis or treatment advice.</p>
          <p>© 2026 CarePoint Pharmacy Demo • K&amp;P Tech Solutions</p>
        </div>
      </footer>

      <a href={waLink()} className="floating-whatsapp" target="_blank" rel="noreferrer">
        WhatsApp
      </a>
    </div>
  );
}

export default App;
