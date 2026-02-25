Sales & Inventory Management System
Full-Stack Business Application

FREK is a web-based Sales and Inventory Management System implementing a multi-tier enterprise application architecture.

The project demonstrates practical experience designing and developing a business system integrating authentication, inventory management, sales operations, analytics, and role-based access control backed by a relational database.

This project represents foundational full-stack engineering experience that later informed automation and quality engineering practices.

Project Purpose

FREK was designed to model real-world business operations where multiple user roles interact with shared transactional data.

The system centralizes:

Product inventory management

Sales order processing

User administration

Operational analytics

Public-facing web presence

The application emphasizes separation of concerns between presentation, business logic, and data layers.

Core Business Capabilities
User & Access Management

Secure authentication workflows

Session-based authorization

Role-Based Access Control (Administrator / User)

User lifecycle management

Account status governance

Sales Management

Sales order creation and tracking

Payment term configuration

Shipment scheduling

Historical transaction monitoring

Operational reporting dashboards

Inventory Management

Product catalog administration

Inventory visibility

Product information management

Availability tracking

Analytics & Reporting

Interactive dashboards using FusionCharts

Sales performance visualization

Business intelligence insights

Statistical reporting through graphical analysis

Public Web Module

Includes a marketing-facing website supporting:

Product showcase

Service information

Company profile

Customer contact workflows

System Architecture

FREK follows a layered enterprise architecture model:

Presentation Layer
(HTML / CSS / JavaScript)

Business Logic Layer
(PHP application logic)

Data Access Layer
(Database interaction)

Database Layer
(MySQL relational storage)
Architectural Concepts Demonstrated

Separation of concerns

MVC-inspired organization

Modular feature structure

Session-based authentication

Data encapsulation

Multi-role system design

Technology Stack
Layer	Technology
Backend	PHP 5.3+
Database	MySQL (InnoDB)
Frontend	HTML5, CSS3, JavaScript
Libraries	jQuery
Visualization	FusionCharts
Architecture	Layered / MVC-inspired
Database Design

Core relational entities include:

Users (usuarios)

Stores authentication, identity, and authorization data.

Sales Orders (pedido_venta)

Maintains transactional sales information linked to users through relational references.

The schema demonstrates:

relational modeling

foreign key relationships

transactional data handling

business entity mapping

Security Model
Implemented Controls

Session-based authentication

Role-based authorization

User status validation

Controlled administrative access

Engineering Improvements Identified

(Important from a QA/SDET perspective)

Migration to prepared statements

Modern password hashing strategies

Input validation and sanitization

CSRF protection

Secure session handling

HTTPS enforcement

Documenting these improvements reflects security awareness and system evaluation skills.

Engineering Value in a QA / SDET Context

Developing this system provided direct exposure to:

Backend business logic implementation

Database-driven applications

Authentication workflows

Data integrity challenges

System architecture decisions

This experience informs stronger automation design because tests can be aligned with how systems actually behave internally, not only through UI interaction.

Project Structure Overview

PRESENTACION/   Presentation layer (UI & dashboards)
NEGOCIO/        Business logic modules
DATOS/          Data access layer
point/          Public website
BD.txt          Database schema

The modular organization reflects enterprise application structuring practices.

Future Engineering Enhancements

Planned improvements demonstrate architectural evolution thinking:

Migration to PDO / MySQLi

Prepared statements for SQL security

REST API layer

Improved logging and error handling

Performance optimization

Modern authentication mechanisms (2FA)

Scalable reporting capabilities

SDET Perspective

This project illustrates an important aspect of Quality Engineering:

Effective automation engineers understand how applications are constructed internally.

Experience building full-stack systems improves the ability to:

design meaningful automated tests

validate business logic correctly

identify architectural risk areas

create realistic testing strategies

RAG Optimization Intent

This documentation enables AI-assisted explanations about:

Full-stack development experience

Database-backed systems

Enterprise web architecture

Authentication and authorization models

Backend-aware QA automation approaches