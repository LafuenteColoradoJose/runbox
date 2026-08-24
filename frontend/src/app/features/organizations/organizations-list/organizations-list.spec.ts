import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationsList } from './organizations-list';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/services/auth';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

describe('OrganizationsList', () => {
  let component: OrganizationsList;
  let fixture: ComponentFixture<OrganizationsList>;
  
  let mockInventoryService: any;
  let mockAuthService: any;
  let mockDialog: any;

  beforeEach(async () => {
    mockInventoryService = {
      getOrganizations: vi.fn().mockReturnValue(of([{ id: 1, name: 'Org 1' }])),
      deleteOrganization: vi.fn().mockReturnValue(of(true))
    };

    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({ role: 'admin' })
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(true))
      })
    };

    TestBed.overrideProvider(MatDialog, { useValue: mockDialog });

    await TestBed.configureTestingModule({
      imports: [OrganizationsList],
      providers: [
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(OrganizationsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and load organizations', () => {
    expect(component).toBeTruthy();
    expect(component.organizations.length).toBe(1);
    expect(component.displayedColumns).toEqual(['id', 'name', 'actions']);
  });

  it('should remove actions column if user is not admin', () => {
    mockAuthService.currentUser.mockReturnValue({ role: 'user' });
    component.ngOnInit();
    expect(component.displayedColumns).toEqual(['id', 'name']);
  });

  it('should open dialog and reload on close with result', () => {
    const loadSpy = vi.spyOn(component, 'loadOrganizations');
    component.openDialog();
    expect(mockDialog.open).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should open dialog and not reload if closed without result', () => {
    mockDialog.open.mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(false))
    });
    const loadSpy = vi.spyOn(component, 'loadOrganizations');
    
    component.openDialog();
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('should delete organization if confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const loadSpy = vi.spyOn(component, 'loadOrganizations');
    
    component.deleteOrg(1);
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this organization?');
    expect(mockInventoryService.deleteOrganization).toHaveBeenCalledWith(1);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should not delete organization if cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    component.deleteOrg(1);
    expect(mockInventoryService.deleteOrganization).not.toHaveBeenCalled();
  });
});
