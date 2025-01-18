import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ApiService } from '../api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SearchStateService } from '../search-state.service';
import { Observable, of } from 'rxjs';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import {
  startWith,
  map,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  filter,
  tap,
  finalize,
  catchError,
} from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface Stock {
  symbol: string;
  displaySymbol: string;
  description: string;
  type: string;
}

@Component({
  selector: 'app-search-home',
  templateUrl: './search-home.component.html',
  styleUrls: ['./search-home.component.css'],
})
export class SearchHomeComponent implements OnInit, OnDestroy {
  tickerSymbol: string = '';
  errorMessage: string | null = null;
  showDetails: boolean = false;
  stockData: any = null;
  ticker: string = '';
  searchControl = new FormControl();
  filteredStocks!: Observable<any[]>;
  lastLoadedTicker: string | null = null; 
  isLoading = false;
  isAutocompleteLoading = false;
  isSearching: boolean = false;

  private unsubscribe$ = new Subject<void>();

  @Output() searchClicked = new EventEmitter<string>();

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private searchStateService: SearchStateService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const ticker = params['ticker'];
      if (ticker && ticker !== ':ticker') {
        const cachedTicker = localStorage.getItem('lastLoadedTicker') || '';
        const cachedData = localStorage.getItem('lastLoadedData');

        if (cachedTicker && cachedData && cachedTicker === ticker) {
          this.tickerSymbol = cachedTicker;
          this.stockData = JSON.parse(cachedData);
          this.searchStateService.setSearchResult(this.stockData);
        } else {
          this.searchStock(ticker);
        }
      } else {
        const cachedTicker = localStorage.getItem('lastLoadedTicker') || '';
        if (cachedTicker) {
          this.router.navigate(['/search', cachedTicker]);
        }
      }
    });

    this.filteredStocks = this.searchControl.valueChanges.pipe(
      tap(() => {
        this.isAutocompleteLoading = true;
      }),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value) => {
        return this.apiService.getAutocompleteResults(value);
      }),
      tap(() => {
        this.isAutocompleteLoading = false;
      }),
      finalize(() => {
        this.isAutocompleteLoading = false;
      })
    );
  }

  onTickerSelection(event: MatAutocompleteSelectedEvent): void {
    const ticker = event.option.value;

    this.router.navigate(['/search', ticker]);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  searchStock(ticker: string): void {
    this.apiService.getStockDetails(ticker.toUpperCase()).subscribe({
      next: (data) => {
        this.searchStateService.setSearchResult(data);
        this.searchStateService.setLastTicker(ticker.toUpperCase());
        this.stockData = data;
        this.tickerSymbol = ticker; 

        localStorage.setItem('lastLoadedTicker', ticker);
        localStorage.setItem('lastLoadedData', JSON.stringify(data));

        this.router.navigate(['/search', ticker.toUpperCase()]);
      },
      error: (error) => {
        this.errorMessage = 'No data found. Please enter a valid ticker';
        console.error(error);
      },
    });
  }

  clearSearch(): void {
    this.tickerSymbol = '';
    this.stockData = null;
    this.errorMessage = null;
    localStorage.removeItem('lastLoadedTicker'); 
    localStorage.removeItem('lastLoadedData'); 
    this.router.navigate(['/search/home']);
    this.searchStateService.clearSearchResult();
  }
}
