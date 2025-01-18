import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../api.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-sell-portfolio',
  templateUrl: './sell-portfolio.component.html',
  styleUrls: ['./sell-portfolio.component.css'],
})
export class SellPortfolioComponent implements OnInit {
  @Input() stockSymbol!: string;
  @Input() currentPrice!: number;
  @Input() moneyInWallet!: number;
  @Input() companyName!: string;
  @Input() quantityOwned!: number;

  quantityToSell: number | null = null;
  total: number = 0;
  sufficientStock: boolean = true;
  errorMessage: string = '';

  @Output() stockSold = new EventEmitter<boolean>();

  constructor(
    public activeModal: NgbActiveModal,
    private apiService: ApiService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.fetchStockDetails(this.stockSymbol);
    this.fetchPortfolioDetails(this.stockSymbol);
    this.fetchWalletBalance();
    this.calculateTotal();
  }

  updateItemWithCurrentPriceAndChange(item: any) {
    this.apiService.getStockQuote(item.companyTicker).subscribe(
      (quote) => {
        item.currentPrice = quote.c;
        item.changePercent = quote.dp;
      },
      (error) => {
        console.error(
          'Failed to fetch stock quote for',
          item.companyTicker,
          error
        );
      }
    );
  }

  fetchPortfolioDetails(ticker: string) {
    this.apiService.getPortfolioItem(ticker).subscribe({
      next: (portfolioItem) => {
        this.quantityOwned = portfolioItem ? portfolioItem.quantity : 0;
      },
      error: (error) => {
        console.error('Error fetching portfolio item:', error);
        this.quantityOwned = 0;
      },
    });
  }

  fetchStockDetails(ticker: string) {
    this.apiService.getStockQuote(ticker).subscribe({
      next: (quote) => {
        console.log('Received quote:', quote);
        this.currentPrice = quote.c;
      },
      error: (error) => console.error('Error fetching stock quote:', error),
    });
  }

  fetchWalletBalance() {
    this.apiService.getWalletBalance().subscribe({
      next: (walletData) => {
        this.moneyInWallet = walletData.balance;
      },
      error: (error) => console.error('Error fetching wallet balance:', error),
    });
  }

  updateWalletBalance(amount: number): void {
    this.apiService.updateWalletBalance(amount).subscribe({
      next: (response) => {
        console.log('Wallet updated successfully', response);
        this.activeModal.close({ success: true });
      },
      error: (error) => {
        console.error('Failed to update wallet:', error);
      },
    });
  }

  calculateTotal(): void {
    this.errorMessage = '';
    if (this.quantityToSell !== null) {
      this.total = this.currentPrice * this.quantityToSell;
      if (this.quantityToSell <= this.quantityOwned) {
        this.sufficientStock = true;
        this.errorMessage = ''; 
      } else {
        this.sufficientStock = false;
        this.errorMessage = 'You cannot sell more stocks than you own.';
      }
    } else {
      this.total = 0; 
      this.sufficientStock = false; 
      this.errorMessage = 'Please enter a valid quantity to sell.';
    }
  }

  onQuantityChange(): void {
    this.calculateTotal();
  }


  sellStocks(): void {
    if (!this.quantityToSell || this.quantityToSell <= 0) {
      this.errorMessage = 'Please enter a valid quantity to sell.';
      return;
    }

    if (this.quantityToSell > this.quantityOwned) {
      this.errorMessage = 'You cannot sell more stocks than you own.';
      return;
    }

    const totalRevenue = this.currentPrice * this.quantityToSell;

    this.apiService
      .sellStocks({
        companyTicker: this.stockSymbol,
        quantityToSell: this.quantityToSell,
        totalRevenue: totalRevenue,
      })
      .subscribe({
        next: (response) => {
          this.activeModal.close('Sell successful');
          this.stockSold.emit(true);
        },
        error: (error) => {
          this.errorMessage = 'An error occurred during the transaction.';
        },
      });
  }

}
