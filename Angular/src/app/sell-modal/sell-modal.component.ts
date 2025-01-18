import { Component, Inject, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ApiService } from '../api.service';
import { BuyMessageService } from '../buy-message.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'; 

@Component({
  selector: 'app-sell-modal',
  templateUrl: './sell-modal.component.html',
  styleUrls: ['./sell-modal.component.css'],
})
export class SellModalComponent {

  @Input() stockSymbol!: string;
  @Input() currentPrice!: number;
  @Input() moneyInWallet!: number;
  @Input() companyName!: string;
  @Input() quantityOwned!: number;

  quantity: number | null = null;
  total: number = 0;
  sufficientFunds: boolean = true;
  sufficientStock: boolean = true;
  errorMessage: string = '';
  quantityToSell: number | null = null;
  @Output() stockSold = new EventEmitter<{ticker: string, quantitySold: number}>(); 

  canSell: boolean = true;
  insufficientStock: boolean = false;
  quantityInPortfolio: number = 0;

  constructor(
    private apiService: ApiService,
    public activeModal: NgbActiveModal,
    private sellMessageService: BuyMessageService
  ) {}

  ngOnInit() {
    this.fetchPortfolioDetails(this.stockSymbol);
    this.fetchStockDetails();
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

  fetchStockDetails(): void {
    this.apiService.getStockQuote(this.stockSymbol).subscribe({
      next: (quote) => {
        this.currentPrice = quote.c; 
      },
      error: (error) => console.error('Error fetching stock quote:', error),
    });
  }

  fetchWalletBalance(): void {
    this.apiService.getWalletBalance().subscribe({
      next: (walletData) => {
        this.moneyInWallet = walletData.balance; 
      },
      error: (error) => console.error('Error fetching wallet balance:', error),
    });
  }


  sellStocks() {
    if (!this.sufficientStock || this.quantityToSell === null || this.quantityToSell <= 0) {
      return;
    }

    const totalRevenue = this.currentPrice * this.quantityToSell;
    this.apiService.sellStocks({
      companyTicker: this.stockSymbol,
      quantityToSell: this.quantityToSell,
      totalRevenue,
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.sellMessageService.changeSellMessage(`${this.stockSymbol} Sold Successfully`);
          this.activeModal.close({ success: true });
        } else {
          this.errorMessage = response.message || 'An error occurred while selling stocks.';
        }
      },
      error: (error) => {
        console.error('Error selling stock:', error);
        this.errorMessage = 'An error occurred during the transaction.';
      },
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
    
    if (this.quantityToSell !== null && this.quantityToSell > 0) {
      this.total = this.currentPrice * this.quantityToSell;
  
      if (this.quantityToSell <= this.quantityOwned) {
        this.sufficientStock = true; 
      } else {
        this.sufficientStock = false; 
        this.errorMessage = 'You cannot sell more stocks than you own.'; 
      }
    } else {
      this.total = 0; 
      this.sufficientStock = false; 
    }
  }

  onQuantityChange(): void {
    this.calculateTotal();
  }
}
