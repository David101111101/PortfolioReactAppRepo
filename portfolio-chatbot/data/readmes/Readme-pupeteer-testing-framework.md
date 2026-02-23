# Puppeteer Testing Framework

A robust, production-ready end-to-end testing framework built with **Puppeteer** and **Jest**, implementing the **Page Object Model (POM)** design pattern for maintainable and scalable automated testing.

---

## 🎯 Overview

This project demonstrates professional-grade browser automation and testing practices, specifically designed for validating complex user workflows such as travel booking platforms. The framework showcases best practices in test organization, error handling, and reusable component design.

**Live Testing Target:** [PHP Travels](https://phptravels.net/login) - A fully-featured travel booking application

---

## ✨ Key Features

### 🏗️ **Page Object Model Architecture**
- Clean separation of concerns with dedicated page classes
- Reusable base page component with common element interactions
- Modular component design for complex UI elements

### 🧪 **Comprehensive Test Coverage**
- User authentication and login validation
- Navigation bar component interaction testing
- Complex flight reservation and search workflows
- Form data entry and element validation

### 🛠️ **Modern Testing Stack**
- **Puppeteer** - Headless browser automation
- **Jest** - Testing framework with HTML reporting
- **Babel** - ES6+ JavaScript transpilation
- **jest-html-reporter** - Beautiful HTML test reports

### ⚡ **Developer Experience**
- Clear error messages with selector information
- Timeout configurations for different test scenarios
- Element visibility validation before interaction
- Comprehensive logging for debugging

---

## 📋 Project Structure

```
puppeteer-framework/
├── Pages/                          # Page Object Models
│   ├── BasePage.js                 # Base class with common methods
│   ├── LoginPage.js                # Login page interactions
│   └── FlightsPage.js              # Flight booking page
├── __test__/                        # Test specifications
│   ├── FlightReservation.test.js   # Main flight booking test suite
│   ├── login.test.js               # Login test cases
│   ├── example.test.js             # Example test patterns
│   └── components/
│       └── NavBar.js               # Navigation component tests
├── reports/                         # Test execution reports
├── jest.config.js                  # Jest configuration
├── jest-puppeteer.config.js        # Puppeteer browser settings
├── babel.config.js                 # Babel transpilation config
└── package.json                    # Project dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd puppeteer-framework

# Install dependencies
npm install
```

---

## 🧪 Running Tests

### Execute All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npx jest __test__/FlightReservation.test.js
```

### Run with Coverage
```bash
npx jest --coverage
```

### Watch Mode (Auto-rerun on file changes)
```bash
npx jest --watch
```

---

## 📖 Test Examples

### Login Flow
```javascript
const loginPage = new LoginPage();
await loginPage.visit();
await loginPage.logIn('user@phptravels.com', 'demouser');
await loginPage.validateLogin();
```

### Navigation Component
```javascript
const navbar = new NavBar();
await navbar.validateNavBarIsPresent();
await navbar.selectMenuItem('Flights');
```

### Flight Reservation
```javascript
const flightsPage = new FlightsPage();
await flightsPage.validatePage();
await flightsPage.FlightSelection(
  'Bogota',           // departure city
  'San Andres Island', // destination city
  '02-01-2025',       // travel date
  4                   // number of passengers
);
await flightsPage.validateFlights();
```

---

## 🔧 Core Components

### BasePage.js
The foundation class providing common element interaction methods:

| Method | Purpose |
|--------|---------|
| `getTitle()` | Retrieve current page title |
| `getUrl()` | Get current page URL |
| `getText(selector)` | Extract text from element |
| `getAttribute(selector, attribute)` | Get element attributes |
| `getValue(selector)` | Retrieve input element values |
| `getCount(selector)` | Count matching elements |
| `click(selector)` | Click element with visibility check |
| `type(selector, text)` | Type text into input field |

### Page Objects
Each page extends `BasePage` and encapsulates:
- Page-specific selectors as class properties
- High-level interaction methods
- Page state validations
- Custom error handling

---

## 📊 Test Reports

Test results are automatically generated in HTML format:
- Location: `./reports/test-report.html`
- View in browser for detailed test execution analysis
- Includes pass/fail status, execution times, and error details

---

## ⚙️ Configuration

### jest.config.js
- Bail after 5 failures for quick feedback
- jest-puppeteer integration for headless browser control
- HTML reporter output configuration

### jest-puppeteer.config.js
- Chromium browser launch options
- Viewport and device emulation settings
- Connection timeout configurations

### babel.config.js
- Modern JavaScript (ES6+) support
- jest-puppeteer preset integration

---

## 🎓 Design Patterns

### Page Object Model (POM)
Each page is represented as a class with:
- **Selectors** stored as private properties
- **Methods** representing user actions
- **Validations** to verify page state

**Benefits:**
- ✅ Maintainable - Changes to selectors in one place
- ✅ Reusable - Share common functionality via BasePage
- ✅ Readable - Test code mirrors user actions
- ✅ Scalable - Easy to add new pages and tests

---

## 🐛 Error Handling

Framework provides detailed error messages:
```
Error while getting text for selector: .invalid-selector - Timeout 5000ms exceeded
```

Features:
- Explicit selector validation
- Visibility checks before interactions
- Try-catch error boundaries
- Descriptive error messages for debugging

---

## 💡 Best Practices Demonstrated

1. **Separation of Concerns** - Page logic isolated from test logic
2. **DRY Principle** - Reusable base class methods
3. **Async/Await** - Clean asynchronous test execution
4. **Element Waits** - Visibility validation before interaction
5. **Meaningful Assertions** - Clear test intent and validation
6. **Test Organization** - Grouped related tests in describe blocks
7. **Timeout Management** - Configurable timeouts for different operations

---

## 🔮 Potential Enhancements

- [ ] Cross-browser testing (Firefox, Safari)
- [ ] Performance metrics collection
- [ ] Visual regression testing with screenshots
- [ ] API integration testing
- [ ] Test data management and factories
- [ ] Parallel test execution
- [ ] CI/CD pipeline integration (GitHub Actions, Jenkins)
- [ ] Accessibility testing integration

---

## 📝 Technologies Used

| Technology | Version | Purpose |
|------------|---------|---------|
| Puppeteer | ^23.10.4 | Browser automation |
| Jest | ^29.7.0 | Testing framework |
| jest-puppeteer | ^10.1.4 | Jest/Puppeteer integration |
| Babel | ^7.26.0 | ES6+ transpilation |
| jest-html-reporter | ^3.10.2 | HTML test reports |

---

## 👤 Author

**David Abril**  
📧 davidstevenabril@gmail.com

---

## 📄 License

ISC

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Tests follow POM pattern
- New selectors are added to appropriate page classes
- All tests pass before submission
- Code follows existing style conventions

---

## 📚 Additional Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Jest Testing Framework](https://jestjs.io/)
- [Page Object Model Best Practices](https://martinfowler.com/bliki/PageObject.html)
- [Async/Await Guide](https://javascript.info/async-await)

---

## ⭐ Highlights for Employers

This project demonstrates:
- ✅ **Professional Architecture** - Implements industry-standard POM design pattern
- ✅ **Quality Assurance** - Comprehensive end-to-end testing with multiple test scenarios
- ✅ **Code Organization** - Clean, maintainable, and scalable code structure
- ✅ **Modern JavaScript** - ES6+ features including classes, async/await, and modules
- ✅ **Error Handling** - Robust error management with descriptive messages
- ✅ **Best Practices** - Follows testing and automation industry standards
- ✅ **Full Workflow** - Tests complex, real-world applications (flight booking)
- ✅ **Documentation** - Clear, professional documentation and code comments
