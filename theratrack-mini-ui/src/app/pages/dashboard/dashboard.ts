import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';
import { ClientService, Client } from '../../services/client.service';
import { SessionService, SessionDto } from '../../services/session.service';

type RoleBadge = 'ADMIN' | 'CLINICIAN';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  loading = true;
  error = '';

  role: RoleBadge = 'CLINICIAN';
  clients: Client[] = [];
  sessions: SessionDto[] = [];

  // computed metrics
  totalClients = 0;
  totalSessions = 0;
  completed30 = 0;
  upcoming7 = 0;

  upcomingList: SessionDto[] = [];
  recentList: SessionDto[] = [];

  constructor(
    private auth: AuthService,
    private clientsApi: ClientService,
    private sessionsApi: SessionService
  ) { }

  ngOnInit(): void {
    this.role = (this.auth.getRole() as RoleBadge) ?? 'CLINICIAN';
    this.loadData();
  }

  private loadData() {
    this.loading = true; this.error = '';

    this.clientsApi.list().subscribe({
      next: c => { this.clients = c; this.compute(); },
      error: () => { }
    });

    this.sessionsApi.getAll().subscribe({
      next: s => {
        this.sessions = s;
        this.compute();
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Failed to load dashboard data.';
        this.loading = false;
      }
    });
  }

  private compute() {
    const now = new Date();
    const back30 = new Date(now.getTime() - 30 * 86400000);
    const in7d = new Date(now.getTime() + 7 * 86400000);

    this.totalClients = this.clients.length;
    this.totalSessions = this.sessions.length;

    this.completed30 = this.sessions.filter(s =>
      s.status === 1 && s.endTime && new Date(s.endTime) >= back30
    ).length;

    const upcoming = this.sessions
      .filter(s => {
        const st = new Date(s.startTime);
        return s.status === 0 && st >= now && st <= in7d;
      })
      .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));

    this.upcoming7 = upcoming.length;
    this.upcomingList = upcoming.slice(0, 6);

    this.recentList = [...this.sessions]
      .sort((a, b) => new Date(b.endTime ?? b.startTime).getTime() - new Date(a.endTime ?? a.startTime).getTime())
      .slice(0, 6);
  }

  clientName(id: number) { return this.clients.find(c => c.id === id)?.name ?? String(id); }
  badgeText() { return this.role; }
  fmt(dt?: string | null) { return dt ? new Date(dt).toLocaleString() : '—'; }

  statusChip(s: number) {
    switch (s) {
      case 0: return 'SCHEDULED';
      case 1: return 'COMPLETED';
      case 2: return 'CANCELED';
      case 3: return 'NO_SHOW';
      default: return String(s);
    }
  }
}
