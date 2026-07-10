import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { SidebarMenuService } from '../sidebar-menu.service';
import { TranslatePipe } from '@nexacore/shared/i18n/translate.pipe';
import { SidebarMenuItem } from '../application-context.model';
import { LayoutService } from '../layout.service';
import { NavigationSubmenuPanelComponent } from '../navigation-submenu-panel/navigation-submenu-panel.component';
import { NavigationViewToggleComponent } from '../navigation-view-toggle/navigation-view-toggle.component';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [
        NgFor,
        NgIf,
        RouterLink,
        RouterLinkActive,
        TranslatePipe,
        NavigationSubmenuPanelComponent,
        NavigationViewToggleComponent
    ],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
    constructor(
        private sidebarMenuService: SidebarMenuService,
        public layoutService: LayoutService,
        private router: Router
    ) {}

    menuItems: SidebarMenuItem[] = [];
    selectedItem?: SidebarMenuItem | null;
    loading = true;

    ngOnInit(): void {
        this.sidebarMenuService.loadSidebarMenu().subscribe({
            next: menuItems => {
                this.menuItems = menuItems || [];
                this.loading = false;
            },
            error: () => {
                this.menuItems = [];
                this.loading = false;
            }
        });
    }

    selectItem(item: SidebarMenuItem): void {
        if (item.disabled) {
            return;
        }
        this.selectedItem = item.children?.length ? item : null;
        if (item.path && !item.children?.length) {
            this.router.navigate([item.path]);
        }
    }

    openSubmenu(item: SidebarMenuItem): void {
        if (item.children?.length) {
            this.selectedItem = item;
        }
    }

    closeSubmenu(): void {
        this.selectedItem = null;
    }

    menuLabelKey(label: string): string {
        const normalizedLabel = label
            .trim()
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '.')
            .replace(/^\.+|\.+$/g, '');

        return normalizedLabel ? `nav.${normalizedLabel}` : 'nav.unknown';
    }
}
