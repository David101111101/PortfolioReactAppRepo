# 🚀 Cypress Backend Automation Framework

A comprehensive **end-to-end testing automation** framework built with Cypress, featuring advanced test reporting, database integration, and containerized deployment capabilities.

---

## ✨ Features

- **Modern E2E Testing** with Cypress 14.x
- **Multiple Reporting Formats** - Allure, Mochawesome, JUnit Reports
- **Database Integration** - MySQL query execution in tests
- **API Testing** - GraphQL, REST endpoints, Request intercepting
- **Security Testing** - Headers validation, security checks
- **Docker Support** - Containerized test execution
- **Mobile Responsiveness Testing**
- **CI/CD Ready** - Dashboard recording & reporting
- **Flaky Test Detection** - Built-in flaky test handling
- **Custom Task Support** - Save and retrieve test data across tests

---

## 📋 Project Structure

```
cypress/
├── e2e/                      # Test specifications
│   ├── 1-getting-started/    # Beginner examples
│   ├── 2-advanced-examples/  # Advanced test patterns
│   ├── login.cy.js           # Authentication tests
│   ├── requests.cy.js        # API endpoint tests
│   ├── graphql.cy.js         # GraphQL mutation tests
│   ├── dbMysqlConnection.cy.js # Database integration tests
│   ├── security.cy.js        # Security validation tests
│   ├── headers.cy.js         # HTTP headers tests
│   ├── Intercepting.cy.js    # Request interception tests
│   ├── mobileResponsiveness.cy.js # Mobile testing
│   └── flakyTests.cy.js      # Flaky test detection
├── fixtures/                 # Test data
├── pageObjects/              # Page Object Model implementations
├── support/                  # Custom commands & helpers
└── screenshots/              # Test failure screenshots

allure-report/               # Allure report outputs
cypress/reportResults/       # Mochawesome & JUnit reports
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Cypress 14.3.3** | E2E Testing Framework |
| **Allure Reports** | Advanced HTML Test Reporting |
| **Mochawesome** | Detailed Test Reports with Screenshots |
| **JUnit Reports** | CI/CD Integration Reports |
| **MySQL2** | Database Testing & Queries |
| **Docker** | Test Containerization |
| **JSON Server** | Mock API Server |
| **GraphQL** | API Testing |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ 
- npm or yarn
- Docker (optional, for containerized execution)
- Java 17+ (for Allure report generation)

### Installation

```bash
# Install dependencies
npm install

# Install Cypress browsers
npx cypress install
```

### Configuration

Update `cypress.env.json` with your database credentials:

```json
{
  "DB_HOST": "your-host",
  "DB_USER": "your-user",
  "DB_PASSWORD": "your-password",
  "DB_NAME": "your-database",
  "DB_PORT": 3306
}
```

---

## 📝 Available Commands

### Running Tests

```bash
# Open Cypress Dashboard (Interactive Mode)
npx cypress open

# Run specific test file
npx cypress run --spec "cypress/e2e/login.cy.js"

# Run all tests
npx cypress run
```

### Mock Server

```bash
# Start JSON Server with db.json
npm run runServer
```

### Reporting

```bash
# Generate Allure Report (Recommended)
npm run allure:report

# Serve Allure Report in Browser
npm run allure:serve

# Generate Mochawesome Report
npm run mochawesome:report

# Generate JUnit Reports
npm run junit:reports

# Multi-reporter (Allure + Mochawesome + JUnit)
npm run report -- --spec cypress/e2e/login.cy.js
```

### Docker Execution

```bash
# Run tests in Docker container
docker compose up --build

# Run with existing image
docker run --rm cypress-automation-docker
```

### Dashboard Recording

```bash
# Record test run on Cypress Dashboard
npm run run:dashboard
```

### Cleanup

```bash
# Delete all report results
npm run delete:results
```

---

## 🧪 Test Coverage

### Test Categories

1. **Authentication Tests** - Login flows, session management
2. **API Testing** - REST and GraphQL endpoints
3. **Database Operations** - MySQL query execution and validation
4. **Security** - Headers validation, security headers
5. **Mobile Responsiveness** - Multi-device testing
6. **Request Interception** - Network request mocking
7. **Error Handling** - Error message validation
8. **Status Codes** - HTTP status validation
9. **Body Validation** - Response payload testing
10. **Multiple Tabs** - Cross-tab communication

---

## 📊 Reports & Artifacts

### Allure Reports
- Visual test execution timeline
- Detailed test steps with screenshots
- Failure analysis & error logs
- Historical trends & metrics
- Category & behavior breakdowns

### Mochawesome Reports
- Interactive HTML reports
- Embedded screenshots on failures
- Video support
- Test execution history

### JUnit Reports
- CI/CD integration compatible
- Test metrics & statistics
- Failure summaries

---

## 🐳 Docker Setup

The project includes a `Dockerfile` with:
- ✅ Pre-installed Cypress browsers
- ✅ Java 17 (for Allure report generation)
- ✅ All npm dependencies
- ✅ Non-root user for security

### Building & Running

```bash
# Build image with docker-compose
docker compose up --build

# Access reports in docker-reports/ directory
```

---

## 🔧 Advanced Features

### Custom Tasks in cypress.config.js

```javascript
// Database Query Execution
cy.task('queryDb', { query: 'SELECT * FROM users' })

// Save Test Data
cy.task('save', { userId: 123 })

// Retrieve Saved Data
cy.task('getInfo', 'userId')
```

### Page Object Model (POM)
Organized page object implementations in `cypress/pageObjects/` for maintainability and reusability.

### Allure Plugin Integration
- Screenshots on failure
- Step descriptions
- Custom status labels
- Behavior mapping
- Test categorization

---

## 🎯 Best Practices Implemented

✅ **Page Object Model** - Separation of concerns  
✅ **Custom Commands** - Reusable test utilities  
✅ **Explicit Waits** - No hardcoded delays  
✅ **Error Screenshots** - Visual debugging  
✅ **Database Integration** - Backend validation  
✅ **API Testing** - Full HTTP method coverage  
✅ **Security Testing** - Header & vulnerability checks  
✅ **Flaky Test Handling** - Retry mechanisms  
✅ **Detailed Reporting** - Multi-format outputs  
✅ **Docker Support** - Environment consistency  

---

## 📈 CI/CD Integration

This framework integrates with:
- **Cypress Dashboard** - Cloud recording & insights
- **JUnit Reports** - Jenkins, GitLab CI, Azure Pipelines
- **Allure Reports** - Standalone or integrated reporting
- **Docker** - Containerized execution in any environment

---

## 📚 Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Allure Framework](https://allurereport.org/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)

---

## 📝 License

ISC

---

**Author:** David  
**Version:** 1.0.0


