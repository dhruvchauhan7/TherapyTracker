import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type SessionStatusNum = 0 | 1 | 2 | 3; // SCHEDULED, COMPLETED, CANCELED, NO_SHOW

export interface SessionDto {
  id: number;
  clientId: number;
  clinicianId: number;
  startTime: string;          // ISO
  endTime?: string | null;    // ISO
  status: SessionStatusNum;
  lockedForPayroll: boolean;

  // NEW: list endpoint can include these display names
  clientName?: string;
  clinicianName?: string;

  // present only on extended fetch (byId)
  note?: SessionNoteDto | null;
  entries?: SessionEntryDto[];
}

export interface SessionEntryDto {
  id: number;
  goalId: number;
  value: number;
}

export interface SessionNoteDto {
  id: number;
  sessionId: number;
  soapText: string;
}

export interface SessionDtoExtended extends SessionDto {
  note: SessionNoteDto | null;
  entries: SessionEntryDto[];
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private base = `${environment.apiUrl}/sessions`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<SessionDto[]> {
    return this.http.get<SessionDto[]>(this.base);
  }

  getById(id: number): Observable<SessionDtoExtended> {
    return this.http.get<SessionDtoExtended>(`${this.base}/${id}`);
  }

  // Admin create
  create(req: {
    clientId: number;
    clinicianId: number;
    startTime: string;             // ISO
    endTime?: string | null;       // ISO or null
  }): Observable<SessionDto> {
    return this.http.post<SessionDto>(this.base, req);
  }

  // Clinician update status
  updateStatus(id: number, body: { status: SessionStatusNum }): Observable<SessionDto> {
    return this.http.put<SessionDto>(`${this.base}/${id}`, body);
  }

  // Clinician add entry
  addEntry(id: number, body: { goalId: number; value: number }): Observable<SessionEntryDto> {
    return this.http.post<SessionEntryDto>(`${this.base}/${id}/entries`, body);
  }

  // Clinician add/update note
  addNote(id: number, body: { soapText: string }): Observable<SessionNoteDto> {
    return this.http.post<SessionNoteDto>(`${this.base}/${id}/note`, body);
  }

  // Admin-only helpers used in modal
  adminSetStatus(id: number, body: { status: SessionStatusNum }): Observable<SessionDto> {
    // backend route: PUT /api/sessions/{id}/status
    return this.http.put<SessionDto>(`${this.base}/${id}/status`, body);
  }

  setPayrollLock(id: number, locked: boolean): Observable<SessionDto> {
    // backend route: PUT /api/sessions/{id}/payroll-lock  (body: { locked: boolean })
    return this.http.put<SessionDto>(`${this.base}/${id}/payroll-lock`, { locked });
  }
}
