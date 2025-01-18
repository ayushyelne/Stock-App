import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyPortfolioComponent } from './buy-portfolio.component';

describe('BuyPortfolioComponent', () => {
  let component: BuyPortfolioComponent;
  let fixture: ComponentFixture<BuyPortfolioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuyPortfolioComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuyPortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
