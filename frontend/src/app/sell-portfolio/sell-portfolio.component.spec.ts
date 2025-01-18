import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellPortfolioComponent } from './sell-portfolio.component';

describe('SellPortfolioComponent', () => {
  let component: SellPortfolioComponent;
  let fixture: ComponentFixture<SellPortfolioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SellPortfolioComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellPortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
