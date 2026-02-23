# FREK - Sales & Inventory Management System

![Version](https://img.shields.io/badge/version-1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PHP](https://img.shields.io/badge/PHP-5.3+-orange.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Key Modules](#key-modules)
- [Database Schema](#database-schema)
- [Security Considerations](#security-considerations)
- [Future Enhancements](#future-enhancements)

## 🎯 Overview

**FREK** is a comprehensive web-based Sales and Inventory Management System designed to streamline business operations. This enterprise-level application provides secure user authentication, role-based access control, comprehensive product and sales management capabilities, and visual analytics through integrated charting solutions.

Built as a multi-tier architecture, FREK serves as a practical implementation of full-stack web development principles, combining frontend technologies with backend PHP business logic and relational database management.

## ✨ Key Features

### User Management
- **Authentication System**: Secure login with username and password validation
- **Role-Based Access Control**: Distinct user roles including Administrator and regular Users
- **User Lifecycle Management**: Create, edit, and delete user accounts
- **User Status Tracking**: Active/Inactive user state management
- **Profile Management**: Complete user information including contact details and address

### Sales Management
- **Sales Order Management**: Create, edit, and manage sales orders
- **Order Tracking**: Monitor orders with comprehensive order history
- **Payment Terms**: Configurable payment terms and conditions
- **Shipping Management**: Track shipment dates and delivery schedules
- **Sales Analytics**: Visual representation of sales data through interactive charts

### Product Management
- **Product Catalog**: Browse and manage product inventory
- **Product Details**: Comprehensive product information storage
- **Inventory Tracking**: Real-time product availability

### Analytics & Reporting
- **Visual Dashboards**: Interactive data visualization using FusionCharts
- **Sales Reports**: Bar charts and pie charts for sales analysis
- **Statistical Insights**: Data-driven business intelligence

### Web Presence
- **Public Website**: Marketing-focused pages including:
  - Home/Landing Page
  - Product Showcase
  - Services Overview
  - About Us / Company Information
  - Contact Page
- **Responsive Design**: Professional UI with CSS reset and IE compatibility

## 🛠 Technology Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | PHP 5.3+ |
| **Database** | MySQL with InnoDB engine |
| **Frontend** | HTML5, CSS3, JavaScript |
| **Charting** | FusionCharts 3D (Column3D, Pie3D) |
| **Libraries** | jQuery 1.6, jQuery Easing |
| **Web Fonts** | Open Sans (400, 300, 600 weights) |
| **Browser Support** | Modern browsers + IE6+ compatibility |

## 🏗 Project Architecture

FREK follows a **layered architecture pattern**:

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│    (HTML/CSS/JavaScript - Views)    │
├─────────────────────────────────────┤
│         Business Logic Layer        │
│      (PHP Business Rules & APIs)    │
├─────────────────────────────────────┤
│         Data Access Layer           │
│    (Database Connection & Queries)  │
├─────────────────────────────────────┤
│         Database Layer              │
│      (MySQL - Relational Database)  │
└─────────────────────────────────────┘
```

### Design Patterns Implemented
- **MVC-inspired architecture**: Separation of concerns across modules
- **Session-based authentication**: Server-side session management
- **Modular organization**: Feature-specific directory structure
- **Data encapsulation**: Business logic isolated in dedicated modules

## 💻 Installation & Setup

### Prerequisites
- PHP 5.3 or higher
- MySQL Server
- Web server (Apache recommended)
- Modern web browser

### Configuration Steps

1. **Database Setup**
   ```sql
   -- Create database
   CREATE DATABASE test;
   USE test;
   
   -- Execute BD.txt SQL scripts to create tables and seed initial data
   ```

2. **Database Connection**
   - Update [DATOS/coneccion.php](DATOS/coneccion.php) with your database credentials:
   ```php
   $link = mysql_connect("localhost", "root", "your_password");
   mysql_select_db("test", $link);
   ```

3. **Web Server Configuration**
   - Place the FREK directory in your web root (htdocs for Apache)
   - Ensure the web server has read/write permissions on the project directory

4. **Access the Application**
   - Navigate to `http://localhost/FREK/PRESENTACION/index.php`
   - Login with credentials defined in database initialization

## 🚀 Usage

### For Regular Users
1. Log in with your credentials
2. Access your dashboard
3. View available products
4. Create and manage sales orders
5. Track order history
6. View personal information and profile

### For Administrators
1. Log in with admin credentials
2. Access administrative dashboard
3. Manage all users (create, edit, delete)
4. Oversee all sales transactions
5. Generate comprehensive sales reports and analytics
6. Monitor system performance

### Public Access
- Visit `point/index.html` for the public-facing website
- Browse products and services
- Submit contact inquiries

## 📁 Project Structure

```
FREK/
├── PRESENTACION/              # Main presentation layer
│   ├── index.php             # Login page & entry point
│   ├── indexADMIN.php        # Admin dashboard
│   ├── indexUSUARIO.php      # User dashboard
│   ├── productos.php         # Product listings
│   ├── contactenos.php       # Contact form
│   └── GESTIONusuarios.php   # User management
│
├── NEGOCIO/                   # Business logic layer
│   ├── Functions.php         # Core business functions
│   ├── FusionCharts.php      # Chart integration
│   ├── gestionUSU.php        # User management logic
│   ├── productos.php         # Product management
│   ├── carro.php             # Shopping cart
│   ├── USUARIOS/             # User module
│   │   ├── INSERTARusuario.php
│   │   ├── editarUSUARIO.php
│   │   └── eliminarUSUARIO.php
│   └── VENTAS/               # Sales module
│       ├── agregarVentaADmin.php
│       └── editarVENTA.php
│
├── DATOS/                     # Data access layer
│   ├── coneccion.php         # Database connection
│   └── css/, js/             # Shared assets
│
├── point/                     # Public website
│   ├── index.html
│   ├── productos.html
│   ├── servicios.html
│   ├── nosotros.html
│   ├── contactenos.html
│   └── css/, js/             # Front-end resources
│
├── BD.txt                     # Database schema & sample data
└── README.md                  # This file
```

## 🔧 Key Modules

### Authentication Module
- **Entry Point**: PRESENTACION/index.php
- **Functionality**: User login, credential validation, session initialization
- **Security**: Password verification, active user status checks

### User Management Module (NEGOCIO/USUARIOS/)
- Create new user accounts
- Edit existing user information
- Delete/deactivate users
- Role assignment (Admin/User)
- User status management

### Sales Management Module (NEGOCIO/VENTAS/)
- Create sales orders
- Edit order details
- Track order status
- Manage payment terms
- Schedule shipments

### Product Management Module (NEGOCIO/)
- Maintain product catalog
- Display product details
- Manage inventory information
- Product showcase

### Analytics Module (NEGOCIO/)
- Integration with FusionCharts
- Sales data visualization
- 3D bar and pie charts
- Statistical reports

## 🗄 Database Schema

### Core Tables

**usuarios** (Users Table)
```
- nombre (PK): Full name of user
- correo: Email address
- nomUSU: Username for login
- passUSU: Password (hashed recommended)
- identificacion: National ID
- ciudad: City of residence
- telefono: Contact phone number
- direccion: Street address
- cargoUSU: User role (ADMINISTRADOR/null)
- estadoUSU: Account status (ACTIVO/INACTIVO)
```

**pedido_venta** (Sales Orders Table)
```
- cod_pedido (PK): Auto-increment order ID
- fecha_orden: Order date
- cantidad_productos: Product quantity
- plazoPago: Payment terms
- fecha_despacho: Shipping date
- nombre (FK): Reference to usuarios.nombre
```

## ⚠️ Security Considerations

### Current Implementation
- Session-based authentication
- Login credential validation
- User status verification
- Role-based access control

### Recommended Security Enhancements
1. **Password Security**
   - Implement password hashing (bcrypt/SHA-256)
   - Add salt to password storage
   - Enforce strong password policies

2. **SQL Injection Prevention**
   - Implement prepared statements/parameterized queries
   - Use mysqli or PDO instead of deprecated mysql extension

3. **Session Security**
   - Implement CSRF token protection
   - Add session timeout mechanisms
   - Secure cookie attributes (HttpOnly, Secure flags)

4. **Input Validation**
   - Sanitize all user inputs
   - Validate data types and formats
   - Implement rate limiting on login attempts

5. **HTTPS/SSL**
   - Enable SSL/TLS encryption
   - Use secure connections for all data transfer

6. **Access Control**
   - Verify user permissions before processing requests
   - Implement audit logging for admin actions

## 🚀 Future Enhancements

### Technical Improvements
- [ ] Migrate from deprecated `mysql_*` functions to MySQLi/PDO
- [ ] Implement prepared statements for SQL injection prevention
- [ ] Add comprehensive error handling and logging
- [ ] Implement unit and integration testing
- [ ] Optimize database queries with indexing strategy
- [ ] Add caching mechanisms (Redis/Memcached)

### Feature Additions
- [ ] Advanced reporting and export functionality (PDF, Excel)
- [ ] Multi-language support (i18n)
- [ ] Mobile-responsive redesign
- [ ] REST API for third-party integrations
- [ ] Email notifications for orders and user actions
- [ ] Customer dashboard with order history
- [ ] Inventory alerts and low-stock notifications
- [ ] Payment gateway integration
- [ ] Two-factor authentication (2FA)
- [ ] Real-time inventory tracking

### Performance Optimization
- [ ] Database query optimization
- [ ] Asset minification and bundling
- [ ] Implement page caching
- [ ] Content Delivery Network (CDN) integration
- [ ] Database connection pooling

## 👨‍💼 Development Information

**Project Type**: Academic/Commercial Full-Stack Web Application
**Complexity**: Enterprise-level multi-tier architecture
**Target Users**: Business administrators, sales teams, system users
**Status**: Functional implementation

## 📝 License

This project is provided as-is. Please refer to your organization's licensing policies.

## 📧 Support

For technical support or questions regarding this system, please contact the system administrator or development team.

---

**Built with attention to professional software engineering practices and enterprise application architecture.**
