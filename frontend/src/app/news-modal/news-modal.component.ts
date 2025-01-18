import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-news-modal',
  templateUrl: './news-modal.component.html',
  styleUrls: ['./news-modal.component.css']
})
export class NewsModalComponent {
  @Input() newsItem: any;

  constructor(public activeModal: NgbActiveModal) {}

  encodeUriComponent(str: string): string {
    return encodeURIComponent(str);
  }
}
