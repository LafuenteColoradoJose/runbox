import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryDetail } from './inventory-detail';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('InventoryDetail', () => {
  let component: InventoryDetail;
  let fixture: ComponentFixture<InventoryDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    
    fixture = TestBed.createComponent(InventoryDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
