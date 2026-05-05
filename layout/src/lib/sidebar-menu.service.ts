import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ActionTypes, ApiEndpoint, ApiService } from '@kyc/api-common';

export interface SidebarMenuItem {
    label: string;
    icon?: string;
    path?: string;
    privilegeCodes?: string[];
    children?: SidebarMenuItem[];
}

export interface ApplicationContext {
    menus: SidebarMenuItem[];
    privilegeCodes: string[];
}

interface WrappedApplicationContext {
    data?: ApplicationContext;
}

const PRIVILEGE_CONTEXT_ENDPOINT: ApiEndpoint = {
    service: 'AUTH',
    apiPath: 'auth/privilege/context',
    actionType: ActionTypes.AUTH,
};

@Injectable({ providedIn: 'root' })
export class SidebarMenuService {
    constructor(private apiService: ApiService) {}

    loadApplicationContext(): Observable<ApplicationContext> {
        return this.apiService.post<ApplicationContext | WrappedApplicationContext>(PRIVILEGE_CONTEXT_ENDPOINT, {}).pipe(
            map((response: ApplicationContext | WrappedApplicationContext) => this.unwrapApplicationContext(response)),
            tap(context => {
                localStorage.setItem('privilegeCodes', JSON.stringify(context?.privilegeCodes || []));
                localStorage.setItem('sidebarMenus', JSON.stringify(context?.menus || []));
            })
        );
    }

    loadSidebarMenu(): Observable<SidebarMenuItem[]> {
        return this.loadApplicationContext().pipe(map(context => context?.menus || []));
    }

    private unwrapApplicationContext(response: ApplicationContext | WrappedApplicationContext): ApplicationContext {
        const context = (response as WrappedApplicationContext)?.data || response as ApplicationContext;
        return {
            menus: context?.menus || [],
            privilegeCodes: context?.privilegeCodes || [],
        };
    }
}
