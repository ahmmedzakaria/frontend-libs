import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Component({
    selector: 'app-page-command-bar',
    standalone: true,
    imports: [CommonModule, TitleCasePipe],
    templateUrl: './page-command-bar.component.html',
    styleUrls: ['./page-command-bar.component.scss']
})
export class PageCommandBarComponent implements OnInit, OnDestroy {
    pageTitle = 'Dashboard';
    private subscription?: Subscription;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.updateTitle();
        this.subscription = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => this.updateTitle());
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    private updateTitle(): void {
        let route = this.activatedRoute.root;
        while (route.firstChild) {
            route = route.firstChild;
        }
        const routeTitle = route.snapshot.data['title'];
        const pathTitle = route.snapshot.routeConfig?.path?.split('/')[0];
        this.pageTitle = routeTitle || pathTitle || 'Dashboard';
    }
}
