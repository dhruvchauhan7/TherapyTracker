import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Clinician {
  id: number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class ClinicianService {
  private base = `${environment.apiUrl}/clinicians`;

  constructor(private http: HttpClient) { }

  // GET /api/clinicians (Requires JWT; Admin or Clinician depending on your API)
  list(): Observable<Clinician[]> {
    return this.http.get<Clinician[]>(this.base);
  }
}
