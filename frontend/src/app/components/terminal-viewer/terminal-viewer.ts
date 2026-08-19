import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

@Component({
  selector: 'app-terminal-viewer',
  standalone: true,
  template: `
    <div class="terminal-container" #terminalContainer></div>
  `,
  styles: [`
    .terminal-container {
      width: 100%;
      height: 100%;
      min-height: 400px;
      background-color: #000;
      padding: 10px;
      border-radius: 4px;
      box-sizing: border-box;
      overflow: hidden;
    }
  `]
})
export class TerminalViewer implements AfterViewInit, OnDestroy {
  @ViewChild('terminalContainer') terminalContainer!: ElementRef;
  
  private term: Terminal;
  private fitAddon: FitAddon;
  private resizeObserver: ResizeObserver;

  constructor() {
    this.term = new Terminal({
      theme: { background: '#000000', foreground: '#ffffff' },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      convertEol: true
    });
    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);
    
    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        try { this.fitAddon.fit(); } catch(e) {}
      });
    });
  }

  ngAfterViewInit() {
    this.term.open(this.terminalContainer.nativeElement);
    this.fitAddon.fit();
    this.resizeObserver.observe(this.terminalContainer.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver.disconnect();
    this.term.dispose();
  }

  write(data: string) {
    this.term.write(data);
  }

  clear() {
    this.term.clear();
  }
}
