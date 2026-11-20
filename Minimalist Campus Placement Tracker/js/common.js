/* 
========================================================================
   COMMON SYSTEM UTILITIES & SEEDER
   Includes Toast System, Loaders, Validators, and Demo Data Seeder.
========================================================================
*/

import { collection, doc, getDocs, writeBatch, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// =====================================================================
// 1. Toast Notification Alert System
// =====================================================================
export function showToast(title, message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  
  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Set type icon
  let icon = '🔔';
  if (type === 'success') icon = '⚡';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${message}</div>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Auto remove toast
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, duration);
}

// =====================================================================
// 2. Loading Spinner Utility
// =====================================================================
export function toggleLoader(show, containerId = null) {
  if (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (show) {
      container.innerHTML = `
        <div class="loader-container">
          <div class="spinner"></div>
          <p class="text-muted" style="margin-top: 12px; font-size: 0.85rem;">Fetching real-time data...</p>
        </div>
      `;
    } else {
      container.innerHTML = '';
    }
  } else {
    // Full screen overlay loader
    let overlay = document.getElementById('full-screen-loader');
    
    if (show) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'full-screen-loader';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        
        overlay.innerHTML = `
          <div class="spinner"></div>
          <h3 style="margin-top: 16px; font-weight: 700;">Placement Tracker</h3>
          <p class="text-muted" style="font-size: 0.9rem;">Securing connection & database...</p>
        `;
        document.body.appendChild(overlay);
      }
    } else {
      if (overlay) {
        overlay.remove();
      }
    }
  }
}

// =====================================================================
// 3. Validation Rules Helpers
// =====================================================================
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export function validateCGPA(cgpa) {
  const score = parseFloat(cgpa);
  return !isNaN(score) && score >= 0.0 && score <= 10.0;
}

export function isEmpty(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

// =====================================================================
// 4. Sample Database Seeder
// =====================================================================
export async function seedDemoData(db) {
  toggleLoader(true);
  try {
    // 1. Seed companies if the collection is empty
    const companyColRef = collection(db, "companies");
    const companySnap = await getDocs(companyColRef);
    
    if (companySnap.empty) {
      const sampleCompanies = [
        {
          companyName: "Google",
          role: "Software Engineer",
          package: "35 LPA",
          minCGPA: 8.5,
          deadline: "2026-10-15",
          description: "Build infrastructure, large-scale systems, web tools and cloud services. Proficiency in DSA is required."
        },
        {
          companyName: "Microsoft",
          role: "Data Scientist",
          package: "28 LPA",
          minCGPA: 8.0,
          deadline: "2026-09-30",
          description: "Analyze vast customer telemetry data, design ML models, and scale intelligence inside Azure and Office 365."
        },
        {
          companyName: "Amazon",
          role: "Cloud Support Engineer",
          package: "18 LPA",
          minCGPA: 7.5,
          deadline: "2026-09-10",
          description: "Support global customer deployments in AWS Cloud. Excellent networking and Linux fundamentals required."
        },
        {
          companyName: "Accenture",
          role: "Associate Software Engineer",
          package: "6.5 LPA",
          minCGPA: 6.5,
          deadline: "2026-08-25",
          description: "Work on global system integration projects, client requirements engineering, and full-stack enterprise development."
        },
        {
          companyName: "Infosys",
          role: "Systems Engineer",
          package: "4.5 LPA",
          minCGPA: 6.0,
          deadline: "2026-08-20",
          description: "Provide enterprise IT consulting, maintenance, automation testing, and core application development services."
        }
      ];
      
      const batch = writeBatch(db);
      sampleCompanies.forEach((company) => {
        const newDocRef = doc(collection(db, "companies"));
        batch.set(newDocRef, {
          companyId: newDocRef.id,
          ...company
        });
      });
      await batch.commit();
      showToast("Seeder", "Companies successfully populated!", "info");
    }

    // 2. Seed students if students collection is empty
    const studentColRef = collection(db, "students");
    const studentSnap = await getDocs(studentColRef);
    
    if (studentSnap.empty) {
      const sampleStudents = [
        {
          uid: "seed-uid-1",
          name: "Aditi Sharma",
          usn: "1RV22CS001",
          branch: "CSE",
          cgpa: 9.2,
          skills: "Java, Spring Boot, React, SQL",
          email: "aditi@placement.com",
          placementStatus: "Unplaced"
        },
        {
          uid: "seed-uid-2",
          name: "Rohan Verma",
          usn: "1RV22CS002",
          branch: "ISE",
          cgpa: 8.5,
          skills: "Python, Django, PostgreSQL, AWS",
          email: "rohan@placement.com",
          placementStatus: "Unplaced"
        },
        {
          uid: "seed-uid-3",
          name: "Sneha Patil",
          usn: "1RV22CS003",
          branch: "CSE",
          cgpa: 7.8,
          skills: "JavaScript, HTML/CSS, MongoDB, Node.js",
          email: "sneha@placement.com",
          placementStatus: "Unplaced"
        },
        {
          uid: "seed-uid-4",
          name: "Vikram Gowda",
          usn: "1RV22CS004",
          branch: "ECE",
          cgpa: 6.9,
          skills: "C++, Embedded Systems, IoT, Arduino",
          email: "vikram@placement.com",
          placementStatus: "Unplaced"
        },
        {
          uid: "seed-uid-5",
          name: "Preethi Rao",
          usn: "1RV22CS005",
          branch: "CSE",
          cgpa: 9.5,
          skills: "Python, PyTorch, Scikit-Learn, Pandas",
          email: "preethi@placement.com",
          placementStatus: "Placed"
        },
        {
          uid: "seed-uid-6",
          name: "Abhishek M",
          usn: "1RV22CS006",
          branch: "ISE",
          cgpa: 8.1,
          skills: "Kotlin, Android SDK, SQLite, Firebase",
          email: "abhishek@placement.com",
          placementStatus: "Unplaced"
        },
        {
          uid: "seed-uid-7",
          name: "Divya K",
          usn: "1RV22CS007",
          branch: "ECE",
          cgpa: 7.4,
          skills: "MATLAB, SystemVerilog, Python, VHDL",
          email: "divya@placement.com",
          placementStatus: "Unplaced"
        },
        {
          uid: "seed-uid-8",
          name: "Sanjay Dutt",
          usn: "1RV22CS008",
          branch: "CSE",
          cgpa: 8.9,
          skills: "C++, STL, MySQL, Git",
          email: "sanjay@placement.com",
          placementStatus: "Unplaced"
        },
        {
          uid: "seed-uid-9",
          name: "Megha Nair",
          usn: "1RV22CS009",
          branch: "ISE",
          cgpa: 9.1,
          skills: "AWS, Docker, Kubernetes, Linux, Nginx",
          email: "megha@placement.com",
          placementStatus: "Unplaced"
        },
        {
          uid: "seed-uid-10",
          name: "Karthik S",
          usn: "1RV22CS010",
          branch: "EEE",
          cgpa: 7.2,
          skills: "Power Circuits, MATLAB, C Programming",
          email: "karthik@placement.com",
          placementStatus: "Unplaced"
        }
      ];

      const batch = writeBatch(db);
      sampleStudents.forEach((student) => {
        const studentDocRef = doc(db, "students", student.uid);
        batch.set(studentDocRef, student);
      });
      await batch.commit();
      showToast("Seeder", "10 Students successfully pre-seeded!", "info");
    }

    // 3. Seed sample application connection mapping
    const appColRef = collection(db, "applications");
    const appSnap = await getDocs(appColRef);
    
    if (appSnap.empty) {
      // Find Rohan Verma (seed-uid-2) and Amazon/Accenture IDs
      const companiesDocs = await getDocs(collection(db, "companies"));
      let amazonId = "";
      let accentureId = "";
      
      companiesDocs.forEach((doc) => {
        const data = doc.data();
        if (data.companyName === "Amazon") amazonId = data.companyId;
        if (data.companyName === "Accenture") accentureId = data.companyId;
      });

      if (amazonId && accentureId) {
        const sampleApps = [
          {
            studentId: "seed-uid-2",
            studentName: "Rohan Verma",
            studentUSN: "1RV22CS002",
            studentCGPA: 8.5,
            studentBranch: "ISE",
            companyId: amazonId,
            companyName: "Amazon",
            role: "Cloud Support Engineer",
            status: "Shortlisted",
            appliedDate: "2026-05-22"
          },
          {
            studentId: "seed-uid-2",
            studentName: "Rohan Verma",
            studentUSN: "1RV22CS002",
            studentCGPA: 8.5,
            studentBranch: "ISE",
            companyId: accentureId,
            companyName: "Accenture",
            role: "Associate Software Engineer",
            status: "Applied",
            appliedDate: "2026-05-23"
          },
          {
            studentId: "seed-uid-1",
            studentName: "Aditi Sharma",
            studentUSN: "1RV22CS001",
            studentCGPA: 9.2,
            studentBranch: "CSE",
            companyId: amazonId,
            companyName: "Amazon",
            role: "Cloud Support Engineer",
            status: "Applied",
            appliedDate: "2026-05-23"
          }
        ];

        const batch = writeBatch(db);
        sampleApps.forEach((app) => {
          const newDocRef = doc(collection(db, "applications"));
          batch.set(newDocRef, {
            applicationId: newDocRef.id,
            ...app
          });
        });
        await batch.commit();
        showToast("Seeder", "Sample applications linked successfully!", "success");
      }
    }
    
    showToast("Setup Ready", "Dummy placement data seeded. Check local databases!", "success");
  } catch (error) {
    console.error("Seeding Error: ", error);
    showToast("Seeder Error", error.message, "error");
  } finally {
    toggleLoader(false);
  }
}
