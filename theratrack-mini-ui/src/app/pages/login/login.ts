import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = 'admin@example.com';
  password = 'Passw0rd!';
  loading = false;
  error = '';
  show = false; // 👈 eye toggle

  constructor(private auth: AuthService, private router: Router) { }

  get passwordType() { return this.show ? 'text' : 'password'; }
  toggleShow(e: Event) { e.preventDefault(); this.show = !this.show; }

  submit() {
    this.error = ''; this.loading = true;
    this.auth.login({ email: this.email, password: this.password })
      .subscribe({
        next: () => { this.loading = false; this.router.navigateByUrl('/dashboard'); },
        error: () => { this.loading = false; this.error = 'Login failed'; }
      });
  }
}
