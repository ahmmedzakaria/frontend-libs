export interface LayoutConfig {
    showSidebar: boolean;
    showTopbar: boolean;
    collapsed: boolean;
    showBreadcrumb?: boolean;
    showCommandBar?: boolean;
    showStatusBar?: boolean;
    allowNavigationViewToggle?: boolean;
    theme?: 'light' | 'dark' | 'blue-enterprise' | 'navy-banking' | 'green-compliance' | 'purple-corporate' | 'gray-professional';
}
