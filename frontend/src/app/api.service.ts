import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://localhost:3000';
  private baseUrl1 = 'https://ayush1621.wl.r.appspot.com';
  private cache = new Map<string, any>();

  constructor(private http: HttpClient) {}

  addToWatchlist(companyName: string, companyTicker: string) {
    return this.http.post(`${this.baseUrl}/api/watchlist`, {
      companyName,
      companyTicker,
    });
  }

  removeFromWatchlist(companyTicker: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/watchlist/${companyTicker}`);
  }

  getWatchlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/watchlist`);
  }

  getQuotesForWatchlist(tickers: string[]): Observable<any[]> {
    const requests = tickers.map((ticker) =>
      this.http.get<any>(`${this.baseUrl}/api/search/${ticker}`)
    );
    return forkJoin(requests); 
  }

  getWalletBalance(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/wallet`);
  }

  updateWalletBalance(amount: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/wallet/update`, { amount });
  }  

  getPortfolio(): Observable<any[]> {
    return this.http.get<any[]>('/api/portfolio');
  }

  getPortfolioItem(ticker: string): Observable<any> {
    return this.http.get<any>(`/api/portfolio/${ticker}`);
  }

  addPurchaseToPortfolio(purchaseData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/portfolio`, purchaseData);
  }

  sellStocks(sellOrder: { companyTicker: string; quantityToSell: number; totalRevenue: number }): Observable<any> {
    return this.http.post('/api/portfolio/sell', sellOrder);
  }
  
  
// ---------------------------------------------------------------------------------------------------------------------------

  getStockQuote(ticker: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/search/${ticker}`);
  }

  getCompanyProfile(ticker: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/company-profile/${ticker}`);
  }

  getCompanyNews(ticker: string, from: string, to: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/api/company-news/${ticker}?from=${from}&to=${to}`
    );
  }

  getInsiderSentiment(
    ticker: string,
    from: string,
    to: string
  ): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/api/insider-sentiment/${ticker}?from=${from}&to=${to}`
    );
  }

  getCompanyPeers(ticker: string): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.baseUrl}/api/company-peers/${ticker}`
    );
  }

  getRecommendationTrends(ticker: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/api/recommendation-trends/${ticker}`
    );
  }

  getAutocompleteResults(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/autocomplete/${query}`);
  }

  getCompanyEarnings(ticker: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/company-earnings/${ticker}`
    );
  }

  getHistoricalData(ticker: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/api/historical-data/${ticker}`
    );
  }

  getDailyData(ticker: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/daily-data/${ticker}`);
  }

  getStockDetails(ticker: string): Observable<any> {
    const cacheKey = `stockDetails-${ticker}`;
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey));
    }

    const request = forkJoin({
      quote: this.getStockQuote(ticker),
      profile: this.getCompanyProfile(ticker),
      news: this.getCompanyNews(ticker, '2022-01-01', '2022-06-30'),
      sentiment: this.getInsiderSentiment(ticker, '2022-01-01', '2022-06-30'),
      peers: this.getCompanyPeers(ticker),
      recommendationTrends: this.getRecommendationTrends(ticker),
      earnings: this.getCompanyEarnings(ticker),
      historicalData: this.getHistoricalData(ticker),
      dailyData: this.getDailyData(ticker),
    }).pipe(
      tap((response) => {
        this.cache.set(cacheKey, response);
      })
    );

    return request;
  }

  // getStockDetails(ticker: string): Observable<any> {
  //   const requests = {
  //     quote: this.getStockQuote(ticker).pipe(catchError(() => of({ error: true }))),
  //     profile: this.getCompanyProfile(ticker).pipe(catchError(() => of({ error: true }))),
  //     news: this.getCompanyNews(ticker, 'fromDate', 'toDate').pipe(catchError(() => of({ error: true }))),
  //     sentiment: this.getInsiderSentiment(ticker, 'fromDate', 'toDate').pipe(catchError(() => of({ error: true }))),
  //     peers: this.getCompanyPeers(ticker).pipe(catchError(() => of({ error: true }))),
  //     recommendationTrends: this.getRecommendationTrends(ticker).pipe(catchError(() => of({ error: true }))),
  //     autocomplete: this.getAutocompleteResults(ticker).pipe(catchError(() => of({ error: true }))),
  //     earnings: this.getCompanyEarnings(ticker).pipe(catchError(() => of({ error: true }))),
  //     historicalData: this.getHistoricalData(ticker).pipe(catchError(() => of({ error: true }))),
  //     dailyData: this.getDailyData(ticker).pipe(catchError(() => of({ error: true }))),
  //   };

  //   return forkJoin(requests);
  // }
}
