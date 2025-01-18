import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { Subscription, interval, forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, delay } from 'rxjs/operators';


@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css'],
})
export class WatchlistComponent implements OnInit {
  watchlist: any[] = [];
  tickers: string[] = [];
  quoteUpdateSubscription: Subscription | undefined;
  watchlistData: any[] = [];
  api: any;
  stockQuotes: any = {};
  private subscriptions: Subscription[] = [];
  isWatchlistLoading: boolean = true;

  constructor(
    private apiService: ApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchWatchlist();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }  
  
  loadWatchlist(): void {
    this.isWatchlistLoading = true; 
  
    const stockQuotesRequests = this.watchlist.map((item) =>
      this.apiService.getStockQuote(item.companyTicker)
    );
  
    forkJoin(stockQuotesRequests).pipe(
      delay(2000), 
      finalize(() => {
        this.isWatchlistLoading = false; 
        this.changeDetectorRef.detectChanges(); 
      })
    ).subscribe({
      next: (responses) => {
        responses.forEach((response, index) => {
          const ticker = this.watchlist[index].companyTicker;
          this.stockQuotes[ticker] = {
            currentPrice: response.c,
            priceChange: response.d,
            changePercent: response.dp,
          };
        });
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching stock quotes for watchlist:', error);
      },
    });
  }


  fetchWatchlist(): void {
    this.apiService.getWatchlist().subscribe({
      next: (data) => {
        this.watchlist = data;
        if (this.watchlist.length > 0) {
          this.loadWatchlist();
        } else {
          this.isWatchlistLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error fetching watchlist:', error);
        this.isWatchlistLoading = false; 
        this.changeDetectorRef.detectChanges();
      },
    });
  }  

  updateColor(change: number): string {
    if (change > 0) return 'text-success'; 
    if (change < 0) return 'text-danger'; 
    return ''; 
  }

  removeFromWatchlist(ticker: string): void {
    this.apiService.removeFromWatchlist(ticker).subscribe({
      next: () => {
        this.watchlist = this.watchlist.filter(
          (item) => item.companyTicker !== ticker
        );
        delete this.stockQuotes[ticker];
        this.changeDetectorRef.detectChanges();
        // this.fetchWatchlist();
      },
      error: (error) => {
        console.error('Error removing ticker from watchlist:', error);
      },
    });
  }

  navigateToDetails(ticker: string): void {
    this.router.navigate(['/search', ticker]);
  }

  // navigateToDetails(ticker: string): void {
  //   // Assuming 'stockQuotes' holds all the details of stocks
  //   const stockDetails = this.stockQuotes[ticker];
    
  //   // Store the details in local storage
  //   localStorage.setItem('lastLoadedTicker', ticker);
  //   localStorage.setItem('lastLoadedData', JSON.stringify(stockDetails));
    
  //   // Navigate to the details page
  //   this.router.navigate(['/search', ticker]);
  // }  
  
}
