import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryComponent } from './inventory.component';
import { provideRouter } from '@angular/router';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('InventoryComponent', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;

  let mockInventoryService: any;
  let mockAuthService: any;
  let mockDialog: any;

  beforeEach(async () => {
    mockInventoryService = {
      getInventories: vi.fn().mockReturnValue(of([{ id: 1, name: 'Inv 1' }, { id: 2, name: 'Inv 2' }])),
      deleteInventory: vi.fn().mockReturnValue(of(true))
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
      imports: [InventoryComponent],
      providers: [
        provideRouter([]),
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    
    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and load inventories for admin', () => {
    expect(component).toBeTruthy();
    expect(component.inventories.length).toBe(2);
    expect(component.displayedColumns).toEqual(['name', 'organization', 'actions']);
  });

  it('should remove actions column if user is not admin', () => {
    mockAuthService.currentUser.mockReturnValue({ role: 'user' });
    const localFixture = TestBed.createComponent(InventoryComponent);
    const localComponent = localFixture.componentInstance;
    localFixture.detectChanges();
    
    expect(localComponent.displayedColumns).toEqual(['name', 'organization']);
  });

  it('should open dialog and reload on close with result', () => {
    const loadInventoriesSpy = vi.spyOn(component, 'loadInventories');
    component.openDialog();
    expect(mockDialog.open).toHaveBeenCalled();
    expect(loadInventoriesSpy).toHaveBeenCalled();
  });

  it('should open dialog and not reload if closed without result', () => {
    mockDialog.open.mockReturnValue({ afterClosed: vi.fn().mockReturnValue(of(false)) });
    const loadInventoriesSpy = vi.spyOn(component, 'loadInventories');
    component.openDialog();
    expect(loadInventoriesSpy).not.toHaveBeenCalled();
  });

  it('should delete inventory if confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const loadInventoriesSpy = vi.spyOn(component, 'loadInventories');
    component.deleteInv(1);
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this inventory?');
    expect(mockInventoryService.deleteInventory).toHaveBeenCalledWith(1);
    expect(loadInventoriesSpy).toHaveBeenCalled();
  });

  it('should not delete inventory if cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.deleteInv(1);
    expect(mockInventoryService.deleteInventory).not.toHaveBeenCalled();
  });
});

