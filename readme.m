# Busy Bean Coffee — Backend API

A scalable RESTful API for a coffee e-commerce and partner management platform built with **Node.js, Express.js, MySQL, and Sequelize ORM**.

## Tech Stack

* Node.js
* Express.js
* MySQL
* Sequelize ORM
* JWT Authentication
* Stripe Payments & Stripe Connect
* Stripe Financial Connections
* Multer (File Uploads)
* Nodemailer (Email Services)
* Puppeteer (PDF Generation)

## Features

### Authentication & Authorization

* Multi-role authentication (Admin / Customer / Local Partner)
* JWT-based authentication
* Role-based access control

### Product & Inventory Management

* Product CRUD operations
* Product image uploads
* Inventory management
* Partner-wise product assignment
* Custom partner pricing

### Order Management

* Dynamic order pricing (Retail & Wholesale)
* Multiple order workflows
* Automated supplier dispatch process
* Real-time order tracking

#### Order Lifecycle

Order Placed → Dispatched → Supplier Acknowledged → Shipped

### Payments & Profit Distribution

* Stripe Payment Intents integration
* ACH bank payments via Stripe Financial Connections
* Stripe Connect payouts (Express & Custom Accounts)
* Automated partner profit calculations
* Bank check recording and payment tracking

### Communication & Invoicing

* Automated email notifications
* Role-based email triggers
* PDF invoice generation using Puppeteer

### Reporting & Analytics

* Partner profit reports
* Pagination on all list endpoints
* Advanced filtering and search functionality

## API Modules

* Authentication
* Users
* Products
* Orders
* Partners
* Payments
* Reports

## Key Highlights

* Scalable REST API architecture
* Secure JWT authentication
* Dynamic pricing engine
* Automated profit distribution system
* Stripe payment ecosystem integration
* Advanced order management workflow
* Production-ready backend structure

## Author

**Muhammad Hamza**
