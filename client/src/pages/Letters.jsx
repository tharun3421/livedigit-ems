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
  name:    "LiveDigit.in",
  address: "Visakhapatnam & Hyderabad, India",
  email:   "hrsupport@livedigit.in",
  website: "www.livedigit.in",
  phone:   "+91 98765 43210",
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
  const tpl = TEMPLATES[0]
  const date = fmtDateLong(letter.createdAt)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${letter.subject}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;position:relative;overflow:hidden}
  /* Header accent bar */
  .accent-bar{height:6px;background:linear-gradient(90deg,#16a34a,#4ade80)}
  /* Header */
  .header{padding:32px 48px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0}
  .logo-wrap{display:flex;align-items:center;gap:14px}
  .logo{width:48px;height:48px;object-fit:contain}
  .company-name{font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.5px}
  .company-sub{font-size:11px;color:#64748b;margin-top:2px}
  .header-right{text-align:right}
  .letter-type{display:inline-block;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;font-size:11px;font-weight:600;padding:4px 14px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase}
  .ref-date{font-size:11px;color:#94a3b8;margin-top:6px}
  /* Body */
  .body{padding:40px 48px}
  .address-block{margin-bottom:32px}
  .address-block p{font-size:13px;line-height:1.7;color:#334155}
  .address-block .name{font-size:14px;font-weight:600;color:#0f172a}
  /* Highlight box */
  .highlight{background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;font-size:13px;color:#166534}
  .highlight strong{font-size:14px;color:#14532d}
  /* Content */
  .content{font-size:13.5px;line-height:1.85;color:#334155}
  .content p{margin-bottom:16px}
  /* Signature */
  .sig-section{margin-top:48px;display:flex;justify-content:space-between;align-items:flex-end}
  .sig-left .sig-line{width:180px;height:1px;background:#cbd5e1;margin-bottom:6px}
  .sig-left p{font-size:12px;color:#64748b}
  .sig-left .sig-name{font-size:14px;font-weight:600;color:#0f172a;margin-bottom:2px}
  .stamp{width:80px;height:80px;border:3px solid #16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0.25}
  .stamp span{font-size:10px;font-weight:700;color:#16a34a;text-align:center;transform:rotate(-15deg);letter-spacing:1px}
  /* Footer */
  .footer{position:absolute;bottom:0;left:0;right:0;background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 48px;display:flex;align-items:center;justify-content:space-between}
  .footer p{font-size:10px;color:#94a3b8}
  .footer-accent{width:40px;height:3px;background:linear-gradient(90deg,#16a34a,#4ade80);border-radius:2px}
  @media print{body{background:#fff}.page{box-shadow:none;margin:0;width:100%}button{display:none!important}}
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="header">
    <div class="logo-wrap">
      <img src="${COMPANY.logo}" class="logo" alt="Logo" onerror="this.style.display='none'"/>
      <div>
        <div class="company-name">${COMPANY.name}</div>
        <div class="company-sub">${COMPANY.address}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="letter-type">Offer Letter</div>
      <div class="ref-date">Date: ${date}</div>
    </div>
  </div>

  <div class="body">
    <div class="address-block">
      <p class="name">${emp?.firstName || ""} ${emp?.lastName || ""}</p>
      <p>${emp?.position || ""}${emp?.department ? " · " + emp.department : ""}</p>
    </div>

    <div class="highlight">
      <strong>Subject: ${letter.subject}</strong>
    </div>

    <div class="content">
      ${letter.renderedBody.split("\n\n").map(p =>
        p.trim() ? `<p>${p.replace(/\n/g, "<br/>")}</p>` : ""
      ).join("")}
    </div>

    <div class="sig-section">
      <div class="sig-left">
        <div class="sig-line"></div>
        <p class="sig-name">Authorised Signatory</p>
        <p>HR Department</p>
        <p>${COMPANY.name}</p>
      </div>
      <div class="stamp"><span>OFFICIAL</span></div>
    </div>
  </div>

  <div class="footer">
    <p>${COMPANY.name} · ${COMPANY.email} · ${COMPANY.phone}</p>
    <div class="footer-accent"></div>
    <p>${COMPANY.website}</p>
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
  body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;position:relative;overflow:hidden}
  .accent-bar{height:6px;background:linear-gradient(90deg,#b45309,#fbbf24)}
  .header{padding:32px 48px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #fef3c7}
  .logo-wrap{display:flex;align-items:center;gap:14px}
  .logo{width:48px;height:48px;object-fit:contain}
  .company-name{font-size:22px;font-weight:700;color:#0f172a}
  .company-sub{font-size:11px;color:#64748b;margin-top:2px}
  .header-right{text-align:right}
  .letter-type{display:inline-block;background:#fffbeb;color:#b45309;border:1px solid #fcd34d;font-size:11px;font-weight:600;padding:4px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px}
  .ref-date{font-size:11px;color:#94a3b8;margin-top:6px}
  /* Warning banner */
  .warning-banner{background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 20px;margin:24px 0;display:flex;align-items:center;gap:12px}
  .warn-icon{width:32px;height:32px;background:#f59e0b;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .warn-icon span{color:#fff;font-size:16px;font-weight:700}
  .warn-text strong{font-size:13px;font-weight:700;color:#92400e;display:block}
  .warn-text span{font-size:12px;color:#b45309}
  .body{padding:40px 48px 100px}
  .address-block{margin-bottom:28px}
  .address-block p{font-size:13px;line-height:1.7;color:#334155}
  .address-block .name{font-size:14px;font-weight:600;color:#0f172a}
  .subject-line{font-size:14px;font-weight:600;color:#92400e;margin-bottom:24px;padding-bottom:12px;border-bottom:1px dashed #fcd34d}
  .content{font-size:13.5px;line-height:1.85;color:#334155}
  .content p{margin-bottom:16px}
  .ack-box{background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-top:32px;font-size:12px;color:#92400e}
  .ack-box strong{display:block;margin-bottom:4px}
  .sig-section{margin-top:40px;display:flex;justify-content:space-between}
  .sig-block .sig-line{width:160px;height:1px;background:#cbd5e1;margin-bottom:6px}
  .sig-block p{font-size:12px;color:#64748b}
  .sig-block .sig-name{font-size:13px;font-weight:600;color:#0f172a;margin-bottom:2px}
  .footer{position:absolute;bottom:0;left:0;right:0;background:#fffbeb;border-top:2px solid #fef3c7;padding:14px 48px;display:flex;justify-content:space-between;align-items:center}
  .footer p{font-size:10px;color:#92400e}
  @media print{body{background:#fff}.page{box-shadow:none;width:100%}}
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="header">
    <div class="logo-wrap">
      <img src="${COMPANY.logo}" class="logo" alt="Logo" onerror="this.style.display='none'"/>
      <div>
        <div class="company-name">${COMPANY.name}</div>
        <div class="company-sub">${COMPANY.address}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="letter-type">⚠ Warning Letter</div>
      <div class="ref-date">Date: ${date}</div>
    </div>
  </div>

  <div class="body">
    <div class="address-block">
      <p class="name">${emp?.firstName || ""} ${emp?.lastName || ""}</p>
      <p>${emp?.position || ""}${emp?.department ? " · " + emp.department : ""}</p>
    </div>

    <div class="warning-banner">
      <div class="warn-icon"><span>!</span></div>
      <div class="warn-text">
        <strong>Official Warning Notice</strong>
        <span>This letter is an official record. Please read carefully.</span>
      </div>
    </div>

    <div class="subject-line">Subject: ${letter.subject}</div>

    <div class="content">
      ${letter.renderedBody.split("\n\n").map(p =>
        p.trim() ? `<p>${p.replace(/\n/g, "<br/>")}</p>` : ""
      ).join("")}
    </div>

    <div class="ack-box">
      <strong>Acknowledgement Required</strong>
      Please sign and return a copy of this letter within 48 hours to confirm receipt.
    </div>

    <div class="sig-section">
      <div class="sig-block">
        <div class="sig-line"></div>
        <p class="sig-name">Authorised Signatory</p>
        <p>HR Department · ${COMPANY.name}</p>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <p class="sig-name">Employee Signature</p>
        <p>Date of Acknowledgement</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>${COMPANY.name} · ${COMPANY.email}</p>
    <p>STRICTLY CONFIDENTIAL · ${COMPANY.website}</p>
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;position:relative;overflow:hidden}
  /* Decorative corner */
  .corner-tl{position:absolute;top:0;left:0;width:120px;height:120px;background:linear-gradient(135deg,#eef2ff 0%,transparent 60%)}
  .corner-br{position:absolute;bottom:0;right:0;width:120px;height:120px;background:linear-gradient(315deg,#eef2ff 0%,transparent 60%)}
  .accent-bar{height:6px;background:linear-gradient(90deg,#4338ca,#818cf8,#c7d2fe)}
  .header{padding:28px 48px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e0e7ff}
  .logo-wrap{display:flex;align-items:center;gap:14px}
  .logo{width:48px;height:48px;object-fit:contain}
  .company-name{font-size:22px;font-weight:700;color:#0f172a}
  .company-sub{font-size:11px;color:#64748b;margin-top:2px}
  .header-right{text-align:right}
  .letter-type{display:inline-block;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;font-size:11px;font-weight:600;padding:4px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px}
  .ref-date{font-size:11px;color:#94a3b8;margin-top:6px}
  /* Hero section */
  .hero{text-align:center;padding:36px 48px 8px;background:linear-gradient(180deg,#eef2ff 0%,#fff 100%)}
  .hero-icon{font-size:40px;display:block;margin-bottom:8px}
  .hero-title{font-family:'Playfair Display',serif;font-size:28px;color:#312e81;letter-spacing:-0.5px}
  .hero-sub{font-size:13px;color:#6366f1;margin-top:4px}
  .recipient-badge{display:inline-block;background:#4338ca;color:#fff;font-size:13px;font-weight:600;padding:8px 24px;border-radius:32px;margin-top:20px;letter-spacing:0.3px}
  /* Stars decoration */
  .stars{color:#fbbf24;font-size:16px;letter-spacing:4px;display:block;margin:16px 0 0}
  /* Body */
  .body{padding:32px 48px 100px}
  .content{font-size:13.5px;line-height:1.9;color:#334155}
  .content p{margin-bottom:16px}
  /* Quote highlight */
  .quote{border-left:4px solid #818cf8;padding:16px 24px;margin:24px 0;font-size:15px;font-style:italic;color:#4338ca;background:#eef2ff;border-radius:0 8px 8px 0}
  /* Signature */
  .sig-section{margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end}
  .sig-left .sig-line{width:180px;height:1px;background:#c7d2fe;margin-bottom:6px}
  .sig-left p{font-size:12px;color:#64748b}
  .sig-left .sig-name{font-size:14px;font-weight:600;color:#0f172a;margin-bottom:2px}
  .seal{width:80px;height:80px;border:3px solid #4338ca;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0.2}
  .seal span{font-size:9px;font-weight:700;color:#4338ca;text-align:center;letter-spacing:1px}
  .seal .star{font-size:16px;color:#4338ca}
  /* Footer */
  .footer{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(90deg,#312e81,#4338ca);padding:14px 48px;display:flex;justify-content:space-between;align-items:center}
  .footer p{font-size:10px;color:rgba(255,255,255,0.7)}
  @media print{body{background:#fff}.page{box-shadow:none;width:100%}}
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
        <div class="company-name">${COMPANY.name}</div>
        <div class="company-sub">${COMPANY.address}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="letter-type">★ Appreciation Letter</div>
      <div class="ref-date">Date: ${date}</div>
    </div>
  </div>

  <div class="hero">
    <span class="hero-icon">🏆</span>
    <div class="hero-title">Certificate of Appreciation</div>
    <div class="hero-sub">In recognition of outstanding performance</div>
    <div class="recipient-badge">${emp?.firstName || ""} ${emp?.lastName || ""}</div>
    <span class="stars">★ ★ ★ ★ ★</span>
  </div>

  <div class="body">
    <div class="content">
      ${letter.renderedBody.split("\n\n").map((p, i) =>
        p.trim()
          ? i === 1
            ? `<div class="quote">${p.replace(/\n/g, "<br/>")}</div>`
            : `<p>${p.replace(/\n/g, "<br/>")}</p>`
          : ""
      ).join("")}
    </div>

    <div class="sig-section">
      <div class="sig-left">
        <div class="sig-line"></div>
        <p class="sig-name">Authorised Signatory</p>
        <p>HR Department</p>
        <p>${COMPANY.name}</p>
      </div>
      <div class="seal">
        <span class="star">★</span>
        <span>LIVEDIGIT</span>
        <span>OFFICIAL</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>${COMPANY.name} · ${COMPANY.email}</p>
    <p>${COMPANY.website} · ${COMPANY.phone}</p>
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