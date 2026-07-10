import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LayoutService } from '../layout.service';

@Component({
    selector: 'app-navigation-view-toggle',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './navigation-view-toggle.component.html',
    styleUrls: ['./navigation-view-toggle.component.scss']
})
export class NavigationViewToggleComponent {
    @Input() compact = false;

    constructor(public layoutService: LayoutService) {}

    toggle(): void {
        this.layoutService.toggleSidebar();
    }
}
