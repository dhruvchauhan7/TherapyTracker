#  TheraTrack Mini (MVP)

**TheraTrack Mini** is a lightweight therapy clinic management MVP built as a **full-stack project** using **.NET 8 Web API** and **Angular 17**.  

---

##  Features

###  Role-based Access
- **Admin**
  - Manage clinicians & clients  
  - Create and schedule sessions  
  - Reopen or lock sessions for payroll  
  - Export payroll CSV reports  
  - View organization dashboard
- **Clinician**
  - View assigned sessions  
  - Add SOAP notes (Subjective, Objective, Assessment, Plan)  
  - Add session goal entries (progress values)  
  - Mark sessions completed  
  - View personal dashboard & recent activity

<h2>📸 Screenshots</h2>

<p align="center">
  <img src="https://github.com/dhruvchauhan7/People-Management-System/blob/main/Screenshots/1.png" width="45%" />
  <img src="https://github.com/dhruvchauhan7/People-Management-System/blob/main/Screenshots/2.png" width="45%" />
</p>

<p align="center">
  <img src="https://github.com/dhruvchauhan7/People-Management-System/blob/main/Screenshots/3.png" width="45%" />
  <img src="https://github.com/dhruvchauhan7/People-Management-System/blob/main/Screenshots/4.png" width="45%" />
</p>

<p align="center">
  <img src="https://github.com/dhruvchauhan7/People-Management-System/blob/main/Screenshots/5.png" width="45%" />
</p>


###  Core Modules
| Module | Description |
|---------|-------------|
| **Dashboard** | KPIs, upcoming sessions, and recent activity overview |
| **Clients** | CRUD for clients and clinician assignments |
| **Sessions** | Scheduling, SOAP notes, and progress tracking |
| **Payroll** | Review completed sessions, lock/unlock, CSV export |
| **Auth** | JWT-based authentication for Admin & Clinician roles |

---

##  Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Angular 17, TypeScript, HTML, SCSS |
| **Backend** | ASP.NET Core Web API (.NET 8) |
| **Database** | SQLite (via Entity Framework Core) |
| **Auth** | JWT-based token authentication |
| **Build Tools** | Visual Studio 2022 / VS Code, Node.js 20+, Angular CLI |
| **Version Control** | Git + GitHub |

---

##  Running the Project Locally

### Backend – .NET API
```bash
cd TheraTrackMini.Api
dotnet restore
dotnet run

Default port → http://localhost:5000
Swagger UI → http://localhost:5000/swagger

###  Backend – .NET API
cd theratrack-mini-ui
npm install
ng serve -o

App will open on → http://localhost:4200

### Login Credentials

You can create users via Swagger (/api/clinicians or /api/auth/register):

Role	Example	Notes
Admin	admin@example.com / Passw0rd!	Full access
Clinician	clin1@example.com / Passw0rd!	Own sessions only

### Payroll Workflow

1. Clinicians mark sessions completed → system sets EndTime and Status = COMPLETED.
2. Admin reviews completed sessions in the Payroll page.
3. Admin can lock/unlock each session for payroll (via PUT /api/sessions/{id}/payroll-lock).
4. Use date range + clinician filters to narrow results.
5. Click Export CSV to download payroll data for accounting.

### Dashboard Highlights

1. Admin Dashboard: organization overview (client count, total sessions, completed in last 30 days, upcoming in 7 days).
2. Clinician Dashboard: personal workload summary with upcoming sessions and recent activity.

### Key Engineering Concepts Demonstrated

1. RESTful API design (DTOs, Entity Framework mappings)
2. Role-based access control (JWT claims & authorization policies)
3. Angular standalone components and routing
4. Reactive UI updates and modular component structure
5. End-to-end CRUD and data binding
6. Secure cross-origin communication between Angular and .NET

### Tools Used

Visual Studio 2022 – backend development
VS Code – Angular frontend
Postman / Swagger UI – API testing
Git & GitHub – source control


