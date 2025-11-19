import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Goal {
  id: number;
  clientId: number;
  name: string;
  description?: string | null;
  unit?: string | null;
  targetValue?: number | null;
}

@Injectable({ providedIn: 'root' })
export class GoalService {
  private base = `${environment.apiUrl}/goals`;
  constructor(private http: HttpClient) { }
  listByClient(clientId: number): Observable<Goal[]> {
    const params = new HttpParams().set('clientId', String(clientId));
    return this.http.get<Goal[]>(this.base, { params });
  }
}
