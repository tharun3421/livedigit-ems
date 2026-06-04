import { useEffect, useState, useCallback, useRef } from "react";
import {
  MailIcon, SendIcon, Loader2Icon, Trash2Icon, EyeIcon,
  XIcon, ChevronDownIcon, FileTextIcon, AlertTriangleIcon,
  StarIcon, DownloadIcon, PrinterIcon,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/authContext";

// ─── Company info ─────────────────────────────────────────────────────────────
const COMPANY = {
  name:    "LiveDigit Technologies Pvt. Ltd.",
  tagline: "Empowering Digital Futures",
  address: "3rd Floor, Cyber Towers, HITEC City, Hyderabad – 500081, Telangana, India",
  address2:"Branch: Siripuram, Visakhapatnam – 530003, Andhra Pradesh, India",
  email:   "hrsupport@livedigit.in",
  website: "www.livedigit.in",
  phone:   "+91 98765 43210",
  cin:     "U72900TG2020PTC145678",
  gstin:   "36AABCL1234F1ZS",
  logo:    "/logo.png",
}

// ─── Template config ──────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    key:   "OFFER_LETTER",
    label: "Offer Letter",
    icon:  FileTextIcon,
    color: "text-green-400 bg-green-500/10 border-green-500/20",
    accentHex: "#16a34a",
    headerBg:  "#f0fdf4",
    desc:  "Formal job offer with position and terms",
    preview: (emp, custom) =>
      `Dear ${emp || "[Employee]"},\n\nWe are pleased to offer you the position discussed.\n\n${custom || "[Your custom message here]"}\n\nWarm regards,\nHR Department`,
  },
  {
    key:   "WARNING_LETTER",
    label: "Warning Letter",
    icon:  AlertTriangleIcon,
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    accentHex: "#d97706",
    headerBg:  "#fffbeb",
    desc:  "Official warning for disciplinary matters",
    preview: (emp, custom) =>
      `Dear ${emp || "[Employee]"},\n\nThis letter serves as an official warning.\n\n${custom || "[Your custom message here]"}\n\nRegards,\nHR Department`,
  },
  {
    key:   "APPRECIATION_LETTER",
    label: "Appreciation Letter",
    icon:  StarIcon,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    accentHex: "#4f46e5",
    headerBg:  "#eef2ff",
    desc:  "Recognise outstanding contributions",
    preview: (emp, custom) =>
      `Dear ${emp || "[Employee]"},\n\nWe sincerely appreciate your outstanding contribution.\n\n${custom || "[Your custom message here]"}\n\nWith appreciation,\nHR Department`,
  },
]

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })

const fmtDateLong = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })

// ─── HTML Letter Templates ────────────────────────────────────────────────────
// Each returns a full self-contained HTML string suitable for printing / PDF

const buildOfferLetterHTML = (letter, emp) => {
  const date = fmtDateLong(letter.createdAt)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${letter.subject}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:297mm;width:210mm;margin:0 auto}
  body{font-family:'Inter',sans-serif;color:#1e293b;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;flex-direction:column}
  .page{width:100%;flex:1;display:flex;flex-direction:column;overflow:hidden}
  .accent-bar{height:5px;background:linear-gradient(90deg,#15803d,#4ade80);flex-shrink:0}
  /* Header */
  .header{padding:20px 40px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #dcfce7;flex-shrink:0}
  .logo-wrap{display:flex;align-items:center;gap:12px}
  .logo{width:44px;height:44px;object-fit:contain}
  .co-name{font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-0.3px}
  .co-tag{font-size:9px;color:#16a34a;font-weight:500;letter-spacing:0.8px;text-transform:uppercase;margin-top:1px}
  .co-addr{font-size:9px;color:#64748b;margin-top:2px;line-height:1.4}
  .hdr-right{text-align:right}
  .letter-badge{display:inline-block;background:#dcfce7;color:#15803d;border:1px solid #86efac;font-size:9.5px;font-weight:700;padding:3px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.8px}
  .hdr-meta{font-size:9px;color:#94a3b8;margin-top:5px;line-height:1.6}
  /* Body */
  .body{padding:20px 40px 16px;flex:1;overflow:hidden}
  .to-block{margin-bottom:16px;padding:10px 14px;background:#f8fafc;border-left:3px solid #16a34a;border-radius:0 6px 6px 0}
  .to-label{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px}
  .to-name{font-size:13px;font-weight:700;color:#0f172a}
  .to-role{font-size:11px;color:#475569;margin-top:1px}
  .subject-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px;margin-bottom:16px}
  .subject-label{font-size:9px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.8px}
  .subject-text{font-size:12.5px;font-weight:700;color:#14532d;margin-top:2px}
  .content{font-size:12px;line-height:1.75;color:#334155}
  .content p{margin-bottom:11px}
  /* Signature */
  .sig-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;padding-top:16px;border-top:1px solid #e2e8f0}
  .sig-block .line{width:140px;height:1px;background:#cbd5e1;margin-bottom:4px}
  .sig-block .s-name{font-size:11.5px;font-weight:600;color:#0f172a}
  .sig-block .s-role{font-size:10px;color:#64748b;margin-top:1px}
  .stamp-wrap{opacity:0.18;width:64px;height:64px;border:2.5px solid #15803d;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .stamp-wrap span{font-size:7.5px;font-weight:700;color:#15803d;text-align:center;letter-spacing:0.8px;line-height:1.4}
  /* Footer */
  .footer{background:#f0fdf4;border-top:2px solid #dcfce7;padding:9px 40px;flex-shrink:0}
  .footer-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px}
  .footer-top p{font-size:9px;color:#166534;font-weight:500}
  .footer-bottom{display:flex;justify-content:space-between}
  .footer-bottom p{font-size:8.5px;color:#86a891}
  .f-bar{height:3px;background:linear-gradient(90deg,#15803d,#4ade80);border-radius:2px;margin:4px 0}
  @page{size:A4;margin:0}
  @media print{html,body{height:297mm;width:210mm}button{display:none!important}.page{page-break-after:avoid;page-break-inside:avoid}}
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="header">
    <div class="logo-wrap">
      <img src="${COMPANY.logo}" class="logo" alt="Logo" onerror="this.style.display='none'"/>
      <div>
        <div class="co-name">${COMPANY.name}</div>
        <div class="co-tag">${COMPANY.tagline}</div>
        <div class="co-addr">${COMPANY.address}</div>
      </div>
    </div>
    <div class="hdr-right">
      <div class="letter-badge">✦ Offer Letter</div>
      <div class="hdr-meta">
        Date: ${date}<br/>
        CIN: ${COMPANY.cin}<br/>
        GSTIN: ${COMPANY.gstin}
      </div>
    </div>
  </div>

  <div class="body">
    <div class="to-block">
      <div class="to-label">Addressed To</div>
      <div class="to-name">${emp?.firstName || ""} ${emp?.lastName || ""}</div>
      <div class="to-role">${emp?.position || ""}${emp?.department ? " · " + emp.department : ""}</div>
    </div>

    <div class="subject-box">
      <div class="subject-label">Subject</div>
      <div class="subject-text">${letter.subject}</div>
    </div>

    <div class="content">
      ${letter.renderedBody.split("\n\n").map(p =>
        p.trim() ? `<p>${p.replace(/\n/g,"<br/>")}</p>` : ""
      ).join("")}
    </div>

    <div class="sig-row">
      <div class="sig-block">
        <div class="line"></div>
        <div class="s-name">Authorised Signatory</div>
        <div class="s-role">HR Department · ${COMPANY.name}</div>
      </div>
      <div class="stamp-wrap">
        <span>OFFICIAL</span>
        <span>SEAL</span>
      </div>
      <div class="sig-block">
        <div class="line"></div>
        <div class="s-name">Employee Acknowledgement</div>
        <div class="s-role">Signature &amp; Date</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="f-bar"></div>
    <div class="footer-top">
      <p>${COMPANY.name} · ${COMPANY.email} · ${COMPANY.phone}</p>
      <p>${COMPANY.website}</p>
    </div>
    <div class="footer-bottom">
      <p>CIN: ${COMPANY.cin}</p>
      <p>${COMPANY.address2}</p>
      <p>GSTIN: ${COMPANY.gstin}</p>
    </div>
  </div>
</div>
</body>
</html>`
}

const buildWarningLetterHTML = (letter, emp) => {
  const date = fmtDateLong(letter.createdAt)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${letter.subject}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:297mm;width:210mm;margin:0 auto}
  body{font-family:'Inter',sans-serif;color:#1e293b;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;flex-direction:column}
  .page{width:100%;flex:1;display:flex;flex-direction:column;overflow:hidden}
  .accent-bar{height:5px;background:linear-gradient(90deg,#b45309,#fbbf24);flex-shrink:0}
  /* Side stripe */
  .stripe{position:absolute;left:0;top:0;bottom:0;width:4px;background:repeating-linear-gradient(180deg,#f59e0b 0px,#f59e0b 8px,transparent 8px,transparent 16px)}
  .header{padding:20px 40px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #fef3c7;flex-shrink:0;position:relative}
  .logo-wrap{display:flex;align-items:center;gap:12px}
  .logo{width:44px;height:44px;object-fit:contain}
  .co-name{font-size:16px;font-weight:700;color:#0f172a}
  .co-tag{font-size:9px;color:#b45309;font-weight:500;letter-spacing:0.8px;text-transform:uppercase;margin-top:1px}
  .co-addr{font-size:9px;color:#64748b;margin-top:2px;line-height:1.4}
  .hdr-right{text-align:right}
  .letter-badge{display:inline-block;background:#fffbeb;color:#b45309;border:1px solid #fcd34d;font-size:9.5px;font-weight:700;padding:3px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.8px}
  .hdr-meta{font-size:9px;color:#94a3b8;margin-top:5px;line-height:1.6}
  /* Warning banner */
  .warn-banner{background:linear-gradient(90deg,#fffbeb,#fef9ee);border:1px solid #fde68a;border-radius:6px;padding:10px 16px;margin:16px 40px 0;display:flex;align-items:center;gap:12px;flex-shrink:0}
  .warn-icon{width:28px;height:28px;background:#f59e0b;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;font-weight:900;color:#fff}
  .warn-text strong{font-size:11.5px;font-weight:700;color:#92400e;display:block}
  .warn-text span{font-size:10px;color:#b45309}
  .body{padding:14px 40px 12px;flex:1;overflow:hidden}
  .to-block{margin-bottom:14px;padding:10px 14px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 6px 6px 0}
  .to-label{font-size:9px;color:#92400e;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px}
  .to-name{font-size:13px;font-weight:700;color:#0f172a}
  .to-role{font-size:11px;color:#475569;margin-top:1px}
  .subject-line{font-size:12.5px;font-weight:700;color:#92400e;border-bottom:1px dashed #fcd34d;padding-bottom:10px;margin-bottom:14px}
  .content{font-size:12px;line-height:1.75;color:#334155}
  .content p{margin-bottom:11px}
  .ack-box{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;margin-top:14px;font-size:10.5px;color:#92400e;line-height:1.5}
  .ack-box strong{display:block;margin-bottom:2px;font-size:11px}
  .sig-row{display:flex;justify-content:space-between;margin-top:16px;padding-top:14px;border-top:1px solid #fde68a}
  .sig-block .line{width:130px;height:1px;background:#fcd34d;margin-bottom:4px}
  .sig-block .s-name{font-size:11px;font-weight:600;color:#0f172a}
  .sig-block .s-role{font-size:9.5px;color:#64748b;margin-top:1px}
  .confidential{text-align:center;margin-top:10px;font-size:9px;font-weight:700;color:#f59e0b;letter-spacing:2px;text-transform:uppercase}
  .footer{background:#fffbeb;border-top:2px solid #fef3c7;padding:9px 40px;flex-shrink:0}
  .footer-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
  .footer-top p{font-size:9px;color:#92400e;font-weight:500}
  .footer-bottom{display:flex;justify-content:space-between}
  .footer-bottom p{font-size:8.5px;color:#a8926a}
  .f-bar{height:3px;background:linear-gradient(90deg,#b45309,#fbbf24);border-radius:2px;margin:4px 0}
  @page{size:A4;margin:0}
  @media print{html,body{height:297mm;width:210mm}button{display:none!important}.page{page-break-after:avoid;page-break-inside:avoid}}
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="header">
    <div class="logo-wrap">
      <img src="${COMPANY.logo}" class="logo" alt="Logo" onerror="this.style.display='none'"/>
      <div>
        <div class="co-name">${COMPANY.name}</div>
        <div class="co-tag">${COMPANY.tagline}</div>
        <div class="co-addr">${COMPANY.address}</div>
      </div>
    </div>
    <div class="hdr-right">
      <div class="letter-badge">⚠ Warning Letter</div>
      <div class="hdr-meta">
        Date: ${date}<br/>
        CIN: ${COMPANY.cin}<br/>
        GSTIN: ${COMPANY.gstin}
      </div>
    </div>
  </div>

  <div class="warn-banner">
    <div class="warn-icon">!</div>
    <div class="warn-text">
      <strong>Official Warning Notice — Strictly Confidential</strong>
      <span>This is an official HR document. Please read carefully and acknowledge receipt.</span>
    </div>
  </div>

  <div class="body">
    <div class="to-block">
      <div class="to-label">Addressed To</div>
      <div class="to-name">${emp?.firstName || ""} ${emp?.lastName || ""}</div>
      <div class="to-role">${emp?.position || ""}${emp?.department ? " · " + emp.department : ""}</div>
    </div>

    <div class="subject-line">Subject: ${letter.subject}</div>

    <div class="content">
      ${letter.renderedBody.split("\n\n").map(p =>
        p.trim() ? `<p>${p.replace(/\n/g,"<br/>")}</p>` : ""
      ).join("")}
    </div>

    <div class="ack-box">
      <strong>Acknowledgement Required</strong>
      Please sign and return a copy within 48 hours. Failure to acknowledge does not void this notice.
    </div>

    <div class="sig-row">
      <div class="sig-block">
        <div class="line"></div>
        <div class="s-name">Authorised Signatory</div>
        <div class="s-role">HR Department · ${COMPANY.name}</div>
      </div>
      <div class="sig-block">
        <div class="line"></div>
        <div class="s-name">Employee Signature</div>
        <div class="s-role">Name &amp; Date of Acknowledgement</div>
      </div>
    </div>
    <div class="confidential">— strictly confidential —</div>
  </div>

  <div class="footer">
    <div class="f-bar"></div>
    <div class="footer-top">
      <p>${COMPANY.name} · ${COMPANY.email} · ${COMPANY.phone}</p>
      <p>CONFIDENTIAL · ${COMPANY.website}</p>
    </div>
    <div class="footer-bottom">
      <p>CIN: ${COMPANY.cin}</p>
      <p>${COMPANY.address2}</p>
      <p>GSTIN: ${COMPANY.gstin}</p>
    </div>
  </div>
</div>
</body>
</html>`
}

const buildAppreciationLetterHTML = (letter, emp) => {
  const date = fmtDateLong(letter.createdAt)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${letter.subject}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:297mm;width:210mm;margin:0 auto}
  body{font-family:'Inter',sans-serif;color:#1e293b;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;flex-direction:column}
  .page{width:100%;flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative}
  /* Corner ornaments */
  .corner-tl{position:absolute;top:0;left:0;width:80px;height:80px;background:linear-gradient(135deg,#e0e7ff 0%,transparent 65%);pointer-events:none}
  .corner-br{position:absolute;bottom:0;right:0;width:80px;height:80px;background:linear-gradient(315deg,#e0e7ff 0%,transparent 65%);pointer-events:none}
  .accent-bar{height:5px;background:linear-gradient(90deg,#3730a3,#818cf8,#c7d2fe);flex-shrink:0}
  .header{padding:20px 40px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e0e7ff;flex-shrink:0}
  .logo-wrap{display:flex;align-items:center;gap:12px}
  .logo{width:44px;height:44px;object-fit:contain}
  .co-name{font-size:16px;font-weight:700;color:#0f172a}
  .co-tag{font-size:9px;color:#4338ca;font-weight:500;letter-spacing:0.8px;text-transform:uppercase;margin-top:1px}
  .co-addr{font-size:9px;color:#64748b;margin-top:2px;line-height:1.4}
  .hdr-right{text-align:right}
  .letter-badge{display:inline-block;background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;font-size:9.5px;font-weight:700;padding:3px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.8px}
  .hdr-meta{font-size:9px;color:#94a3b8;margin-top:5px;line-height:1.6}
  /* Hero */
  .hero{background:linear-gradient(135deg,#eef2ff 0%,#f5f3ff 50%,#fff 100%);padding:16px 40px 14px;text-align:center;border-bottom:1px solid #e0e7ff;flex-shrink:0}
  .trophy{font-size:26px;display:block;margin-bottom:4px}
  .hero-title{font-family:'Playfair Display',serif;font-size:20px;color:#312e81;letter-spacing:-0.3px}
  .hero-sub{font-size:10px;color:#6366f1;margin-top:2px;letter-spacing:0.5px}
  .recipient-pill{display:inline-block;background:linear-gradient(90deg,#4338ca,#6366f1);color:#fff;font-size:11.5px;font-weight:700;padding:5px 20px;border-radius:24px;margin-top:8px;letter-spacing:0.3px}
  .stars{font-size:13px;color:#fbbf24;letter-spacing:4px;display:block;margin-top:6px}
  /* Body */
  .body{padding:16px 40px 12px;flex:1;overflow:hidden}
  .content{font-size:12px;line-height:1.75;color:#334155}
  .content p{margin-bottom:10px}
  .quote{border-left:3px solid #818cf8;padding:10px 16px;margin:12px 0;font-size:12.5px;font-style:italic;color:#4338ca;background:#eef2ff;border-radius:0 6px 6px 0}
  /* Sig */
  .sig-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px;padding-top:14px;border-top:1px solid #e0e7ff}
  .sig-block .line{width:130px;height:1px;background:#c7d2fe;margin-bottom:4px}
  .sig-block .s-name{font-size:11px;font-weight:600;color:#0f172a}
  .sig-block .s-role{font-size:9.5px;color:#64748b;margin-top:1px}
  .seal{width:58px;height:58px;border:2px solid #4338ca;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0.2}
  .seal .s{font-size:16px;color:#4338ca}
  .seal span{font-size:7px;font-weight:700;color:#4338ca;letter-spacing:0.8px;text-align:center}
  /* Footer */
  .footer{background:linear-gradient(90deg,#312e81,#4338ca);padding:9px 40px;flex-shrink:0}
  .footer-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
  .footer-top p{font-size:9px;color:rgba(255,255,255,0.8);font-weight:500}
  .footer-bottom{display:flex;justify-content:space-between}
  .footer-bottom p{font-size:8.5px;color:rgba(255,255,255,0.45)}
  @page{size:A4;margin:0}
  @media print{html,body{height:297mm;width:210mm}button{display:none!important}.page{page-break-after:avoid;page-break-inside:avoid}}
</style>
</head>
<body>
<div class="page">
  <div class="corner-tl"></div>
  <div class="corner-br"></div>
  <div class="accent-bar"></div>

  <div class="header">
    <div class="logo-wrap">
      <img src="${COMPANY.logo}" class="logo" alt="Logo" onerror="this.style.display='none'"/>
      <div>
        <div class="co-name">${COMPANY.name}</div>
        <div class="co-tag">${COMPANY.tagline}</div>
        <div class="co-addr">${COMPANY.address}</div>
      </div>
    </div>
    <div class="hdr-right">
      <div class="letter-badge">★ Appreciation Letter</div>
      <div class="hdr-meta">
        Date: ${date}<br/>
        CIN: ${COMPANY.cin}<br/>
        GSTIN: ${COMPANY.gstin}
      </div>
    </div>
  </div>

  <div class="hero">
    <span class="trophy">🏆</span>
    <div class="hero-title">Certificate of Appreciation</div>
    <div class="hero-sub">In proud recognition of outstanding performance &amp; dedication</div>
    <div class="recipient-pill">${emp?.firstName || ""} ${emp?.lastName || ""}</div>
    <span class="stars">★ ★ ★ ★ ★</span>
  </div>

  <div class="body">
    <div class="content">
      ${letter.renderedBody.split("\n\n").map((p, i) =>
        p.trim()
          ? i === 1
            ? `<div class="quote">${p.replace(/\n/g,"<br/>")}</div>`
            : `<p>${p.replace(/\n/g,"<br/>")}</p>`
          : ""
      ).join("")}
    </div>

    <div class="sig-row">
      <div class="sig-block">
        <div class="line"></div>
        <div class="s-name">Authorised Signatory</div>
        <div class="s-role">HR Department · ${COMPANY.name}</div>
      </div>
      <div class="seal"><span class="s">★</span><span>OFFICIAL</span></div>
      <div class="sig-block">
        <div class="line"></div>
        <div class="s-name">Employee Acknowledgement</div>
        <div class="s-role">Signature &amp; Date</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-top">
      <p>${COMPANY.name} · ${COMPANY.email} · ${COMPANY.phone}</p>
      <p>${COMPANY.website}</p>
    </div>
    <div class="footer-bottom">
      <p>CIN: ${COMPANY.cin}</p>
      <p>${COMPANY.address2}</p>
      <p>GSTIN: ${COMPANY.gstin}</p>
    </div>
  </div>
</div>
</body>
</html>`
}

const LETTER_HTML_BUILDERS = {
  OFFER_LETTER:         buildOfferLetterHTML,
  WARNING_LETTER:       buildWarningLetterHTML,
  APPRECIATION_LETTER:  buildAppreciationLetterHTML,
}

// ─── Download helper ──────────────────────────────────────────────────────────
const downloadLetterAsPDF = (letter, emp) => {
  const builder = LETTER_HTML_BUILDERS[letter.templateType]
  if (!builder) return

  const html = builder(letter, emp)
  const win  = window.open("", "_blank", "width=900,height=700")
  if (!win) { alert("Please allow popups to download the letter."); return }

  win.document.write(html)
  win.document.close()
  win.focus()

  // Give fonts/images a moment to load, then print
  setTimeout(() => {
    win.print()
    // win.close() — let user close after saving
  }, 800)
}

// ─── Letter detail modal ──────────────────────────────────────────────────────
const LetterModal = ({ letter, emp, onClose, allowDownload = false }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const tpl = TEMPLATES.find((t) => t.key === letter.templateType)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              {tpl?.label ?? letter.templateType}
            </p>
            <h2 className="text-sm font-semibold text-slate-100">{letter.subject}</h2>
            <p className="text-xs text-slate-500 mt-1">{fmtDate(letter.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {allowDownload && (
              <button
                onClick={() => downloadLetterAsPDF(letter, emp)}
                className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                title="Download as PDF"
              >
                <DownloadIcon className="w-3.5 h-3.5" /> Download
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body preview */}
        <div className="px-6 py-5">
          <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
            {letter.renderedBody}
          </pre>
        </div>
      </div>
    </div>
  )
}

// ─── Admin View ───────────────────────────────────────────────────────────────
const AdminLetters = () => {
  const [employees,  setEmployees]  = useState([])
  const [letters,    setLetters]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [sending,    setSending]    = useState(false)
  const [deleting,   setDeleting]   = useState(null)
  const [viewLetter, setViewLetter] = useState(null)

  const [template,   setTemplate]   = useState("")
  const [recipient,  setRecipient]  = useState("")
  const [customText, setCustomText] = useState("")
  const [empSearch,  setEmpSearch]  = useState("")
  const [empOpen,    setEmpOpen]    = useState(false)

  const selectedEmp  = employees.find((e) => e._id === recipient)
  const filteredEmps = employees.filter((e) =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(empSearch.toLowerCase())
  )
  const selectedTpl = TEMPLATES.find((t) => t.key === template)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [empRes, letRes] = await Promise.all([
        api.get("/employees"),
        api.get("/letters/all"),
      ])
      setEmployees(empRes.data.data || empRes.data || [])
      setLetters(letRes.data.data || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSend = async () => {
    if (!template || !recipient || !customText.trim()) return
    setSending(true)
    try {
      await api.post("/letters", {
        templateType:        template,
        customText:          customText.trim(),
        recipientEmployeeId: recipient,
      })
      setTemplate(""); setRecipient(""); setCustomText(""); setEmpSearch("")
      await fetchAll()
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to send letter")
    } finally { setSending(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete this letter?")) return
    setDeleting(id)
    try {
      await api.delete(`/letters/${id}`)
      setLetters((prev) => prev.filter((l) => l._id !== id))
    } catch { alert("Failed to delete") }
    finally { setDeleting(null) }
  }

  const viewLetterEmp = viewLetter
    ? employees.find((e) => e._id === viewLetter.recipientEmployeeId?._id || e._id === viewLetter.recipientEmployeeId)
    : null

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Letters</h1>
        <p className="page-subtitle">Compose and send official letters to employees</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Compose ── */}
        <div className="card p-5 sm:p-6 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <SendIcon className="w-4 h-4 text-indigo-400" /> Compose Letter
          </h2>

          {/* Template picker */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Select Template</p>
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((tpl) => {
                const Icon   = tpl.icon
                const active = template === tpl.key
                return (
                  <button
                    key={tpl.key}
                    onClick={() => setTemplate(tpl.key)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      active
                        ? `${tpl.color} border-current`
                        : "border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "" : "text-slate-500"}`} />
                    <div>
                      <p className="text-xs font-semibold">{tpl.label}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{tpl.desc}</p>
                    </div>
                    {active && <span className="ml-auto text-[10px] font-bold">Selected</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recipient */}
          <div className="relative">
            <p className="text-xs text-slate-400 mb-2">Recipient</p>
            <button
              onClick={() => setEmpOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 hover:border-slate-600 transition-colors"
            >
              <span className={selectedEmp ? "text-slate-200" : "text-slate-500"}>
                {selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : "Choose employee…"}
              </span>
              <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${empOpen ? "rotate-180" : ""}`} />
            </button>
            {empOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                <div className="p-2 border-b border-slate-800">
                  <input autoFocus type="text" placeholder="Search employee…" value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {filteredEmps.length === 0
                    ? <p className="text-xs text-slate-500 text-center py-4">No employees found</p>
                    : filteredEmps.map((e) => (
                      <button key={e._id}
                        onClick={() => { setRecipient(e._id); setEmpOpen(false); setEmpSearch("") }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-800 transition-colors ${recipient === e._id ? "bg-indigo-500/10 text-indigo-300" : "text-slate-300"}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-indigo-400">{e.firstName?.[0]}{e.lastName?.[0]}</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium">{e.firstName} {e.lastName}</p>
                          <p className="text-[10px] text-slate-500">{e.position} · {e.department}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom text */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Custom Message <span className="text-red-400">*</span></p>
            <textarea rows={5} value={customText} onChange={(e) => setCustomText(e.target.value)}
              placeholder="Write your personalised message. It will be inserted into the template…"
              className="w-full text-sm bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

          {/* Preview */}
          {selectedTpl && (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Preview</p>
              <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans leading-relaxed line-clamp-6">
                {selectedTpl.preview(
                  selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : undefined,
                  customText || undefined,
                )}
              </pre>
            </div>
          )}

          <button onClick={handleSend} disabled={!(template && recipient && customText.trim()) || sending}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            {sending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
            {sending ? "Sending…" : "Send Letter"}
          </button>
        </div>

        {/* ── Sent Letters ── */}
        <div className="card overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <MailIcon className="w-4 h-4 text-indigo-400" /> Sent Letters
            </h2>
            <span className="text-xs text-slate-500">{letters.length} total</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
              <Loader2Icon className="w-4 h-4 animate-spin" /><span className="text-sm">Loading…</span>
            </div>
          ) : letters.length === 0 ? (
            <div className="text-center py-12">
              <MailIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No letters sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1">
              {letters.map((l) => {
                const tpl = TEMPLATES.find((t) => t.key === l.templateType)
                const emp = l.recipientEmployeeId
                return (
                  <div key={l._id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-800/20 transition-colors">
                    <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${tpl?.color ?? "bg-slate-700 border-slate-600 text-slate-400"}`}>
                      {tpl ? <tpl.icon className="w-3.5 h-3.5" /> : <FileTextIcon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{l.subject}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        To: {emp?.firstName} {emp?.lastName} · {fmtDate(l.createdAt)}
                      </p>
                      <p className="text-[10px] mt-0.5">
                        {l.readAt
                          ? <span className="text-green-400">✓ Read</span>
                          : <span className="text-slate-500">Unread</span>}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setViewLetter(l)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="View">
                        <EyeIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => downloadLetterAsPDF(l, employees.find((e) => e._id === (l.recipientEmployeeId?._id || l.recipientEmployeeId)))}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-colors" title="Download PDF">
                        <DownloadIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(l._id)} disabled={deleting === l._id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40" title="Delete">
                        {deleting === l._id ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <Trash2Icon className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {viewLetter && (
        <LetterModal
          letter={viewLetter}
          emp={viewLetterEmp || viewLetter.recipientEmployeeId}
          onClose={() => setViewLetter(null)}
          allowDownload
        />
      )}
    </div>
  )
}

// ─── Employee Inbox ───────────────────────────────────────────────────────────
const EmployeeLetters = () => {
  const { user } = useAuth()
  const [letters,    setLetters]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [viewLetter, setViewLetter] = useState(null)

  const fetchLetters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get("/letters")
      setLetters(res.data.data || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLetters() }, [fetchLetters])

  const handleOpen = async (letter) => {
    setViewLetter(letter)
    if (!letter.readAt) {
      try {
        await api.patch(`/letters/${letter._id}/read`)
        setLetters((prev) =>
          prev.map((l) => l._id === letter._id ? { ...l, readAt: new Date().toISOString() } : l)
        )
      } catch { /* silent */ }
    }
  }

  const unread = letters.filter((l) => !l.readAt).length

  // Build emp object from user session for download
  const empObj = { firstName: user?.name?.split(" ")[0] || "", lastName: user?.name?.split(" ").slice(1).join(" ") || "" }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          Letters
          {unread > 0 && (
            <span className="text-sm px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold">
              {unread} new
            </span>
          )}
        </h1>
        <p className="page-subtitle">Official letters sent to you by HR</p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <MailIcon className="w-4 h-4 text-indigo-400" /> Inbox
          </h2>
          <span className="text-xs text-slate-500">{letters.length} letter{letters.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2Icon className="w-4 h-4 animate-spin" /><span className="text-sm">Loading…</span>
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-16">
            <MailIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No letters yet</p>
            <p className="text-slate-600 text-xs mt-1">Letters from HR will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {letters.map((l) => {
              const tpl   = TEMPLATES.find((t) => t.key === l.templateType)
              const isNew = !l.readAt
              return (
                <div key={l._id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors">
                  {/* Icon + unread dot */}
                  <div className="relative shrink-0 mt-1">
                    <div className={`p-2 rounded-xl border ${tpl?.color ?? "bg-slate-700 border-slate-600 text-slate-400"}`}>
                      {tpl ? <tpl.icon className="w-4 h-4" /> : <FileTextIcon className="w-4 h-4" />}
                    </div>
                    {isNew && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-slate-900" />
                    )}
                  </div>

                  <button onClick={() => handleOpen(l)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${isNew ? "font-semibold text-slate-100" : "font-medium text-slate-300"}`}>
                        {l.subject}
                      </p>
                      <span className="text-[10px] text-slate-500 shrink-0">{fmtDate(l.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {tpl?.label ?? l.templateType}
                      {isNew && <span className="ml-2 text-[10px] text-indigo-400 font-semibold">NEW</span>}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                      {l.renderedBody?.split("\n").find((ln) => ln.trim()) ?? ""}
                    </p>
                  </button>

                  {/* Action buttons */}
                  <div className="flex gap-1 shrink-0 mt-1">
                    <button onClick={() => handleOpen(l)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="View">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => downloadLetterAsPDF(l, empObj)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-colors" title="Download PDF">
                      <DownloadIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {viewLetter && (
        <LetterModal
          letter={viewLetter}
          emp={empObj}
          onClose={() => setViewLetter(null)}
          allowDownload
        />
      )}
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────
const Letters = () => {
  const { user } = useAuth()
  if (!user) return null
  return user.role === "ADMIN" ? <AdminLetters /> : <EmployeeLetters />
}

export default Letters