import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BuyMessageService {
  private messageSource = new BehaviorSubject<string>('');
  currentMessage = this.messageSource.asObservable();

  private sellMessageSource = new BehaviorSubject<string>('');
  sellMessage = this.sellMessageSource.asObservable();

  constructor() {}

  changeMessage(message: string) {
    this.messageSource.next(message);
    if (message) {
      setTimeout(() => this.messageSource.next(''), 3000);
    }
  }

  changeSellMessage(message: string) {
    this.sellMessageSource.next(message);
    if (message) {
      setTimeout(() => this.sellMessageSource.next(''), 3000);
    }
  }
}
