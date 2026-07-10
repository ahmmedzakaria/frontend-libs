import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ActionTypes, ApiEndpoint, ApiService } from '@nexacore/api-common';
import { ApplicationContext, SidebarMenuItem, WrappedApplicationContext } from './application-context.model';
import { LayoutService } from './layout.service';

const PRIVILEGE_CONTEXT_ENDPOINT: ApiEndpoint = {
    service: 'AUTH',
    apiPath: 'system/privilege/context',
    actionType: ActionTypes.AUTH,
};

@Injectable({ providedIn: 'root' })
export class SidebarMenuService {
    constructor(
        private apiService: ApiService,
        private layoutService: LayoutService
    ) {}

    loadApplicationContext(): Observable<ApplicationContext> {
        return this.apiService.post<ApplicationContext | WrappedApplicationContext>(PRIVILEGE_CONTEXT_ENDPOINT, {}).pipe(
            map((response: ApplicationContext | WrappedApplicationContext) => this.unwrapApplicationContext(response)),
            tap(context => {
                localStorage.setItem('clientCode', context?.clientCode || '');
                localStorage.setItem('clientType', context?.clientType || '');
                localStorage.setItem('privilegeCodes', JSON.stringify(context?.privilegeCodes || []));
                localStorage.setItem('enabledModules', JSON.stringify(context?.enabledModules || []));
                localStorage.setItem('enabledSubmodules', JSON.stringify(context?.enabledSubmodules || []));
                localStorage.setItem('enabledFeatures', JSON.stringify(context?.enabledFeatures || []));
                localStorage.setItem('sidebarMenus', JSON.stringify(context?.menus || []));
                this.layoutService.setApplicationContext(context);
            })
        );
    }

    loadSidebarMenu(): Observable<SidebarMenuItem[]> {
        return this.loadApplicationContext().pipe(map(context => context?.menus || []));
    }

    private unwrapApplicationContext(response: ApplicationContext | WrappedApplicationContext): ApplicationContext {
        const context = (response as WrappedApplicationContext)?.data || response as ApplicationContext;
        return {
            clientCode: context?.clientCode || '',
            clientType: context?.clientType || '',
            layout: context?.layout || {},
            branding: context?.branding || {},
            theme: context?.theme || {},
            navigation: context?.navigation || {},
            header: context?.header || {},
            statusBar: context?.statusBar || {},
            tenant: context?.tenant || {},
            localization: context?.localization || {},
            menus: context?.menus || [],
            privilegeCodes: context?.privilegeCodes || [],
            enabledModules: context?.enabledModules || [],
            enabledSubmodules: context?.enabledSubmodules || [],
            enabledFeatures: context?.enabledFeatures || [],
        };
    }
}
