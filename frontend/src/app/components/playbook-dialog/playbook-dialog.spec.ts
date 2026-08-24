import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

import { PlaybookDialog } from './playbook-dialog';
import { PlaybookService } from '../../core/services/playbook';
import { InventoryService } from '../../core/services/inventory.service';
import { of } from 'rxjs';

describe('PlaybookDialog', () => {
  let component: PlaybookDialog;
  let fixture: ComponentFixture<PlaybookDialog>;
  let playbookServiceSpy: any;
  let inventoryServiceSpy: any;
  let dialogRefSpy: any;

  beforeEach(async () => {
    playbookServiceSpy = {
      createPlaybook: vi.fn(),
      updatePlaybook: vi.fn()
    };
    inventoryServiceSpy = {
      getOrganizations: vi.fn()
    };
    dialogRefSpy = { close: vi.fn() };
    
    inventoryServiceSpy.getOrganizations.mockReturnValue(of([{ id: 1, name: 'Org 1' }]));

    await TestBed.configureTestingModule({
      imports: [PlaybookDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: PlaybookService, useValue: playbookServiceSpy },
        { provide: InventoryService, useValue: inventoryServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlaybookDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load organizations on init', () => {
    expect(component).toBeTruthy();
    expect(inventoryServiceSpy.getOrganizations).toHaveBeenCalled();
    expect(component.organizations.length).toBe(1);
    expect(component.isEditMode).toBe(false);
  });

  it('should invalidate form if name or path is empty', () => {
    component.playbookForm.controls['name'].setValue('');
    component.playbookForm.controls['path'].setValue('');
    expect(component.playbookForm.invalid).toBe(true);
  });

  it('should validate form if all required fields are filled', () => {
    component.playbookForm.controls['name'].setValue('Valid Playbook');
    component.playbookForm.controls['path'].setValue('/path/to/pb.yml');
    expect(component.playbookForm.invalid).toBe(false);
  });

  it('should not call create or update if form is invalid on submit', () => {
    component.playbookForm.controls['name'].setValue('');
    component.onSubmit();
    expect(playbookServiceSpy.createPlaybook).not.toHaveBeenCalled();
    expect(playbookServiceSpy.updatePlaybook).not.toHaveBeenCalled();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should call createPlaybook and close dialog when no data is provided (create mode)', () => {
    component.playbookForm.setValue({ name: 'New Playbook', path: '/path', organization_id: 1 });
    playbookServiceSpy.createPlaybook.mockReturnValue(of({ id: 1, name: 'New Playbook', path: '/path', organization_id: 1, created_at: '', updated_at: '' }));
    
    component.onSubmit();
    
    expect(playbookServiceSpy.createPlaybook).toHaveBeenCalledWith({ name: 'New Playbook', path: '/path', organization_id: 1 });
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});

describe('PlaybookDialog with DATA (edit mode)', () => {
  let component: PlaybookDialog;
  let fixture: ComponentFixture<PlaybookDialog>;
  let playbookServiceSpy: any;
  let inventoryServiceSpy: any;
  let dialogRefSpy: any;

  beforeEach(async () => {
    playbookServiceSpy = {
      createPlaybook: vi.fn(),
      updatePlaybook: vi.fn()
    };
    inventoryServiceSpy = {
      getOrganizations: vi.fn()
    };
    dialogRefSpy = { close: vi.fn() };
    
    inventoryServiceSpy.getOrganizations.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PlaybookDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: { id: 5, name: 'Existing PB', path: '/existing/path', organization_id: 2 } 
        },
        { provide: PlaybookService, useValue: playbookServiceSpy },
        { provide: InventoryService, useValue: inventoryServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlaybookDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form with existing data in edit mode', () => {
    expect(component.isEditMode).toBe(true);
    expect(component.playbookForm.value.name).toBe('Existing PB');
    expect(component.playbookForm.value.path).toBe('/existing/path');
    expect(component.playbookForm.value.organization_id).toBe(2);
  });

  it('should call updatePlaybook and close dialog on submit', () => {
    component.playbookForm.setValue({ name: 'Updated PB', path: '/updated', organization_id: 2 });
    playbookServiceSpy.updatePlaybook.mockReturnValue(of({ id: 5, name: 'Updated PB', path: '/updated', organization_id: 2, created_at: '', updated_at: '' }));
    
    component.onSubmit();
    
    expect(playbookServiceSpy.updatePlaybook).toHaveBeenCalledWith(5, { name: 'Updated PB', path: '/updated', organization_id: 2 });
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});
