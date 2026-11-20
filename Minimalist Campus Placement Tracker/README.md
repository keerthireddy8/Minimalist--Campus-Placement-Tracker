# Minimalist Campus Placement Tracker
### A Full-Stack DBMS Mini Project | HTML, CSS, Vanilla JS & Firebase

A premium, modern SaaS-style web application designed to help colleges digitize and manage their campus placement pipeline. Built entirely using high-fidelity Vanilla HTML/CSS/JavaScript with Firebase v10 for secure authentication, Firestore NoSQL real-time databases, and Firebase global CDN hosting.

---

## 📋 Table of Contents
1. [Project Abstract](#-project-abstract)
2. [SaaS Design System & Styling](#-saas-design-system--styling)
3. [DBMS & Architecture Concepts](#-dbms--architecture-concepts)
4. [Entity-Relationship (ER) Diagram Description](#-entity-relationship-er-diagram-description)
5. [Local Setup & Deployment Steps](#-local-setup--deployment-steps)
6. [Academic Viva Q&A (15 Core Questions)](#-academic-viva-qa-15-core-questions)
7. [System Advantages & Future Scope](#-system-advantages--future-scope)

---

## 📝 Project Abstract

Traditional collegiate placement cells rely on fragmented, labor-intensive spreadsheets to capture student records, log recruiter criteria, and monitor hiring pipelines. This paper-and-file approach is highly prone to data integrity issues, delayed notifications, and mismatched criteria where uneligible students inadvertently apply for companies.

The **Minimalist Campus Placement Tracker** provides a sleek, automated solution. The system maintains two primary roles: **Students** who can build their profile, track placement progress, and instantly apply to eligible jobs; and **Admins** who manage corporate job offerings, view student logs, and drive the recruitment pipeline status. 

Through real-time database syncing, the application enforces academic rules—such as CGPA eligibility cutoffs and application deadlines—at the client and database layers, ensuring 100% data coordination and operational efficiency.

---

## 🎨 SaaS Design System & Styling

The user interface of the placement tracker has been engineered to resemble top-tier modern enterprise software:
- **Palette:** Minimalist deep navy (`#0F172A`), royal blue (`#2563EB`) as the focal accent, pristine card white, and background gray.
- **Micro-Animations:** Fluid, cubic-bezier hover transitions on corporate cards, pulsing state changes, and a non-obtrusive, slide-in slide-out toast alert notification system.
- **Glassmorphism:** Elegant login forms with translucent frosted panels, crisp shadows, and distinct structural sidebars.
- **Responsive Layout:** Tailored using CSS Grid and Flexbox with media-queries. It adapts perfectly from 4K desktop screens down to mobile smartphones.

---

## 💾 DBMS & Architecture Concepts

While built on **Google Firebase Firestore** (a high-performance, document-oriented NoSQL database), this project carefully implements fundamental database management systems (DBMS) schemas and constraints:

1. **Many-to-Many (M:N) Relationship Mapping:**
   A student can apply to multiple companies, and a company can receive applications from multiple students. This M:N relationship is resolved through the `applications` collection, which serves as a **junction table (associative entity)** containing foreign keys pointing to `students` and `companies`.
   
2. **Referential Integrity & Cascading updates:**
   When an admin updates a student's selection status in the `applications` collection to **"Selected"**, the application automatically triggers a transactional change updating the student's status to **"Placed"** in the `students` collection. If the offer is rescinded, the status rolls back to **"Unplaced"**.

3. **Database Constraints (Cutoff Guards):**
   Academic eligibility represents a conditional constraint. Before submitting a document to the `applications` collection, the system queries the `students.cgpa` attribute and compares it against the `companies.minCGPA` cutoff. If the constraint is violated, the transaction is rejected.

4. **Data Denormalization:**
   In NoSQL environments, performing complex relational joins on-the-fly slows down processing. To optimize performance, we denormalize (cache) key fields (like `studentName`, `studentUSN`, `companyName`, and `role`) directly into the `applications` documents, mimicking a pre-compiled View.

---

## 📐 Entity-Relationship (ER) Diagram Description

Below is the logical structure representing the entities and relations of our system:

### 1. **Entities & Attributes:**
*   **STUDENT (Strong Entity)**
    *   `uid` (Primary Key, String): Firebase Authentication reference.
    *   `name` (String): Full name of the candidate.
    *   `usn` (Key, Unique String): University Seat Number.
    *   `branch` (String): Academic stream (CSE, ISE, ECE, EEE, ME).
    *   `cgpa` (Number): Cumulative GPA (decimal 0.00 to 10.00).
    *   `skills` (String): Comma-separated technical keywords.
    *   `email` (String, Unique): Institution email ID.
    *   `placementStatus` (String): State tracker ("Unplaced" or "Placed").
    
*   **COMPANY (Strong Entity)**
    *   `companyId` (Primary Key, String): Unique identifier.
    *   `companyName` (String): Corporate partner name.
    *   `role` (String): Designated job profile.
    *   `package` (String): Compensation CTC details (e.g. "12 LPA").
    *   `minCGPA` (Number): Cutoff CGPA requirement constraint.
    *   `deadline` (String): Date limit (YYYY-MM-DD).
    *   `description` (String): Job descriptions.

*   **APPLICATION (Associative Entity resolving Many-to-Many)**
    *   `applicationId` (Primary Key, String): Unique transaction ID.
    *   `studentId` (Foreign Key, String): References `STUDENT.uid`.
    *   `companyId` (Foreign Key, String): References `COMPANY.companyId`.
    *   `status` (String): Current progress ("Applied", "Shortlisted", "Selected", "Rejected").
    *   `appliedDate` (String): Date of filing.

*   **ADMIN (Strong Entity)**
    *   `uid` (Primary Key, String): Firebase Auth link.
    *   `email` (String): Admin login.
    *   `role` (String): Set to `"admin"`.

### 2. **Relationships:**
*   **APPLIES_FOR (`STUDENT` to `COMPANY`):** M:N (Many-to-Many) cardinality. Resolved by the **APPLICATION** associative entity.
    *   A student can register *zero-to-many* applications.
    *   A company can receive *zero-to-many* applications.
*   **MANAGES (`ADMIN` to `COMPANY` / `STUDENT`):** 1:N (One-to-Many) cardinality.
    *   An admin can create, modify, or delete *many* company accounts.

---

## ⚡ Local Setup & Deployment Steps

To run this application locally or host it on the web, follow these steps:

### Prerequisites:
- A modern web browser.
- [Node.js](https://nodejs.org/) installed (for Firebase CLI operations).

### Step 1: Clone or Copy Project Files
Ensure all project files are organized inside the folder:
```
project/
├── css/style.css
├── js/firebaseConfig.js, auth.js, student.js, admin.js, common.js
├── index.html, login.html, register.html, student.html, admin.html
├── firebase.json
└── .firebaserc
```

### Step 2: Configure Firebase API Credentials
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project called **Campus Placement Tracker**.
2. Enable **Firebase Authentication** (Sign-in method: Email/Password).
3. Enable **Cloud Firestore Database** (Start in Test Mode or configure security rules).
4. Register a Web App in Firebase Settings, copy your `firebaseConfig` object, and paste it into `js/firebaseConfig.js` to replace the placeholders:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### Step 3: Local Live-Testing
To run a local static server to test role redirection and live changes, open your terminal (PowerShell/Command Prompt) in the project directory and run:
```bash
# Using standard Python server
python -m http.server 8000

# OR using Node.js global live-server
npx live-server
```
Navigate to `http://localhost:8000` (or the port provided) in your browser.

### Step 4: Database Auto-Seeding
On the landing page (`index.html`), click the **"⚡ Setup Demo Data"** button in the floating mock card. This instantly seeds:
- 5 corporations (Google, Microsoft, Amazon, Accenture, Infosys)
- 10 sample students (with distinct GPAs and skill inventories)
- Initial application mappings.

### Step 5: Firebase Global Deployment
Host your mini project live on the web for free using Firebase Hosting:
```bash
# 1. Install Firebase Command Line Interface globally
npm install -g firebase-tools

# 2. Login to your Google account via browser authorization
firebase login

# 3. Associate your project (replaces placeholder in .firebaserc)
firebase use --add YOUR_FIREBASE_PROJECT_ID

# 4. Deploy your app globally
firebase deploy
```
Once deployed, Firebase will provide you with a live secure hosting link (e.g., `https://your-project.web.app`) to share with your project evaluators!

---

## 🎓 Academic Viva Q&A (15 Core Questions)

Here are the top 15 questions frequently asked by external evaluators during DBMS Mini Project examinations, along with professional responses:

#### Q1: What is the primary objective of this project?
> **Answer:** The primary objective is to build a centralized campus recruitment database system that automates profile management, eligibility verification, company cutoff checks, application submissions, and placement tracking, thereby replacing manual, error-prone spreadsheets.

#### Q2: Why did you choose NoSQL (Firestore) over a traditional Relational DBMS like MySQL?
> **Answer:** Firestore provides seamless real-time syncing, offline support, and horizontal scaling. For campus placement cycles with hundreds of concurrent student logins and rapid profile updates, a real-time Document DB provides instant, lag-free UI state updates and simplified deployment without maintaining a custom Node.js backend.

#### Q3: How do you resolve a Many-to-Many (M:N) relationship in your database?
> **Answer:** An M:N relationship exists between `students` and `companies`. We resolve this by creating an associative collection (equivalent to a junction table) called `applications`. Each application document holds a reference to `studentId` and `companyId`, thereby converting the M:N relationship into two separate, manageable 1:M relationships.

#### Q4: What is data denormalization, and why did you use it in your applications collection?
> **Answer:** Denormalization is the practice of caching redundant data fields into a document to avoid expensive join queries. In our `applications` collection, we cache the student's name, USN, branch, CGPA, and the company's name and role. This allows us to populate dashboards instantly with a single query, optimizing load times.

#### Q5: How is user authorization and role-based security managed in this application?
> **Answer:** Security is managed via a combination of Firebase Authentication and Firestore document checking. When a user authenticates, our navigation guard (`checkAuthState`) queries their UID against both the `admins` and `students` collections. Unauthorized cross-access (e.g. a student attempting to access `admin.html`) is instantly blocked and redirected at the routing layer.

#### Q6: Explain how you enforce the CGPA academic eligibility cutoff constraint in your code.
> **Answer:** Before allowing a student to apply, the system checks the `cgpa` attribute of the logged-in student against the `minCGPA` of the target company. If the student's CGPA is less than the cutoff, the "Apply" button is disabled and replaced with an alert badge, preventing invalid entries from ever entering the `applications` collection.

#### Q7: What are Firestore collections and documents? How do they compare to SQL tables?
> **Answer:**
> *   A **Collection** is a container of related records, equivalent to a **Table** in SQL.
> *   A **Document** is a single JSON-like record containing key-value pairs, equivalent to a **Row** in SQL.
> *   **Fields** inside a document are equivalent to **Columns** in SQL.

#### Q8: What is a Firestore Transaction? How is it implemented when a student gets selected?
> **Answer:** A transaction is a sequence of operations executed as a single, atomic unit of work. In this system, when an admin changes an application's status to "Selected", the system executes a transactional update that updates the application document's `status` to "Selected" and also updates the corresponding student's general `placementStatus` to "Placed" in the `students` collection.

#### Q9: What happens if you try to register a user with an email that is pre-seeded?
> **Answer:** Our registration function (`registerStudent`) checks if a pre-seeded student profile exists with that email. If found, it deletes the dummy pre-seeded record, creates a new authenticated student record, and seamlessly transfers the pre-seeded USN, CGPA, and profile data over to their new Auth UID.

#### Q10: How are indexes used in Firestore, and do you need composite indexes for this project?
> **Answer:** Indexes make query speeds independent of dataset sizes. Firestore automatically creates single-field indexes for every field in a document. For queries filtering by multiple fields (e.g. fetching applications by `studentId` AND sorting by `status`), a composite index is generated.

#### Q11: How do you prevent SQL Injection or NoSQL injection attacks in this application?
> **Answer:** SQL injection occurs when raw user inputs are concatenated into database query strings. In Firebase, database operations are carried out using official SDK methods (`doc()`, `query()`, `where()`) which treat input strictly as typed parameters rather than executable command strings, completely neutralizing injection vectors.

#### Q12: What is the purpose of the `.firebaserc` file?
> **Answer:** The `.firebaserc` file defines project aliases. It maps the local project directory to your specific remote Firebase console project ID, allowing you to run deployment commands without having to re-specify the project target each time.

#### Q13: What are the benefits of using `"cleanUrls": true` in your `firebase.json`?
> **Answer:** The `cleanUrls` configuration removes the `.html` extension from web paths. This makes the URL routing look modern, professional, and clean (e.g., `/login` instead of `/login.html`), which is crucial for modern production-grade web applications.

#### Q14: How are dates and deadlines validated in this system?
> **Answer:** The company deadlines are stored as ISO standard string dates (`YYYY-MM-DD`). In `student.js`, we retrieve today's local date in the same string format. If the deadline string is lexicographically smaller than today's date string, the system recognizes that the deadline has passed, marks the status as "Closed", and blocks applications.

#### Q15: How can we scale this system to support multiple colleges (Multi-tenant structure)?
> **Answer:** To support multiple colleges, we could introduce a `colleges` collection and append a `collegeId` field to `students`, `admins`, `companies`, and `applications`. Every query would then filter records by the authenticated user's `collegeId`, ensuring strict tenant isolation on a single database cluster.

---

## 🚀 System Advantages & Future Scope

### Key Advantages:
*   **Zero Infrastructure Costs:** Runs on serverless cloud architecture.
*   **Bulletproof Data Consistency:** Real-time updates ensure student profiles and application pipelines are always in sync.
*   **Automated Eligibility Guards:** Prevents unqualified candidates from applying, saving recruiters' review time.
*   **Modern SaaS UX:** Elegant dark sidebar, clean visual cues, and beautiful, responsive grid-based cards.

### Future Scope for Enhancements:
1.  **Resume Uploads:** Integrating Firebase Storage to allow students to upload and parse PDF resumes.
2.  **Email Alerts:** Integrating Firebase Cloud Functions and Nodemailer to automatically email students when a new company matching their GPA registers.
3.  **Analytics Charts:** Integrating Chart.js into the Admin dashboard to display graphical reports on department-wise selection rates.
