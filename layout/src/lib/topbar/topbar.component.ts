import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../layout.service';
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
    @Input() theme: 'light' | 'dark' = 'light';
    @Input() user: any;
    @Output() logout = new EventEmitter<void>();

    isMenuOpen = true;

    constructor(public layoutService: LayoutService) {}

    toggleSidebar() {
        this.layoutService.toggleSidebar();
    }

    toggleTheme(): void {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.theme = newTheme;
        this.layoutService.setTheme(newTheme);
        document.body.setAttribute('data-bs-theme', newTheme);
    }

    onLogout() {
        this.logout.emit();
        console.log("logout");
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }
}
