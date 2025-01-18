import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { ApiService } from '../api.service';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchStateService } from '../search-state.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NewsModalComponent } from '../news-modal/news-modal.component';
// import * as Highcharts from 'highcharts';
import * as Highcharts from 'highcharts/highstock';
import HC_exporting from 'highcharts/modules/exporting';
HC_exporting(Highcharts);
import HC_stock from 'highcharts/modules/stock';
HC_stock(Highcharts);
import { Chart } from 'highcharts';
import { SeriesColumnOptions } from 'highcharts';
// import IndicatorsCore from 'highcharts/indicators/indicators';
// import vbp from 'highcharts/indicators/volume-by-price';
// import sma from 'highcharts/indicators/sma';
import { forkJoin, Subject, timer } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Observable, of, interval, Subscription } from 'rxjs';
import { startWith, map, switchMap, finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { BuyModalComponent } from '../buy-modal/buy-modal.component';
import { SellModalComponent } from '../sell-modal/sell-modal.component';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { BuyMessageService } from '../buy-message.service';
import { Options } from 'highcharts';
import more from 'highcharts/highcharts-more';
import {
  default as IndicatorsCore,
  default as sma,
} from 'highcharts/indicators/indicators';
import vbp from 'highcharts/indicators/volume-by-price';
IndicatorsCore(Highcharts);
vbp(Highcharts);
more(Highcharts);
sma(Highcharts);

// IndicatorsCore(Highcharts);
// vbp(Highcharts);
// sma(Highcharts);
import IndicatorsAll from 'highcharts/indicators/indicators-all';
import Exporting from 'highcharts/modules/exporting';
Exporting(Highcharts);

IndicatorsAll(Highcharts);

@Component({
  selector: 'app-search-details',
  templateUrl: './search-details.component.html',
  styleUrls: ['./search-details.component.css'],
})
export class SearchDetailsComponent implements OnChanges {
  @Input() ticker: string | null = null;
  stockDetails: any = null;
  error: string | null = null;
  @Input() stockData: any;
  currentDate: Date = new Date();
  activeTab: string = 'summary';

  currentTimeSubscription!: Subscription;

  totalMspr: number = 0;
  positiveMspr: number = 0;
  negativeMspr: number = 0;
  totalChange: number = 0;
  positiveChange: number = 0;
  negativeChange: number = 0;
  searchControl = new FormControl();
  filteredStocks!: Observable<any[]>;
  isFavorited: boolean = false;
  currentTime: string = '';
  // private routeSub: Subscription;
  private watchlistSub!: Subscription;
  // private watchlist: string[] = [];
  private watchlist: any[] = [];
  private destroy$ = new Subject<void>();
  private unsubscribe$ = new Subject<void>();
  showSellButton: boolean = false;
  isSearching: boolean = false;

  public chartInstance?: Highcharts.Chart;
  buyModal: any;
  buyMessage: string = '';
  sellMessage: string = '';
  private messageSubscription!: Subscription;
  private sellMessageSubscription!: Subscription;

  tickerSymbol: string = '';
  watchlistMessage: string = '';

  private quoteUpdateSubscription: Subscription = new Subscription();
  datePipe: any;

  private filterStocks(value: string): Observable<any[]> {
    return this.apiService.getAutocompleteResults(value);
  }

  // public chartInstance?: Highcharts.Chart;
  public highcharts: typeof Highcharts = Highcharts;
  public recommendationChartOptions: Highcharts.Options = {
    series: [
      {
        type: 'column',
        name: 'Strong Buy',
        data: [],
        color: '#18632f',
      },
      {
        type: 'column',
        name: 'Buy',
        data: [],
        color: '#19b049',
      },
      {
        type: 'column',
        name: 'Hold',
        data: [],
        color: '#af7f1b',
      },
      {
        type: 'column',
        name: 'Sell',
        data: [],
        color: '#f15050',
      },
      {
        type: 'column',
        name: 'Strong Sell',
        data: [],
        color: '#742c2e',
      },
    ],
  };

  public earningChartOptions: Highcharts.Options = {
    series: [
      {
        name: 'Actual',
        data: [],
        type: 'spline',
        color: '#007bff',
      },
      {
        name: 'Estimate',
        data: [],
        type: 'spline',
        color: '#28a745',
      },
    ],
  };

  public historicalChartOptions: Highcharts.Options = {
    series: [
      {
        type: 'line',
        data: [],
      },
      {
        type: 'column',
        data: [],
      },
    ],
  };

  public hourlyChartOptions: Highcharts.Options = {
    chart: {
      type: 'line',
    },
    series: [
      {
        type: 'line',
        name: 'Stock Price',
        data: [] as [number, number][],
      },
    ] as Highcharts.SeriesOptionsType[],
  };

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private searchStateService: SearchStateService,
    private modalService: NgbModal,
    private changeDetectorRef: ChangeDetectorRef,
    public dialog: MatDialog,
    private buyMessageService: BuyMessageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const ticker = params['ticker'];
      if (ticker) {
        this.ticker = ticker;
        const timer$ = interval(15000);
        this.currentTimeSubscription = timer$.subscribe(() => {
          this.currentDate = new Date(); // This updates the currentDate with the current time
        });
        this.checkIfInPortfolio(ticker);
        this.loadStockDetails(ticker);
        this.startQuoteUpdateInterval(ticker);
        this.fetchWatchlist();
        this.messageSubscription =
          this.buyMessageService.currentMessage.subscribe((message) => {
            this.buyMessage = message;
            setTimeout(() => (this.buyMessage = ''), 3000);
          });

        this.sellMessageSubscription =
          this.buyMessageService.sellMessage.subscribe((message) => {
            this.sellMessage = message;
            setTimeout(() => (this.sellMessage = ''), 3000);
          });
        this.processEarningsData(this.stockData.earnings);
        this.processRecommendationData(this.stockData.recommendationTrends);
        this.processHistoricData(this.stockData.historicalData);
        this.processHourlyData();
        this.searchStateService.setLastTicker(ticker);
        this.filteredStocks = this.searchControl.valueChanges.pipe(
          startWith(''),
          switchMap((value) => this.filterStocks(value || ''))
        );
      }
    });

    this.searchStateService.searchResult$.subscribe((result) => {
      if (result && result.sentiment) {
        this.calculateSentimentData(result.sentiment.data);
      } else {
      }
      this.stockData = result;
    });
  }

  checkIfInPortfolio(ticker: string): void {
    this.apiService.getPortfolio().subscribe({
      next: (portfolioItems) => {
        this.showSellButton = portfolioItems.some(
          (item) => item.companyTicker === ticker
        );
      },
      error: (error) => {
        console.error('Error fetching portfolio:', error);
        this.showSellButton = false;
      },
    });
  }

  fetchWatchlistAndUpdateState(): void {
    this.apiService.getWatchlist().subscribe((watchlist) => {
      this.watchlist = watchlist.map((item) => item.companyTicker);
      this.isFavorited = this.watchlist.includes(this.ticker);
      this.changeDetectorRef.markForCheck();
    });
  }

  // startQuoteUpdateInterval(ticker: string): void {
  //   if (this.quoteUpdateSubscription) {
  //     this.quoteUpdateSubscription.unsubscribe();
  //   }

  //   const fifteenSeconds = 15000;
  //   this.quoteUpdateSubscription = interval(fifteenSeconds).subscribe(() => {
  //     this.apiService.getStockQuote(ticker).subscribe((quoteData) => {
  //       this.stockData.quote = quoteData;
  //       this.changeDetectorRef.markForCheck();
  //       this.changeDetectorRef.detectChanges();
  //     });
  //   });
  // }

  startQuoteUpdateInterval(ticker: string): void {
    if (this.isMarketOpen()) {
      if (this.quoteUpdateSubscription) {
        this.quoteUpdateSubscription.unsubscribe();
      }
  
      const fifteenSeconds = 15000;
      this.quoteUpdateSubscription = interval(fifteenSeconds).subscribe(() => {
        this.apiService.getStockQuote(ticker).subscribe((quoteData) => {
          this.stockData.quote = quoteData;
          this.changeDetectorRef.markForCheck();
          this.changeDetectorRef.detectChanges();
        });
      });
    } else {
      console.log('Market is closed. Not starting the quote update interval.');
    }
  }
  

  ngOnDestroy(): void {
    this.buyMessage = '';
    this.sellMessage = '';
    // this.quoteUpdateSubscription.unsubscribe();
    this.messageSubscription.unsubscribe();
    this.sellMessageSubscription.unsubscribe();
    if (this.quoteUpdateSubscription) {
      this.quoteUpdateSubscription.unsubscribe();
    }
    if (this.currentTimeSubscription) {
      this.currentTimeSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticker'] && changes['ticker'].currentValue) {
      this.currentDate = new Date();
      this.ticker = changes['ticker'].currentValue;
      this.checkIfFavorited();
      this.loadStockDetails(changes['ticker'].currentValue);
    }
  }

  private loadEarningsData(ticker: string): void {
    this.apiService.getCompanyEarnings(ticker).subscribe(
      (data) => {
        if (Array.isArray(data) && data.length) {
          this.processEarningsData(data);
          this.changeDetectorRef.detectChanges();
        } else {
          console.error('No data or unexpected data format received', data);
        }
      },
      (error) => {
        console.error('Error fetching recommendation trends:', error);
      }
    );
  }

  private loadHistoricalData(ticker: string): void {
    this.apiService.getHistoricalData(ticker).subscribe(
      (data) => {
        if (Array.isArray(data) && data.length) {
          this.processHistoricData(data);
          this.changeDetectorRef.detectChanges();
        } else {
          console.error('No data or unexpected data format received', data);
        }
      },
      (error) => {
        console.error('Error fetching recommendation trends:', error);
      }
    );
  }

  // private loadHourlyData(ticker: string): void {
  //   this.apiService.getDailyData(ticker).subscribe(
  //     (data) => {
  //       console.log(data)
  //       // if (Array.isArray(data) && data.length) {
  //       //   const periods = data.map((item) => new Date(item.date).getTime());
  //       //   const close = data.map((item) => item.closePrice);
  //       //   const open = data.map((item) => item.openPrice);

  //       //   this.processHourlyData();
  //       //   this.changeDetectorRef.detectChanges();
  //       // } else {
  //       //   console.error('No data or unexpected data format received', data);
  //       // }
  //       this.processHourlyData();
  //     },
  //     (error) => {
  //       console.error('Error fetching data:', error);
  //     }
  //   );
  // }

  private processHourlyData(): void {
    console.log('Stock Data:', this.stockData);
    const lineColor = this.stockData.quote?.d < 0 ? 'red' : 'green';

    const lastClosedDate = new Date(this.stockData.quote.t * 1000);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    let toDate = new Date();
    let fromDate = new Date();

    if (this.stockData.quote.t != Math.floor(Date.now() / 1000)) {
      toDate = new Date(lastClosedDate);
      fromDate = new Date(toDate);
      fromDate.setDate(fromDate.getDate() - 1);
    } else {
      toDate = today;
      fromDate = new Date(toDate);
      fromDate.setDate(fromDate.getDate() - 1);
    }
    const fromTime = fromDate.getTime();
    const toTime = toDate.getTime();

    const filteredStockPrices = this.stockData.dailyData.stockPrices.filter(
      (point: [number, number]) => {
        return point[0] >= fromTime && point[0] <= toTime;
      }
    );

    this.hourlyChartOptions = {
      series: [
        {
          // name: 'Stock Price',
          type: 'line',
          data: filteredStockPrices,
          color: lineColor,
          tooltip: {
            valueDecimals: 2,
          },
        },
      ],
      yAxis: [
        {
          labels: {
            format: '{value}',
          },
          title: {
            text: 'Price',
          },
          opposite: true,
        },
      ],
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          hour: '%H:%M',
          day: '%H:%M',
        },
        // min: fromTime,
        // max: toTime,
        tickInterval: 3600 * 1000 * 3,
      },
      title: {
        text: `${this.ticker} Hourly Price Variation`,
      },
      plotOptions: {
        line: {
          marker: {
            enabled: false,
          },
        },
      },
    };
  }

  private processHistoricData(data: any[]): void {
    console.log('Historic Data:', data);
    console.log(data);
    const ohlcData = data.map((item) => [
      item.t,
      item.o,
      item.h,
      item.l,
      item.c,
    ]);
    const volumeData = data.map((item) => [item.t, item.v]);

    console.log('OHLC Data:', ohlcData);
    console.log('Volume Data:', volumeData);

    this.historicalChartOptions = {
      rangeSelector: {
        allButtonsEnabled: true,
        enabled: true,
        selected: 2,
      },
      navigator: {
        enabled: true,
      },
      scrollbar: {
        enabled: true,
      },
      title: {
        text: `${this.ticker} Historical`,
      },
      credits: {
        enabled: false,
      },
      subtitle: {
        text: 'With SMA and Volume by Price technical indicators',
      },
      xAxis: {
        type: 'datetime',
        ordinal: true,
      },
      yAxis: [
        {
          startOnTick: false,
          endOnTick: false,
          opposite: true,
          labels: {
            align: 'right',
            x: -3,
          },
          title: {
            text: 'OHLC',
          },
          height: '60%',
          lineWidth: 2,
          resize: {
            enabled: true,
          },
        },
        {
          labels: {
            align: 'right',
            x: -3,
          },
          title: {
            text: 'Volume',
          },
          top: '65%',
          height: '35%',
          offset: 0,
          lineWidth: 2,
        },
      ],
      tooltip: {
        split: true,
      },
      plotOptions: {
        series: {
          dataGrouping: {
            units: [
              ['week', [1]],
              ['month', [1, 2, 3, 4, 6]],
            ],
          },
        },
      },
      series: [
        {
          showInLegend: false,
          type: 'candlestick',
          name: `${this.ticker} Stock Price`,
          id: 'primary',
          data: ohlcData,
          zIndex: 2,
          tooltip: { valueDecimals: 2 },
        },
        {
          showInLegend: false,
          type: 'column',
          name: 'Volume',
          id: 'volume',
          data: volumeData,
          yAxis: 1,
          // zIndex: 1,
          // tooltip: { valueDecimals: 0 },
        },
        {
          type: 'sma',
          linkedTo: 'primary',
          zIndex: 1,
          marker: { enabled: false },
        },
        {
          type: 'vbp',
          linkedTo: 'primary',
          params: { volumeSeriesID: 'volume' },
          dataLabels: { enabled: false },
          zoneLines: { enabled: false },
        },
      ],
    };
  }

  private processEarningsData(data: any[]): void {
    console.log('Earnings Data:', data);
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('Earnings data is invalid or empty');
      return;
    }

    const categories = data.map((item) => item.Period);
    const actualData = data.map((item) => item.Actual);
    const estimateData = data.map((item) => item.Estimate);

    this.earningChartOptions = {
      chart: {
        type: 'spline',
        backgroundColor: '#f8f9fa',
        spacingRight: 30,
      },
      title: {
        text: 'Historical EPS Surprises',
      },
      xAxis: {
        categories: categories,
        title: {
          text: null,
        },
      },
      yAxis: {
        title: {
          text: 'EPS',
        },
      },
      tooltip: {
        shared: true,
        valuePrefix: '$',
      },
      series: [
        {
          name: 'Actual EPS',
          data: actualData,
          color: '#007bff',
          type: 'spline',
          marker: {
            enabled: true,
            symbol: 'circle',
          },
        },
        {
          name: 'Estimated EPS',
          data: estimateData,
          color: '#28a745',
          type: 'spline',
          marker: {
            enabled: true,
            symbol: 'diamond',
          },
        },
      ],
    };
  }

  private loadRecommendationTrends(ticker: string): void {
    this.apiService.getRecommendationTrends(ticker).subscribe(
      (data) => {
        if (Array.isArray(data) && data.length) {
          this.processRecommendationData(data);
          this.changeDetectorRef.detectChanges();
        } else {
          console.error('No data or unexpected data format received', data);
        }
      },
      (error) => {
        console.error('Error fetching recommendation trends:', error);
      }
    );
  }

  private processRecommendationData(responseData: any): void {
    console.log('Recommendation Data:', responseData);
    const categories = responseData.map((item: { period: any }) => item.period);

    const seriesData = {
      strongBuy: responseData.map((item: { strongBuy: any }) => item.strongBuy),
      buy: responseData.map((item: { buy: any }) => item.buy),
      hold: responseData.map((item: { hold: any }) => item.hold),
      sell: responseData.map((item: { sell: any }) => item.sell),
      strongSell: responseData.map(
        (item: { strongSell: any }) => item.strongSell
      ),
    };

    this.recommendationChartOptions = {
      chart: {
        type: 'column',
        backgroundColor: '#f8f9fa',
        spacingRight: 30,
      },
      title: {
        text: 'Recommendation Trends',
      },
      xAxis: {
        categories: categories,
      },
      yAxis: {
        min: 0,
        title: {
          text: '#Analysis',
        },
      },
      tooltip: {
        shared: true,
      },
      plotOptions: {
        column: {
          stacking: 'normal',
        },
      },
      series: [
        {
          name: 'Strong Buy',
          data: seriesData.strongBuy,
          color: '#196233',
          type: 'column',
        },
        {
          name: 'Buy',
          data: seriesData.buy,
          color: '#23af50',
          type: 'column',
        },
        {
          name: 'Hold',
          data: seriesData.hold,
          color: '#af7d27',
          type: 'column',
        },
        {
          name: 'Sell',
          data: seriesData.sell,
          color: '#f04f52',
          type: 'column',
        },
        {
          name: 'Strong Sell',
          data: seriesData.strongSell,
          color: '#742a2b',
          type: 'column',
        },
      ],
    };
  }

  private calculateSentimentData(sentiments: any[]): void {
    this.totalMspr = 0;
    this.positiveMspr = 0;
    this.negativeMspr = 0;
    this.totalChange = 0;
    this.positiveChange = 0;
    this.negativeChange = 0;

    sentiments.forEach((sentiment) => {
      this.totalMspr += sentiment.mspr;
      this.totalChange += sentiment.change;
      if (sentiment.mspr > 0) {
        this.positiveMspr += sentiment.mspr;
      } else {
        this.negativeMspr += sentiment.mspr;
      }
      if (sentiment.change > 0) {
        this.positiveChange += sentiment.change;
      } else {
        this.negativeChange += sentiment.change;
      }
    });
  }

  private loadStockDetails(ticker: string): void {
    this.isSearching = true;
    forkJoin({
      apiCall: this.apiService.getStockDetails(ticker),
      timer: timer(2000),
    })
      .pipe(finalize(() => (this.isSearching = false)))
      .subscribe({
        next: ({ apiCall }) => {
          this.stockData = apiCall;
          this.error = null;
        },
        error: (err) => {
          this.error = 'Failed to fetch stock details';
          console.error(err);
        },
      });
  }

  isMarketOpen(): boolean {
    const currentTime = new Date();
    const lastDataTimestamp = Number(this.stockData?.quote?.t);

    if (isNaN(lastDataTimestamp) || lastDataTimestamp <= 0) {
      return false;
    }

    const lastDataDate = new Date(lastDataTimestamp * 1000);

    const timeDifferenceInSeconds =
      (currentTime.getTime() - lastDataDate.getTime()) / 1000;

    return timeDifferenceInSeconds < 60;
  }

  getCurrentTime(): string {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  }

  getMarketCloseTime(apiTimestamp?: number): string {
    if (!apiTimestamp) {
      return 'N/A';
    }

    const closingDate = new Date(apiTimestamp * 1000);

    return formatDate(closingDate, 'yyyy-MM-dd HH:mm:ss', 'en-US');
  }

  navigateToPeer(ticker: string, event: Event): void {
    event.preventDefault();
    this.apiService.getStockDetails(ticker).subscribe({
      next: (data) => {
        this.searchStateService.setSearchResult(data);

        this.router.navigate(['/search', ticker.toUpperCase()]);
      },
      error: (error) => {
        console.error('Failed to fetch stock details:', error);
      },
    });
  }

  setActiveTab(index: number): void {
    const tabNames = ['summary', 'news', 'charts', 'insights'];
    this.activeTab = tabNames[index] || 'summary';
  }

  openNewsModal(newsItem: any) {
    const modalRef = this.modalService.open(NewsModalComponent, { size: 'lg' });
    modalRef.componentInstance.newsItem = newsItem;
  }

  // openBuyModal(
  //   stockSymbol: string,
  //   currentPrice: number,
  //   moneyInWallet: number,
  //   companyName: string
  // ) {
  //   const modalRef = this.modalService.open(BuyModalComponent);
  //   modalRef.componentInstance.data = {
  //     stockSymbol,
  //     currentPrice,
  //     moneyInWallet,
  //     companyName,
  //   };

  //   modalRef.result.then(
  //     (result) => {
  //       console.log('The modal was closed', result);
  //     },
  //     (reason) => {
  //       console.log('The modal was dismissed', reason);
  //     }
  //   );
  // }

  openBuyModal(
    stockSymbol: string,
    currentPrice: number,
    moneyInWallet: number,
    companyName: string
  ) {
    const modalRef = this.modalService.open(BuyModalComponent);
    modalRef.componentInstance.data = {
      stockSymbol,
      currentPrice,
      moneyInWallet,
      companyName,
    };
  
    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          console.log('Purchase was successful', result);
          this.showSellButton = true;
        } else {
          console.log('The modal was closed without making a purchase', result);
        }
      },
      (reason) => {
        console.log('The modal was dismissed', reason);
      }
    );
  }

  openSellModal(
    stockSymbol: string,
    currentPrice: number,
    moneyInWallet: number,
    companyName: string,
    quantityOwned: number
  ) {
    const modalRef = this.modalService.open(SellModalComponent);
    modalRef.componentInstance.stockSymbol = stockSymbol;
    modalRef.componentInstance.currentPrice = currentPrice;
    modalRef.componentInstance.moneyInWallet = moneyInWallet;
    modalRef.componentInstance.companyName = companyName;
    modalRef.componentInstance.quantityOwned = quantityOwned;
  }

  updateCurrentTime(): void {
    const now = new Date();
    this.currentTime =
      this.datePipe.transform(now, 'yyyy-MM-dd HH:mm:ss') || '';
  }

  addToWatchlist(companyName: string, companyTicker: string) {
    this.apiService.addToWatchlist(companyName, companyTicker).subscribe({
      next: (response) => console.log(response),
      error: (error) => console.error('Could not add to watchlist:', error),
    });
  }

  toggleWatchlist(profile: any): void {
    this.isFavorited = !this.isFavorited;
    if (this.isFavorited) {
      this.apiService.addToWatchlist(profile.name, profile.ticker).subscribe({
        next: () => {
          console.log('Added to watchlist');
          this.fetchWatchlistAndUpdateState();
          this.watchlistMessage = `${profile.ticker} added to Watchlist.`;
          setTimeout(() => (this.watchlistMessage = ''), 3000);
        },
        error: (error) => {
          console.error('Could not add to watchlist:', error);
          this.watchlistMessage = '';
        },
      });
    } else {
      this.apiService.removeFromWatchlist(profile.ticker).subscribe({
        next: () => {
          console.log('Removed from watchlist');
          this.fetchWatchlistAndUpdateState();
        },
        error: (error) =>
          console.error('Could not remove from watchlist:', error),
      });
    }
  }

  fetchWatchlist(): void {
    this.apiService.getWatchlist().subscribe((watchlist) => {
      this.watchlist = watchlist;
      this.checkIfFavorited();
    });
  }

  checkIfFavorited(): void {
    this.isFavorited = this.watchlist.some(
      (item) => item.companyTicker === this.ticker
    );
  }
}
