import { Injectable, computed, effect, signal } from '@angular/core';
import {
    ApplicationContext,
    HeaderContext,
    LayoutContext,
    NavigationView,
    StatusBarContext,
    ThemeContext
} from './application-context.model';

export type ThemeType = 'light' | 'dark' | 'blue-enterprise' | 'navy-banking' | 'green-compliance' | 'purple-corporate' | 'gray-professional';
export type LayoutType = 'default' | 'compact' | 'horizontal';

@Injectable({ providedIn: 'root' })
export class LayoutService {
    private readonly navigationViewPreferenceKey = 'nexacore.navigationView';
    private readonly themePreferenceKey = 'nexacore.theme';

    private _layout = signal({
        showSidebar: false,
        showTopbar: false,
        collapsed: false,
        showBreadcrumb: true,
        showCommandBar: true,
        showStatusBar: true,
        allowNavigationViewToggle: true
    });

    private _theme = signal<ThemeType>('light');
    private _layoutType = signal<LayoutType>('default');
    private _navigationView = signal<NavigationView>('detail');
    private _applicationContext = signal<ApplicationContext | null>(null);

    layout = computed(() => this._layout());
    theme = computed(() => this._theme());
    bootstrapTheme = computed(() => this._theme() === 'dark' ? 'dark' : 'light');
    layoutType = computed(() => this._layoutType());
    navigationView = computed(() => this._navigationView());
    applicationContext = computed(() => this._applicationContext());
    layoutContext = computed<LayoutContext | undefined>(() => this._applicationContext()?.layout);
    headerContext = computed<HeaderContext | undefined>(() => this._applicationContext()?.header);
    statusBarContext = computed<StatusBarContext | undefined>(() => this._applicationContext()?.statusBar);
    themeContext = computed<ThemeContext | undefined>(() => this._applicationContext()?.theme);

    constructor() {
        effect(() => {
            this.applyThemeToDocument(this._theme(), this._applicationContext()?.theme?.tokens);
        });
    }

    toggleSidebar(): void {
        this._navigationView.update(view => {
            const nextView: NavigationView = view === 'icon' ? 'detail' : 'icon';
            if (this._applicationContext()?.navigation?.allowUserViewPreference !== false) {
                localStorage.setItem(this.navigationViewPreferenceKey, nextView);
            }
            return nextView;
        });
        this._layout.update(cfg => ({ ...cfg, collapsed: this._navigationView() === 'icon' }));
    }

    setNavigationView(view: NavigationView): void {
        this._navigationView.set(view);
        this._layout.update(cfg => ({ ...cfg, collapsed: view === 'icon' }));
        if (this._applicationContext()?.navigation?.allowUserViewPreference !== false) {
            localStorage.setItem(this.navigationViewPreferenceKey, view);
        }
    }

    setTheme(theme: ThemeType): void {
        this._theme.set(theme);
        document.body.dataset.bsTheme = theme === 'dark' ? 'dark' : 'light';
        if (this._applicationContext()?.theme?.allowUserOverride) {
            localStorage.setItem(this.themePreferenceKey, theme);
        }
    }

    setLayoutType(type: LayoutType): void {
        this._layoutType.set(type);
    }

    setApplicationContext(context: ApplicationContext): void {
        this._applicationContext.set(context);

        const layout = context.layout;
        const header = context.header;
        const statusBar = context.statusBar;
        const defaultNavigationView = this.resolveNavigationView(context);
        const themeCode = this.resolveTheme(context.theme);

        this._layout.update(cfg => ({
            ...cfg,
            showSidebar: layout?.leftNavigationEnabled !== false,
            showTopbar: layout?.headerEnabled !== false && header?.enabled !== false,
            showBreadcrumb: layout?.breadcrumbEnabled !== false,
            showCommandBar: layout?.commandBarEnabled !== false,
            showStatusBar: layout?.statusBarEnabled !== false && statusBar?.enabled !== false,
            allowNavigationViewToggle: layout?.allowNavigationViewToggle !== false,
            collapsed: defaultNavigationView === 'icon'
        }));

        this._navigationView.set(defaultNavigationView);
        this._theme.set(themeCode);
    }

    setAuthenticatedLayout(): void {
        this._layout.set({
            showSidebar: true,
            showTopbar: true,
            collapsed: false,
            showBreadcrumb: true,
            showCommandBar: true,
            showStatusBar: true,
            allowNavigationViewToggle: true
        });
    }

    setPublicLayout(): void {
        this._layout.set({
            showSidebar: false,
            showTopbar: false,
            collapsed: false,
            showBreadcrumb: false,
            showCommandBar: false,
            showStatusBar: false,
            allowNavigationViewToggle: false
        });
    }

    private resolveNavigationView(context: ApplicationContext): NavigationView {
        const savedView = localStorage.getItem(this.navigationViewPreferenceKey) as NavigationView | null;
        if (context.navigation?.allowUserViewPreference !== false && (savedView === 'icon' || savedView === 'detail')) {
            return savedView;
        }
        return context.navigation?.defaultView || context.layout?.defaultNavigationView || 'detail';
    }

    private resolveTheme(theme?: ThemeContext): ThemeType {
        const savedTheme = localStorage.getItem(this.themePreferenceKey) as ThemeType | null;
        if (theme?.allowUserOverride && this.isKnownTheme(savedTheme)) {
            return savedTheme;
        }
        return this.isKnownTheme(theme?.themeCode) ? theme?.themeCode as ThemeType : 'light';
    }

    private isKnownTheme(theme?: string | null): theme is ThemeType {
        return !!theme && ['light', 'dark', 'blue-enterprise', 'navy-banking', 'green-compliance', 'purple-corporate', 'gray-professional'].includes(theme);
    }

    private applyThemeToDocument(theme: ThemeType, tokens?: Record<string, string>): void {
        document.body.dataset.bsTheme = theme === 'dark' ? 'dark' : 'light';
        document.body.dataset.ncTheme = theme;

        Object.entries(tokens || {}).forEach(([key, value]) => {
            const cssKey = key.startsWith('--') ? key : `--nc-${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}`;
            document.body.style.setProperty(cssKey, value);
        });
    }
}
