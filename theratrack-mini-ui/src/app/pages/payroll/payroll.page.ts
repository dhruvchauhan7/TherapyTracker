import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService, SessionDto } from '../../services/session.service';
import { ClientService, Client } from '../../services/client.service';
import { ClinicianService, Clinician } from '../../services/clinician';
import { AuthService } from '../../services/auth';

type SessionStatusNum = 0 | 1 | 2 | 3;
const COMPLETED: SessionStatusNum = 1;

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './payroll.page.html',
  styleUrls: ['./payroll.page.css']
})
export class PayrollPage {
  loading = false;
  error = '';

  sessions: SessionDto[] = [];
  clients: Client[] = [];
  clinicians: Clinician[] = [];

  // filters
  from!: string; // yyyy-MM-dd
  to!: string;   // yyyy-MM-dd
  clinicianId: number | null = null;
  clientId: number | null = null;
  onlyUnlocked = false;

  constructor(
    private api: SessionService,
    private clientsApi: ClientService,
    private cliniciansApi: ClinicianService,
    private auth: AuthService
  ) {
    this.initDates();
    this.load();
  }

  get isAdmin() { return this.auth.getRole() === 'ADMIN'; }

  private initDates() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.from = this.toInputDate(start);
    this.to = this.toInputDate(end);
  }

  private toInputDate(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  load() {
    this.loading = true; this.error = '';
    this.api.getAll().subscribe({
      next: s => { this.sessions = s; this.loading = false; },
      error: err => { console.error(err); this.error = 'Failed to load sessions'; this.loading = false; }
    });
    this.clientsApi.list().subscribe({ next: c => this.clients = c });
    this.cliniciansApi.list().subscribe({ next: h => this.clinicians = h });
  }

  // helpers
  clientName(id: number) { return this.clients.find(c => c.id === id)?.name ?? String(id); }
  clinicianName(id: number) { return this.clinicians.find(h => h.id === id)?.name ?? String(id); }
  fmt(dt?: string | null) { return dt ? new Date(dt).toLocaleString() : '—'; }

  get filtered(): SessionDto[] {
    const fromMs = this.from ? new Date(this.from + 'T00:00:00').getTime() : -Infinity;
    const toMs = this.to ? new Date(this.to + 'T23:59:59').getTime() : Infinity;
    return this.sessions.filter(s => {
      if (s.status !== COMPLETED) return false;
      const endMs = s.endTime ? new Date(s.endTime).getTime() : 0;
      if (endMs < fromMs || endMs > toMs) return false;
      if (this.clientId && s.clientId !== this.clientId) return false;
      if (this.clinicianId && s.clinicianId !== this.clinicianId) return false;
      if (this.onlyUnlocked && s.lockedForPayroll) return false;
      return true;
    }).sort((a, b) => (new Date(a.endTime || '').getTime() - new Date(b.endTime || '').getTime()));
  }

  toggleLock(s: SessionDto) {
    if (!this.isAdmin) return;
    const next = !s.lockedForPayroll;
    this.api.setPayrollLock(s.id, next).subscribe({
      next: upd => {
        // update local row
        const idx = this.sessions.findIndex(x => x.id === upd.id);
        if (idx >= 0) this.sessions[idx] = upd;
      },
      error: err => { console.error(err); this.error = 'Unable to update payroll lock.'; }
    });
  }

  exportCsv() {
    const rows = this.filtered;
    const headers = ['SessionID', 'Client', 'Clinician', 'Start', 'End', 'Status', 'PayrollLock'];
    const lines = [headers.join(',')];

    for (const s of rows) {
      const row = [
        s.id,
        this.csvSafe(this.clientName(s.clientId)),
        this.csvSafe(this.clinicianName(s.clinicianId)),
        this.fmt(s.startTime),
        this.fmt(s.endTime),
        'COMPLETED',
        s.lockedForPayroll ? 'Locked' : 'Unlocked'
      ];
      lines.push(row.join(','));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fromLabel = this.from || 'all';
    const toLabel = this.to || 'all';
    a.download = `payroll_${fromLabel}_to_${toLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private csvSafe(v: string) {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  }
}
