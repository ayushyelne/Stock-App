import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-buy-portfolio',
  templateUrl: './buy-portfolio.component.html',
  styleUrls: ['./buy-portfolio.component.css'],
})
export class BuyPortfolioComponent {
  @Input() stockSymbol!: string;
  @Input() currentPrice!: number;
  @Input() moneyInWallet!: number;
  @Input() companyName!: string;

  quantity: number | null = null;
  total: number = 0;
  sufficientFunds: boolean = true;
  @Output() purchaseMade = new EventEmitter<boolean>();

  constructor(
    public activeModal: NgbActiveModal,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.calculateTotal();
    this.fetchStockDetails(this.stockSymbol);
    this.fetchWalletBalance();
  }

  fetchStockDetails(ticker: string) {
    console.log('Ticker received', ticker);
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

  calculateTotal() {
    if (this.quantity !== null) {
      this.total = this.currentPrice * this.quantity;
      this.sufficientFunds = this.total <= this.moneyInWallet;
    } else {
      this.total = 0;
      this.sufficientFunds = false;
    }
  }

  buyStocks(): void {
    if (this.quantity === null || this.quantity <= 0 || !this.sufficientFunds) {
      console.error('Invalid operation.');
      return;
    }

    const totalCost = this.currentPrice * this.quantity;
    console.log(
      `Buying stocks: ${this.stockSymbol}, Quantity: ${this.quantity}, Total Cost: ${totalCost}`
    );

    this.apiService.addPurchaseToPortfolio({
      companyName: this.companyName,
      companyTicker: this.stockSymbol,
      quantity: this.quantity,
      totalCost: totalCost,
    }).subscribe({
      next: (response) => {
        console.log('Purchase added to portfolio successfully', response);
        this.activeModal.close('purchaseMade');
        this.purchaseMade.emit(true); 
      },
      error: (error) => {
        console.error('Failed to add purchase to portfolio:', error);
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
}
