import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TerminalViewer } from './terminal-viewer';

describe('TerminalViewer', () => {
  let component: TerminalViewer;
  let fixture: ComponentFixture<TerminalViewer>;

  beforeEach(async () => {
    // Mock ResizeObserver and matchMedia for xterm
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    await TestBed.configureTestingModule({
      imports: [TerminalViewer]
    }).compileComponents();

    fixture = TestBed.createComponent(TerminalViewer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call term.write when write() is called', () => {
    const termSpy = vi.spyOn(component['term'], 'write');
    component.write('Hello Terminal');
    expect(termSpy).toHaveBeenCalledWith('Hello Terminal');
  });

  it('should call term.clear when clear() is called', () => {
    const clearSpy = vi.spyOn(component['term'], 'clear');
    component.clear();
    expect(clearSpy).toHaveBeenCalled();
  });
});
