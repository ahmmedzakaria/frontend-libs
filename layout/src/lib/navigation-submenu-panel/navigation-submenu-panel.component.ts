import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@nexacore/shared/i18n/translate.pipe';
import { SidebarMenuItem } from '../application-context.model';

@Component({
    selector: 'app-navigation-submenu-panel',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
    templateUrl: './navigation-submenu-panel.component.html',
    styleUrls: ['./navigation-submenu-panel.component.scss']
})
export class NavigationSubmenuPanelComponent {
    @Input() item?: SidebarMenuItem | null;

    menuLabelKey(label?: string): string {
        const normalizedLabel = (label || '')
            .trim()
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '.')
            .replace(/^\.+|\.+$/g, '');

        return normalizedLabel ? `nav.${normalizedLabel}` : 'nav.unknown';
    }
}
