import { TestBed } from '@angular/core/testing';

import { BuyMessageService } from './buy-message.service';

describe('BuyMessageService', () => {
  let service: BuyMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BuyMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
