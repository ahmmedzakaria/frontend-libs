import { Component } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { LayoutService } from '../layout.service';
import { AuthService } from '@nexacore/auth';
import { BreadcrumbBarComponent } from '../breadcrumb-bar/breadcrumb-bar.component';
import { PageCommandBarComponent } from '../page-command-bar/page-command-bar.component';
import { StatusBarComponent } from '../status-bar/status-bar.component';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [
        CommonModule,
        TopbarComponent,
        SidebarComponent,
        BreadcrumbBarComponent,
        PageCommandBarComponent,
        StatusBarComponent,
        RouterOutlet,
        AsyncPipe
    ],
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
    constructor(
        public layoutService: LayoutService,
        public authService: AuthService
    ) {}

    onLogout(): void {
        this.authService.logout();
        this.layoutService.setPublicLayout();
    }
}
