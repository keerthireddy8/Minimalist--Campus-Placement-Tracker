/* 
========================================================================
   ADMINISTRATIVE DASHBOARD CONTROLLER
   Manages tab views, analytics stats engines, company CRUD operations,
   student directory lookups, and transactional application pipelines.
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
  deleteDoc, 
  getDoc,
  query,
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, toggleLoader, validateCGPA, isEmpty } from "./common.js";

// Cached dataset
let studentsList = [];
let companiesList = [];
let applicationsList = [];

// =====================================================================
// 1. Dashboard Bootstrapper & Observers
// =====================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Bind security guard for admin role
  checkAuthState("admin");

  // Sidebar navigation switching
  const menuItems = document.querySelectorAll(".sidebar-menu .sidebar-item");
  menuItems.forEach((item) => {
    item.addEventListener("click", async (e) => {
      e.preventDefault();
      
      // Deactivate all
      menuItems.forEach(mi => mi.classList.remove("active"));
      document.querySelectorAll(".dashboard-view").forEach(view => view.classList.remove("active"));
      
      // Activate selected
      item.classList.add("active");
      const targetViewId = item.getAttribute("data-view");
      document.getElementById(targetViewId).classList.add("active");
      
      // Refresh matching view data
      if (targetViewId === "view-stats") {
        await refreshDashboardData();
      } else if (targetViewId === "view-manage-companies") {
        await loadCompaniesTab();
      } else if (targetViewId === "view-manage-students") {
        await loadStudentsTab();
      } else if (targetViewId === "view-manage-applications") {
        await loadApplicationsTab();
      }
    });
  });

  // Logout binder
  document.getElementById("btn-logout").addEventListener("click", logoutUser);

  // Modal Open & Close triggers
  const companyModal = document.getElementById("company-modal");
  document.getElementById("btn-add-company").addEventListener("click", () => {
    openCompanyModal();
  });
  
  document.getElementById("modal-close-btn").addEventListener("click", () => {
    closeCompanyModal();
  });
  
  document.getElementById("btn-cancel-modal").addEventListener("click", () => {
    closeCompanyModal();
  });

  // Handle Form Submission
  document.getElementById("company-form").addEventListener("submit", handleCompanyFormSubmit);
});

// Capture profile loaded event
document.addEventListener("profileLoaded", async (e) => {
  const { user } = e.detail;
  document.getElementById("admin-email-sidebar").textContent = user.email;
  
  // Compute metrics initial load
  await refreshDashboardData();
});

// =====================================================================
// 2. Fetch and Aggregates Stats Engine
// =====================================================================
async function refreshDashboardData() {
  toggleLoader(true);
  try {
    // 1. Fetch Students
    const studentsSnap = await getDocs(collection(db, "students"));
    studentsList = [];
    studentsSnap.forEach(doc => studentsList.push(doc.data()));

    // 2. Fetch Companies
    const companiesSnap = await getDocs(collection(db, "companies"));
    companiesList = [];
    companiesSnap.forEach(doc => companiesList.push(doc.data()));

    // 3. Fetch Applications
    const appsSnap = await getDocs(collection(db, "applications"));
    applicationsList = [];
    appsSnap.forEach(doc => applicationsList.push(doc.data()));

    // Populate metric cards
    document.getElementById("stat-total-students").textContent = studentsList.length;
    document.getElementById("stat-total-companies").textContent = companiesList.length;
    document.getElementById("stat-total-applications").textContent = applicationsList.length;

    // Calculate placement rate percentage
    const placedStudents = studentsList.filter(s => s.placementStatus === "Placed").length;
    const placementRate = studentsList.length > 0 ? Math.round((placedStudents / studentsList.length) * 100) : 0;
    document.getElementById("stat-placed-percent").textContent = `${placementRate}%`;

    // Render Recent Applications list
    renderRecentApplications();
    
  } catch (error) {
    console.error("Dashboard calculation failed:", error);
    showToast("Fetch Error", "Failed to compute stats summary.", "error");
  } finally {
    toggleLoader(false);
  }
}

function renderRecentApplications() {
  const container = document.getElementById("stats-recent-applications");
  container.innerHTML = "";

  // Sort applications by date descending (or just slice recent 5)
  const sortedApps = [...applicationsList].slice(-5).reverse();

  if (sortedApps.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 16px;">
          No student applications received yet.
        </td>
      </tr>
    `;
    return;
  }

  sortedApps.forEach(app => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-bold">${app.studentName}</td>
      <td>${app.studentUSN}</td>
      <td>${app.companyName}</td>
      <td style="color: var(--primary); font-weight: 600;">${app.companyName === 'Google' ? '35 LPA' : app.companyName === 'Microsoft' ? '28 LPA' : app.companyName === 'Amazon' ? '18 LPA' : app.companyName === 'Accenture' ? '6.5 LPA' : app.companyName === 'Infosys' ? '4.5 LPA' : '6.0 LPA'}</td>
      <td><span class="badge ${app.status.toLowerCase()}">${app.status}</span></td>
    `;
    container.appendChild(tr);
  });
}

// =====================================================================
// 3. Manage Companies Tab (CRUD Operations)
// =====================================================================
async function loadCompaniesTab() {
  toggleLoader(true, "admin-companies-table");
  try {
    const querySnap = await getDocs(collection(db, "companies"));
    companiesList = [];
    querySnap.forEach(doc => companiesList.push(doc.data()));

    const tbody = document.getElementById("admin-companies-table");
    tbody.innerHTML = "";

    if (companiesList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No campus placement openings registered. Click Add New Partner to start!
          </td>
        </tr>
      `;
      toggleLoader(false, "admin-companies-table");
      return;
    }

    companiesList.forEach(company => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-bold">${company.companyName}</td>
        <td>${company.role}</td>
        <td style="color: var(--primary); font-weight: 600;">${company.package}</td>
        <td class="font-semibold">${parseFloat(company.minCGPA).toFixed(1)}</td>
        <td>📅 ${company.deadline}</td>
        <td>
          <button class="btn btn-secondary btn-sm edit-company-btn" data-id="${company.companyId}" style="margin-right: 8px;">✏️ Edit</button>
          <button class="btn btn-danger btn-sm delete-company-btn" data-id="${company.companyId}">🗑️ Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Bind Edit Action
    document.querySelectorAll(".edit-company-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const companyId = e.target.getAttribute("data-id");
        const company = companiesList.find(c => c.companyId === companyId);
        if (company) openCompanyModal(company);
      });
    });

    // Bind Delete Action
    document.querySelectorAll(".delete-company-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const companyId = e.target.getAttribute("data-id");
        if (confirm("Are you sure you want to delete this company posting? Students will no longer see it.")) {
          await deleteCompanyPost(companyId);
        }
      });
    });

  } catch (error) {
    console.error("Failed to load companies tab:", error);
    showToast("Error", "Could not fetch company directory.", "error");
  } finally {
    toggleLoader(false, "admin-companies-table");
  }
}

// Open modal for add or edit
function openCompanyModal(company = null) {
  const modal = document.getElementById("company-modal");
  const modalTitle = document.getElementById("modal-title-text");
  
  if (company) {
    // Edit state
    modalTitle.textContent = "Edit Company Partner Details";
    document.getElementById("form-company-id").value = company.companyId;
    document.getElementById("form-company-name").value = company.companyName;
    document.getElementById("form-company-role").value = company.role;
    document.getElementById("form-company-package").value = company.package;
    document.getElementById("form-company-min-cgpa").value = company.minCGPA;
    document.getElementById("form-company-deadline").value = company.deadline;
    document.getElementById("form-company-desc").value = company.description;
  } else {
    // Add state
    modalTitle.textContent = "Register Company Partner";
    document.getElementById("company-form").reset();
    document.getElementById("form-company-id").value = "";
  }
  
  modal.classList.add("show");
}

function closeCompanyModal() {
  document.getElementById("company-modal").classList.remove("show");
}

// Add/Update Submit handler (C & U)
async function handleCompanyFormSubmit(e) {
  const companyId = document.getElementById("form-company-id").value;
  const companyName = document.getElementById("form-company-name").value.trim();
  const role = document.getElementById("form-company-role").value.trim();
  const pkg = document.getElementById("form-company-package").value.trim();
  const minCgpa = document.getElementById("form-company-min-cgpa").value;
  const deadline = document.getElementById("form-company-deadline").value;
  const description = document.getElementById("form-company-desc").value.trim();

  // Validate
  if (isEmpty(companyName) || isEmpty(role) || isEmpty(pkg) || isEmpty(minCgpa) || isEmpty(deadline) || isEmpty(description)) {
    showToast("Validation Error", "All fields are required.", "warning");
    return;
  }

  if (!validateCGPA(minCgpa)) {
    showToast("Validation Error", "CGPA Cutoff must be between 0.0 and 10.0.", "warning");
    return;
  }

  toggleLoader(true);
  try {
    if (companyId) {
      // UPDATE COMPANY
      const companyRef = doc(db, "companies", companyId);
      await updateDoc(companyRef, {
        companyName,
        role,
        package: pkg,
        minCGPA: parseFloat(minCgpa),
        deadline,
        description
      });
      showToast("Updated", `${companyName} specifications updated.`, "success");
    } else {
      // CREATE COMPANY
      const newDocRef = doc(collection(db, "companies"));
      await setDoc(newDocRef, {
        companyId: newDocRef.id,
        companyName,
        role,
        package: pkg,
        minCGPA: parseFloat(minCgpa),
        deadline,
        description
      });
      showToast("Success", `Registered ${companyName} for placement drives.`, "success");
    }

    closeCompanyModal();
    await loadCompaniesTab();
  } catch (error) {
    console.error("Company write failure:", error);
    showToast("Save Failure", "Unable to save company details.", "error");
  } finally {
    toggleLoader(false);
  }
}

// Delete company (D)
async function deleteCompanyPost(companyId) {
  toggleLoader(true);
  try {
    await deleteDoc(doc(db, "companies", companyId));
    showToast("Deleted", "Company partnership listing deleted.", "success");
    await loadCompaniesTab();
  } catch (error) {
    console.error("Delete company failed:", error);
    showToast("Delete Error", "Could not remove company posting.", "error");
    toggleLoader(false);
  }
}

// =====================================================================
// 4. Student Directory Tab (Read Students)
// =====================================================================
async function loadStudentsTab() {
  toggleLoader(true, "admin-students-table");
  try {
    const snap = await getDocs(collection(db, "students"));
    studentsList = [];
    snap.forEach(doc => studentsList.push(doc.data()));

    document.getElementById("badge-total-students-count").textContent = `${studentsList.length} Students`;

    const tbody = document.getElementById("admin-students-table");
    tbody.innerHTML = "";

    if (studentsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No students currently registered in placement cycle.
          </td>
        </tr>
      `;
      toggleLoader(false, "admin-students-table");
      return;
    }

    studentsList.forEach(student => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-bold">${student.name}</td>
        <td>${student.usn}</td>
        <td>${student.branch}</td>
        <td class="font-semibold" style="color: var(--primary);">${parseFloat(student.cgpa).toFixed(2)}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${student.skills}
        </td>
        <td>
          <span class="badge ${student.placementStatus.toLowerCase()}">${student.placementStatus}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Students load failed:", error);
    showToast("Error", "Could not fetch student database.", "error");
  } finally {
    toggleLoader(false, "admin-students-table");
  }
}

// =====================================================================
// 5. Applications Pipeline Tab (Update application & student status)
// =====================================================================
async function loadApplicationsTab() {
  toggleLoader(true, "admin-applications-table");
  try {
    const snap = await getDocs(collection(db, "applications"));
    applicationsList = [];
    snap.forEach(doc => applicationsList.push(doc.data()));

    document.getElementById("badge-pending-applications").textContent = `${applicationsList.length} Applications`;

    const tbody = document.getElementById("admin-applications-table");
    tbody.innerHTML = "";

    if (applicationsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No placement applications submitted yet.
          </td>
        </tr>
      `;
      toggleLoader(false, "admin-applications-table");
      return;
    }

    applicationsList.forEach(app => {
      const tr = document.createElement("tr");

      // Set inline selector options
      const options = ["Applied", "Shortlisted", "Selected", "Rejected"];
      let selectorHTML = `<select class="form-control select-app-status btn-sm" data-id="${app.applicationId}" data-studentid="${app.studentId}" style="width: 130px; font-weight:600; padding:4px 8px; height: auto;">`;
      options.forEach(opt => {
        const isSelected = app.status === opt ? "selected" : "";
        selectorHTML += `<option value="${opt}" ${isSelected}>${opt}</option>`;
      });
      selectorHTML += `</select>`;

      tr.innerHTML = `
        <td class="font-bold">${app.studentName}</td>
        <td>${app.studentUSN} (${app.studentBranch})</td>
        <td class="font-semibold">${parseFloat(app.studentCGPA).toFixed(2)}</td>
        <td class="font-bold">${app.companyName}</td>
        <td>${app.role}</td>
        <td>${selectorHTML}</td>
      `;
      tbody.appendChild(tr);
    });

    // Bind change listener for inline application selector
    document.querySelectorAll(".select-app-status").forEach(select => {
      select.addEventListener("change", async (e) => {
        const appId = e.target.getAttribute("data-id");
        const studentId = e.target.getAttribute("data-studentid");
        const newStatus = e.target.value;
        
        await updateApplicationStatus(appId, studentId, newStatus);
      });
    });

  } catch (error) {
    console.error("Applications load failed:", error);
    showToast("Error", "Could not fetch active pipeline.", "error");
  } finally {
    toggleLoader(false, "admin-applications-table");
  }
}

// Dynamic Transactional Status update (U)
async function updateApplicationStatus(appId, studentId, status) {
  toggleLoader(true);
  try {
    // 1. Update status in applications collection
    const appRef = doc(db, "applications", appId);
    await updateDoc(appRef, { status: status });

    // 2. Transactional Update: If "Selected", update student's general placementStatus to "Placed"
    const studentRef = doc(db, "students", studentId);
    
    // Check if the student has any other "Selected" applications before changing back to "Unplaced"
    if (status === "Selected") {
      await updateDoc(studentRef, { placementStatus: "Placed" });
      showToast("Placed Success", "Candidate has been officially placed! Record aligned.", "success");
    } else {
      // If changed away from Selected, verify if they have any other "Selected" offers
      const otherSelectedQ = query(
        collection(db, "applications"), 
        where("studentId", "==", studentId), 
        where("status", "==", "Selected")
      );
      const otherSnap = await getDocs(otherSelectedQ);
      
      // If they have no other selected offers, revert to "Unplaced"
      if (otherSnap.empty) {
        await updateDoc(studentRef, { placementStatus: "Unplaced" });
        showToast("Pipeline Refined", "Candidate placement status marked as Unplaced.", "info");
      } else {
        showToast("Pipeline Refined", "Status updated. Student remains Placed due to other accepted offers.", "info");
      }
    }

    // Refresh current view
    await loadApplicationsTab();
  } catch (error) {
    console.error("Failed to update status:", error);
    showToast("Failure", "Transaction aborted. Try again.", "error");
    toggleLoader(false);
  }
}
