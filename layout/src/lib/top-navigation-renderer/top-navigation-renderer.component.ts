import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { I18nService, SupportedLocale } from '@nexacore/shared/i18n/i18n.service';
import { TranslatePipe } from '@nexacore/shared/i18n/translate.pipe';
import { TopNavigationItem } from '../application-context.model';

@Component({
    selector: 'app-top-navigation-renderer',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
    templateUrl: './top-navigation-renderer.component.html',
    styleUrls: ['./top-navigation-renderer.component.scss']
})
export class TopNavigationRendererComponent {
    @Input() items: TopNavigationItem[] = [];
    @Input() user: any;
    @Input() theme: string = 'light';
    @Output() logout = new EventEmitter<void>();
    @Output() themeToggle = new EventEmitter<void>();

    constructor(public i18nService: I18nService) {}

    get selectedLocale(): SupportedLocale {
        return this.i18nService.locale();
    }

    get visibleItems(): TopNavigationItem[] {
        return (this.items || [])
            .filter(item => item.visible !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    itemLabel(item: TopNavigationItem): string {
        return item.labelCode || item.fallbackLabel || item.code;
    }

    fallbackLabel(item: TopNavigationItem): string {
        return item.fallbackLabel || item.code;
    }

    async changeLanguage(locale: string): Promise<void> {
        await this.i18nService.use(locale);
    }

    handleAction(item: TopNavigationItem): void {
        if (item.disabled) {
            return;
        }
        if (item.action === 'toggleTheme') {
            this.themeToggle.emit();
        }
        if (item.action === 'logout') {
            this.logout.emit();
        }
    }
}
