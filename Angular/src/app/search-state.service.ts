import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SearchStateService {
  private searchResultSource = new BehaviorSubject<any | null>(null);
  searchResult$ = this.searchResultSource.asObservable();

  private lastTickerSource = new BehaviorSubject<string | null>(null);
  lastTicker$ = this.lastTickerSource.asObservable();

  private historicalDataTriggerSource = new BehaviorSubject<string | null>(
    null
  );

  private searchClickSource = new BehaviorSubject<string | null>(null);

  private tickerDataCache = new Map<string, any>();

  setLastTicker(ticker: string) {
    this.lastTickerSource.next(ticker);
  }

  getLastTicker(): Observable<string | null> {
    return this.lastTickerSource.asObservable();
  }

  setSearchResult(result: any): void {
    this.searchResultSource.next(result);
  }

  clearSearchResult(): void {
    this.searchResultSource.next(null);
  }

  getSearchResult(): any {
    return this.searchResultSource.getValue();
  }

  isDataCachedForTicker(ticker: string): boolean {
    return this.tickerDataCache.has(ticker);
  }

  getCachedDataForTicker(ticker: string): any | null {
    return this.tickerDataCache.get(ticker) || null;
  }
  
}
