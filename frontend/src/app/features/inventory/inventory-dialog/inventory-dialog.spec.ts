import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryDialog } from './inventory-dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { InventoryService } from '../../../core/services/inventory.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('InventoryDialog', () => {
  let component: InventoryDialog;
  let fixture: ComponentFixture<InventoryDialog>;
  let mockInventoryService: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockInventoryService = {
      getOrganizations: vi.fn().mockReturnValue(of([{ id: 1, name: 'Org 1' }, { id: 2, name: 'Org 2' }])),
      createInventory: vi.fn(),
      updateInventory: vi.fn()
    };
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [InventoryDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: InventoryService, useValue: mockInventoryService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InventoryDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load organizations on init', () => {
    expect(component).toBeTruthy();
    expect(mockInventoryService.getOrganizations).toHaveBeenCalled();
    expect(component.organizations.length).toBe(2);
  });

  it('should not automatically select organization if multiple exist', () => {
    expect(component.invForm.value.organization_id).toBe('');
  });

  it('should invalidate form if name or organization is empty', () => {
    component.invForm.controls['name'].setValue('');
    component.invForm.controls['organization_id'].setValue('');
    expect(component.invForm.invalid).toBe(true);
  });

  it('should validate form if all fields are valid', () => {
    component.invForm.controls['name'].setValue('Valid Inventory');
    component.invForm.controls['organization_id'].setValue(1);
    expect(component.invForm.invalid).toBe(false);
  });

  it('should not call create or update if form is invalid on save', () => {
    component.invForm.controls['name'].setValue('');
    component.save();
    expect(mockInventoryService.createInventory).not.toHaveBeenCalled();
    expect(mockInventoryService.updateInventory).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should call createInventory and close dialog when no id is provided', () => {
    component.invForm.setValue({ name: 'New Inv', organization_id: 1 });
    mockInventoryService.createInventory.mockReturnValue(of({ id: 1, name: 'New Inv', organization_id: 1 }));
    
    component.save();
    
    expect(mockInventoryService.createInventory).toHaveBeenCalledWith({ name: 'New Inv', organization_id: 1 });
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});

describe('InventoryDialog with Single Organization', () => {
  let component: InventoryDialog;
  let fixture: ComponentFixture<InventoryDialog>;
  let mockInventoryService: any;

  beforeEach(async () => {
    mockInventoryService = {
      getOrganizations: vi.fn().mockReturnValue(of([{ id: 1, name: 'Org 1' }]))
    };

    await TestBed.configureTestingModule({
      imports: [InventoryDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: InventoryService, useValue: mockInventoryService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InventoryDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should automatically select organization if only one exists (create mode)', () => {
    expect(component.invForm.value.organization_id).toBe(1);
  });
});

describe('InventoryDialog with DATA (edit mode)', () => {
  let component: InventoryDialog;
  let fixture: ComponentFixture<InventoryDialog>;
  let mockInventoryService: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockInventoryService = {
      getOrganizations: vi.fn().mockReturnValue(of([{ id: 1, name: 'Org 1' }])),
      updateInventory: vi.fn()
    };
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [InventoryDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: { id: 2, name: 'Existing Inv', organization_id: 1 } 
        },
        { provide: InventoryService, useValue: mockInventoryService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InventoryDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form with existing inventory data', () => {
    expect(component.invForm.value.name).toBe('Existing Inv');
    expect(component.invForm.value.organization_id).toBe(1);
  });

  it('should call updateInventory and close dialog when id is provided', () => {
    component.invForm.setValue({ name: 'Updated Inv', organization_id: 1 });
    mockInventoryService.updateInventory.mockReturnValue(of({ id: 2, name: 'Updated Inv', organization_id: 1 }));
    
    component.save();
    
    expect(mockInventoryService.updateInventory).toHaveBeenCalledWith(2, { name: 'Updated Inv', organization_id: 1 });
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});
