 SiLafazenda Web Module

This project belongs to my thesis project in my Analysis & Development of Computer Software

A comprehensive enterprise inventory and e-commerce management system for agricultural production facilities


Project Overview

SiLafazenda (Sistema Integrado La Fazenda) is an enterprise-grade inventory management and e-commerce platform designed specifically for agricultural production facilities. The system manages multiple production plants, inventory tracking, customer accounts, shopping carts, and transaction processing for a pork production and distribution business.

 Key Capabilities:
- Multi-plant inventory management across 7 distributed production facilities
- Role-based access control (administrators, clients)
- E-commerce functionality with shopping cart and checkout features
- Real-time inventory tracking of products and equipment
- Statistical analytics dashboard for business intelligence
- User authentication and authorization with secure account management
- Responsive web interface compatible with desktop and mobile devices

## Programming Languages:
HTML, Java, JavaScript, CSS, PHP

## Architecture

The application follows a three-tier MVC architecture:

Presentation Layer (JSP)
- Dynamic web pages    
- Client-side validation (jQuery)
- Responsive UI components 

Business Logic Layer (Servlets)
-Request handling
-Data processing
-Session management
-Shopping cart operations
-User authentication

Data Access Layer (JDBC/MySQL)
-Database connectivity
-Query execution 
-Data persistence


Technology Stack

 Backend Technologies
 Java, JSP, Servlets

 Database
 MySQL, InnoDB 
 
 Frontend Technologies
HTML5,CSS3, jQuery 

 Application Server
Apache Tomcat

 Libraries & Dependencies
json_simple, JavaMail, Mail API

 Development Tools
- NetBeans IDE - Primary development environment
- Ant - Build management
- MySQL Workbench - Database design & management



## 🖥️ System Requirements

 Minimum Requirements
- Operating System: Windows XP SP3+, Linux, or macOS
- Java: JDK 6 or higher (JDK 7 recommended)
- RAM: 2 GB minimum (4 GB recommended)
- Storage: 500 MB for application + 1 GB for database
- Disk Space: 2 GB total

 Server Requirements
- Application Server: Apache Tomcat 6.0 or higher
- Database Server: MySQL 5.1 or higher
- Network: TCP ports 8080 (Tomcat), 3306 (MySQL) available

 Browser Compatibility
- Chrome 20+
- Firefox 15+
- Safari 5+
- Internet Explorer 9+
- Mobile browsers (iOS Safari, Chrome Mobile)


## ✨ Key Features

 1. User Management
- Admin and Client role-based access
- User registration with validation
- Secure login authentication
- Session management
- Account profile management

 2. Inventory Management
- Real-time inventory tracking across 7 facilities
- Product categorization (Products vs. Elements/Equipment)
- Stock level monitoring
- Inventory queries and reporting
- Low stock alerts

 3. E-Commerce Platform
- Product browsing and search
- Shopping cart management
- Purchase order creation
- Order confirmation and invoicing
- Purchase history tracking

 4. Facility Management
- Multi-location support (7 production plants)
- Location-based queries
- Facility contact information
- Geographic maps integration
- Facility statistics

 5. Business Intelligence
- Sales statistics and reporting
- Inventory analytics
- User activity tracking
- Revenue reports
- Inventory movement analysis

 6. Communication
- Contact information management
- Email notifications
- Inquiry submission
- Message management



Database Schema

Table Structure Overview


Facilities (7 total):
1. Planta Sembrado - Seed/Planting
2. Planta Recepcion de Granos - Grain Reception
3. Planta Crianza - Animal Raising
4. Planta Sacrificio - Processing/Slaughter
5. Planta Procesos Cerdo - Pork Processing
6. Sede Bosa - Distribution Center
7. Sede Cedritos - Distribution Center

Sample Products:
- Raw seeds and grains
- Processed animal feed
- Live animals for processing
- Processed pork cuts (Paleta, Lomo, Chuleta, etc.)



## 👨‍💻 Author

Project Created By: David (david_000)

Project Name: SiLafazenda Web Module

Created: November 12, 2013

Last Updated: December 7, 2013

Final Project For: Analysis & Development of Computer Software


## 🎓 Technical Notes

 Performance Optimization
- Connection pooling for database
- Prepared statements to prevent SQL injection
- Caching of frequently accessed data
- Minified CSS/JS in production
- Image optimization for web

 Security Considerations
- SQL injection prevention via prepared statements
- XSS protection with input validation
- CSRF tokens for state-changing operations
- Secure session management
- Password hashing for user credentials

 Future Enhancements
- HTTPS/SSL encryption
- OAuth 2.0 authentication
- RESTful API endpoints
- Microservices architecture
- NoSQL caching layer (Redis)
- Mobile-native applications
- Real-time inventory notifications
- Advanced analytics dashboard
