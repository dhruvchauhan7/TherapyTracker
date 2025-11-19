import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export type Client = {
  id: number;
  name: string;
  assignedClinicianId: number | null;
};

@Injectable({ providedIn: 'root' })
export class ClientService {
  private base = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) { }

  list(): Observable<Client[]> {
    return this.http.get<Client[]>(this.base);
  }

  create(body: { name: string; assignedClinicianId: number | null }): Observable<Client> {
    return this.http.post<Client>(this.base, body);
  }

  update(id: number, body: { name: string; assignedClinicianId: number | null }): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, body);
  }
}
