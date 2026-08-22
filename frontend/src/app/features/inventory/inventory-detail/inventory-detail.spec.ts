import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryDetail } from './inventory-detail';

describe('InventoryDetail', () => {
  let component: InventoryDetail;
  let fixture: ComponentFixture<InventoryDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryDetail]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InventoryDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
