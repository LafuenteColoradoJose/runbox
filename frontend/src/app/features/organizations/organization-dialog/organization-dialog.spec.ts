import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationDialog } from './organization-dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InventoryService } from '../../../core/services/inventory.service';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';

describe('OrganizationDialog', () => {
  let component: OrganizationDialog;
  let fixture: ComponentFixture<OrganizationDialog>;
  let mockInventoryService: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockInventoryService = {
      createOrganization: vi.fn(),
      updateOrganization: vi.fn()
    };
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OrganizationDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: InventoryService, useValue: mockInventoryService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrganizationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call create or update if form is invalid', () => {
    component.orgForm.patchValue({ name: '' });
    component.save();
    expect(mockInventoryService.createOrganization).not.toHaveBeenCalled();
    expect(mockInventoryService.updateOrganization).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should call createOrganization and close dialog when no id is provided', () => {
    component.orgForm.patchValue({ name: 'New Org' });
    mockInventoryService.createOrganization.mockReturnValue(of({ id: 1, name: 'New Org', description: '' }));
    
    component.save();
    
    expect(mockInventoryService.createOrganization).toHaveBeenCalledWith({ name: 'New Org', description: '' });
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});

describe('OrganizationDialog with DATA', () => {
  let component: OrganizationDialog;
  let fixture: ComponentFixture<OrganizationDialog>;
  let mockInventoryService: any;
  let mockDialogRef: any;

  beforeEach(async () => {
    mockInventoryService = {
      createOrganization: vi.fn(),
      updateOrganization: vi.fn()
    };
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OrganizationDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { id: 1, name: 'Existing Org' } },
        { provide: InventoryService, useValue: mockInventoryService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrganizationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form with data', () => {
    expect(component.orgForm.value.name).toBe('Existing Org');
  });

  it('should call updateOrganization and close dialog when id is provided', () => {
    component.orgForm.patchValue({ name: 'Updated Org' });
    mockInventoryService.updateOrganization.mockReturnValue(of({ id: 1, name: 'Updated Org', description: '' }));
    
    component.save();
    
    expect(mockInventoryService.updateOrganization).toHaveBeenCalledWith(1, { name: 'Updated Org', description: '' });
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});
