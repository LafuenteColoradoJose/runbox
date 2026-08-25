import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Playbooks } from './playbooks';
import { PlaybookService } from '../../core/services/playbook';
import { AuthService } from '../../core/services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Playbooks', () => {
  let component: Playbooks;
  let fixture: ComponentFixture<Playbooks>;
  
  let mockPlaybookService: any;
  let mockSnackBar: any;
  let mockDialog: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockPlaybookService = {
      getPlaybooks: vi.fn().mockReturnValue(of([
        { id: 1, name: 'Test Playbook', path: '/test', description: 'Test', created_at: '' }
      ])),
      runPlaybook: vi.fn().mockReturnValue(of({ job: { id: 100 } })),
      deletePlaybook: vi.fn().mockReturnValue(of(true))
    };

    mockSnackBar = {
      open: vi.fn()
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of({ inventoryId: 1 }))
      })
    };

    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({ role: 'admin' })
    };

    TestBed.overrideProvider(MatDialog, { useValue: mockDialog });
    TestBed.overrideProvider(MatSnackBar, { useValue: mockSnackBar });

    await TestBed.configureTestingModule({
      imports: [Playbooks, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PlaybookService, useValue: mockPlaybookService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Playbooks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and load playbooks', () => {
    expect(component).toBeTruthy();
    expect(component.playbooks().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('should filter playbooks by name and description', () => {
    component.playbooks.set([
      { id: 1, name: 'Setup Server', path: '', description: 'Initial setup', created_at: '' },
      { id: 2, name: 'Deploy App', path: '', description: 'Frontend deployment', created_at: '' }
    ]);
    
    // Buscar por nombre
    component.searchQuery.set('setup');
    expect(component.filteredPlaybooks().length).toBe(1);
    expect(component.filteredPlaybooks()[0].name).toBe('Setup Server');

    // Buscar por descripción
    component.searchQuery.set('frontend');
    expect(component.filteredPlaybooks().length).toBe(1);
    expect(component.filteredPlaybooks()[0].name).toBe('Deploy App');

    // Buscar texto que no existe
    component.searchQuery.set('xyz');
    expect(component.filteredPlaybooks().length).toBe(0);

    // Búsqueda vacía retorna todos
    component.searchQuery.set('');
    expect(component.filteredPlaybooks().length).toBe(2);
  });

  it('should handle load playbooks error', () => {
    mockPlaybookService.getPlaybooks.mockReturnValue(throwError(() => new Error('Error')));
    component.loadPlaybooks();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Error al cargar playbooks', 'Cerrar', { duration: 3000 });
    expect(component.loading()).toBe(false);
  });

  it('should call runPlaybook and navigate', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const playbook = component.playbooks()[0];
    component.runPlaybook(playbook);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockPlaybookService.runPlaybook).toHaveBeenCalledWith(playbook.id, 1);
    expect(navigateSpy).toHaveBeenCalledWith(['/jobs', 100]);
  });

  it('should handle runPlaybook dialog cancel', () => {
    mockDialog.open.mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(undefined))
    });
    
    component.runPlaybook(component.playbooks()[0]);
    expect(mockPlaybookService.runPlaybook).not.toHaveBeenCalled();
  });

  it('should handle runPlaybook error', () => {
    mockPlaybookService.runPlaybook.mockReturnValue(throwError(() => new Error('Error')));
    component.runPlaybook(component.playbooks()[0]);
    
    expect(mockSnackBar.open).toHaveBeenCalledWith('Error al ejecutar playbook', 'Cerrar', { duration: 3000 });
  });

  it('should open create dialog and reload on result', () => {
    mockDialog.open.mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(true))
    });
    const loadSpy = vi.spyOn(component, 'loadPlaybooks');

    component.openDialog();
    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Playbook creado', 'Cerrar', { duration: 3000 });
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should open edit dialog and reload on result', () => {
    mockDialog.open.mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(true))
    });
    const loadSpy = vi.spyOn(component, 'loadPlaybooks');

    component.openDialog(component.playbooks()[0]);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Playbook actualizado', 'Cerrar', { duration: 3000 });
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should not reload if dialog returns false', () => {
    mockDialog.open.mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(false))
    });
    const loadSpy = vi.spyOn(component, 'loadPlaybooks');

    component.openDialog();
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('should delete playbook on confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const loadSpy = vi.spyOn(component, 'loadPlaybooks');
    
    component.deletePlaybook(component.playbooks()[0]);
    expect(window.confirm).toHaveBeenCalled();
    expect(mockPlaybookService.deletePlaybook).toHaveBeenCalledWith(1);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Playbook eliminado', 'Cerrar', { duration: 3000 });
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should not delete playbook on cancel', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    component.deletePlaybook(component.playbooks()[0]);
    expect(mockPlaybookService.deletePlaybook).not.toHaveBeenCalled();
  });

  it('should handle delete playbook error', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockPlaybookService.deletePlaybook.mockReturnValue(throwError(() => new Error('Error')));
    
    component.deletePlaybook(component.playbooks()[0]);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Error al eliminar playbook', 'Cerrar', { duration: 3000 });
  });
});
