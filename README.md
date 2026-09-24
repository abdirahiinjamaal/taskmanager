# 🚀 AWS 3-Tier Task Manager

A full-stack Task Manager application deployed on AWS using a 3-tier architecture.

This project demonstrates how to deploy a web application using a separated **Presentation Layer, Application Layer, and Database Layer**, while applying AWS networking, security, load balancing, and Auto Scaling concepts.

---

## 📌 Project Overview

The goal of this project was to build and deploy a complete Task Manager application on AWS and understand how the different components communicate in a real cloud environment.

The application consists of:

- A static frontend hosted on **Amazon S3**
- A Node.js backend running on **Amazon EC2**
- An **Application Load Balancer** for handling API traffic
- An **Auto Scaling Group** managing multiple EC2 instances
- An **Amazon RDS MySQL** database
- An Amazon **VPC** with Public and Private Subnets
- **Security Groups** controlling communication between layers
- A **Bastion Host** for administrative SSH access
- A **NAT Gateway** for outbound Internet connectivity from private resources

The final architecture separates public-facing resources from application and database resources.

---

# 🏗️ Architecture

![AWS 3-Tier Task Manager Architecture](./screenshots/architecture%20diagram.png)

> Click the diagram to view it at full resolution.

[View Full Architecture Diagram](https://app.eraser.io/workspace/byI2Imksjdm5mgBg48bU?origin=share)

---

## 🧱 3-Tier Architecture

The application follows a traditional 3-tier architecture:

```text
┌──────────────────────────┐
│   Presentation Layer     │
│                          │
│      Amazon S3           │
│    HTML / CSS / JS       │
└────────────┬─────────────┘
             │
             │ API Request
             ▼
┌──────────────────────────┐
│    Application Layer     │
│                          │
│ Application Load Balancer│
│           ↓              │
│        EC2 / Node.js     │
│      Auto Scaling Group  │
└────────────┬─────────────┘
             │
             │ MySQL :3306
             ▼
┌──────────────────────────┐
│      Database Layer      │
│                          │
│     Amazon RDS           │
│        MySQL             │
└──────────────────────────┘