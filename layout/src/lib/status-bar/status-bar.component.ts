import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { StatusBarContext, StatusBarItem } from '../application-context.model';

@Component({
    selector: 'app-status-bar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './status-bar.component.html',
    styleUrls: ['./status-bar.component.scss']
})
export class StatusBarComponent {
    @Input() context?: StatusBarContext;
    @Input() user: any;

    get items(): StatusBarItem[] {
        const configured = (this.context?.items || [])
            .filter(item => item.visible !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        if (configured.length) {
            return configured;
        }

        return [
            { code: 'application', fallbackLabel: this.context?.applicationName || 'KYC', value: this.context?.version || 'v1.0.0', order: 10 },
            { code: 'environment', fallbackLabel: 'Environment', value: this.context?.environment || 'DEV', order: 20 },
            { code: 'tenant', fallbackLabel: 'Tenant', value: this.context?.tenantCode || 'DEFAULT', order: 30 },
            { code: 'user', fallbackLabel: 'Logged in', value: this.context?.loggedInUserDisplayName || this.user?.sub || this.user?.username || 'User', order: 40 }
        ];
    }
}
