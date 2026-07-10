import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../layout.service';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@nexacore/shared/i18n/translate.pipe';
import { TopNavigationItem } from '../application-context.model';
import { TopNavigationRendererComponent } from '../top-navigation-renderer/top-navigation-renderer.component';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [CommonModule, RouterLink, TranslatePipe, TopNavigationRendererComponent],
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
    @Input() theme: string = 'light';
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
    }

    onLogout() {
        this.logout.emit();
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    topNavigationItems(): TopNavigationItem[] {
        const configuredItems = this.layoutService.headerContext()?.items || [];
        if (configuredItems.length) {
            return configuredItems;
        }

        const context = this.layoutService.applicationContext();
        const header = context?.header;
        const tenantLabel = context?.tenant?.tenantCode || context?.clientCode || 'DEFAULT';

        return [
            { code: 'search', type: 'Search', fallbackLabel: 'Search', icon: 'fa fa-search', order: 10, visible: header?.globalSearchEnabled !== false },
            { code: 'notifications', type: 'Notification', fallbackLabel: 'Notifications', icon: 'fa fa-bell', order: 20, visible: header?.notificationsEnabled !== false },
            { code: 'help', type: 'Help', fallbackLabel: 'Help', icon: 'fa fa-circle-question', route: '/help', order: 30, visible: header?.helpEnabled !== false },
            { code: 'language', type: 'Language', fallbackLabel: 'Language', order: 40, visible: header?.languageSelectorEnabled !== false },
            { code: 'tenant', type: 'Tenant', fallbackLabel: tenantLabel, icon: 'fa fa-building', order: 50, visible: header?.tenantSelectorEnabled !== false },
            { code: 'theme', type: 'Action', fallbackLabel: 'Theme', icon: this.theme === 'dark' ? 'fa fa-sun' : 'fa fa-moon', action: 'toggleTheme', order: 60 },
            { code: 'settings', type: 'Settings', fallbackLabel: 'Settings', icon: 'fa fa-gear', route: '/settings', order: 70, visible: header?.settingsEnabled !== false },
            { code: 'profile', type: 'Profile', fallbackLabel: 'Profile', order: 80, visible: header?.profileMenuEnabled !== false }
        ];
    }
}
