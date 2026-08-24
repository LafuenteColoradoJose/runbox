import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupDialog } from './group-dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InventoryService } from '../../../core/services/inventory.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('GroupDialog', () => {
  let component: GroupDialog;
  let fixture: ComponentFixture<GroupDialog>;
  let mockInventoryService: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockInventoryService = {
      createGroup: vi.fn(),
      updateGroup: vi.fn()
    };
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GroupDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { inventoryId: 10 } },
        { provide: InventoryService, useValue: mockInventoryService }
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

  it('should invalidate form if name is empty', () => {
    component.groupForm.controls['name'].setValue('');
    expect(component.groupForm.invalid).toBe(true);
  });

  it('should invalidate form if JSON is invalid', () => {
    component.groupForm.controls['variables'].setValue('{ invalid json ');
    expect(component.groupForm.invalid).toBe(true);
    expect(component.groupForm.controls['variables'].hasError('invalidJson')).toBe(true);
  });

  it('should validate form if JSON is valid', () => {
    component.groupForm.controls['name'].setValue('Valid Group');
    component.groupForm.controls['variables'].setValue('{"key": "value"}');
    expect(component.groupForm.invalid).toBe(false);
  });

  it('should not call create or update if form is invalid on save', () => {
    component.groupForm.controls['name'].setValue('');
    component.save();
    expect(mockInventoryService.createGroup).not.toHaveBeenCalled();
    expect(mockInventoryService.updateGroup).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should call createGroup and close dialog when no id is provided', () => {
    component.groupForm.setValue({ name: 'New Group', variables: '{}' });
    mockInventoryService.createGroup.mockReturnValue(of({ id: 1, name: 'New Group', variables: {}, inventory_id: 10 }));
    
    component.save();
    
    expect(mockInventoryService.createGroup).toHaveBeenCalledWith(10, { name: 'New Group', variables: '{}' });
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});

describe('GroupDialog with DATA', () => {
  let component: GroupDialog;
  let fixture: ComponentFixture<GroupDialog>;
  let mockInventoryService: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockInventoryService = {
      createGroup: vi.fn(),
      updateGroup: vi.fn()
    };
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GroupDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: { 
            inventoryId: 10,
            group: { id: 2, name: 'Existing Group', variables: { debug: true } }
          } 
        },
        { provide: InventoryService, useValue: mockInventoryService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GroupDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form with existing group data and stringify variables', () => {
    expect(component.groupForm.value.name).toBe('Existing Group');
    expect(component.groupForm.value.variables).toContain('"debug": true');
  });

  it('should call updateGroup and close dialog when id is provided', () => {
    component.groupForm.setValue({ name: 'Updated Group', variables: '{"debug": false}' });
    mockInventoryService.updateGroup.mockReturnValue(of({ id: 2, name: 'Updated Group', variables: { debug: false }, inventory_id: 10 }));
    
    component.save();
    
    expect(mockInventoryService.updateGroup).toHaveBeenCalledWith(2, { name: 'Updated Group', variables: '{"debug": false}' });
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});

describe('GroupDialog with DATA (string variables)', () => {
  let component: GroupDialog;
  let fixture: ComponentFixture<GroupDialog>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: { 
            inventoryId: 10,
            group: { id: 3, name: 'Str Group', variables: '{"foo":"bar"}' }
          } 
        }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GroupDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form with existing group data when variables is string', () => {
    expect(component.groupForm.value.variables).toBe('{"foo":"bar"}');
  });
});
