# CLASSIFY TECH — Privacy Policy & Data Processing Notice

**Effective Date:** October 2026 Edition  
**Platform URL:** [CLASSIFY TECH](https://classifytech.ai.studio/)  
**Compliance Standards:** Digital Personal Data Protection Act, 2023 (India) • Information Technology Act, 2000 • GDPR • CCPA • FTC 16 CFR § 255

---

## 1. Scope & Privacy-First Commitment

At **CLASSIFY TECH**, we respect your fundamental right to privacy and enforce rigorous data transparency. We believe you have a right to know what information is handled when using our site.

This Privacy Policy details our data engineering practices across our:
- **Smart Affiliate Link Generator & Shortener**
- **16-Point Smartphone Comparator**
- **Flagship Photography Showcase**
- **Tech News Aggregator & Full Story Extraction**
- **Contact & Editorial Grievance Desks**

---

## 2. Data Handling Practices for Affiliate Link Generator & Shortener

Our Smart Affiliate Link Generator is built on strict privacy-by-design engineering principles:

### 2.1. Zero User Registration & No PII
You do not need to create an account, log in, or provide your name, phone number, email address, or payment details to generate shortened affiliate links. The tool is 100% publicly accessible and anonymous.

### 2.2. What We Record in Server Storage (`shortlinks.json`)
When a short link is created, the server records only:
1. The randomized 6-character shortcode (e.g., `aB12xY`)
2. The original submitted product link
3. The verified affiliate destination URL with tracking parameters preserved
4. The retailer identifier (`amazon`, `flipkart`, `myntra`, or `meesho`)
5. Store display name
6. Creation timestamp
7. Aggregate anonymous click counter

We do **not** associate shortcodes with personal identities, IP addresses, or user profiles in our database.

### 2.3. No Cross-Site Browsing Surveillance
We do not place tracking pixels, spyware, or cross-domain tracking beacons on short links. Once a visitor is redirected to Amazon, Flipkart, Myntra, or Meesho, CLASSIFY TECH has zero visibility into what products the user views, adds to cart, or purchases on the merchant's website.

### 2.4. Ephemeral Anti-Abuse Rate-Limiting
To protect our server infrastructure from automated bot floods, brute-force attacks, and DDoS, a temporary, hashed IP counter is held in volatile server memory for 60 seconds (rate limit: 20 calls/min). This ephemeral record is automatically purged, is never saved to persistent disk, and is never used for commercial profiling.

### 2.5. Client-Side Local Storage (`localStorage`)
For user convenience, your last 5 generated links are saved in your device's browser memory under key `classify_affiliate_history`. This information lives entirely on your personal device, is never synced to any analytics server, and can be cleared instantly via the in-app "Clear All" button or by clearing your browser cache.

---

## 3. Outbound E-Commerce Merchant Cookies & Tracking

When you click on any outbound store link, short redirect link, or Universal Loot Hub deal card, you are redirected to an external retailer (Amazon India, Flipkart, Myntra, or Meesho).

- Those third-party platforms deploy their own first-party and third-party cookies (such as session cookies, cart cookies, and affiliate attribution tags) governed by their respective privacy statements.
- CLASSIFY TECH has no control over and no access to merchant tracking cookies.
- We encourage users to inspect each retailer's privacy policies when shopping.

---

## 4. Smartphone Comparator, Camera Showcase & Tech News Data Practices

- **16-Point Comparator:** Smartphone comparisons, filter queries, and custom user device additions are processed entirely in client-side browser memory (`localStorage` key `classify_custom_phones_db`). No comparison history or hardware queries are transmitted or logged on our servers.
- **Tech News:** Our tech news aggregator fetches public RSS feeds and caches articles server-side without recording reader IPs or reading patterns.

---

## 5. Contact Desk & Editorial Corrections Data

When you submit an inquiry through our Contact Form or file a specification correction via the Editorial Desk, we collect:
- Your name
- Your email address
- Topic category
- Message description

**Zero-Spam Policy:** This data is used solely to evaluate your submission, verify technical data, and reply directly to you. Your contact information is strictly never sold, rented, leased, or distributed to marketing brokers or third-party mailing lists.

---

## 6. Advertising & Behavioral Cookies Status Notice

Google AdSense, third-party behavioral advertising networks, and cross-site tracking beacons are **currently not active or integrated** on CLASSIFY TECH.

If behavioral advertising or third-party analytical cookies are integrated in the future, this privacy statement will be updated with explicit cookie consent banners and granular opt-out controls prior to activation.

---

## 7. Technical Data Security & Infrastructure Safeguards

We employ industry-standard technical measures to safeguard data against unauthorized access, loss, or alteration:
- Full HTTPS (TLS 1.3) encryption in transit
- Strict Server-Side Request Forgery (SSRF) validation filters
- Input sanitization against cross-site scripting (XSS)
- Rate-limiting barriers on all API endpoints
- Write-locked local server file storage

---

## 8. User Data Rights (DPDP Act 2023, GDPR & CCPA)

In compliance with the **Digital Personal Data Protection Act, 2023 (India)**, **IT Rules 2021**, and global standards (GDPR/CCPA), you retain the right to:
1. Confirm whether your personal contact information is processed
2. Request access to or a summary of such data
3. Request correction or updating of inaccurate data
4. Request permanent erasure of your contact submission records

---

## 9. Designated Grievance Officer & Contact Information

In compliance with the Information Technology Act, 2000 and the DPDP Act, 2023, our designated Grievance Redressal Officer is:

- **Officer / Desk:** Editorial & Compliance Desk • CLASSIFY TECH
- **Official Email:** Classifytechz@gmail.com
- **Response Timeline:** Written acknowledgment within 24–48 hours; grievance resolution within 15 working days.
