import { Component } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SessionService,
  SessionDto,
  SessionDtoExtended,
  SessionStatusNum,
  SessionNoteDto
} from '../../services/session.service';
import { ClientService, Client } from '../../services/client.service';
import { ClinicianService, Clinician } from '../../services/clinician';
import { GoalService, Goal } from '../../services/goal.service';
import { AuthService } from '../../services/auth';

const STATUS_LABEL: Record<SessionStatusNum, 'SCHEDULED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'> =
  { 0: 'SCHEDULED', 1: 'COMPLETED', 2: 'CANCELED', 3: 'NO_SHOW' };
const COMPLETED: SessionStatusNum = 1;
const SCHEDULED: SessionStatusNum = 0;

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './sessions.page.html',
  styleUrls: ['./sessions.page.css']
})
export class SessionsPage {
  sessions: SessionDto[] = [];
  clients: Client[] = [];
  clinicians: Clinician[] = [];

  loading = false;
  error = '';

  search = '';

  // Detail modal
  showDetail = false;
  current: (SessionDto | SessionDtoExtended) | null = null;

  // Clinician actions (detail)
  noteText = '';
  selectedGoalId: number | null = null;
  entryValue: number | null = null;

  // Admin create modal
  showCreate = false;
  createForm = {
    clientId: null as number | null,
    clinicianId: null as number | null,
    startLocal: '', // yyyy-MM-ddTHH:mm
    endLocal: ''    // yyyy-MM-ddTHH:mm (optional)
  };

  private goalsByClient: Record<number, Goal[]> = {};

  constructor(
    private api: SessionService,
    private clientsApi: ClientService,
    private cliniciansApi: ClinicianService,
    private goalsApi: GoalService,
    private auth: AuthService
  ) { this.loadAll(); }

  get isClinician() { return this.auth.getRole() === 'CLINICIAN'; }
  get isAdmin() { return this.auth.getRole() === 'ADMIN'; }
  get myId() { return (this.auth as any).getUserId?.() ?? null; }

  private loadAll() {
    this.loading = true; this.error = '';
    this.api.getAll().subscribe({
      next: s => { this.sessions = s; this.loading = false; },
      error: err => { console.error(err); this.error = 'Failed to load sessions'; this.loading = false; }
    });
    this.clientsApi.list().subscribe({ next: c => this.clients = c });
    this.cliniciansApi.list().subscribe({ next: cs => this.clinicians = cs, error: () => { } });
  }

  // helpers
  clientName(id: number) {
    return this.clients.find(c => c.id === id)?.name ?? String(id);
  }
  clinicianName(id: number) {
    const f = this.clinicians.find(c => c.id === id)?.name;
    if (f) return f;
    if (this.myId != null && id === this.myId) return 'You';
    return String(id);
  }
  statusLabel(s: SessionStatusNum) { return STATUS_LABEL[s] ?? ('' + s); }
  fmt(dt?: string | null) { return dt ? new Date(dt).toLocaleString() : '—'; }
  canComplete(s: SessionDto) { return this.isClinician && s.status !== COMPLETED; }
  isExtended(x: any): x is SessionDtoExtended { return !!x && 'entries' in x; }

  // goals
  private ensureGoalsForClient(clientId: number) {
    if (this.goalsByClient[clientId]) return;
    this.goalsApi.listByClient(clientId).subscribe({
      next: list => { this.goalsByClient[clientId] = list ?? []; },
      error: err => { console.warn('Failed to load goals for client', clientId, err); this.goalsByClient[clientId] = []; }
    });
  }
  get goalsForCurrent(): Goal[] {
    const cid = this.current?.clientId;
    return cid ? (this.goalsByClient[cid] ?? []) : [];
  }
  goalName(id: number) {
    const cid = this.current?.clientId;
    if (!cid) return String(id);
    const found = (this.goalsByClient[cid] ?? []).find(g => g.id === id);
    return found?.name ?? String(id);
  }
  goalUnit(id: number) {
    const cid = this.current?.clientId;
    if (!cid) return '';
    const found = (this.goalsByClient[cid] ?? []).find(g => g.id === id);
    return found?.unit ?? '';
  }

  // filtering — prefer API names when present
  get filteredSessions(): SessionDto[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.sessions;

    return this.sessions.filter(s => {
      const clientDisplay = (s.clientName ?? this.clientName(s.clientId)).toLowerCase();
      const clinicianDisplay = (s.clinicianName ?? this.clinicianName(s.clinicianId)).toLowerCase();
      return clientDisplay.includes(q) || clinicianDisplay.includes(q);
    });
  }
  clearSearch() { this.search = ''; }

  // actions
  complete(s: SessionDto) {
    this.api.updateStatus(s.id, { status: COMPLETED }).subscribe({
      next: (updated) => {
        this.replaceRow(updated);
        if (this.current && this.current.id === updated.id) this.current = updated;
      },
      error: err => { console.error(err); this.error = 'Unable to complete session (must be assigned clinician).'; }
    });
  }

  openDetail(s: SessionDto) {
    this.current = { ...s };
    this.noteText = '';
    this.selectedGoalId = null;
    this.entryValue = null;
    this.showDetail = true;

    this.ensureGoalsForClient(s.clientId);

    this.api.getById(s.id).subscribe({
      next: full => { this.current = full; },
      error: () => { }
    });
  }
  closeDetail() {
    this.showDetail = false;
    this.current = null;
    this.noteText = '';
    this.selectedGoalId = null;
    this.entryValue = null;
  }

  addNote() {
    if (!this.current) return;
    const text = (this.noteText || '').trim();
    if (!text) { this.error = 'Note text is required.'; return; }

    this.api.addNote(this.current.id, { soapText: text }).subscribe({
      next: (note: SessionNoteDto) => {
        if (this.current) {
          if (this.isExtended(this.current)) this.current = { ...this.current, note };
          else this.current = { ...(this.current as SessionDto), note, entries: [] };
        }
        this.noteText = '';
      },
      error: err => { console.error(err); this.error = 'Could not save note (are you the assigned clinician? Is session completed?)'; }
    });
  }

  addEntry() {
    if (!this.current) return;
    const gid = this.selectedGoalId;
    const val = this.entryValue != null ? Number(this.entryValue) : NaN;
    if (gid == null || Number.isNaN(val)) { this.error = 'Please select a goal and enter a numeric value.'; return; }

    this.api.addEntry(this.current.id, { goalId: gid, value: val }).subscribe({
      next: (entry) => {
        if (this.current) {
          if (this.isExtended(this.current)) this.current = { ...this.current, entries: [...this.current.entries, entry] };
          else this.current = { ...(this.current as SessionDto), entries: [entry], note: null };
        }
        this.selectedGoalId = null;
        this.entryValue = null;
      },
      error: err => { console.error(err); this.error = 'Could not add entry (are you the assigned clinician? Is session completed?)'; }
    });
  }

  completeFromModal() { if (this.current) this.complete(this.current); }

  reopenFromModal() {
    if (!this.current || !this.isAdmin) return;
    this.api.adminSetStatus(this.current.id, { status: SCHEDULED }).subscribe({
      next: (updated) => { this.replaceRow(updated); this.current = updated; },
      error: err => { console.error(err); this.error = 'Unable to reopen session.'; }
    });
  }

  togglePayrollLock() {
    if (!this.current || !this.isAdmin) return;
    const next = !this.current.lockedForPayroll;
    this.api.setPayrollLock(this.current.id, next).subscribe({
      next: (updated) => { this.replaceRow(updated); this.current = updated; },
      error: err => { console.error(err); this.error = 'Unable to update payroll lock.'; }
    });
  }

  private replaceRow(updated: SessionDto) {
    const i = this.sessions.findIndex(x => x.id === updated.id);
    if (i >= 0) this.sessions[i] = updated;
    else this.sessions.unshift(updated);
  }

  // -------- Admin create ----------
  openCreate() {
    this.showCreate = true;
    this.error = '';
    // suggest now + 30min
    const now = new Date();
    const plus30 = new Date(now.getTime() + 30 * 60 * 1000);
    this.createForm.startLocal = this.toLocalInput(now);
    this.createForm.endLocal = this.toLocalInput(plus30);
    if (this.clinicians.length === 1) this.createForm.clinicianId = this.clinicians[0].id;
  }

  closeCreate() {
    this.showCreate = false;
    this.createForm = { clientId: null, clinicianId: null, startLocal: '', endLocal: '' };
  }

  createSession() {
    if (!this.createForm.clientId || !this.createForm.clinicianId || !this.createForm.startLocal) {
      this.error = 'Please choose client, clinician, and start time.'; return;
    }
    const startISO = new Date(this.createForm.startLocal).toISOString();
    const endISO = this.createForm.endLocal ? new Date(this.createForm.endLocal).toISOString() : null;

    this.api.create({
      clientId: this.createForm.clientId,
      clinicianId: this.createForm.clinicianId,
      startTime: startISO,
      endTime: endISO
    }).subscribe({
      next: (created) => {
        this.replaceRow(created);
        this.closeCreate();
      },
      error: err => { console.error(err); this.error = 'Create failed (check inputs).'; }
    });
  }

  private toLocalInput(d: Date) {
    // yyyy-MM-ddTHH:mm
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${day}T${hh}:${mm}`;
  }
}
