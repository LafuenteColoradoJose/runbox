import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HostDialog } from './host-dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { InventoryService } from '../../../core/services/inventory.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('HostDialog', () => {
  let component: HostDialog;
  let fixture: ComponentFixture<HostDialog>;
  let mockInventoryService: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockInventoryService = {
      createHost: vi.fn(),
      updateHost: vi.fn(),
      getGroupsByInventory: vi.fn().mockReturnValue(of([{ id: 1, name: 'Group 1', inventory_id: 10, variables: {} }]))
    };
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [HostDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { inventoryId: 10 } },
        { provide: InventoryService, useValue: mockInventoryService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HostDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load groups on init', () => {
    expect(component).toBeTruthy();
    expect(mockInventoryService.getGroupsByInventory).toHaveBeenCalledWith(10);
    expect(component.availableGroups.length).toBe(1);
    expect(component.availableGroups[0].name).toBe('Group 1');
  });

  it('should invalidate form if name or ip_address is empty', () => {
    component.hostForm.controls['name'].setValue('');
    component.hostForm.controls['ip_address'].setValue('');
    expect(component.hostForm.invalid).toBe(true);
  });

  it('should invalidate form if JSON is invalid', () => {
    component.hostForm.controls['variables'].setValue('{ invalid json ');
    expect(component.hostForm.invalid).toBe(true);
    expect(component.hostForm.controls['variables'].hasError('invalidJson')).toBe(true);
  });

  it('should validate form if all fields are valid', () => {
    component.hostForm.controls['name'].setValue('Valid Host');
    component.hostForm.controls['ip_address'].setValue('10.0.0.1');
    component.hostForm.controls['variables'].setValue('{"key": "value"}');
    expect(component.hostForm.invalid).toBe(false);
  });

  it('should not call create or update if form is invalid on save', () => {
    component.hostForm.controls['name'].setValue('');
    component.save();
    expect(mockInventoryService.createHost).not.toHaveBeenCalled();
    expect(mockInventoryService.updateHost).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should call createHost and close dialog when no id is provided', () => {
    component.hostForm.setValue({ name: 'New Host', ip_address: '10.0.0.1', groups: [1], variables: '{}' });
    mockInventoryService.createHost.mockReturnValue(of({ id: 1, name: 'New Host', ip_address: '10.0.0.1', variables: {}, inventory_id: 10 }));
    
    component.save();
    
    expect(mockInventoryService.createHost).toHaveBeenCalledWith(10, { name: 'New Host', ip_address: '10.0.0.1', groups: [1], variables: '{}' });
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});

describe('HostDialog with DATA', () => {
  let component: HostDialog;
  let fixture: ComponentFixture<HostDialog>;
  let mockInventoryService: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockInventoryService = {
      createHost: vi.fn(),
      updateHost: vi.fn(),
      getGroupsByInventory: vi.fn().mockReturnValue(of([]))
    };
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [HostDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: { 
            inventoryId: 10,
            host: { 
              id: 2, 
              name: 'Existing Host', 
              ip_address: '10.0.0.2', 
              groups: [{ id: 1, name: 'Group 1' }],
              variables: { debug: true } 
            }
          } 
        },
        { provide: InventoryService, useValue: mockInventoryService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HostDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form with existing host data and stringify variables', () => {
    expect(component.hostForm.value.name).toBe('Existing Host');
    expect(component.hostForm.value.ip_address).toBe('10.0.0.2');
    expect(component.hostForm.value.groups).toEqual([1]);
    expect(component.hostForm.value.variables).toContain('"debug": true');
  });

  it('should call updateHost and close dialog when id is provided', () => {
    component.hostForm.setValue({ name: 'Updated Host', ip_address: '10.0.0.2', groups: [1], variables: '{"debug": false}' });
    mockInventoryService.updateHost.mockReturnValue(of({ id: 2, name: 'Updated Host', ip_address: '10.0.0.2', variables: { debug: false }, inventory_id: 10 }));
    
    component.save();
    
    expect(mockInventoryService.updateHost).toHaveBeenCalledWith(2, { name: 'Updated Host', ip_address: '10.0.0.2', groups: [1], variables: '{"debug": false}' });
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});

describe('HostDialog with DATA (string variables)', () => {
  let component: HostDialog;
  let fixture: ComponentFixture<HostDialog>;
  let mockInventoryService: any;
  
  beforeEach(async () => {
    mockInventoryService = {
      getGroupsByInventory: vi.fn().mockReturnValue(of([]))
    };
    
    await TestBed.configureTestingModule({
      imports: [HostDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: { 
            inventoryId: 10,
            host: { id: 3, name: 'Str Host', ip_address: '1.1.1.1', groups: [], variables: '{"foo":"bar"}' }
          } 
        },
        { provide: InventoryService, useValue: mockInventoryService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HostDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form with existing host data when variables is string', () => {
    expect(component.hostForm.value.variables).toBe('{"foo":"bar"}');
  });
});
