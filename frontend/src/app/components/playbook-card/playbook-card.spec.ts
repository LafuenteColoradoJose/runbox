import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlaybookCard } from './playbook-card';
import { Playbook } from '../../core/services/playbook';

describe('PlaybookCard', () => {
  let component: PlaybookCard;
  let fixture: ComponentFixture<PlaybookCard>;

  const mockPlaybook: Playbook = {
    id: 1,
    name: 'Test Playbook',
    path: '/path/to/playbook',
    description: 'A test playbook',
    created_at: '2023-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaybookCard]
    }).compileComponents();

    fixture = TestBed.createComponent(PlaybookCard);
    component = fixture.componentInstance;
    
    // Set required input
    fixture.componentRef.setInput('playbook', mockPlaybook);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render playbook name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-card-title')?.textContent).toContain('Test Playbook');
  });

  it('should emit onRun when button is clicked', () => {
    const emitSpy = vi.spyOn(component.onRun, 'emit');
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    button?.click();
    expect(emitSpy).toHaveBeenCalledWith(mockPlaybook);
  });
});
