import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationDialog } from './organization-dialog';

describe('OrganizationDialog', () => {
  let component: OrganizationDialog;
  let fixture: ComponentFixture<OrganizationDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationDialog]
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
