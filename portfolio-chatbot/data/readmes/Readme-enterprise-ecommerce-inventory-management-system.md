# SiLafazenda Web Module


**A comprehensive enterprise inventory and e-commerce management system for agricultural production facilities**

![Java](https://img.shields.io/badge/Java-6-ED8B00?style=flat-square&logo=java)
![JSP](https://img.shields.io/badge/JSP-2.1-blue?style=flat-square)
![MySQL](https://img.shields.io/badge/MySQL-5.1+-orange?style=flat-square&logo=mysql)
![Tomcat](https://img.shields.io/badge/Tomcat-6.0-F8DC75?style=flat-square)
![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)

</div>

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [System Requirements](#system-requirements)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Key Features](#key-features)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Build & Deployment](#build--deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Author](#author)

---

## 🎯 Project Overview

**SiLafazenda** (Sistema Integrado La Fazenda) is an enterprise-grade inventory management and e-commerce platform designed specifically for agricultural production facilities. The system manages multiple production plants, inventory tracking, customer accounts, shopping carts, and transaction processing for a pork production and distribution business.

### Key Capabilities:
- **Multi-plant inventory management** across 7 distributed production facilities
- **Role-based access control** (administrators, clients)
- **E-commerce functionality** with shopping cart and checkout features
- **Real-time inventory tracking** of products and equipment
- **Statistical analytics dashboard** for business intelligence
- **User authentication and authorization** with secure account management
- **Responsive web interface** compatible with desktop and mobile devices

---

## 🏗️ Architecture

The application follows a **three-tier MVC architecture**:

```
┌──────────────────────────────────────────────────────┐
│           Presentation Layer (JSP)                   │
│  - Dynamic web pages                                 │
│  - Client-side validation (jQuery)                   │
│  - Responsive UI components                          │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│          Business Logic Layer (Servlets)             │
│  - Request handling                                  │
│  - Data processing                                  │
│  - Session management                                │
│  - Shopping cart operations                          │
│  - User authentication                               │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│          Data Access Layer (JDBC/MySQL)              │
│  - Database connectivity                            │
│  - Query execution                                  │
│  - Data persistence                                 │
└──────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

### Backend Technologies
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Java** | 6+ | Core server-side language |
| **JSP** | 2.1 | Dynamic page generation |
| **Servlets** | 2.5 | Request/response handling |
| **JDBC** | - | Database connectivity |
| **Ant** | - | Build automation |

### Database
| Component | Version | Purpose |
|-----------|---------|---------|
| **MySQL** | 5.1+ | Relational data storage |
| **InnoDB** | - | Transaction support & referential integrity |

### Frontend Technologies
| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic markup |
| **CSS3** | Responsive styling (custom + frameworks) |
| **jQuery** | 1.8.2+ | DOM manipulation & AJAX |
| **jQuery UI** | - | Interactive components |
| **jQuery Validation Engine** | - | Client-side form validation |
| **jQuery DataTables** | - | Advanced table functionality |

### Application Server
| Component | Version |
|-----------|---------|
| **Apache Tomcat** | 6.0+ |

### Libraries & Dependencies
| Library | Version | Purpose |
|---------|---------|---------|
| **json_simple** | 1.1 | JSON processing |
| **JavaMail** | 1.4.7 | Email notifications |
| **Mail API** | 1.4.7 | Email support |
| **Activation API** | 1.1.1 | MIME type handling |

### Development Tools
- **NetBeans IDE** - Primary development environment
- **Ant** - Build management
- **MySQL Workbench** - Database design & management

---

## 📁 Project Structure

```
SiLafazendaWEBmodule/
├── src/
│   ├── java/
│   │   ├── Servlets/
│   │   │   ├── ServletConsults.java       # Inventory queries & consultations
│   │   │   ├── ServletLogin.java          # User authentication
│   │   │   ├── ServletRegister.java       # New user registration
│   │   │   └── ServletShoopingCart.java   # Shopping cart management
│   │   ├── GlobalVariables1/
│   │   │   └── GlobalVariables.java       # Application-wide constants
│   │   └── conf/
│   │       └── MANIFEST.MF                # JAR manifest
│   └── conf/
│       └── MANIFEST.MF
│
├── web/
│   ├── index.jsp                          # Homepage
│   ├── indexAdmin.jsp                     # Admin dashboard
│   ├── indexClient.jsp                    # Client dashboard
│   ├── ConfirmCompra.jsp                  # Purchase confirmation
│   ├── ConsultSedes.jsp                   # Plant/facility queries
│   ├── Contactenos.jsp                    # Contact information
│   ├── DondeEstamos.jsp                   # Location information
│   ├── Estadisticas.jsp                   # Business statistics
│   ├── Factura.jsp                        # Invoice management
│   ├── ShoppingCart.jsp                   # Shopping cart display
│   │
│   ├── css/                               # Stylesheets
│   │   ├── style.css                      # Main styles
│   │   ├── layout.css                     # Layout framework
│   │   ├── template.css                   # Template styles
│   │   ├── style-desktop.css              # Desktop optimizations
│   │   ├── customMessages.css             # Message styling
│   │   ├── styleGoogleMaps.css            # Maps styling
│   │   ├── styleImages.css                # Image styling
│   │   ├── styleSlider.css                # Slider styling
│   │   ├── jquery.dataTables.css          # DataTables theme
│   │   ├── demo.css & demo_table.css      # Demo styles
│   │   ├── reset.css                      # CSS reset
│   │   └── fonts/                         # Custom fonts
│   │
│   ├── js/                                # JavaScript libraries & code
│   │   ├── jquery-1.8.2.min.js            # jQuery core library
│   │   ├── jquery.min.js                  # jQuery alternate
│   │   ├── jquery.js                      # jQuery unminified
│   │   ├── jquery.validationEngine*.js    # Form validation
│   │   ├── jquery.dataTables*.js          # Data table plugin
│   │   ├── jquery.dropotron.js            # Dropdown menu plugin
│   │   ├── jquery.slideshow.js            # Slideshow functionality
│   │   ├── jquery.tmpl.min.js             # Template plugin
│   │   ├── config.js                      # App configuration
│   │   ├── sliding.form.js                # Form animations
│   │   ├── modernizr.js                   # HTML5/CSS3 detection
│   │   ├── skel*.js                       # Skeleton framework
│   │   ├── prefixfree.min.js              # CSS prefix automation
│   │   └── html5shiv.js                   # HTML5 IE support
│   │
│   ├── images/                            # Media assets
│   │   ├── large/                         # High-resolution images
│   │   └── thumbs/                        # Thumbnail images
│   │
│   ├── jquery-ui/                         # jQuery UI components
│   │   ├── css/                           # UI themes
│   │   ├── js/                            # UI plugins
│   │   └── development-bundle/            # Development files
│   │
│   ├── META-INF/
│   │   └── context.xml                    # Tomcat context configuration
│   │
│   └── WEB-INF/
│       ├── web.xml                        # Deployment descriptor
│       ├── lib/                           # Runtime libraries
│       └── classes/                       # Compiled classes
│
├── build/                                 # Compiled output
│   ├── web/                               # Deployable WAR contents
│   ├── generated/                         # Auto-generated code
│   └── test/                              # Test outputs
│
├── dist/                                  # Distribution artifacts
│   └── SiLafazendaWEBmodule.war           # Deployable WAR file
│
├── nbproject/                             # NetBeans project files
│   ├── project.properties                 # Build properties
│   ├── project.xml                        # Project metadata
│   ├── build-impl.xml                     # Build implementation
│   ├── ant-deploy.xml                     # Deployment configuration
│   └── private/                           # User-specific settings
│
├── build.xml                              # Ant build configuration
├── DataBaseLaFazenda07-12-2013.sql        # Database schema & initial data
└── README.md                              # This file
```

---

## 🖥️ System Requirements

### Minimum Requirements
- **Operating System**: Windows XP SP3+, Linux, or macOS
- **Java**: JDK 6 or higher (JDK 7 recommended)
- **RAM**: 2 GB minimum (4 GB recommended)
- **Storage**: 500 MB for application + 1 GB for database
- **Disk Space**: 2 GB total

### Server Requirements
- **Application Server**: Apache Tomcat 6.0 or higher
- **Database Server**: MySQL 5.1 or higher
- **Network**: TCP ports 8080 (Tomcat), 3306 (MySQL) available

### Browser Compatibility
- Chrome 20+
- Firefox 15+
- Safari 5+
- Internet Explorer 9+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🚀 Installation & Setup

### Prerequisites
Before installing, ensure you have:
1. JDK 6+ installed and `JAVA_HOME` configured
2. Apache Tomcat 6.0+ installed
3. MySQL 5.1+ installed and running
4. NetBeans IDE (optional but recommended)
5. Ant installed (usually included with NetBeans)

### Step 1: Database Setup

```bash
# 1. Open MySQL command line or MySQL Workbench
mysql -u root -p

# 2. Execute the database initialization script
source DataBaseLaFazenda07-12-2013.sql;

# 3. Verify the database was created
SHOW DATABASES;
USE S_I_LaFazenda;
SHOW TABLES;
```

The script will create the following tables:
- `sede` - Production facility locations (7 plants)
- `inventario` - Inventory tracking
- `producto` - Product catalog
- `usuario` - User accounts
- `carrito` - Shopping cart items
- `compra` - Purchase transactions

### Step 2: Configure Database Connection

1. **Update connection properties** in `src/java/GlobalVariables1/GlobalVariables.java`:

```java
public class GlobalVariables {
    public static final String DB_URL = "jdbc:mysql://localhost:3306/S_I_LaFazenda";
    public static final String DB_USER = "root";
    public static final String DB_PASSWORD = "your_password";
    public static final String DB_DRIVER = "com.mysql.jdbc.Driver";
}
```

2. **Ensure MySQL JDBC driver** is in the classpath (usually via project properties)

### Step 3: Build the Application

Using Ant:
```bash
cd SiLafazendaWEBmodule
ant clean build
```

Or using NetBeans:
1. Open the project in NetBeans
2. Right-click project → Clean and Build
3. Output WAR file: `dist/SiLafazendaWEBmodule.war`

### Step 4: Deploy to Tomcat

**Option A: Manual Deployment**
```bash
# Copy WAR file to Tomcat webapps directory
cp dist/SiLafazendaWEBmodule.war $TOMCAT_HOME/webapps/

# Start Tomcat
$TOMCAT_HOME/bin/startup.sh  # Linux/Mac
%TOMCAT_HOME%\bin\startup.bat # Windows
```

**Option B: NetBeans Deployment**
1. Right-click project → Properties
2. Select Tomcat server under "Run"
3. Click "Deploy on Save"
4. Press F6 or Run → Run Project

### Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:8080/SiLafazendaWEBmodule/
```

Default credentials:
- **Admin User**: 
  - Username: `admin`
  - Password: `admin123`
- **Test Client**:
  - Username: `cliente`
  - Password: `cliente123`

---

## ⚙️ Configuration

### Environment Variables

```properties
# TOMCAT_HOME - Tomcat installation directory
# JAVA_HOME - JDK installation directory
# MYSQL_HOME - MySQL installation directory
```

### Application Configuration Files

#### `nbproject/project.properties`
- Build paths and source directories
- Library dependencies
- Server configuration
- Compilation settings

#### `web/WEB-INF/context.xml`
- Tomcat context configuration
- Application name and paths
- Session management settings

#### `web/WEB-INF/web.xml`
- Servlet mappings
- Welcome files
- Error pages
- Session timeout

### Key Configuration Parameters

```java
// Database Configuration
String dbUrl = "jdbc:mysql://localhost:3306/S_I_LaFazenda";

// Session Configuration
int sessionTimeout = 30; // minutes

// Email Configuration (for notifications)
String smtpHost = "smtp.gmail.com";
int smtpPort = 587;
String fromEmail = "lafazenda@empresa.com";
```

---

## ✨ Key Features

### 1. **User Management**
- Admin and Client role-based access
- User registration with validation
- Secure login authentication
- Session management
- Account profile management

### 2. **Inventory Management**
- Real-time inventory tracking across 7 facilities
- Product categorization (Products vs. Elements/Equipment)
- Stock level monitoring
- Inventory queries and reporting
- Low stock alerts

### 3. **E-Commerce Platform**
- Product browsing and search
- Shopping cart management
- Purchase order creation
- Order confirmation and invoicing
- Purchase history tracking

### 4. **Facility Management**
- Multi-location support (7 production plants)
- Location-based queries
- Facility contact information
- Geographic maps integration
- Facility statistics

### 5. **Business Intelligence**
- Sales statistics and reporting
- Inventory analytics
- User activity tracking
- Revenue reports
- Inventory movement analysis

### 6. **Communication**
- Contact information management
- Email notifications
- Inquiry submission
- Message management

---

## 🗄️ Database Schema

### Table Structure Overview

#### `sede` - Production Facilities
```sql
CREATE TABLE sede (
    cod_sede BIGINT PRIMARY KEY,
    nombre_sede NVARCHAR(30) NOT NULL,
    direccion_sede NVARCHAR(60) NOT NULL,
    telefono_sede BIGINT NOT NULL
);
```

**Facilities (7 total)**:
1. Planta Sembrado - Seed/Planting
2. Planta Recepcion de Granos - Grain Reception
3. Planta Crianza - Animal Raising
4. Planta Sacrificio - Processing/Slaughter
5. Planta Procesos Cerdo - Pork Processing
6. Sede Bosa - Distribution Center
7. Sede Cedritos - Distribution Center

#### `inventario` - Inventory Items
```sql
CREATE TABLE inventario (
    cod_inventario BIGINT PRIMARY KEY,
    total BIGINT NOT NULL,
    nombre NCHAR(20),
    cod_sede BIGINT FOREIGN KEY,
    tipo VARCHAR(10) -- 'PRODUCTO' or 'ELEMENTO'
);
```

#### `producto` - Product Catalog
```sql
CREATE TABLE producto (
    cod_producto BIGINT PRIMARY KEY,
    nombre_producto NVARCHAR(40) NOT NULL,
    precio BIGINT,
    descripcion NVARCHAR(200) NOT NULL
);
```

**Sample Products**:
- Raw seeds and grains
- Processed animal feed
- Live animals for processing
- Processed pork cuts (Paleta, Lomo, Chuleta, etc.)

#### `usuario` - User Accounts
```sql
CREATE TABLE usuario (
    cod_usuario BIGINT PRIMARY KEY,
    nombre NVARCHAR(50) NOT NULL,
    email NVARCHAR(100) UNIQUE,
    password VARCHAR(100) NOT NULL,
    rol VARCHAR(20), -- 'ADMIN' or 'CLIENT'
    fecha_registro DATETIME,
    estado VARCHAR(10) -- 'ACTIVO' or 'INACTIVO'
);
```

#### `carrito` - Shopping Carts
```sql
CREATE TABLE carrito (
    cod_carrito BIGINT PRIMARY KEY,
    cod_usuario BIGINT FOREIGN KEY,
    cod_producto BIGINT FOREIGN KEY,
    cantidad BIGINT,
    fecha_agregado DATETIME
);
```

#### `compra` - Purchase Orders
```sql
CREATE TABLE compra (
    cod_compra BIGINT PRIMARY KEY,
    cod_usuario BIGINT FOREIGN KEY,
    fecha_compra DATETIME,
    total_compra DECIMAL(10,2),
    estado VARCHAR(20), -- 'PENDIENTE', 'CONFIRMADA', 'ENTREGADA'
    numero_factura VARCHAR(20)
);
```

---

## 🔌 API Endpoints

### Servlet Routes

#### Authentication Endpoints
```
POST /SiLafazendaWEBmodule/ServletLogin
  Parameters: username, password
  Returns: Session authenticated user object
  
POST /SiLafazendaWEBmodule/ServletRegister
  Parameters: nombre, email, password, password_confirm
  Returns: Registration confirmation
```

#### Inventory Endpoints
```
GET /SiLafazendaWEBmodule/ServletConsults
  Parameters: action=consult&sede_id=X
  Returns: Inventory items for facility
  
GET /SiLafazendaWEBmodule/ServletConsults
  Parameters: action=products
  Returns: All available products
```

#### Shopping Cart Endpoints
```
POST /SiLafazendaWEBmodule/ServletShoopingCart
  Parameters: action=add&product_id=X&quantity=Y
  Returns: Updated cart
  
POST /SiLafazendaWEBmodule/ServletShoopingCart
  Parameters: action=remove&item_id=X
  Returns: Updated cart
  
POST /SiLafazendaWEBmodule/ServletShoopingCart
  Parameters: action=checkout
  Returns: Purchase confirmation
```

### AJAX Endpoints
```
GET /SiLafazendaWEBmodule/ajax.jsp
  Parameters: method=getProductDetails&product_id=X
  Returns: JSON product information
```

---

## 💡 Usage Examples

### Login to Application
```javascript
// AJAX Login Request
$.ajax({
    url: 'ServletLogin',
    method: 'POST',
    data: {
        username: 'cliente',
        password: 'cliente123'
    },
    success: function(response) {
        window.location.href = 'indexClient.jsp';
    }
});
```

### Add Item to Shopping Cart
```javascript
// Add product to cart
$.post('ServletShoopingCart', {
    action: 'add',
    product_id: 4,        // Paleta (Pork cut)
    quantity: 5,
    user_id: currentUserId
}, function(data) {
    console.log('Items added to cart');
});
```

### Query Inventory for Facility
```javascript
// Get all inventory for a specific facility
$.ajax({
    url: 'ServletConsults',
    data: {
        action: 'consult',
        sede_id: 5  // Planta Procesos Cerdo
    },
    dataType: 'json',
    success: function(inventory) {
        console.log(inventory);
    }
});
```

### Display Product Details in DataTable
```javascript
// Initialize DataTable with products
$('#productTable').dataTable({
    "ajax": 'ServletConsults?action=products',
    "columns": [
        { "data": "nombre_producto" },
        { "data": "precio" },
        { "data": "descripcion" }
    ]
});
```

---

## 🔨 Build & Deployment

### Building the Project

**Using Ant CLI:**
```bash
ant clean build
```

**Build Output Structure:**
```
dist/
├── SiLafazendaWEBmodule.war
└── SiLafazendaWEBmodule/         # Expanded WAR
    ├── index.jsp
    ├── WEB-INF/
    │   ├── classes/              # Compiled Java classes
    │   ├── lib/                  # Runtime libraries
    │   └── web.xml
    ├── css/
    ├── js/
    └── images/
```

### Deployment Checklist
- [ ] Database initialized and accessible
- [ ] JDBC driver in classpath
- [ ] Database credentials configured
- [ ] Tomcat server running
- [ ] Sufficient disk space
- [ ] Port 8080 available
- [ ] Firewall rules configured

### Production Deployment

```bash
# Build WAR file
ant clean build

# Copy to production server
scp dist/SiLafazendaWEBmodule.war user@prodserver:/opt/tomcat/webapps/

# Restart Tomcat
ssh user@prodserver '/opt/tomcat/bin/shutdown.sh'
ssh user@prodserver '/opt/tomcat/bin/startup.sh'

# Verify deployment
curl http://prodserver:8080/SiLafazendaWEBmodule/
```

---

## 🔍 Troubleshooting

### Common Issues and Solutions

#### Issue: Database Connection Refused
```
Error: Communications link failure - connect() attempt failed
```
**Solution:**
1. Verify MySQL is running: `mysql -u root -p`
2. Check database credentials in GlobalVariables.java
3. Ensure database `S_I_LaFazenda` exists: `SHOW DATABASES;`
4. Check MySQL port (default 3306)

#### Issue: JDBC Driver Not Found
```
Error: java.lang.ClassNotFoundException: com.mysql.jdbc.Driver
```
**Solution:**
1. Add MySQL JDBC driver to project libraries
2. Verify driver JAR in `WEB-INF/lib/mysql-connector-java.jar`
3. Rebuild project

#### Issue: Session Expires Immediately
```
Error: User session invalid
```
**Solution:**
1. Check `web.xml` session timeout: `<session-timeout>30</session-timeout>`
2. Verify session ID cookie enabled
3. Check servlet `setAttribute("user", userObject)`

#### Issue: Shopping Cart Data Not Persisting
```
Error: Cart empty after page refresh
```
**Solution:**
1. Verify session management in `ServletShoopingCart`
2. Ensure cart stored in HttpSession, not JavaScript variables
3. Check browser cookie settings
4. Verify database connection for cart persistence

#### Issue: Static Files (CSS/JS) Not Loading
```
Error: 404 - /css/style.css not found
```
**Solution:**
1. Verify files in correct directories: `web/css/`, `web/js/`
2. Check file paths in JSP: `<link href="css/style.css">`
3. Rebuild and redeploy WAR
4. Clear browser cache (Ctrl+Shift+Delete)

#### Issue: Image Assets Not Displaying
**Solution:**
1. Verify `web/images/` directory is in WAR
2. Check image file permissions
3. Use relative paths: `<img src="images/logo.png">`
4. Verify image formats are web-compatible (PNG, JPG, GIF)

### Debug Mode

Enable debug logging in Tomcat:
```properties
# $TOMCAT_HOME/conf/logging.properties
org.apache.catalina.level = FINE
org.apache.catalina.manager.level = FINE
```

View logs:
```bash
# Linux/Mac
tail -f $TOMCAT_HOME/logs/catalina.out

# Windows
type %TOMCAT_HOME%\logs\catalina.out
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Code Style**
   - Follow Java naming conventions (camelCase for variables, PascalCase for classes)
   - Use meaningful variable names
   - Add comments for complex logic
   - Keep methods focused and concise

2. **Before Committing**
   - Test all functionality locally
   - Verify database schema changes
   - Build project without errors: `ant clean build`
   - Test on target Tomcat version

3. **Commit Messages**
   ```
   Feature: Add product filtering by category
   - Implement filter UI in ConsultSedes.jsp
   - Add filtering logic to ServletConsults
   - Update database queries
   ```

4. **Pull Request Process**
   - Describe changes clearly
   - Test against database schema
   - Ensure backward compatibility
   - Include updated documentation

---

## 👨‍💻 Author

**Project Created By**: David (david_000)

**Project Name**: SiLafazenda Web Module

**Created**: November 12, 2013

**Last Updated**: December 7, 2013

**Final Project For**: Technologist Program

---

## 📝 License

This project is proprietary and confidential. All rights reserved. Unauthorized copying, distribution, or modification of this code is strictly prohibited.

---

## 📞 Support & Contact

For issues, questions, or feature requests:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review database schema documentation
3. Examine servlet logs in Tomcat
4. Contact project administrator

---

## 🎓 Technical Notes

### Performance Optimization
- Connection pooling for database
- Prepared statements to prevent SQL injection
- Caching of frequently accessed data
- Minified CSS/JS in production
- Image optimization for web

### Security Considerations
- SQL injection prevention via prepared statements
- XSS protection with input validation
- CSRF tokens for state-changing operations
- Secure session management
- Password hashing for user credentials

### Future Enhancements
- HTTPS/SSL encryption
- OAuth 2.0 authentication
- RESTful API endpoints
- Microservices architecture
- NoSQL caching layer (Redis)
- Mobile-native applications
- Real-time inventory notifications
- Advanced analytics dashboard

---

<div align="center">

**Built with ❤️ for agricultural enterprise management**

*Version 1.0* | Last Updated: December 2013 | Made with Java & JSP

</div>
