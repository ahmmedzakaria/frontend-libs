import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription, filter } from 'rxjs';

interface BreadcrumbItem {
    label: string;
    url: string;
}

@Component({
    selector: 'app-breadcrumb-bar',
    standalone: true,
    imports: [CommonModule, RouterLink, TitleCasePipe],
    templateUrl: './breadcrumb-bar.component.html',
    styleUrls: ['./breadcrumb-bar.component.scss']
})
export class BreadcrumbBarComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItem[] = [];
    private subscription?: Subscription;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
        this.subscription = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root));
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    private createBreadcrumbs(route: ActivatedRoute, url = '', breadcrumbs: BreadcrumbItem[] = []): BreadcrumbItem[] {
        const children = route.children;
        if (!children.length) {
            return breadcrumbs.length ? breadcrumbs : [{ label: 'Home', url: '/dashboard' }];
        }

        for (const child of children) {
            const routeUrl = child.snapshot.url.map(segment => segment.path).join('/');
            if (routeUrl) {
                url += `/${routeUrl}`;
            }

            const label = child.snapshot.data['breadcrumb'] || child.snapshot.data['title'] || routeUrl;
            if (label) {
                breadcrumbs.push({ label, url });
            }

            return this.createBreadcrumbs(child, url, breadcrumbs);
        }

        return breadcrumbs;
    }
}
