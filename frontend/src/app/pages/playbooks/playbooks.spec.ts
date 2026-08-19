import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Playbooks } from './playbooks';
import { PlaybookService } from '../../core/services/playbook';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';

describe('Playbooks', () => {
  let component: Playbooks;
  let fixture: ComponentFixture<Playbooks>;
  
  let mockPlaybookService: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockPlaybookService = {
      getPlaybooks: vi.fn().mockResolvedValue([
        { id: 1, name: 'Test Playbook', path: '/test', description: 'Test', created_at: '' }
      ]),
      runPlaybook: vi.fn().mockResolvedValue({ id: 100 })
    };

    mockSnackBar = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Playbooks],
      providers: [
        provideRouter([]),
        { provide: PlaybookService, useValue: mockPlaybookService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Playbooks);
    component = fixture.componentInstance;
    // Act & Wait para la carga inicial asíncrona
    await fixture.whenStable();
  });

  it('should create and load playbooks', () => {
    expect(component).toBeTruthy();
    expect(component.playbooks().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('should call runPlaybook and navigate', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const playbook = component.playbooks()[0];
    await component.runPlaybook(playbook);

    expect(mockPlaybookService.runPlaybook).toHaveBeenCalledWith(playbook.id);
    expect(navigateSpy).toHaveBeenCalledWith(['/jobs', 100]);
  });
});
