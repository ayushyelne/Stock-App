import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SearchHomeComponent } from './search-home/search-home.component';
import { SearchDetailsComponent } from './search-details/search-details.component';
import { WatchlistComponent } from './watchlist/watchlist.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { HeaderComponent } from './header/header.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { NewsModalComponent } from './news-modal/news-modal.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BuyModalComponent } from './buy-modal/buy-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SellModalComponent } from './sell-modal/sell-modal.component';
import { BuyPortfolioComponent } from './buy-portfolio/buy-portfolio.component';
import { SellPortfolioComponent } from './sell-portfolio/sell-portfolio.component';

@NgModule({
  declarations: [
    AppComponent,
    SearchHomeComponent,
    SearchDetailsComponent,
    WatchlistComponent,
    PortfolioComponent,
    HeaderComponent,
    NewsModalComponent,
    BuyModalComponent,
    SellModalComponent,
    BuyPortfolioComponent,
    SellPortfolioComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserModule,
    NgbModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatTabsModule,
    HighchartsChartModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
