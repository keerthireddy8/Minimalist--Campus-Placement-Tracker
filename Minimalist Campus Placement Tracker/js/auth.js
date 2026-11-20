/* 
========================================================================
   ROLE-BASED AUTHENTICATION & NAVIGATION GUARDS
   Integrates Firebase Auth & Firestore with role checking and automatic redirects.
========================================================================
*/

import { auth, db } from "./firebaseConfig.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, toggleLoader } from "./common.js";

// =====================================================================
// 1. Role Identification
// =====================================================================
export async function getUserRole(uid) {
  try {
    // Check in admins collection
    const adminDoc = await getDoc(doc(db, "admins", uid));
    if (adminDoc.exists()) {
      return { role: 'admin', data: adminDoc.data() };
    }
    
    // Check in students collection
    const studentDoc = await getDoc(doc(db, "students", uid));
    if (studentDoc.exists()) {
      return { role: 'student', data: studentDoc.data() };
    }
    
    return { role: null, data: null };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return { role: null, data: null };
  }
}

// =====================================================================
// 2. Student Signup & Registration
// =====================================================================
export async function registerStudent(email, password, name, usn, branch, cgpa, skills) {
  toggleLoader(true);
  try {
    // Check if registering the admin email to grant admin role automatically
    const isAdminEmail = email.toLowerCase() === 'admin@placement.com';
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (isAdminEmail) {
      // Setup admin profile
      await setDoc(doc(db, "admins", user.uid), {
        uid: user.uid,
        email: email,
        role: "admin"
      });
      showToast("Registered", "Admin account created successfully!", "success");
      toggleLoader(false);
      window.location.href = "admin.html";
      return user;
    }
    
    // Regular Student Registration - Check if a dummy record with this email was preloaded
    const q = query(collection(db, "students"), where("email", "==", email.toLowerCase()));
    const querySnap = await getDocs(q);
    
    if (!querySnap.empty) {
      // Pre-seeded record found! We will transfer its content to the new user UID
      const seededDoc = querySnap.docs[0];
      const seededData = seededDoc.data();
      
      // Delete old seeded record (since the document ID was dummy, e.g. "seed-uid-1")
      if (seededDoc.id !== user.uid) {
        await deleteDoc(doc(db, "students", seededDoc.id));
      }
      
      // Save new record with actual Auth UID but keeping the preloaded name, usn, cgpa, and placementStatus!
      await setDoc(doc(db, "students", user.uid), {
        ...seededData,
        uid: user.uid,
        email: email.toLowerCase() // Ensure matching format
      });
      showToast("Linked Profile", `Profile for ${seededData.name} loaded and linked successfully!`, "success");
    } else {
      // Complete fresh student record
      await setDoc(doc(db, "students", user.uid), {
        uid: user.uid,
        name: name,
        usn: usn.toUpperCase(),
        branch: branch,
        cgpa: parseFloat(cgpa),
        skills: skills,
        email: email.toLowerCase(),
        placementStatus: "Unplaced"
      });
      showToast("Success", "Student account registered successfully!", "success");
    }
    
    toggleLoader(false);
    window.location.href = "student.html";
    return user;
  } catch (error) {
    toggleLoader(false);
    console.error("Registration failed:", error);
    showToast("Registration Error", error.message, "error");
    throw error;
  }
}

// =====================================================================
// 3. User Login
// =====================================================================
export async function loginUser(email, password) {
  toggleLoader(true);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get their role from database
    const { role } = await getUserRole(user.uid);
    
    toggleLoader(false);
    showToast("Welcome", "Login successful!", "success");
    
    // Redirect based on role
    if (role === 'admin') {
      window.location.href = "admin.html";
    } else if (role === 'student') {
      window.location.href = "student.html";
    } else {
      // Default fallback in case Firestore document doesn't exist yet (highly unlikely)
      showToast("Error", "Role not detected. Assigning default student access.", "warning");
      window.location.href = "student.html";
    }
    return user;
  } catch (error) {
    toggleLoader(false);
    console.error("Login failed:", error);
    showToast("Authentication Failed", "Incorrect email or password.", "error");
    throw error;
  }
}

// =====================================================================
// 4. Logout Session
// =====================================================================
export async function logoutUser() {
  toggleLoader(true);
  try {
    await signOut(auth);
    toggleLoader(false);
    showToast("Logged Out", "You have signed out successfully.", "info");
    // Redirect to landing page
    window.location.href = "index.html";
  } catch (error) {
    toggleLoader(false);
    console.error("Logout failed:", error);
    showToast("Logout Error", error.message, "error");
  }
}

// =====================================================================
// 5. Navigation Guard (State Verification)
// =====================================================================
export function checkAuthState(requiredRole) {
  // Show full page loader while verifying credentials
  toggleLoader(true);
  
  onAuthStateChanged(auth, async (user) => {
    const currentPath = window.location.pathname.split("/").pop();
    
    if (!user) {
      // User is not signed in
      toggleLoader(false);
      // If user is trying to view dashboard files, boot them to login
      if (currentPath === "student.html" || currentPath === "admin.html") {
        window.location.href = "login.html";
      }
    } else {
      // User is signed in, verify their role from database
      const { role, data } = await getUserRole(user.uid);
      toggleLoader(false);
      
      if (currentPath === "login.html" || currentPath === "register.html" || currentPath === "index.html" || currentPath === "") {
        // Logged in user trying to access public pages -> Redirect to their respective dashboards
        if (role === 'admin') {
          window.location.href = "admin.html";
        } else {
          window.location.href = "student.html";
        }
      } else if (requiredRole && role !== requiredRole) {
        // Unauthorized role cross-access -> Redirect to valid dashboard
        showToast("Access Denied", "Unauthorized dashboard access.", "error");
        if (role === 'admin') {
          window.location.href = "admin.html";
        } else {
          window.location.href = "student.html";
        }
      } else {
        // Valid page access! Dispatch an event with profile information
        const event = new CustomEvent("profileLoaded", { detail: { user, role, profile: data } });
        document.dispatchEvent(event);
      }
    }
  });
}
