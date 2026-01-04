import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-admin-layout',
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
    isSidebarCollapsed = false;

    ngOnInit() {
        // Add robust scoping class for global overrides (e.g. CDK overlays)
        document.body.classList.add('admin-mode');
    }

    ngOnDestroy() {
        document.body.classList.remove('admin-mode');
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
}
