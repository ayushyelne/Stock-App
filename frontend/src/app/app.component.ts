import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';


import * as Highcharts from 'highcharts';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  tickerSymbol: string = '';
  activeTabIndex = 0;
  isSearchActive: boolean = true;

  constructor(private router: Router) {
  }
  
}
