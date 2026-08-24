import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

import { PlaybookRunDialog } from './playbook-run-dialog';
import { InventoryService } from '../../core/services/inventory.service';
import { of, throwError } from 'rxjs';

describe('PlaybookRunDialog', () => {
  let component: PlaybookRunDialog;
  let fixture: ComponentFixture<PlaybookRunDialog>;
  let mockInventoryService: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockInventoryService = {
      getInventories: vi.fn().mockReturnValue(of([{ id: 1, name: 'Prod' }]))
    };
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PlaybookRunDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: InventoryService, useValue: mockInventoryService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlaybookRunDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load inventories on init', () => {
    expect(component).toBeTruthy();
    expect(mockInventoryService.getInventories).toHaveBeenCalled();
    expect(component.inventories().length).toBe(1);
    expect(component.inventories()[0].name).toBe('Prod');
  });

  it('should handle error when loading inventories', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInventoryService.getInventories.mockReturnValue(throwError(() => new Error('API Error')));
    
    component.ngOnInit();
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load inventories', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('should close dialog without data on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('should close dialog with selected inventory on run', () => {
    component.selectedInventoryId.set(1);
    component.onRun();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ inventoryId: 1 });
  });
});
