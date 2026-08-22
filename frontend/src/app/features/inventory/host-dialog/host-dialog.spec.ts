import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HostDialog } from './host-dialog';

describe('HostDialog', () => {
  let component: HostDialog;
  let fixture: ComponentFixture<HostDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostDialog]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HostDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
