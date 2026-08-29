"use client";

import { useState } from "react";

interface Review {
  security: { score: number; issues: string[]; severity: string };
  performance: { score: number; issues: string[] };
  architecture: { score: number; adherence: number; patterns: string[] };
  maintainability: { grade: string; issues: string[] };
  suggestions: {
    type: string;
    title: string;
    description: string;
    file: string;
    before: string;
    after: string;
  }[];
}

interface Props {
  repo: { id: string; name: string; fullName: string };
  review: Review;
  filesAnalyzed: number;
  analyzedFiles: string[];
  allFiles: string[];
}

const severityColor = {
  low: "#4cd7f6",
  medium: "#ddb7ff",
  high: "#ffb4ab",
};

const gradeColor = {
  A: "#4cd7f6",
  B: "#c3c0ff",
  C: "#ddb7ff",
  D: "#ffb4ab",
};

const typeIcon = {
  security: "security",
  performance: "speed",
  architecture: "account_tree",
  maintainability: "build",
};

const typeColor = {
  security: "#ffb4ab",
  performance: "#4cd7f6",
  architecture: "#c3c0ff",
  maintainability: "#ddb7ff",
};

export default function CodeReviewClient({
  repo,
  review,
  filesAnalyzed,
  analyzedFiles,
  allFiles,
}: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>(analyzedFiles);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review>(review);
  const [currentAnalyzedFiles, setCurrentAnalyzedFiles] =
    useState<string[]>(analyzedFiles);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  function exportReport() {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const reportId = `CCR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const overallScore = Math.round(
      (currentReview.security.score + currentReview.performance.score + currentReview.architecture.score) / 3,
    );
    const riskLevel = overallScore >= 80 ? "LOW" : overallScore >= 60 ? "MEDIUM" : overallScore >= 40 ? "HIGH" : "CRITICAL";
    const riskColor = overallScore >= 80 ? "#16a34a" : overallScore >= 60 ? "#d97706" : overallScore >= 40 ? "#dc2626" : "#7f1d1d";

    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const secSeverity = currentReview.security.severity ?? "low";
    const secSevLabel = secSeverity.charAt(0).toUpperCase() + secSeverity.slice(1);

    const sevBadge = (sev: string) => {
      const colors: Record<string, string> = { critical: "#7f1d1d", high: "#dc2626", medium: "#d97706", low: "#16a34a" };
      const bgs: Record<string, string> = { critical: "#fef2f2", high: "#fef2f2", medium: "#fffbeb", low: "#f0fdf4" };
      return `<span style="display:inline-block;padding:2px 12px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${colors[sev] ?? "#64748b"};background:${bgs[sev] ?? "#f8fafc"};border:1px solid ${colors[sev] ?? "#e2e8f0"}30;">${sev}</span>`;
    };

    const findingTypeToSeverity = (type: string) => {
      if (type === "security") return "high";
      if (type === "performance") return "medium";
      return "low";
    };

    const findingTypeToImpact = (type: string) => {
      const impacts: Record<string, string> = {
        security: "Potential exposure to attacks such as XSS, CSRF, SQL injection, or authentication bypass. Exploitation could lead to unauthorized data access, session hijacking, or full system compromise.",
        performance: "Degraded application responsiveness, increased server load, and poor user experience. Under heavy traffic, affected endpoints may become unresponsive or trigger cascading failures.",
        architecture: "Increased technical debt, reduced code modularity, and difficulty scaling. Deviation from established patterns makes onboarding harder and increases risk of regression bugs.",
        maintainability: "Higher cost of future changes, increased bug density, and reduced developer productivity. Code becomes fragile and resistant to refactoring.",
      };
      return impacts[type] ?? "May affect application reliability and developer productivity.";
    };

    const findingTypeToRemediation = (type: string) => {
      const rems: Record<string, string> = {
        security: "Apply input validation and output encoding on all user-controlled data. Implement Content Security Policy (CSP) headers. Use parameterized queries for database operations. Review authentication and session management flows against OWASP Top 10 guidelines.",
        performance: "Profile the identified code paths using browser DevTools or server-side APM tools. Implement caching strategies (memoization, HTTP cache headers). Consider lazy loading, code splitting, and database query optimization.",
        architecture: "Refactor the affected modules to follow the established project patterns. Extract shared logic into reusable services or utilities. Ensure proper separation of concerns between layers (presentation, business logic, data access).",
        maintainability: "Reduce cyclomatic complexity by extracting functions. Add comprehensive JSDoc/TSDoc comments. Increase unit test coverage for critical paths. Remove dead code and consolidate duplicated logic.",
      };
      return rems[type] ?? "Review the identified code and apply best practices for the relevant domain.";
    };

    // Build findings
    const findingsHtml = currentReview.suggestions.map((s, i) => {
      const sev = findingTypeToSeverity(s.type);
      return `
      <div style="page-break-inside:avoid;margin-bottom:32px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <div style="background:#f8fafc;padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-size:12px;color:#94a3b8;font-weight:600;">FINDING #${i + 1}</span>
            <h4 style="font-size:16px;font-weight:700;color:#0f172a;margin:4px 0 0 0;">${esc(s.title)}</h4>
          </div>
          ${sevBadge(sev)}
        </div>
        <div style="padding:20px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px;">
            <tr>
              <td style="padding:6px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;color:#475569;width:140px;">Category</td>
              <td style="padding:6px 12px;border:1px solid #e2e8f0;color:#334155;text-transform:capitalize;">${s.type}</td>
              <td style="padding:6px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;color:#475569;width:140px;">Severity</td>
              <td style="padding:6px 12px;border:1px solid #e2e8f0;color:#334155;text-transform:capitalize;">${sev}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;color:#475569;">Affected File</td>
              <td colspan="3" style="padding:6px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:11px;color:#334155;">${esc(s.file)}</td>
            </tr>
          </table>

          <h5 style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:0.05em;">Description</h5>
          <p style="font-size:13px;color:#475569;line-height:1.7;margin:0 0 16px 0;">${esc(s.description)}</p>

          <h5 style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:0.05em;">Impact Assessment</h5>
          <p style="font-size:13px;color:#475569;line-height:1.7;margin:0 0 16px 0;">${findingTypeToImpact(s.type)}</p>

          ${(s.before || s.after) ? `
          <h5 style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.05em;">Evidence &amp; Proof of Concept</h5>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            ${s.before ? `<div>
              <div style="font-size:10px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#dc2626;"></span> VULNERABLE CODE
              </div>
              <pre style="background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:6px;font-size:11px;line-height:1.6;overflow-x:auto;margin:0;border-left:3px solid #dc2626;">${esc(s.before)}</pre>
            </div>` : ""}
            ${s.after ? `<div>
              <div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;"></span> REMEDIATED CODE
              </div>
              <pre style="background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:6px;font-size:11px;line-height:1.6;overflow-x:auto;margin:0;border-left:3px solid #16a34a;">${esc(s.after)}</pre>
            </div>` : ""}
          </div>` : ""}

          <h5 style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:0.05em;">Recommended Remediation</h5>
          <p style="font-size:13px;color:#475569;line-height:1.7;margin:0;">${findingTypeToRemediation(s.type)}</p>
        </div>
      </div>`;
    }).join("");

    // Summary table
    const summaryTableRows = currentReview.suggestions.map((s, i) => {
      const sev = findingTypeToSeverity(s.type);
      const sevColor: Record<string, string> = { high: "#dc2626", medium: "#d97706", low: "#16a34a" };
      return `<tr>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;color:#475569;text-align:center;">${i + 1}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;color:#0f172a;font-weight:500;">${esc(s.title)}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-transform:capitalize;color:#475569;">${s.type}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-transform:uppercase;font-weight:700;color:${sevColor[sev] ?? "#64748b"};text-align:center;">${sev}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:11px;font-family:monospace;color:#64748b;">${esc(s.file.split("/").pop() ?? s.file)}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Code Review Report - ${esc(repo.fullName)}</title>
  <style>
    @page { size: A4; margin: 20mm 18mm 25mm 18mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #1e293b; background: #fff; font-size: 13px; line-height: 1.6; }
    .page-break { page-break-after: always; }

    /* Cover Page */
    .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 90vh; text-align: center; }
    .cover-logo { font-size: 14px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #4f46e5; margin-bottom: 48px; }
    .cover h1 { font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    .cover .cover-sub { font-size: 18px; color: #64748b; font-weight: 400; margin-bottom: 40px; }
    .cover .cover-meta { font-size: 13px; color: #94a3b8; line-height: 2; }
    .cover .cover-meta strong { color: #475569; }
    .cover .risk-badge { display: inline-block; margin-top: 32px; padding: 8px 32px; border-radius: 6px; font-size: 14px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
    .confidential { font-size: 11px; color: #dc2626; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 48px; padding: 8px 24px; border: 2px solid #dc2626; border-radius: 4px; }

    /* Content */
    .content { padding: 0; }
    h2 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #4f46e5; }
    h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin: 24px 0 10px 0; }
    p { margin: 0 0 12px 0; color: #475569; line-height: 1.7; }
    .section { margin-bottom: 40px; }

    /* TOC */
    .toc a { text-decoration: none; color: #334155; font-size: 14px; display: block; padding: 8px 0; border-bottom: 1px dotted #e2e8f0; }
    .toc a:hover { color: #4f46e5; }
    .toc .toc-num { display: inline-block; width: 28px; color: #4f46e5; font-weight: 700; }

    /* Metrics */
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .metric-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
    .metric-box .m-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 6px; }
    .metric-box .m-value { font-size: 28px; font-weight: 800; }
    .metric-box .m-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }

    /* Risk Matrix */
    .risk-matrix { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .risk-matrix th, .risk-matrix td { padding: 10px 14px; border: 1px solid #e2e8f0; font-size: 12px; text-align: left; }
    .risk-matrix th { background: #f8fafc; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px; }

    .footer-bar { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover page-break">
    <div class="cover-logo">&#9670; ContextCrafter</div>
    <h1>Code Security &amp; Quality<br>Assessment Report</h1>
    <p class="cover-sub">${esc(repo.fullName)}</p>
    <div class="cover-meta">
      <strong>Report ID:</strong> ${reportId}<br>
      <strong>Date:</strong> ${dateStr}<br>
      <strong>Files Analyzed:</strong> ${currentAnalyzedFiles.length}<br>
      <strong>Total Findings:</strong> ${currentReview.suggestions.length}
    </div>
    <div class="risk-badge" style="color:${riskColor};background:${riskColor}10;border:2px solid ${riskColor};">
      Overall Risk: ${riskLevel}
    </div>
    <div class="confidential">CONFIDENTIAL</div>
  </div>

  <div class="content">

    <!-- TABLE OF CONTENTS -->
    <div class="section page-break">
      <h2>Table of Contents</h2>
      <div class="toc">
        <a href="#exec"><span class="toc-num">1.</span> Executive Summary</a>
        <a href="#scope"><span class="toc-num">2.</span> Scope of Assessment</a>
        <a href="#methodology"><span class="toc-num">3.</span> Methodology</a>
        <a href="#risk"><span class="toc-num">4.</span> Risk Classification</a>
        <a href="#summary"><span class="toc-num">5.</span> Findings Summary</a>
        <a href="#metrics"><span class="toc-num">6.</span> Detailed Metrics</a>
        <a href="#findings"><span class="toc-num">7.</span> Detailed Findings</a>
        <a href="#appendix"><span class="toc-num">8.</span> Appendix — Files Analyzed</a>
      </div>
    </div>

    <!-- 1. EXECUTIVE SUMMARY -->
    <div class="section" id="exec">
      <h2>1. Executive Summary</h2>
      <p>
        ContextCrafter performed an automated code security and quality assessment of the
        <strong>${esc(repo.fullName)}</strong> repository on <strong>${dateStr}</strong>.
        The analysis examined <strong>${currentAnalyzedFiles.length} source file${currentAnalyzedFiles.length !== 1 ? "s" : ""}</strong>
        across four key dimensions: Security, Performance, Architecture, and Maintainability.
      </p>
      <p>
        The assessment identified <strong>${currentReview.suggestions.length} finding${currentReview.suggestions.length !== 1 ? "s" : ""}</strong>
        requiring attention. The overall risk level is classified as
        <strong style="color:${riskColor};">${riskLevel}</strong> with a composite score of
        <strong>${overallScore}/100</strong>.
      </p>
      <p>
        The security analysis yielded a score of <strong>${currentReview.security.score}/100</strong>
        with <strong>${currentReview.security.issues.length}</strong> issue${currentReview.security.issues.length !== 1 ? "s" : ""} detected at
        <strong>${secSevLabel}</strong> severity.
        Performance was rated at <strong>${currentReview.performance.score}/100</strong>,
        architecture adherence at <strong>${currentReview.architecture.adherence}%</strong>,
        and maintainability received a grade of <strong>${currentReview.maintainability.grade}</strong>.
      </p>
      <p>
        This report provides detailed descriptions of each finding including impact assessments,
        evidence with code excerpts, and actionable remediation guidance. It is recommended that
        all high-severity findings be addressed before the next deployment cycle.
      </p>
    </div>

    <!-- 2. SCOPE -->
    <div class="section" id="scope">
      <h2>2. Scope of Assessment</h2>
      <table class="risk-matrix">
        <tr><th style="width:180px;">Parameter</th><th>Details</th></tr>
        <tr><td><strong>Target Repository</strong></td><td>${esc(repo.fullName)}</td></tr>
        <tr><td><strong>Assessment Type</strong></td><td>Automated Static Analysis (SAST) — AI-Assisted Code Review</td></tr>
        <tr><td><strong>Files in Scope</strong></td><td>${currentAnalyzedFiles.length} files</td></tr>
        <tr><td><strong>Analysis Date</strong></td><td>${dateStr} at ${timeStr}</td></tr>
        <tr><td><strong>Report ID</strong></td><td style="font-family:monospace;">${reportId}</td></tr>
        <tr><td><strong>Tool</strong></td><td>ContextCrafter AI Code Review Engine</td></tr>
      </table>
    </div>

    <!-- 3. METHODOLOGY -->
    <div class="section" id="methodology">
      <h2>3. Methodology</h2>
      <p>The assessment followed a systematic approach aligned with industry-standard practices:</p>
      <ol style="margin:12px 0 12px 20px;color:#475569;">
        <li style="margin-bottom:8px;"><strong>Static Code Analysis:</strong> Source files were parsed and analyzed for common vulnerability patterns including injection flaws, authentication weaknesses, and insecure data handling.</li>
        <li style="margin-bottom:8px;"><strong>Performance Profiling:</strong> Code patterns were evaluated for computational complexity, memory efficiency, unnecessary re-renders, and potential bottlenecks.</li>
        <li style="margin-bottom:8px;"><strong>Architecture Review:</strong> The codebase structure was evaluated against established design patterns including separation of concerns, dependency management, and modular architecture.</li>
        <li style="margin-bottom:8px;"><strong>Maintainability Assessment:</strong> Code quality metrics such as cyclomatic complexity, code duplication, documentation coverage, and naming conventions were analyzed.</li>
        <li style="margin-bottom:8px;"><strong>AI-Powered Analysis:</strong> Machine learning models were used to identify subtle patterns and provide context-aware recommendations beyond what rule-based tools can detect.</li>
      </ol>
    </div>

    <!-- 4. RISK CLASSIFICATION -->
    <div class="section page-break" id="risk">
      <h2>4. Risk Classification</h2>
      <p>Findings are classified according to the following severity scale:</p>
      <table class="risk-matrix">
        <tr><th>Severity</th><th>Score Range</th><th>Description</th><th>Expected Response</th></tr>
        <tr>
          <td style="color:#7f1d1d;font-weight:700;">CRITICAL</td>
          <td>0 — 39</td>
          <td>Exploitable vulnerabilities with direct, severe impact on confidentiality, integrity, or availability.</td>
          <td>Immediate remediation required. Block deployment.</td>
        </tr>
        <tr>
          <td style="color:#dc2626;font-weight:700;">HIGH</td>
          <td>40 — 59</td>
          <td>Significant security or quality issues that could be exploited under specific conditions.</td>
          <td>Remediate within the current sprint before release.</td>
        </tr>
        <tr>
          <td style="color:#d97706;font-weight:700;">MEDIUM</td>
          <td>60 — 79</td>
          <td>Issues that may degrade application quality or introduce indirect security risks.</td>
          <td>Plan remediation within 1–2 sprints.</td>
        </tr>
        <tr>
          <td style="color:#16a34a;font-weight:700;">LOW</td>
          <td>80 — 100</td>
          <td>Minor improvements or best-practice recommendations with limited immediate risk.</td>
          <td>Address during routine maintenance or refactoring.</td>
        </tr>
      </table>
    </div>

    <!-- 5. FINDINGS SUMMARY TABLE -->
    <div class="section" id="summary">
      <h2>5. Findings Summary</h2>
      ${currentReview.suggestions.length > 0 ? `
      <table class="risk-matrix" style="width:100%;">
        <tr><th style="width:40px;">#</th><th>Finding</th><th style="width:110px;">Category</th><th style="width:80px;">Severity</th><th style="width:140px;">File</th></tr>
        ${summaryTableRows}
      </table>` : `<p style="color:#16a34a;font-weight:600;">No findings were identified. The codebase passes all checks.</p>`}
    </div>

    <!-- 6. DETAILED METRICS -->
    <div class="section page-break" id="metrics">
      <h2>6. Detailed Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="m-label">Security</div>
          <div class="m-value" style="color:${severityColor[currentReview.security.severity as keyof typeof severityColor] ?? "#0891b2"};">${currentReview.security.score}</div>
          <div class="m-sub">${currentReview.security.issues.length} issue${currentReview.security.issues.length !== 1 ? "s" : ""}</div>
        </div>
        <div class="metric-box">
          <div class="m-label">Performance</div>
          <div class="m-value" style="color:#0891b2;">${currentReview.performance.score}</div>
          <div class="m-sub">${currentReview.performance.issues.length} issue${currentReview.performance.issues.length !== 1 ? "s" : ""}</div>
        </div>
        <div class="metric-box">
          <div class="m-label">Architecture</div>
          <div class="m-value" style="color:#4f46e5;">${currentReview.architecture.adherence}%</div>
          <div class="m-sub">Adherence</div>
        </div>
        <div class="metric-box">
          <div class="m-label">Maintainability</div>
          <div class="m-value" style="color:${gradeColor[currentReview.maintainability.grade as keyof typeof gradeColor] ?? "#9333ea"};">${currentReview.maintainability.grade}</div>
          <div class="m-sub">Grade</div>
        </div>
      </div>

      <h3>6.1 Security Issues</h3>
      <ul style="margin:8px 0 16px 20px;color:#475569;">
        ${currentReview.security.issues.length > 0 ? currentReview.security.issues.map((iss) => `<li style="margin-bottom:4px;">${esc(iss)}</li>`).join("") : `<li style="color:#16a34a;">No security issues detected</li>`}
      </ul>

      <h3>6.2 Performance Issues</h3>
      <ul style="margin:8px 0 16px 20px;color:#475569;">
        ${currentReview.performance.issues.length > 0 ? currentReview.performance.issues.map((iss) => `<li style="margin-bottom:4px;">${esc(iss)}</li>`).join("") : `<li style="color:#16a34a;">No performance issues detected</li>`}
      </ul>

      <h3>6.3 Architecture Patterns Detected</h3>
      <ul style="margin:8px 0 16px 20px;color:#475569;">
        ${currentReview.architecture.patterns.map((p) => `<li style="margin-bottom:4px;">${esc(p)}</li>`).join("")}
      </ul>

      <h3>6.4 Maintainability Issues</h3>
      <ul style="margin:8px 0 16px 20px;color:#475569;">
        ${currentReview.maintainability.issues.length > 0 ? currentReview.maintainability.issues.map((iss) => `<li style="margin-bottom:4px;">${esc(iss)}</li>`).join("") : `<li style="color:#16a34a;">Good maintainability</li>`}
      </ul>
    </div>

    <!-- 7. DETAILED FINDINGS -->
    <div class="section" id="findings">
      <h2>7. Detailed Findings</h2>
      ${currentReview.suggestions.length > 0 ? findingsHtml : `<p style="color:#16a34a;font-weight:600;">No actionable findings. The analyzed code meets all quality and security thresholds.</p>`}
    </div>

    <!-- 8. APPENDIX -->
    <div class="section page-break" id="appendix">
      <h2>8. Appendix — Files Analyzed</h2>
      <p>The following ${currentAnalyzedFiles.length} file${currentAnalyzedFiles.length !== 1 ? "s were" : " was"} included in this assessment:</p>
      <table class="risk-matrix" style="margin-top:12px;">
        <tr><th style="width:40px;">#</th><th>File Path</th></tr>
        ${currentAnalyzedFiles.map((f, i) => `<tr><td style="text-align:center;font-size:12px;color:#94a3b8;">${i + 1}</td><td style="font-family:monospace;font-size:11px;color:#334155;">${esc(f)}</td></tr>`).join("")}
      </table>
    </div>

    <!-- FOOTER -->
    <div class="footer-bar">
      <span>CONFIDENTIAL — ${esc(repo.fullName)}</span>
      <span>Report ${reportId} — ${dateStr}</span>
      <span>Generated by ContextCrafter</span>
    </div>

  </div>
</body>
</html>`;

    // Open in new window and trigger print (Save as PDF)
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  async function reanalyze() {
    if (selectedFiles.length === 0) return;
    setAnalyzing(true);

    try {
      const res = await fetch(`/api/repos/${repo.id}/code-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: selectedFiles }),
      });

      const data = await res.json();

      if (data.review) {
        setCurrentReview(data.review);
        setCurrentAnalyzedFiles(selectedFiles);
        setShowSelector(false);
      }
    } catch {
      console.error("Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }
  if (!repo)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant">Repository not found</p>
      </div>
    );
  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="font-code-md text-[14px] font-medium text-primary bg-primary-container/10 px-2 py-0.5 rounded border border-primary/20">
              AI Review
            </span>
            <h1 className="font-headline-lg text-[32px] leading-10 tracking-[-0.01em] font-bold text-on-surface">
              {repo.fullName}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant font-body-sm text-[14px]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                folder
              </span>
              {repo.fullName}
            </span>
            <span>•</span>
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-tertiary">
                <span className="material-symbols-outlined text-[16px]">
                  description
                </span>
                {currentAnalyzedFiles.length} files analyzed
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentAnalyzedFiles.map((f) => (
                  <span
                    key={f}
                    className="text-[11px] px-2 py-0.5 rounded"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      background: "rgba(76,215,246,0.1)",
                      border: "1px solid rgba(76,215,246,0.2)",
                      color: "#4cd7f6",
                    }}
                  >
                    {f.split("/").pop()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportReport} className="glass-panel font-label-xs text-[12px] font-semibold tracking-wider text-on-surface hover:bg-white/5 px-4 py-2 rounded-md cursor-pointer transition-colors border border-outline-variant/50">
            Export Report
          </button>
          <button
            onClick={() => setShowSelector(true)}
            className="bg-primary-container text-on-primary-container font-label-xs text-[12px] font-semibold tracking-wider px-4 py-2 rounded-md border-t border-white/20 cursor-pointer hover:brightness-110 transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]"
          >
            Choose Files
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Security */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-label-xs text-[12px] font-semibold tracking-wider text-on-surface-variant uppercase">
              Security
            </span>
            <span
              className="material-symbols-outlined text-error"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span
              className="font-headline-lg-mobile text-[24px] font-bold"
              style={{
                color:
                  severityColor[
                    currentReview.security
                      .severity as keyof typeof severityColor
                  ] ?? "#4cd7f6",
              }}
            >
              {currentReview.security.score}/100
            </span>
            <span className="font-body-sm text-[14px] text-on-surface-variant">
              {currentReview.security.issues.length} issue
              {currentReview.security.issues.length !== 1 ? "s" : ""} detected
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 relative z-10 flex flex-col gap-2">
            {currentReview.security.issues.slice(0, 2).map((issue, i) => (
              <span
                key={i}
                className="font-label-xs text-[12px] font-semibold px-2 py-1 rounded inline-flex items-center gap-1"
                style={{
                  background: "rgba(255,180,171,0.1)",
                  border: "1px solid rgba(255,180,171,0.3)",
                  color: "#ffb4ab",
                }}
              >
                <span className="material-symbols-outlined text-[14px]">
                  warning
                </span>
                {issue}
              </span>
            ))}
          </div>
        </div>

        {/* Performance */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-label-xs text-[12px] font-semibold tracking-wider text-on-surface-variant uppercase">
              Performance
            </span>
            <span
              className="material-symbols-outlined text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              speed
            </span>
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="font-headline-lg-mobile text-[24px] font-bold text-tertiary">
              {currentReview.performance.score}/100
            </span>
            <span className="font-body-sm text-[14px] text-on-surface-variant">
              {currentReview.performance.issues[0] ?? "No issues found"}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 relative z-10">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-tertiary rounded-full transition-all duration-700"
                style={{ width: `${currentReview.performance.score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Architecture */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-label-xs text-[12px] font-semibold tracking-wider text-on-surface-variant uppercase">
              Architecture
            </span>
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_tree
            </span>
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="font-headline-lg-mobile text-[24px] font-bold text-primary">
              {currentReview.architecture.adherence}%
            </span>
            <span className="font-body-sm text-[14px] text-on-surface-variant">
              Pattern Adherence
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 relative z-10 flex flex-wrap gap-2">
            {currentReview.architecture.patterns.slice(0, 3).map((p) => (
              <span
                key={p}
                className="font-code-md text-[10px] text-outline px-1.5 py-0.5 rounded bg-surface border border-outline-variant/30"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Maintainability */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-label-xs text-[12px] font-semibold tracking-wider text-on-surface-variant uppercase">
              Maintainability
            </span>
            <span
              className="material-symbols-outlined text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              build
            </span>
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-baseline gap-2">
              <span
                className="font-headline-lg-mobile text-[24px] font-bold"
                style={{
                  color:
                    gradeColor[
                      currentReview.maintainability
                        .grade as keyof typeof gradeColor
                    ] ?? "#ddb7ff",
                }}
              >
                {currentReview.maintainability.grade}
              </span>
              <span className="font-body-sm text-[14px] text-on-surface-variant">
                Grade
              </span>
            </div>
            <span className="font-body-sm text-[14px] text-on-surface-variant">
              {currentReview.maintainability.issues[0] ??
                "Good maintainability"}
            </span>
          </div>
          {currentReview.maintainability.issues.length > 1 && (
            <div className="mt-4 pt-3 border-t border-white/5 relative z-10">
              <span className="font-label-xs text-[12px] font-semibold tracking-wider text-on-surface-variant">
                {currentReview.maintainability.issues.length} issues found
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-[0_0_20px_0_rgba(79,70,229,0.15)] border-primary/30">
        <div className="bg-surface-container-high/80 px-6 py-4 border-b border-white/10 flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="material-symbols-outlined text-primary text-[18px]">
                auto_awesome
              </span>
            </div>
            <h2 className="font-headline-lg-mobile text-[24px] font-semibold text-on-surface">
              AI Recommendations
            </h2>
          </div>
          <span className="font-label-xs text-[12px] font-semibold tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
            {currentReview.suggestions.length} Suggestions
          </span>
        </div>

        <div className="p-6 flex flex-col gap-8">
          {currentReview.suggestions.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">
                check_circle
              </span>
              <p
                className="text-on-surface-variant mt-2"
                style={{ fontFamily: "Inter, sans-serif", fontSize: 14 }}
              >
                No suggestions — code looks good!
              </p>
            </div>
          ) : (
            currentReview.suggestions.map((s, i) => (
              <div key={i}>
                {i > 0 && (
                  <hr className="border-white/5 border-t w-full mb-8" />
                )}
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="material-symbols-outlined mt-0.5 text-[20px]"
                      style={{
                        color:
                          typeColor[s.type as keyof typeof typeColor] ??
                          "#c3c0ff",
                      }}
                    >
                      {typeIcon[s.type as keyof typeof typeIcon] ?? "lightbulb"}
                    </span>
                    <div>
                      <h3 className="font-body-md text-[16px] font-semibold text-on-surface">
                        {s.title}
                      </h3>
                      <p className="font-body-sm text-[14px] text-on-surface-variant mt-1">
                        {s.description}
                      </p>
                      <p className="font-code-md text-[11px] text-on-surface-variant/60 mt-1">
                        {s.file}
                      </p>
                    </div>
                  </div>

                  {(s.before || s.after) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                      {/* Before */}
                      <div className="bg-[#0d152a] rounded-lg overflow-hidden flex flex-col border border-error/20">
                        <div className="bg-error/10 px-4 py-2 border-b border-error/20">
                          <span className="font-code-md text-[12px] text-error">
                            Before
                          </span>
                        </div>
                        <div className="p-4 overflow-x-auto">
                          <pre
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: 13,
                              color: "#c7c4d8",
                              lineHeight: "22px",
                            }}
                          >
                            {s.before}
                          </pre>
                        </div>
                      </div>

                      {/* After */}
                      <div className="bg-[#0d152a] rounded-lg overflow-hidden flex flex-col border border-tertiary/20">
                        <div className="bg-tertiary/10 px-4 py-2 border-b border-tertiary/20 flex items-center justify-between">
                          <span className="font-code-md text-[12px] text-tertiary">
                            AI Suggested
                          </span>
                          <button
                            onClick={() => handleCopy(s.after, i)}
                            className="font-label-xs text-[10px] font-semibold text-tertiary hover:text-on-surface transition-colors cursor-pointer"
                          >
                            {copiedIndex === i ? "Copied!" : "Copy Fix"}
                          </button>
                        </div>
                        <div className="p-4 overflow-x-auto">
                          <pre
                            style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: 13,
                              color: "#c7c4d8",
                              lineHeight: "22px",
                            }}
                          >
                            {s.after}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {showSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div
            className="w-full max-w-lg rounded-xl overflow-hidden"
            style={{
              background: "rgba(17,25,51,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#dae2fd",
                }}
              >
                Select Files to Analyze
              </h3>
              <button
                onClick={() => setShowSelector(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* File List */}
            <div className="overflow-y-auto max-h-80 p-2">
              {allFiles.map((file) => (
                <div
                  key={file}
                  onClick={() =>
                    setSelectedFiles((prev) =>
                      prev.includes(file)
                        ? prev.filter((f) => f !== file)
                        : [...prev, file],
                    )
                  }
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                  style={{
                    background: selectedFiles.includes(file)
                      ? "rgba(79,70,229,0.1)"
                      : "transparent",
                    border: selectedFiles.includes(file)
                      ? "1px solid rgba(79,70,229,0.3)"
                      : "1px solid transparent",
                    marginBottom: 4,
                  }}
                >
                  {/* Checkbox */}
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                    style={{
                      background: selectedFiles.includes(file)
                        ? "#4f46e5"
                        : "transparent",
                      border: selectedFiles.includes(file)
                        ? "none"
                        : "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {selectedFiles.includes(file) && (
                      <span
                        className="material-symbols-outlined text-white"
                        style={{ fontSize: 12 }}
                      >
                        check
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 12,
                      color: "#dae2fd",
                    }}
                  >
                    {file}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  color: "#918fa1",
                }}
              >
                {selectedFiles.length} files selected
              </span>
              <button
                onClick={reanalyze}
                disabled={selectedFiles.length === 0 || analyzing}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-40"
                style={{
                  background: "#4f46e5",
                  color: "#dad7ff",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {analyzing ? "Analyzing..." : "Analyze Selected"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
