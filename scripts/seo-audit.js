#!/usr/bin/env node

/**
 * SEO Audit Script for Bright Designs
 * Runs comprehensive SEO checks and generates a report
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
const SITE_URL = (envUrl && envUrl !== '****') ? envUrl : 'http://localhost:3000';
const AUDIT_PAGES = [
  '/',
  '/arrangements',
  '/shows',
  '/about',
  '/contact'
];

const TARGET_KEYWORDS = [
  'marching band design',
  'custom marching band shows',
  'marching band arrangements',
  'drill design services',
  'marching band choreography'
];

async function runLighthouseAudit(url) {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse(url, options);
  await chrome.kill();
  
  return runnerResult.lhr;
}

async function checkSEOFundamentals(url) {
  console.log(`\n🔍 Checking SEO fundamentals for: ${url}`);
  
  const checks = {
    url,
    lighthouse: null,
    seoIssues: [],
    recommendations: []
  };
  
  try {
    // Run Lighthouse audit
    const lighthouse = await runLighthouseAudit(url);
    checks.lighthouse = {
      performance: lighthouse.categories.performance.score * 100,
      accessibility: lighthouse.categories.accessibility.score * 100,
      bestPractices: lighthouse.categories['best-practices'].score * 100,
      seo: lighthouse.categories.seo.score * 100
    };
    
    // Check specific SEO audits
    const seoAudits = lighthouse.audits;
    
    // Title and meta description
    if (seoAudits['document-title'].score < 1) {
      checks.seoIssues.push('Missing or poor title tag');
    }
    if (seoAudits['meta-description'].score < 1) {
      checks.seoIssues.push('Missing or poor meta description');
    }
    
    // Structured data
    if (seoAudits['structured-data'].score < 1) {
      checks.seoIssues.push('Missing or invalid structured data');
    }
    
    // Performance issues affecting SEO
    if (checks.lighthouse.performance < 90) {
      checks.seoIssues.push(`Poor performance score: ${checks.lighthouse.performance}/100`);
    }
    
    // Core Web Vitals
    const lcp = seoAudits['largest-contentful-paint']?.numericValue;
    const fid = seoAudits['max-potential-fid']?.numericValue;
    const cls = seoAudits['cumulative-layout-shift']?.numericValue;
    
    if (lcp > 2500) {
      checks.seoIssues.push(`LCP too slow: ${Math.round(lcp)}ms (target: <2500ms)`);
    }
    if (fid > 100) {
      checks.seoIssues.push(`FID too slow: ${Math.round(fid)}ms (target: <100ms)`);
    }
    if (cls > 0.1) {
      checks.seoIssues.push(`CLS too high: ${cls.toFixed(3)} (target: <0.1)`);
    }
    
    console.log(`✅ Lighthouse scores - Performance: ${checks.lighthouse.performance}/100, SEO: ${checks.lighthouse.seo}/100`);
    
  } catch (error) {
    console.error(`❌ Error auditing ${url}:`, error.message);
    checks.seoIssues.push(`Audit failed: ${error.message}`);
  }
  
  return checks;
}

function checkKeywordOptimization() {
  console.log('\n🎯 Checking keyword optimization...');
  
  const keywordChecks = TARGET_KEYWORDS.map(keyword => ({
    keyword,
    pages: [],
    density: 0,
    placement: {
      title: false,
      heading: false,
      metaDescription: false,
      content: false
    }
  }));
  
  // This would typically fetch and analyze page content
  // For now, we'll simulate the check
  console.log('📊 Target keywords analysis:');
  TARGET_KEYWORDS.forEach(keyword => {
    console.log(`   - "${keyword}": Requires content analysis`);
  });
  
  return keywordChecks;
}

function generateRecommendations(auditResults) {
  console.log('\n💡 SEO Recommendations:');
  
  const recommendations = [];
  
  auditResults.forEach(result => {
    if (result.lighthouse?.seo < 100) {
      recommendations.push(`Improve SEO score for ${result.url} (currently ${result.lighthouse.seo}/100)`);
    }
    if (result.lighthouse?.performance < 90) {
      recommendations.push(`Optimize performance for ${result.url} (currently ${result.lighthouse.performance}/100)`);
    }
    
    result.seoIssues.forEach(issue => {
      recommendations.push(`${result.url}: ${issue}`);
    });
  });
  
  // Marching band specific recommendations
  recommendations.push('Ensure "marching band design" appears in title tags');
  recommendations.push('Add more internal links between arrangement and show pages');
  recommendations.push('Create location-specific landing pages for target markets');
  recommendations.push('Optimize images with alt text containing target keywords');
  recommendations.push('Add customer testimonials with schema markup');
  
  recommendations.forEach(rec => {
    console.log(`   • ${rec}`);
  });
  
  return recommendations;
}

async function generateSEOReport(auditResults, recommendations) {
  const report = {
    timestamp: new Date().toISOString(),
    siteUrl: SITE_URL,
    summary: {
      pagesAudited: auditResults.length,
      averagePerformance: Math.round(auditResults.reduce((sum, r) => sum + (r.lighthouse?.performance || 0), 0) / auditResults.length),
      averageSEO: Math.round(auditResults.reduce((sum, r) => sum + (r.lighthouse?.seo || 0), 0) / auditResults.length),
      totalIssues: auditResults.reduce((sum, r) => sum + r.seoIssues.length, 0)
    },
    pages: auditResults,
    targetKeywords: TARGET_KEYWORDS,
    recommendations
  };
  
  const reportPath = path.join(process.cwd(), 'seo-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📋 SEO Audit Report generated: ${reportPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   • Pages audited: ${report.summary.pagesAudited}`);
  console.log(`   • Average Performance: ${report.summary.averagePerformance}/100`);
  console.log(`   • Average SEO: ${report.summary.averageSEO}/100`);
  console.log(`   • Total Issues: ${report.summary.totalIssues}`);
  
  return report;
}

async function main() {
  console.log('🚀 Starting SEO Audit for Bright Designs');
  console.log(`🌐 Site URL: ${SITE_URL}`);
  
  // Audit all pages
  const auditResults = [];
  for (const page of AUDIT_PAGES) {
    const url = `${SITE_URL}${page}`;
    const result = await checkSEOFundamentals(url);
    auditResults.push(result);
  }
  
  // Check keyword optimization
  const keywordChecks = checkKeywordOptimization();
  
  // Generate recommendations
  const recommendations = generateRecommendations(auditResults);
  
  // Generate report
  await generateSEOReport(auditResults, recommendations);
  
  console.log('\n✅ SEO Audit completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runLighthouseAudit,
  checkSEOFundamentals,
  checkKeywordOptimization,
  generateRecommendations,
  generateSEOReport
};