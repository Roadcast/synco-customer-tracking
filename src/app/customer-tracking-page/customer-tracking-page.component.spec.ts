import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerTrackingPageComponent } from './customer-tracking-page.component';

describe('CustomerTrackingPageComponent', () => {
  let component: CustomerTrackingPageComponent;
  let fixture: ComponentFixture<CustomerTrackingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerTrackingPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerTrackingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
