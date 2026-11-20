/* 
========================================================================
   STUDENT DASHBOARD CONTROLLER
   Manages tab views, fetches available companies, validates cutoffs,
   manages student applications, and handles student profile updates.
========================================================================
*/

import { db } from "./firebaseConfig.js";
import { checkAuthState, logoutUser } from "./auth.js";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  addDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, toggleLoader, validateCGPA, isEmpty } from "./common.js";

// Global student data hold
let currentStudent = null;

// =====================================================================
// 1. Initialize Dashboard & Secure Guard
// =====================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Bind security guard for student dashboard
  checkAuthState("student");

  // Sidebar navigation toggling
  const menuItems = document.querySelectorAll(".sidebar-menu .sidebar-item");
  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Deactivate all
      menuItems.forEach(mi => mi.classList.remove("active"));
      document.querySelectorAll(".dashboard-view").forEach(view => view.classList.remove("active"));
      
      // Activate selected
      item.classList.add("active");
      const targetViewId = item.getAttribute("data-view");
      document.getElementById(targetViewId).classList.add("active");
      
      // Refresh data on specific tab open
      if (targetViewId === "view-companies") {
        loadCompanies();
      } else if (targetViewId === "view-applications") {
        loadApplications();
      }
    });
  });

  // Logout listener
  document.getElementById("btn-logout").addEventListener("click", logoutUser);

  // Bind edit profile form submit
  document.getElementById("profile-update-form").addEventListener("submit", handleProfileUpdate);
});

// Capture verified session info
document.addEventListener("profileLoaded", async (e) => {
  const { user, profile } = e.detail;
  currentStudent = profile;
  
  // Set UI labels
  updateSidebarUI();
  
  // Set standard form fields
  document.getElementById("profile-name").value = currentStudent.name || "";
  document.getElementById("profile-usn").value = currentStudent.usn || "";
  document.getElementById("profile-branch").value = currentStudent.branch || "CSE";
  document.getElementById("profile-cgpa").value = currentStudent.cgpa || 0.0;
  document.getElementById("profile-skills").value = currentStudent.skills || "";
  document.getElementById("profile-email").value = currentStudent.email || "";

  // Initial tab loading
  await loadCompanies();
});

// Update sidebar UI with live student state
function updateSidebarUI() {
  if (!currentStudent) return;
  
  // Sidebar elements
  document.getElementById("sidebar-student-name").textContent = currentStudent.name;
  document.getElementById("sidebar-student-usn").textContent = currentStudent.usn;
  
  // Main header
  document.getElementById("welcome-header").textContent = `Welcome, ${currentStudent.name.split(' ')[0]}!`;
  document.getElementById("header-student-name").textContent = currentStudent.name;
  document.getElementById("header-student-cgpa").textContent = `CGPA: ${parseFloat(currentStudent.cgpa).toFixed(2)}`;
  
  // Placement Status Badge
  const statusBadge = document.getElementById("sidebar-student-status");
  statusBadge.className = `badge ${currentStudent.placementStatus.toLowerCase()}`;
  statusBadge.textContent = currentStudent.placementStatus;
  
  // Current date
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById("dashboard-date-label").textContent = new Date().toLocaleDateString("en-US", options);
}

// =====================================================================
// 2. Fetch and Render Companies (Eligibilities checks)
// =====================================================================
async function loadCompanies() {
  toggleLoader(true, "company-card-container");
  try {
    // 1. Fetch all companies
    const companiesSnap = await getDocs(collection(db, "companies"));
    const companies = [];
    companiesSnap.forEach((doc) => {
      companies.push(doc.data());
    });

    // 2. Fetch user's applications to mark "Already Applied"
    const appsQuery = query(collection(db, "applications"), where("studentId", "==", currentStudent.uid));
    const appsSnap = await getDocs(appsQuery);
    const appliedCompanyIds = new Set();
    appsSnap.forEach((doc) => {
      appliedCompanyIds.add(doc.data().companyId);
    });

    const cardContainer = document.getElementById("company-card-container");
    cardContainer.innerHTML = "";

    if (companies.length === 0) {
      cardContainer.innerHTML = `
        <div style="grid-column: span 3; text-align: center; padding: 48px; background: white; border: 1px solid var(--border); border-radius: var(--radius-md);">
          <p class="text-muted">No campus placement openings currently active.</p>
        </div>
      `;
      toggleLoader(false, "company-card-container");
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    companies.forEach((company) => {
      const card = document.createElement("div");
      card.className = "company-card";

      // Formulate conditions
      const hasApplied = appliedCompanyIds.has(company.companyId);
      const isCgpaLow = parseFloat(currentStudent.cgpa) < parseFloat(company.minCGPA);
      const isExpired = company.deadline < todayStr;

      let actionBtnHTML = "";
      if (hasApplied) {
        actionBtnHTML = `<button class="btn btn-secondary" disabled>✓ Applied</button>`;
      } else if (isExpired) {
        actionBtnHTML = `<button class="btn btn-danger btn-sm" disabled>Expired</button>`;
      } else if (isCgpaLow) {
        actionBtnHTML = `<button class="btn btn-danger btn-sm" disabled style="color: var(--danger); background-color: var(--danger-bg);">CGPA < ${parseFloat(company.minCGPA).toFixed(1)} Needed</button>`;
      } else {
        actionBtnHTML = `<button class="btn btn-primary apply-btn" data-id="${company.companyId}">Apply Now</button>`;
      }

      // Short name stub
      const initials = company.companyName.substring(0, 2).toUpperCase();

      card.innerHTML = `
        <div class="company-card-header">
          <div class="company-logo-stub">${initials}</div>
          <span class="badge ${isExpired ? 'rejected' : 'placed'}">${isExpired ? 'Closed' : 'Open'}</span>
        </div>
        <h3 class="company-title">${company.companyName}</h3>
        <p class="company-role">${company.role}</p>
        
        <div class="company-details">
          <div class="company-detail-item">
            <span class="detail-label">Package</span>
            <span class="detail-value" style="color: var(--primary);">${company.package}</span>
          </div>
          <div class="company-detail-item">
            <span class="detail-label">Cutoff CGPA</span>
            <span class="detail-value">${parseFloat(company.minCGPA).toFixed(1)}</span>
          </div>
          <div class="company-detail-item" style="grid-column: span 2; margin-top: 4px;">
            <span class="detail-label">Deadline</span>
            <span class="detail-value" style="font-weight: 500;">📅 ${company.deadline}</span>
          </div>
        </div>
        
        <p class="company-desc">${company.description}</p>
        
        <div class="company-actions">
          ${actionBtnHTML}
        </div>
      `;

      cardContainer.appendChild(card);
    });

    // Bind event listeners to Apply buttons
    document.querySelectorAll(".apply-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const companyId = e.target.getAttribute("data-id");
        const company = companies.find(c => c.companyId === companyId);
        if (company) {
          if (confirm(`Do you wish to submit an official application to ${company.companyName} for the ${company.role} role?`)) {
            await submitApplication(company);
          }
        }
      });
    });

  } catch (error) {
    console.error("Error loading companies:", error);
    showToast("Error", "Could not fetch company listings.", "error");
  } finally {
    toggleLoader(false, "company-card-container");
  }
}

// =====================================================================
// 3. Create Application (CRUD - Create)
// =====================================================================
async function submitApplication(company) {
  toggleLoader(true);
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Create new application document
    const appRef = doc(collection(db, "applications"));
    await setDoc(appRef, {
      applicationId: appRef.id,
      studentId: currentStudent.uid,
      studentName: currentStudent.name,
      studentUSN: currentStudent.usn,
      studentCGPA: parseFloat(currentStudent.cgpa),
      studentBranch: currentStudent.branch,
      companyId: company.companyId,
      companyName: company.companyName,
      role: company.role,
      status: "Applied",
      appliedDate: todayStr
    });

    showToast("Applied", `Application submitted successfully to ${company.companyName}!`, "success");
    
    // Reload cards and tables
    await loadCompanies();
  } catch (error) {
    console.error("Application submission failed:", error);
    showToast("Submission Error", "Failed to submit application. Try again.", "error");
  } finally {
    toggleLoader(false);
  }
}

// =====================================================================
// 4. Fetch Student's Applications (CRUD - Read)
// =====================================================================
async function loadApplications() {
  toggleLoader(true, "applications-table-body");
  try {
    const q = query(collection(db, "applications"), where("studentId", "==", currentStudent.uid));
    const querySnap = await getDocs(q);
    
    const tableBody = document.getElementById("applications-table-body");
    tableBody.innerHTML = "";
    
    if (querySnap.empty) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
            You have not applied to any job postings yet.
          </td>
        </tr>
      `;
      toggleLoader(false, "applications-table-body");
      return;
    }
    
    querySnap.forEach((doc) => {
      const app = doc.data();
      const tr = document.createElement("tr");
      
      tr.innerHTML = `
        <td class="font-bold">${app.companyName}</td>
        <td>${app.role}</td>
        <td style="color: var(--primary); font-weight: 600;">${app.companyName === 'Google' ? '35 LPA' : app.companyName === 'Microsoft' ? '28 LPA' : app.companyName === 'Amazon' ? '18 LPA' : app.companyName === 'Accenture' ? '6.5 LPA' : app.companyName === 'Infosys' ? '4.5 LPA' : '6.0 LPA'}</td>
        <td>📅 ${app.appliedDate}</td>
        <td>
          <span class="badge ${app.status.toLowerCase()}">${app.status}</span>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    showToast("Error", "Could not load applied records.", "error");
  } finally {
    toggleLoader(false, "applications-table-body");
  }
}

// =====================================================================
// 5. Update Student Profile (CRUD - Update)
// =====================================================================
async function handleProfileUpdate(e) {
  const name = document.getElementById("profile-name").value.trim();
  const branch = document.getElementById("profile-branch").value;
  const cgpa = document.getElementById("profile-cgpa").value;
  const skills = document.getElementById("profile-skills").value.trim();

  // Validate
  if (isEmpty(name) || isEmpty(skills) || isEmpty(cgpa)) {
    showToast("Validation Error", "Fields cannot be left blank.", "warning");
    return;
  }

  if (!validateCGPA(cgpa)) {
    showToast("Validation Error", "CGPA must be a decimal value between 0.0 and 10.0.", "warning");
    return;
  }

  toggleLoader(true);
  try {
    const studentRef = doc(db, "students", currentStudent.uid);
    const updatedFields = {
      name: name,
      branch: branch,
      cgpa: parseFloat(cgpa),
      skills: skills
    };

    await updateDoc(studentRef, updatedFields);
    
    // Update local state
    currentStudent = { ...currentStudent, ...updatedFields };
    
    // Update UI headers
    updateSidebarUI();
    showToast("Profile Updated", "Your academic credentials were saved successfully.", "success");
  } catch (error) {
    console.error("Profile update failed:", error);
    showToast("Update Failure", "Could not save profile changes.", "error");
  } finally {
    toggleLoader(false);
  }
}
