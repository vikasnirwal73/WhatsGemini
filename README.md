# WhatsGemini

WhatsGemini is an AI-powered chat application built using **React, Redux, and Tailwind CSS**. It allows users to interact with AI-generated characters and engage in conversations powered by Google Generative AI.

## 🚀 Features

- 🌗 **Dark Mode Support** - Toggle between light and dark themes.
- 🔑 **User Authentication** - Save API keys securely in local storage.
- 🗣️ **AI Chatbot** - Engage in AI-driven conversations.
- 💬 **Multiple Characters** - Create and chat with different characters.
- ✍️ **Edit Characters** - Update character names, descriptions, and prompts.
- 🗑️ **Chat Management** - Delete chats and characters.
- 📜 **Typing Indicator** - Shows when AI is generating a response.
- 📡 **GitHub Pages Deployment** - Easily deploy on GitHub Pages.

---

## 🛠️ Installation & Setup

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/vikasnirwal73/WhatsGemini.git
cd WhatsGemini
```

### **2️⃣ Install Dependencies**
```sh
npm install
```

### **3️⃣ Start the App**
```sh
npm start
```

- Runs the app on `http://localhost:3000/`.
- Hot reloading enabled for development.

## 📂 Project Structure
```
📦 src
 ┣ 📂 components
 ┃ ┣ 📜 ChatWindow.js
 ┃ ┣ 📜 MessageInput.js
 ┃ ┣ 📜 Header.js
 ┃ ┣ 📜 Sidebar.js
 ┃ ┗ 📜 NotFound.js
 ┣ 📂 contexts
 ┃ ┣ 📜 AuthContext.js
 ┃ ┗ 📜 ThemeContext.js
 ┣ 📂 features
 ┃ ┣ 📜 aiSlice.js
 ┃ ┣ 📜 chatSlice.js
 ┃ ┗ 📜 characterSlice.js
 ┣ 📂 pages
 ┃ ┣ 📜 ChatPage.js
 ┃ ┣ 📜 CharacterPage.js
 ┃ ┣ 📜 SettingsPage.js
 ┃ ┗ 📜 Login.js
 ┣ 📂 store
 ┃ ┗ 📜 store.js
 ┣ 📂 utils
 ┃ ┗ 📜 constants.js
 ┗ 📜 App.js
```

---

## 📌 Technologies Used
- **React** - Frontend framework
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Dexie.js** - IndexedDB for local storage
- **Google Generative AI API** - AI-powered chat
- **Tailwind CSS** - Styling

---

## 🙌 Contributing
Want to contribute? Feel free to fork the repo and submit a pull request!

---

## 📄 License
This project is open-source and available under the MIT License.

---

## 🛠️ Author
Developed by **YOUR_NAME**.

📧 Contact: [vikasnirwal73@gmail.com](mailto:vikasnirwal73@gmail.com)

🚀 Happy Coding! 🎉

