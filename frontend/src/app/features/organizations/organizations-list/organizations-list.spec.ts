import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationsList } from './organizations-list';

describe('OrganizationsList', () => {
  let component: OrganizationsList;
  let fixture: ComponentFixture<OrganizationsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationsList]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrganizationsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
