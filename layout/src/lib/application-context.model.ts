export type NavigationView = 'icon' | 'detail';
export type TopNavigationItemType =
    | 'Logo'
    | 'Search'
    | 'Notification'
    | 'Help'
    | 'Language'
    | 'Tenant'
    | 'Profile'
    | 'Settings'
    | 'Link'
    | 'Action'
    | 'Custom';

export interface LayoutContext {
    shellType?: string;
    headerEnabled?: boolean;
    breadcrumbEnabled?: boolean;
    commandBarEnabled?: boolean;
    leftNavigationEnabled?: boolean;
    statusBarEnabled?: boolean;
    navigationMode?: string;
    defaultNavigationView?: NavigationView;
    allowNavigationViewToggle?: boolean;
    contentWidth?: string;
    density?: 'compact' | 'comfortable' | 'spacious';
}

export interface ThemeContext {
    themeCode?: string;
    allowUserOverride?: boolean;
    tokens?: Record<string, string>;
}

export interface BrandingContext {
    applicationName?: string;
    logoUrl?: string;
    homeRoute?: string;
}

export interface TopNavigationItem {
    code: string;
    type: TopNavigationItemType | string;
    labelCode?: string;
    fallbackLabel?: string;
    icon?: string;
    route?: string;
    action?: string;
    position?: 'left' | 'right';
    order?: number;
    visible?: boolean;
    disabled?: boolean;
    privilegeCodes?: string[];
    featureCode?: string;
    configuration?: Record<string, unknown>;
}

export interface HeaderContext {
    enabled?: boolean;
    items?: TopNavigationItem[];
    globalSearchEnabled?: boolean;
    notificationsEnabled?: boolean;
    helpEnabled?: boolean;
    languageSelectorEnabled?: boolean;
    tenantSelectorEnabled?: boolean;
    settingsEnabled?: boolean;
    profileMenuEnabled?: boolean;
}

export interface StatusBarItem {
    code: string;
    type?: string;
    labelCode?: string;
    fallbackLabel?: string;
    value?: string;
    order?: number;
    visible?: boolean;
    privilegeCodes?: string[];
}

export interface StatusBarContext {
    enabled?: boolean;
    items?: StatusBarItem[];
    applicationName?: string;
    version?: string;
    environment?: string;
    tenantCode?: string;
    loggedInUserDisplayName?: string;
}

export interface NavigationContext {
    mode?: string;
    supportedViews?: NavigationView[];
    defaultView?: NavigationView;
    allowUserViewPreference?: boolean;
    featureTypes?: string[];
    defaultFeatureType?: string;
    submenuTrigger?: 'hover' | 'click' | 'focus';
    collapseBehavior?: string;
    items?: SidebarMenuItem[];
}

export interface TenantContext {
    tenantCode?: string;
    tenantName?: string;
}

export interface LocalizationContext {
    defaultLanguage?: string;
    supportedLanguages?: string[];
}

export interface SidebarMenuItem {
    label: string;
    icon?: string;
    path?: string;
    menuOrder?: number;
    subMenuOrder?: number;
    privilegeCodes?: string[];
    moduleCode?: string;
    submoduleCode?: string;
    featureCode?: string;
    featureType?: string;
    code?: string;
    visible?: boolean;
    disabled?: boolean;
    children?: SidebarMenuItem[];
}

export interface ApplicationContext {
    clientCode?: string;
    clientType?: string;
    layout?: LayoutContext;
    branding?: BrandingContext;
    theme?: ThemeContext;
    navigation?: NavigationContext;
    header?: HeaderContext;
    statusBar?: StatusBarContext;
    tenant?: TenantContext;
    localization?: LocalizationContext;
    menus: SidebarMenuItem[];
    privilegeCodes: string[];
    enabledModules?: string[];
    enabledSubmodules?: string[];
    enabledFeatures?: string[];
}

export interface WrappedApplicationContext {
    data?: ApplicationContext;
}
