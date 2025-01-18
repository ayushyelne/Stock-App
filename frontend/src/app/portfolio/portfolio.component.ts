import { Component, ChangeDetectorRef, Input } from '@angular/core';
import { ApiService } from '../api.service';
import { Subscription, interval, forkJoin } from 'rxjs';
import { BuyPortfolioComponent } from '../buy-portfolio/buy-portfolio.component';
import { MatDialog } from '@angular/material/dialog';
import { SellPortfolioComponent } from '../sell-portfolio/sell-portfolio.component';
import { delay, finalize } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css'],
})
export class PortfolioComponent {
  portfolioItems: any[] = [];
  balance: number = 0;
  stockQuotes: { [key: string]: any } = {};
  @Input() stockData: any;
  isPortfolioLoading: boolean = true;

  constructor(
    private apiService: ApiService,
    private changeDetectorRef: ChangeDetectorRef,
    public dialog: MatDialog,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.loadPortfolio();
    this.loadWalletBalance();
  }

  loadPortfolio(): void {
    this.isPortfolioLoading = true; 
    this.apiService.getPortfolio().pipe(
      delay(500), 
      finalize(() => this.isPortfolioLoading = false) 
    ).subscribe({
      next: (data) => {
        this.portfolioItems = data;
        this.loadStockQuotes();
      },
      error: (error) => {
        console.error('Error fetching portfolio:', error);
      },
    });
  }

  loadStockQuotes(): void {
    const stockQuotesRequests = this.portfolioItems.map((item) =>
      this.apiService.getStockQuote(item.companyTicker)
    );
    forkJoin(stockQuotesRequests).subscribe({
      next: (responses) => {
        responses.forEach((response, index) => {
          const ticker = this.portfolioItems[index].companyTicker;
          this.stockQuotes[ticker] = {
            currentPrice: response.c,
            changePercent: response.dp,
          };
        });
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => console.error('Error fetching stock quotes:', error),
    });
  }

  updateColor(change: number): string {
    if (change > 0) return 'text-success'; 
    if (change < 0) return 'text-danger'; 
    return ''; 
  }

  loadWalletBalance() {
    this.apiService.getWalletBalance().subscribe(
      (data) => {
        this.balance = data.balance; 
      },
      (error) => {
        console.error('Error loading wallet balance:', error);
      }
    );
  }

  openBuyModal(stockSymbol: string, currentPrice: number, moneyInWallet: number, companyName: string) {
    const modalRef = this.modalService.open(BuyPortfolioComponent, { size: 'lg' });
    modalRef.componentInstance.stockSymbol = stockSymbol;
    modalRef.componentInstance.currentPrice = currentPrice;
    modalRef.componentInstance.moneyInWallet = moneyInWallet;
    modalRef.componentInstance.companyName = companyName;

    modalRef.result.then((result) => {
      console.log('Buy modal closed with result:', result);
      if (result === 'purchaseMade') {
        this.loadPortfolio(); 
      }
    }, (reason) => {
      console.log('Dismissed', reason);
    });
  }

  openSellModal(stockSymbol: string, currentPrice: number, moneyInWallet: number, companyName: string, quantityOwned: number) {
    const modalRef = this.modalService.open(SellPortfolioComponent, { size: 'lg' });
    modalRef.componentInstance.stockSymbol = stockSymbol;
    modalRef.componentInstance.currentPrice = currentPrice;
    modalRef.componentInstance.moneyInWallet = moneyInWallet;
    modalRef.componentInstance.companyName = companyName;
    modalRef.componentInstance.quantityOwned = quantityOwned;

    modalRef.result.then((result) => {
      if (result === 'Sell successful') {
        console.log('Sell successful');
        this.loadPortfolio(); 
      }
    }, (reason) => {
      console.log('Modal dismissed:', reason);
    });
  }
  
}