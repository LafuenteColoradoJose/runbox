import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationsList } from './organizations-list';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('OrganizationsList', () => {
  let component: OrganizationsList;
  let fixture: ComponentFixture<OrganizationsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationsList],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    
    fixture = TestBed.createComponent(OrganizationsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
