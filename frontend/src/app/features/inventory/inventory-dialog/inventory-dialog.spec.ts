import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryDialog } from './inventory-dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('InventoryDialog', () => {
  let component: InventoryDialog;
  let fixture: ComponentFixture<InventoryDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InventoryDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
