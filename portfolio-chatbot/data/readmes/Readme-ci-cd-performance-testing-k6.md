K6 Performance Testing Suite

 Overview

A comprehensive performance testing project using k6, an open-source load testing tool. This suite demonstrates expertise in designing and executing various performance testing scenarios including load testing, stress testing, spike testing, and soak testing against a REST API and/or Postman.

Testing Target: [Escuela JS API](https://api.escuelajs.co/api/v1)


 Prerequisites

- Node.js (for running k6 scripts)
- Windows, macOS, or Linux environment
- Git (for version control)

Programming Languages:
JavaScript

Github project: https://github.com/David101111101/performance-testing-k6

Test scenarios:
load
stress
spike
soak


Generating Reports
Cloud Testing
Leveraged k6 Cloud for interactive dashboards and advanced reporting through Data visualization.

CI/CD Integration
Automated Performance Testing in GitHub Actions with weekly scheduled nightly runs

This project integrates performance testing directly into the CI/CD pipeline using GitHub Actions. The workflow automatically runs k6 checks on every pull request and scheduled execution.

 Workflow Triggers

- Pull Requests: Performance tests run on all PRs targeting `main` branch
- Push to Main: Tests execute and upload results to k6 Cloud
- Scheduled/Nightly Runs: Weekly performance testing (Mondays at 03:00 UTC)
- Manual Dispatch: Trigger tests on-demand via GitHub Actions UI

 Branch Protection Rulesets

Merge Protection: GitHub Rulesets enforce that performance tests must pass before any code can be merged to the `main` branch:

- ✅ Performance test must succeed (HTTP checks, response time thresholds, error rates)
- ✅ All k6 assertions and custom checks must pass
- ✅ Blocking criteria prevents merge if tests fail
- ❌ Failed performance tests block PR merge automatically

 k6 Cloud Integration

Performance test data from successful runs on the `main` branch is automatically uploaded to k6 Cloud, providing:

- 📊 Real-Time Dashboards - Visual charts and trend analysis
- 📈 Performance Trends - Historical data and regression detection
- 🔍 Detailed Metrics - Response times, throughput, error rates, and custom metrics
- 🎯 Result Visualization - Beautiful, shareable performance reports
- 🔔 Alerting - Notifications for performance degradation

 Test Types

1. Load Testing (`load.js`)
Tests API performance under normal and expected load conditions.
- Duration: 13+ minutes
- Virtual Users (VUs): Up to 150
- Throughput: 723.7 requests/sec
- Data Volume: ~13GB per test run

2. Stress Testing (`stress.js`)
Gradually increases load to identify breaking points.

3. Spike Testing (`spike.js`)
Sudden load increases to test system resilience.

4. Soak Testing (`soak.js`)
Extended duration testing to detect memory leaks and degradation.

5. Staged Testing (`Stages.js`)
Multi-stage scenarios with dynamic Virtual User scaling.


✅ Custom Metrics
- Counter Metrics - Track cumulative events (`counter-custom-metrics.js`)
- Gauge Metrics - Measure instantaneous values (`gauge-metric.js`)
- Rate Metrics - Calculate rates of events (`rate-metric.js`)
- Trend Metrics - Analyze percentiles and statistics (`trend-metric.js`)

✅ Performance Thresholds
Automated pass/fail criteria based on performance targets:
- HTTP request failure rate < 10%
- 95th percentile response time < 200ms
- Dynamic abort conditions

✅ CI/CD Pipeline Integration
GitHub Actions workflow with automated performance testing:
- Runs on every PR to `main` branch
- Blocks merges if performance thresholds fail
- Uploads results to k6 Cloud for dashboard visualization
- Scheduled weekly tests for continuous monitoring

📊 Multiple Output Formats
- JSON export for integration with CI/CD pipelines
- Summary reports for stakeholder communication
- k6 Cloud dashboard for real-time monitoring



 Key Metrics & Thresholds:
HTTP Request Failure Rate < 10% 
Response Time (p95) < 200ms 
Response Time (p99) < 500ms 
Virtual Users (Peak) 150 VUs Supported
Throughput 723.7 requests per second 



 Results

Performance Test Summary

Load Testing Results:
- Total Iterations: 629,746
- Throughput: 723.7 requests/second
- Data Volume: ~13GB
- Status: ✅ Passed all thresholds

Key Findings:
- API responds consistently under sustained load
- No memory leaks detected in soak tests
- Spike scenarios handled gracefully
- All response times within acceptable ranges



 Best Practices Demonstrated

✅ Structured test organization - Separate files for different test types  
✅ Custom metrics & checks - Beyond standard k6 metrics  
✅ Threshold management - Automated acceptance criteria  
✅ Detailed documentation - Clear setup and usage instructions  
✅ Multiple reporting formats - JSON, summary, and cloud dashboards  
✅ Scalability testing - VU staging and gradual load increases  


 References

- [k6 Official Documentation](https://k6.io/docs/)
- [k6 API Reference](https://k6.io/docs/javascript-api/)
- [Performance Testing Best Practices](https://k6.io/articles/best-practices-web-app-load-testing/)
- [Escuela JS API](https://api.escuelajs.co/)


 License
This project is open source.


Author: QA Automation Engineer  
Last Updated: February 2026
