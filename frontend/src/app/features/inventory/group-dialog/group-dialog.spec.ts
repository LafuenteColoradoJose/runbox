import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupDialog } from './group-dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('GroupDialog', () => {
  let component: GroupDialog;
  let fixture: ComponentFixture<GroupDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { group: null, variables: {} } }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GroupDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
