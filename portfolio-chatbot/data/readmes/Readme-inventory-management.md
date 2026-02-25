SiLafazenda Web Module
Enterprise Inventory & E-Commerce Management Platform

SiLafazenda (Sistema Integrado La Fazenda) is an enterprise web application developed to manage inventory, commerce operations, and logistics across multiple agricultural production facilities.

The system supports distributed inventory control, transactional purchasing workflows, and role-based operational management for a large-scale pork production and distribution organization.

This project demonstrates experience working with enterprise Java web architectures, relational data systems, and multi-location business platforms.

Project Purpose

The platform centralizes operational processes across seven production plants, enabling coordinated management of inventory, customers, and commercial transactions through a unified web system.

Core objectives included:

Centralized inventory visibility

E-commerce purchasing workflows

Facility-level operational tracking

Secure user access management

Business analytics and reporting

The application reflects real-world enterprise system design where multiple actors interact with shared transactional data.

System Architecture

The application follows a classic three-tier MVC enterprise architecture.

Presentation Layer (JSP Views)
        ↓
Business Logic Layer (Java Servlets)
        ↓
Data Access Layer (JDBC)
        ↓
MySQL Relational Database
Architectural Characteristics

MVC-inspired separation of concerns

Server-side session management

Servlet-based request orchestration

Database-driven business logic

Modular enterprise deployment (WAR packaging)

This architecture mirrors traditional large-scale Java enterprise applications deployed in production environments.

Core Platform Capabilities
Multi-Plant Inventory Management

Inventory tracking across 7 distributed facilities

Product and equipment classification

Stock monitoring and reporting

Location-based inventory queries

E-Commerce Operations

Product browsing and catalog management

Shopping cart workflows

Checkout and purchase processing

Invoice generation

Purchase history tracking

User & Access Management

Authentication and session handling

Role-based authorization (Admin / Client)

Account lifecycle management

Secure user interaction workflows

Business Intelligence & Analytics

Operational statistics dashboards

Inventory analytics

Transaction monitoring

Facility performance insights

Technology Stack
Backend
Technology	Role
Java	Core application logic
JSP	Dynamic presentation layer
Servlets	Request handling
JDBC	Database interaction
Apache Tomcat	Application server
Ant	Build automation
Database
Technology	Purpose
MySQL (InnoDB)	Transactional relational storage
Frontend

HTML5

CSS3

jQuery ecosystem

AJAX-based interactions

DataTables UI components

Enterprise Deployment Model

The application is packaged as a WAR (Web Application Archive) and deployed to an application server environment.

Typical deployment flow:

Source Code
   ↓
Ant Build
   ↓
WAR Packaging
   ↓
Tomcat Deployment
   ↓
Enterprise Web Application

This reflects traditional enterprise Java delivery pipelines still widely used in corporate environments.

Database Design

The relational schema models operational business entities including:

Production facilities (sede)

Inventory assets (inventario)

Commercial products (producto)

Users and roles (usuario)

Shopping carts (carrito)

Purchase transactions (compra)

The design demonstrates:

relational normalization

transactional integrity

foreign key relationships

business entity modeling

Engineering Concepts Demonstrated

Enterprise Java web development

Multi-tier system architecture

Session-based authentication systems

Transactional database design

Distributed inventory systems

Server-side application deployment

Business workflow modeling

Security Considerations

Implemented and evaluated controls include:

Role-based authorization

Session lifecycle management

Input validation strategies

Prepared statement usage

Secure credential handling

Security improvements identified reflect architectural review and system hardening awareness.

QA / SDET Perspective

Experience developing enterprise applications provides critical advantages when designing automation strategies.

Understanding internal system behavior improves the ability to:

design meaningful end-to-end tests

validate business logic correctly

identify integration risk areas

automate complex transactional systems

collaborate effectively with backend teams

This background strengthens Quality Engineering beyond UI-level validation.

Project Structure Overview
src/java/        Servlets & backend logic
web/             JSP views and frontend assets
WEB-INF/         Deployment configuration
dist/            Deployable WAR artifacts
database/        Schema initialization

The structure aligns with standard Java enterprise application organization.

SDET Portfolio Significance

Within the broader portfolio, this project demonstrates:

✅ Enterprise backend development experience
✅ Java ecosystem familiarity
✅ Large system architecture exposure
✅ Database-driven application design
✅ Operational business system understanding

Combined with automation repositories, this shows capability across both system creation and system validation.

RAG Optimization Intent
This documentation enables AI-assisted explanations about:
Enterprise Java applications
Legacy system testing environments
Inventory and commerce platforms
Multi-tier architectures
Backend-aware automation strategies