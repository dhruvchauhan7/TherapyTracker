import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';

type LoginReq = { email: string; password: string };
type LoginRes = { accessToken: string; refreshToken: string };
type Role = 'ADMIN' | 'CLINICIAN' | '';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ---- Auth API -------------------------------------------------------------

  login(body: LoginReq): Observable<LoginRes> {
    return this.http
      .post<LoginRes>(`${this.base}/auth/login`, body)
      .pipe(tap(r => this.setTokens(r.accessToken, r.refreshToken)));
  }

  refresh(): Observable<LoginRes> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<LoginRes>(`${this.base}/auth/refresh`, { refreshToken })
      .pipe(tap(r => this.setTokens(r.accessToken, r.refreshToken)));
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // ---- Token helpers --------------------------------------------------------

  getAccessToken(): string {
    return localStorage.getItem('accessToken') ?? '';
  }

  getRefreshToken(): string {
    return localStorage.getItem('refreshToken') ?? '';
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  // ---- Role helpers ---------------------------------------------------------

  /**
   * Returns 'ADMIN' | 'CLINICIAN' | '' by decoding the JWT.
   * Tries several common claim keys and normalizes to uppercase.
   */
  getRole(): Role {
    const t = this.getAccessToken();
    if (!t) return '';

    try {
      const payload = this.decodeJwtPayload(t);

      // Try common claim keys:
      let val: unknown =
        payload.role ??
        payload.roles ??
        payload['Role'] ??
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        '';

      if (Array.isArray(val)) val = val[0] ?? '';
      const role = String(val).toUpperCase();

      if (role === 'ADMIN' || role === 'CLINICIAN') return role as Role;
      return '';
    } catch {
      return '';
    }
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isClinician(): boolean {
    return this.getRole() === 'CLINICIAN';
  }

  // ---- Private utils --------------------------------------------------------

  private setTokens(access: string, refresh: string): void {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }

  /** Base64URL-safe JWT payload decode */
  private decodeJwtPayload(token: string): any {
    const part = token.split('.')[1];
    if (!part) throw new Error('Invalid token');

    // Convert base64url -> base64
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  }
}
