export class UIOverlay {
  private container: HTMLElement;
  
  constructor(container: HTMLElement) {
    this.container = container;
  }
  
  dispose(): void {
    // Cleanup
  }
}