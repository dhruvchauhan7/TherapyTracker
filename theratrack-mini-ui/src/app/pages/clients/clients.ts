import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Client, ClientService } from '../../services/client.service';
import { AuthService } from '../../services/auth';
import { Clinician, ClinicianService } from '../../services/clinician';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.html',
  styleUrls: ['./clients.css']
})
export class Clients implements OnInit {
  clients: Client[] = [];
  clinicians: Clinician[] = [];

  loading = false;
  error = '';

  showForm = false;
  editingId: number | null = null;
  form = { name: '', assignedClinicianId: null as number | null };

  clinicianSearch = '';
  showClinicianMenu = false;

  @ViewChild('comboRef') comboRef!: ElementRef<HTMLDivElement>;

  constructor(
    private api: ClientService,
    private auth: AuthService,
    private clinicianApi: ClinicianService
  ) { }

  get isAdmin() { return this.auth.getRole() === 'ADMIN'; }

  ngOnInit() {
    this.load();
    if (this.isAdmin) this.loadClinicians();
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    if (!this.showClinicianMenu || !this.comboRef) return;
    const target = ev.target as Node;
    if (!this.comboRef.nativeElement.contains(target)) {
      this.showClinicianMenu = false;
    }
  }

  // Data
  load() {
    this.loading = true; this.error = '';
    this.api.list().subscribe({
      next: data => { this.clients = data; this.loading = false; },
      error: err => { this.error = 'Failed to load clients'; this.loading = false; console.error(err); }
    });
  }

  loadClinicians() {
    this.clinicianApi.list().subscribe({
      next: list => this.clinicians = list,
      error: err => console.error('Failed to load clinicians', err)
    });
  }

  // Helpers
  nameFor(id: number | null | undefined): string {
    if (id == null) return '—';
    const c = this.clinicians.find(x => x.id === id);
    return c ? c.name : String(id);
  }

  filteredClinicians(): Clinician[] {
    const q = (this.clinicianSearch || '').toLowerCase().trim();
    if (!q) return this.clinicians.slice(0, 8);
    return this.clinicians
      .filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      .slice(0, 8);
  }

  // NOTE: accept Event (Angular templates type $event as Event); cast inside
  selectFirstMatch(ev: Event) {
    ev.preventDefault();
    const first = this.filteredClinicians()[0];
    if (first) this.selectClinician(first);
  }

  selectClinician(c: Clinician, inputEl?: HTMLInputElement) {
    this.form.assignedClinicianId = c.id;
    this.clinicianSearch = c.name;
    this.showClinicianMenu = false;
    setTimeout(() => inputEl?.blur(), 0);
  }

  // Modal
  openCreate() {
    this.editingId = null;
    this.form = { name: '', assignedClinicianId: null };
    this.clinicianSearch = '';
    this.showForm = true;
    this.showClinicianMenu = false;
    if (this.isAdmin && this.clinicians.length === 0) this.loadClinicians();
  }

  openEdit(c: Client) {
    this.editingId = c.id;
    this.form = { name: c.name, assignedClinicianId: c.assignedClinicianId ?? null };
    const current = this.clinicians.find(x => x.id === c.assignedClinicianId);
    this.clinicianSearch = current ? current.name : '';
    this.showForm = true;
    this.showClinicianMenu = false;
    if (this.isAdmin && this.clinicians.length === 0) this.loadClinicians();
  }

  save() {
    const body = {
      name: (this.form.name ?? '').trim(),
      assignedClinicianId: this.form.assignedClinicianId
    };
    if (!body.name) { this.error = 'Name is required'; return; }

    const done = () => { this.showForm = false; this.load(); };

    if (this.editingId == null) {
      this.api.create(body).subscribe({
        next: done,
        error: err => { this.error = 'Create failed'; console.error(err); }
      });
    } else {
      this.api.update(this.editingId, body).subscribe({
        next: done,
        error: err => { this.error = 'Update failed'; console.error(err); }
      });
    }
  }

  cancel() { this.showForm = false; this.showClinicianMenu = false; }
}
