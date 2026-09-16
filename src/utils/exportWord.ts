import { saveAs } from 'file-saver';
import { TaskItem } from '../types';
import { getCurrentReportDateTime, formatDateToDisplay } from './dateUtils';
import { AiRiskAnalysisResponse } from '../components/AiRisksAndResolutionsView';

/**
 * Exports the Live AI Audit Report directly to Microsoft Word (.doc) with
 * complete CBE styling, executive summary, risk breakdown tables, and preventative recommendations.
 */
export function exportAiAuditToWord(
  analysisData: AiRiskAnalysisResponse,
  tasks: TaskItem[],
  asOfDate: string,
  customFileName?: string
) {
  const reportGen = getCurrentReportDateTime();
  const totalRisks = analysisData.identifiedRisks.length;
  const criticalCount = analysisData.criticalHiddenCount || analysisData.identifiedRisks.filter(r => r.severity === 'Critical').length;
  const highCount = analysisData.highHiddenCount || analysisData.identifiedRisks.filter(r => r.severity === 'High').length;
  const mediumCount = totalRisks - criticalCount - highCount;
  const totalPreventedDays = analysisData.identifiedRisks.reduce((acc, r) => acc + (r.estimatedDelayExposureDays || 0), 0);

  const fileName = customFileName || `CBE_Live_AI_Audit_Report_${asOfDate}_${reportGen.fileTimestamp}.doc`;

  // Severity color helper for Word HTML
  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'background-color: #ffe4e6; color: #9f1239; border: 1px solid #fda4af; font-weight: bold;';
      case 'High':
        return 'background-color: #fef3c7; color: #92400e; border: 1px solid #fcd34d; font-weight: bold;';
      case 'Medium':
        return 'background-color: #e0f2fe; color: #075985; border: 1px solid #7dd3fc; font-weight: bold;';
      default:
        return 'background-color: #f1f5f9; color: #334155;';
    }
  };

  const getRiskIndexStyle = (idx: string) => {
    switch (idx) {
      case 'Severe':
        return 'background-color: #991b1b; color: #ffffff;';
      case 'Elevated':
        return 'background-color: #b45309; color: #ffffff;';
      case 'Moderate':
        return 'background-color: #0369a1; color: #ffffff;';
      default:
        return 'background-color: #047857; color: #ffffff;';
    }
  };

  // Build Word MSO HTML structure
  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>CBE Live AI Audit Report</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: 8.5in 11.0in;
      margin: 1.0in 1.0in 1.0in 1.0in;
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
    }
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 20pt;
      color: #701a75;
      margin-bottom: 4pt;
      font-weight: 800;
    }
    h2 {
      font-size: 14pt;
      color: #95288e;
      border-bottom: 2pt solid #95288e;
      padding-bottom: 4pt;
      margin-top: 18pt;
      margin-bottom: 8pt;
    }
    h3 {
      font-size: 12pt;
      color: #1e293b;
      margin-top: 12pt;
      margin-bottom: 4pt;
    }
    p {
      margin: 0 0 6pt 0;
    }
    .header-box {
      background-color: #fdf4ff;
      border: 1.5pt solid #d667cf;
      padding: 14pt;
      margin-bottom: 16pt;
      border-radius: 6pt;
    }
    .kpi-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16pt;
    }
    .kpi-card {
      border: 1pt solid #cbd5e1;
      padding: 10pt;
      text-align: center;
      background-color: #f8fafc;
    }
    .kpi-card-value {
      font-size: 16pt;
      font-weight: bold;
      color: #701a75;
      display: block;
    }
    .kpi-card-label {
      font-size: 9pt;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10pt;
      margin-bottom: 18pt;
      font-size: 9.5pt;
    }
    table.data-table th {
      background-color: #701a75;
      color: #ffffff;
      padding: 8pt 6pt;
      text-align: left;
      font-weight: bold;
      border: 1pt solid #701a75;
    }
    table.data-table td {
      padding: 7pt 6pt;
      border: 1pt solid #cbd5e1;
      vertical-align: top;
    }
    table.data-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 2pt 6pt;
      border-radius: 4pt;
      font-size: 8.5pt;
      text-transform: uppercase;
      font-weight: bold;
    }
    .risk-card {
      border: 1pt solid #e2e8f0;
      background-color: #ffffff;
      padding: 12pt;
      margin-bottom: 14pt;
      border-left: 4pt solid #95288e;
      box-shadow: 0 1pt 3pt rgba(0,0,0,0.05);
    }
    .footer-note {
      font-size: 8.5pt;
      color: #94a3b8;
      border-top: 1pt solid #e2e8f0;
      padding-top: 8pt;
      margin-top: 24pt;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Official Bank Header -->
  <div class="header-box">
    <div style="font-size: 9pt; font-weight: bold; color: #b38d34; letter-spacing: 1.5pt; text-transform: uppercase;">
      Commercial Bank of Ethiopia • Wholesale Banking Operations
    </div>
    <h1>Live AI Diagnostic Audit Report</h1>
    <p style="font-size: 11pt; color: #475569; margin: 0;">
      Project: <strong>Wholesale Banking Customer Onboarding & Loan Origination System (44 Deliverables)</strong>
    </p>
    <div style="margin-top: 8pt; font-size: 9pt; color: #64748b;">
      <span><strong>As-Of Operational Date:</strong> ${asOfDate}</span> | 
      <span><strong>Audit Timestamp:</strong> ${reportGen.displayDateTime}</span> | 
      <span><strong>Auditor Authorization:</strong> Gemini PMO Cognitive Diagnostic Engine</span>
    </div>
  </div>

  <!-- Key KPI Cards Grid -->
  <table class="kpi-table">
    <tr>
      <td class="kpi-card" style="width: 25%;">
        <span class="kpi-card-value" style="padding: 3pt 8pt; border-radius: 4pt; font-size: 13pt; ${getRiskIndexStyle(analysisData.overallRiskIndex)}">
          ${analysisData.overallRiskIndex}
        </span>
        <span class="kpi-card-label">Overall Risk Index</span>
      </td>
      <td class="kpi-card" style="width: 25%;">
        <span class="kpi-card-value" style="color: #be123c;">${criticalCount}</span>
        <span class="kpi-card-label">Critical Hidden Risks</span>
      </td>
      <td class="kpi-card" style="width: 25%;">
        <span class="kpi-card-value" style="color: #b45309;">${highCount}</span>
        <span class="kpi-card-label">High Priority Risks</span>
      </td>
      <td class="kpi-card" style="width: 25%;">
        <span class="kpi-card-value" style="color: #047857;">${totalPreventedDays} Days</span>
        <span class="kpi-card-label">Prevented Delay Exposure</span>
      </td>
    </tr>
  </table>

  <!-- Executive AI Summary -->
  <h2>1. Executive Summary &amp; Diagnostic Synthesis</h2>
  <div style="background-color: #f1f5f9; padding: 12pt; border-radius: 4pt; border-left: 3pt solid #701a75; font-size: 10.5pt; line-height: 1.6;">
    <p><strong>AI PMO Diagnostic Finding:</strong></p>
    <p>${analysisData.executiveSummary}</p>
  </div>

  <!-- Summary Table of All Identified Risks -->
  <h2>2. Master Identified Risks &amp; Resolutions Table</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 6%;">#</th>
        <th style="width: 22%;">Task &amp; Workstream</th>
        <th style="width: 14%;">Owners</th>
        <th style="width: 12%;">Risk Category</th>
        <th style="width: 9%;">Severity</th>
        <th style="width: 27%;">Recommended PMO Resolution</th>
        <th style="width: 10%;">Exposure</th>
      </tr>
    </thead>
    <tbody>
      ${analysisData.identifiedRisks.map((r, idx) => `
        <tr>
          <td style="font-weight: bold; text-align: center;">${idx + 1}</td>
          <td>
            <strong>[Task #${r.taskSNo}]</strong> ${r.taskTitle}<br/>
            <span style="font-size: 8pt; color: #64748b;">${r.workstream}</span>
          </td>
          <td>${r.leadOwner}</td>
          <td>${r.riskCategory}</td>
          <td>
            <span class="badge" style="${getSeverityStyle(r.severity)}">
              ${r.severity}
            </span>
          </td>
          <td>
            <strong>${r.recommendedPreventativeAction}</strong>
          </td>
          <td style="text-align: center; font-weight: bold; color: #be123c;">
            +${r.estimatedDelayExposureDays || 0}d
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Deep-Dive Cards for Each Risk -->
  <h2>3. Comprehensive Risk Diagnostic Details &amp; Mitigation Plans</h2>
  ${analysisData.identifiedRisks.map((r, idx) => `
    <div class="risk-card">
      <div style="display: flex; justify-content: space-between; border-bottom: 1pt solid #e2e8f0; padding-bottom: 6pt; margin-bottom: 8pt;">
        <div>
          <span style="font-size: 11pt; font-weight: bold; color: #701a75;">
            Risk Item #${idx + 1}: [Task #${r.taskSNo}] ${r.taskTitle}
          </span>
          <br/>
          <span style="font-size: 9pt; color: #64748b;">
            Workstream: <strong>${r.workstream}</strong> | Engineering Owners: <strong>${r.leadOwner}</strong>
          </span>
        </div>
        <div style="text-align: right;">
          <span class="badge" style="${getSeverityStyle(r.severity)}">
            ${r.severity} Severity
          </span>
          <span style="font-size: 8.5pt; color: #64748b; margin-left: 6pt;">
            Confidence: ${r.confidenceScore}%
          </span>
        </div>
      </div>

      <table style="width: 100%; font-size: 9.5pt; border-collapse: collapse; margin-top: 4pt;">
        <tr>
          <td style="width: 25%; font-weight: bold; color: #475569; padding: 4pt 0;">Early Warning Clue:</td>
          <td style="color: #334155; padding: 4pt 0;"><em>"${r.subtleSignal}"</em></td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #475569; padding: 4pt 0;">Downstream Impact:</td>
          <td style="color: #991b1b; font-weight: 500; padding: 4pt 0;">${r.potentialImpact}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #047857; padding: 4pt 0;">Prescribed Resolution:</td>
          <td style="color: #065f46; font-weight: bold; background-color: #ecfdf5; padding: 6pt; border-radius: 4pt;">
            ${r.recommendedPreventativeAction}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #475569; padding: 4pt 0;">Delay Exposure:</td>
          <td style="color: #b45309; font-weight: bold; padding: 4pt 0;">
            +${r.estimatedDelayExposureDays} business days if unmitigated
          </td>
        </tr>
      </table>
    </div>
  `).join('')}

  <!-- Footer / Governance Sign-Off -->
  <div class="footer-note">
    <p><strong>CONFIDENTIAL &amp; PROPRIETARY • COMMERCIAL BANK OF ETHIOPIA</strong></p>
    <p>Generated by Wholesale Banking Operations PMO Cognitive System on ${reportGen.displayDateTime}.</p>
    <p>Distribution: SteerCo Executive Members, Department Leads, Engineering Track Leads.</p>
  </div>

</body>
</html>
  `;

  // Create blob as MS Word (.doc)
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8;'
  });

  saveAs(blob, fileName);
  return fileName;
}
