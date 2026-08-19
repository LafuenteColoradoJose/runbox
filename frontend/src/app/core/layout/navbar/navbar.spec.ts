import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';
import { DOCUMENT } from '@angular/common';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let mockDocument: Document;

  beforeEach(async () => {
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
      imports: [Navbar]
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle theme correctly', async () => {
    const initialState = component.isDarkMode;
    component.toggleTheme();
    await fixture.whenStable();
    expect(component.isDarkMode).toBe(!initialState);
  });
});
