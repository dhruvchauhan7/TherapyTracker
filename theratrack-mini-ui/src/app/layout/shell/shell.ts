import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './shell.html',
  styleUrls: ['./shell.css']
})
export class Shell {
  constructor(private auth: AuthService, private router: Router) { }

  // Getter avoids "used before initialization"
  get userRole(): string {
    return this.auth.getRole();
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
