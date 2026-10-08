/* DisasterSafe - Front-end demo authentication and dashboard logic */
const DEFAULT_USERS = [
  {name:"Demo User", email:"user@demo.com", password:"123456", role:"user"},
  {name:"System Admin", email:"admin@demo.com", password:"admin123", role:"admin"}
];

function getUsers(){
  const saved = localStorage.getItem("ds_users");
  if(!saved){ localStorage.setItem("ds_users", JSON.stringify(DEFAULT_USERS)); return DEFAULT_USERS; }
  try { return JSON.parse(saved); } catch(e){ return DEFAULT_USERS; }
}
function saveUsers(users){ localStorage.setItem("ds_users", JSON.stringify(users)); }
function getReports(){
  try { return JSON.parse(localStorage.getItem("ds_reports") || "[]"); } catch(e){ return []; }
}
function saveReports(reports){ localStorage.setItem("ds_reports", JSON.stringify(reports)); }
function getSession(){
  try { return JSON.parse(localStorage.getItem("ds_session") || "null"); } catch(e){ return null; }
}
function showMessage(id, text, type="error"){
  const el=document.getElementById(id); if(!el)return;
  el.textContent=text; el.className="form-message "+type;
}
function togglePassword(id, button){
  const input=document.getElementById(id);
  if(!input)return;
  input.type=input.type==="password" ? "text" : "password";
  button.textContent=input.type==="password" ? "Show" : "Hide";
}
function logout(){
  localStorage.removeItem("ds_session");
  window.location.href="Login.html";
}
function toggleMenu(){
  const links=document.querySelector(".nav-links");
  if(links) links.classList.toggle("show");
}

document.addEventListener("DOMContentLoaded", ()=>{
  const loginForm=document.getElementById("loginForm");
  if(loginForm){
    loginForm.addEventListener("submit",(e)=>{
      e.preventDefault();
      const email=document.getElementById("loginEmail").value.trim().toLowerCase();
      const password=document.getElementById("loginPassword").value;
      const user=getUsers().find(u=>u.email.toLowerCase()===email && u.password===password);
      if(!user){ showMessage("loginMessage","Invalid email or password.","error"); return; }
      localStorage.setItem("ds_session",JSON.stringify({name:user.name,email:user.email,role:user.role}));
      window.location.href=user.role==="admin" ? "Admin.html" : "User.html";
    });
  }

  const signupForm=document.getElementById("signupForm");
  if(signupForm){
    signupForm.addEventListener("submit",(e)=>{
      e.preventDefault();
      const name=document.getElementById("signupName").value.trim();
      const email=document.getElementById("signupEmail").value.trim().toLowerCase();
      const password=document.getElementById("signupPassword").value;
      const role=document.getElementById("signupRole").value;
      const users=getUsers();
      if(users.some(u=>u.email.toLowerCase()===email)){ showMessage("signupMessage","An account with this email already exists.","error"); return; }
      users.push({name,email,password,role}); saveUsers(users);
      showMessage("signupMessage","Account created successfully. Redirecting to login...","success");
      setTimeout(()=>window.location.href="Login.html",800);
    });
  }

  const session=getSession();
  const protectedPage=location.pathname.toLowerCase().includes("user.html") || location.pathname.toLowerCase().includes("admin.html");
  if(protectedPage){
    if(!session){ window.location.href="Login.html"; return; }
    const isAdmin=location.pathname.toLowerCase().includes("admin.html");
    if(isAdmin && session.role!=="admin"){ window.location.href="User.html"; return; }
    if(!isAdmin && session.role==="admin"){ window.location.href="Admin.html"; return; }
  }

  if(session && location.pathname.toLowerCase().includes("login.html")) window.location.href=session.role==="admin"?"Admin.html":"User.html";

  if(document.getElementById("welcomeName") && session){
    document.getElementById("welcomeName").textContent=`Welcome back, ${session.name.split(" ")[0]}!`;
    document.getElementById("sideName").textContent=session.name;
    document.getElementById("sideAvatar").textContent=session.name.charAt(0).toUpperCase();
    document.getElementById("headerAvatar").textContent=session.name.charAt(0).toUpperCase();
  }
  if(document.getElementById("adminWelcome") && session){
    document.getElementById("adminWelcome").textContent=`Welcome, ${session.name.split(" ")[0]}`;
    document.getElementById("adminName").textContent=session.name;
  }

  const incidentForm=document.getElementById("incidentForm");
  if(incidentForm){
    renderUserReports();
    incidentForm.addEventListener("submit",(e)=>{
      e.preventDefault();
      const reports=getReports();
      reports.unshift({
        id:"INC-"+Date.now().toString().slice(-6),
        user:session.email,
        type:document.getElementById("incidentType").value,
        location:document.getElementById("incidentLocation").value.trim(),
        description:document.getElementById("incidentDescription").value.trim(),
        status:"Pending",
        date:new Date().toLocaleString()
      });
      saveReports(reports);
      incidentForm.reset();
      showMessage("incidentMessage","Incident report submitted successfully.","success");
      renderUserReports();
    });
  }

  if(document.getElementById("adminReportTable")) renderAdminReports();
  if(document.getElementById("userList")) renderAdminUsers();
});

function renderUserReports(){
  const box=document.getElementById("reportTable"); if(!box)return;
  const session=getSession();
  const reports=getReports().filter(r=>r.user===session.email);
  const count=document.getElementById("reportCount"); if(count) count.textContent=reports.length;
  if(!reports.length){box.innerHTML='<div class="empty">No incident reports submitted yet.</div>';return;}
  box.innerHTML='<table><thead><tr><th>ID</th><th>Type</th><th>Location</th><th>Status</th><th>Date</th></tr></thead><tbody>'+
    reports.map(r=>`<tr><td>${r.id}</td><td>${r.type}</td><td>${escapeHtml(r.location)}</td><td><span class="status ${r.status.toLowerCase()}">${r.status}</span></td><td>${r.date}</td></tr>`).join("")+'</tbody></table>';
}
function renderAdminReports(){
  const box=document.getElementById("adminReportTable"); if(!box)return;
  const reports=getReports();
  const total=document.getElementById("adminReports"), pending=document.getElementById("pendingReports");
  if(total)total.textContent=reports.length;
  if(pending)pending.textContent=reports.filter(r=>r.status==="Pending").length;
  if(!reports.length){box.innerHTML='<div class="empty">No incident reports available.</div>';return;}
  box.innerHTML='<table><thead><tr><th>ID</th><th>User</th><th>Type</th><th>Location</th><th>Status</th><th>Action</th></tr></thead><tbody>'+
  reports.map(r=>`<tr><td>${r.id}</td><td>${escapeHtml(r.user)}</td><td>${r.type}</td><td>${escapeHtml(r.location)}</td><td><span class="status ${r.status.toLowerCase()}">${r.status}</span></td><td><button class="table-btn" onclick="changeReportStatus('${r.id}')">Update</button></td></tr>`).join("")+'</tbody></table>';
}
function changeReportStatus(id){
  const reports=getReports(), r=reports.find(x=>x.id===id);
  if(!r)return;
  r.status=r.status==="Pending"?"In Review":r.status==="In Review"?"Resolved":"Pending";
  saveReports(reports); renderAdminReports();
}
function renderAdminUsers(){
  const box=document.getElementById("userList"); if(!box)return;
  const users=getUsers();
  const count=document.getElementById("adminUsers"); if(count)count.textContent=users.length;
  box.innerHTML=users.map(u=>`<div class="user-row"><div class="avatar small">${u.name.charAt(0).toUpperCase()}</div><div><b>${escapeHtml(u.name)}</b><small>${escapeHtml(u.email)}</small></div><span class="role">${u.role}</span></div>`).join("");
}
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}