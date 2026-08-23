import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationDialog } from './organization-dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('OrganizationDialog', () => {
  let component: OrganizationDialog;
  let fixture: ComponentFixture<OrganizationDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrganizationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
