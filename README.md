# HealthMatch-BD

> 🚀 **Live Demo:** [https://health-match-bd.vercel.app](https://health-match-bd.vercel.app)

**HealthMatch-BD** is a hospital and doctor discovery web application tailored for Bangladesh, built for the **Ostad Presents YUNet AIgnite Buildathon 2026**.

---

## 🌟 Key Features

* **Hospital & Doctor Search:** Quick and intuitive query matching to find the right medical tests, doctors, and facilities across Dhaka.
* **Bilingual Voice Input:** Supports real-time speech recognition in both English and Bengali (`bn-BD`).
* **Area & Filter Controls:** Clean controls to narrow down searches by medical exam type, preferred gender, and specific area (e.g., Mirpur, Dhanmondi, Azimpur).
* **Modern Accessible UI:** Deep indigo theme with responsive designs and official buildathon branding.

---

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS
* **Database & Backend:** Supabase (PostgreSQL)
* **Speech Processing:** Web Speech API

---

## 🚀 Getting Started

First, clone the repository and install dependencies:

```bash
git clone [https://github.com/laiamzzaman961/HealthMatch-BD.git](https://github.com/laiamzzaman961/HealthMatch-BD.git)
cd HealthMatch-BD
npm install
Environment Variables
Create a .env.local file in the root directory and add your Supabase keys:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
Run Development Server
Bash
npm run dev
Open http://localhost:3000 in your browser to test the application locally.


---

### Steps to update your `README.md`:
1. Open your `README.md` file in VS Code.
2. Replace all existing text with the Markdown content above.
3. Commit and push the updated README:
   ```bash
   git add README.md
   git commit -m "Docs: polish README with live demo link and project details"
   git push origin main
