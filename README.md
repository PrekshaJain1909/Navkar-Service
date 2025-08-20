# 🚌 Bus Fee Manager

**A smart solution for school bus fee collection and automated reminders**  
*Built with care for Chacha's bus service*

![Project Screenshot](./frontend/public/screenshot.png)
<!-- Replace with actual screenshot path -->

---

## ✨ Features

- **Automated Payment Reminders**  
  📧 Email | 📱 SMS | 💬 WhatsApp  
  *(Cron-based scheduled notifications)*

- **Student Management**  
  📝 Add/Edit student details | 🏷️ Track fee payment history

- **Real-time Dashboard**  
  📊 Payment status overview | 📅 Due date tracking

- **Customizable Templates**  
  ✉️ Personalize notification messages

- **Multi-Device Support**  
  💻 Desktop | 📱 Mobile-friendly interface

---

## 🛠️ Tech Stack

**Frontend:**  
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)  
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)  
![Shadcn/ui](https://img.shields.io/badge/Shadcn/ui-Elegant_Components-blueviolet)  

**Backend:**  
![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)  
![Express](https://img.shields.io/badge/Express-4.17-lightgrey?logo=express)  
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?logo=mongodb)  

**Notifications:**  
📧 **Nodemailer** | 📱 **Twilio** | 💬 **WhatsApp Web API**

---

## 🚀 Quick Start

### 1️⃣ Clone the repository
```bash
git clone https://github.com/yourusername/bus-fee-manager.git
```
### 2️⃣ Install dependencies
```bash
cd bus-fee-manager
npm install
```
### 3️⃣ Set up environment variables
```bash
Create a .env file in the root directory:
.env
MONGODB_URI=your_mongodb_connection_string
TWILIO_SID=your_twilio_account_sid
TWILIO_TOKEN=your_twilio_auth_token
```
### 4️⃣ Run the development server
```bash
npm run dev
```
### 📂 Project Structure
```bash
bus-fee-manager/
├── Frontend/               # Frontend (Next.js + Shadcn/ui)
├── Backend/               # Backend (Express + MongoDB)
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   └── server.js/         # Business logic (notifications, payments)
└── README.md             # This file
```
### 🤝 Contributing
We welcome contributions!
Fork the project
Create your feature branch
```bash
git checkout -b feature/AmazingFeature
```
Commit your changes
```bash
git commit -m "Add some amazing feature"
```
Push to your branch
```bash
git push origin feature/AmazingFeature
```
Open a Pull Request 🎉
