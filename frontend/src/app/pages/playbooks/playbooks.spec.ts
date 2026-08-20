import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Playbooks } from './playbooks';
import { PlaybookService } from '../../core/services/playbook';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

describe('Playbooks', () => {
  let component: Playbooks;
  let fixture: ComponentFixture<Playbooks>;
  
  let mockPlaybookService: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockPlaybookService = {
      getPlaybooks: vi.fn().mockReturnValue(of([
        { id: 1, name: 'Test Playbook', path: '/test', description: 'Test', created_at: '' }
      ])),
      runPlaybook: vi.fn().mockReturnValue(of({ job: { id: 100 } }))
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
    fixture.detectChanges();
  });

  it('should create and load playbooks', () => {
    expect(component).toBeTruthy();
    expect(component.playbooks().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('should call runPlaybook and navigate', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const playbook = component.playbooks()[0];
    component.runPlaybook(playbook);

    expect(mockPlaybookService.runPlaybook).toHaveBeenCalledWith(playbook.id);
    expect(navigateSpy).toHaveBeenCalledWith(['/jobs', 100]);
  });
});
