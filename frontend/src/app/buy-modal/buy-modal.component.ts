import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../api.service';
import { BuyMessageService } from '../buy-message.service';

@Component({
  selector: 'app-buy-modal',
  templateUrl: './buy-modal.component.html',
  // ...
})
export class BuyModalComponent {

  @Input() data: any; 
  quantity: number | null = null;
  total: number = 0;
  sufficientFunds: boolean = true;
  @Output() purchaseMade = new EventEmitter<boolean>();

  constructor(
    public activeModal: NgbActiveModal,
    private apiService: ApiService,
    private buyMessageService: BuyMessageService
  ) {}

  ngOnInit() {
    if (this.data && this.data.stockSymbol) {
      this.fetchStockDetails(this.data.stockSymbol);
      this.fetchWalletBalance();
      this.calculateTotal();
    }
  }

  fetchStockDetails(ticker: string) {
    this.apiService.getStockQuote(ticker).subscribe({
      next: (quote) => {
        console.log('Received quote:', quote);
        this.data.currentPrice = quote.c;
      },
      error: (error) => console.error('Error fetching stock quote:', error),
    });
  }

  fetchWalletBalance() {
    this.apiService.getWalletBalance().subscribe({
      next: (walletData) => {
        this.data.moneyInWallet = walletData.balance;
      },
      error: (error) => console.error('Error fetching wallet balance:', error),
    });
  }

  calculateTotal() {
    if (this.quantity !== null) {
      this.total = this.data.currentPrice * this.quantity;
    } else {
      this.total = 0; 
    }
    this.sufficientFunds =
      this.total > 0 && this.total <= this.data.moneyInWallet;
  }


  buyStocks(): void {
    if (this.quantity === null) {
      console.error('Quantity is not specified.');
      this.activeModal.dismiss('Quantity is not specified'); 
      return;
    }

    this.calculateTotal();

    const totalCost = this.data.currentPrice * this.quantity;

    if (this.quantity > 0 && totalCost <= this.data.moneyInWallet) {
      this.apiService.addPurchaseToPortfolio({
        companyName: this.data.companyName,
        companyTicker: this.data.stockSymbol,
        quantity: this.quantity,
        totalCost: totalCost,
      }).subscribe({
        next: (response) => {
          this.purchaseMade.emit(true);
          console.log('Purchase added to portfolio successfully', response);
          this.updateWalletBalance(-totalCost);
          this.buyMessageService.changeMessage(`${this.data.stockSymbol} Bought Successfully`);
          this.activeModal.close({ success: true, message: `${this.data.stockSymbol} Bought Successfully` }); 
        },
        error: (error) => {
          console.error('Failed to add purchase to portfolio:', error);
          this.activeModal.dismiss('Failed to add purchase to portfolio'); 
        },
      });
    } else {
      console.error('Purchase failed: not enough funds or invalid quantity');
      this.activeModal.dismiss('Purchase failed: not enough funds or invalid quantity'); 
    }
  }

  updateWalletBalance(amount: number): void {
    this.apiService.updateWalletBalance(amount).subscribe({
      next: (response) => {
        console.log('Wallet updated successfully', response);
        this.activeModal.close({ success: true, message: 'Wallet updated successfully' }); 
      },
      error: (error) => {
        console.error('Failed to update wallet:', error);
        this.activeModal.dismiss('Failed to update wallet'); 
      },
    });
  }
  
}