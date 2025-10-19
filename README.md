# 🛍️ Vendor Mitra

**Vendor Mitra** is a smart vendor–customer interaction platform designed to simplify online shopping and negotiation. It bridges the gap between vendors and buyers through a seamless **bargaining system**, **dynamic cart management**, and **real-time communication** — empowering small businesses and customers alike.

---

## 🚀 Features

- 🤝 **Smart Bargaining System** – Interactive buyer–seller price negotiation built into the cart.
- 🛒 **Dynamic Cart Management** – Automatically updates prices, quantities, and bargains in real time.
- 💬 **Chat Integration** – Live chat context handling for better vendor–customer communication.
- 🧾 **Persistent Orders & Cart Data** – Ensures data consistency even after reloads or logouts.
- 🧹 **Debugged & Enhanced System** – Includes multiple optimizations and fixes for smoother UX.
- 🎨 **Modern UI** – Built using **React**, **Tailwind CSS**, and **Vite** for a responsive, high-speed interface.

---

## 🏗️ Project Structure

VENDOR MITRA/
│

├── Mitra/

│ ├── index.html

│ ├── vite.config.js

│ ├── tailwind.config.js

│ ├── postcss.config.js

│ ├── .env

│ ├── dist/ # Production build output

│ ├── node_modules/ # Dependencies

│ ├── BARGAIN_FIX.md # Patch notes and debugging logs

│ ├── CLEAR.html # Helper/test HTML utilities

│ └── ... (React app source files)
│
├── package-lock.json

└── HOW_TO_USE_BARGAINING.md



---

## 🧩 Tech Stack

| Category | Technology |
|-----------|-------------|
| Frontend | React.js, Vite |
| Styling | Tailwind CSS, PostCSS |
| Build Tool | Vite |
| State / Data | LocalStorage, Context API |
| Deployment | GitHub Pages / Vercel (recommended) |

---

## ⚙️ Installation & Setup

Follow these steps to set up the project locally:

```bash
# 1️⃣ Clone the repository
git clone https://github.com/<your-username>/VENDOR-MITRA.git
cd VENDOR-MITRA/Mitra

# 2️⃣ Install dependencies
npm install

# 3️⃣ Run the development server
npm run dev

# 4️⃣ Build for production
npm run build

# 5️⃣ Preview the production build
npm run preview

🧠 Key Functional Modules

Bargaining Module – Enables price negotiation and dynamic cart updates.

Cart System – Tracks discounts, updates, and real-time price adjustments.

Chatbot Integration – Context-aware system to recall past interactions and orders.

Persistence Layer – Uses browser storage and backend APIs to retain state.

🧹 Fix Logs & Enhancements

Detailed explanations of all bug fixes and improvements can be found in the included markdown files:

BARGAIN_CART_FIXES.md

BARGAIN_UI_UPDATE_FIX.md

CHATBOT_CONTEXT_FIX.md

FINAL_FIXES_COMPLETE.md

Each file documents resolved issues, debugging steps, and feature improvements.

🎯 Future Enhancements

AI-powered bargaining suggestions based on product trends.

Vendor analytics dashboard.

Integration with UPI and wallet-based payments.

Multi-language support.

💡 Inspiration

Vendor Mitra was built to empower local vendors by providing a digital platform that combines negotiation, transparency, and accessibility — making digital commerce more personal and fair.


