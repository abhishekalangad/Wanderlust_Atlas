import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';

@Directive({
  selector: '[appTilt]',
  standalone: true,
})
export class TiltDirective implements OnInit {
  private el!: HTMLElement;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.el = this.elementRef.nativeElement;
    this.el.style.transition = 'transform 0.1s ease';
    this.el.style.transformStyle = 'preserve-3d';
    this.el.style.willChange = 'transform';
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const rect = this.el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (event.clientX - centerX) / (rect.width / 2);
    const deltaY = (event.clientY - centerY) / (rect.height / 2);

    const rotateX = -deltaY * 8;
    const rotateY = deltaX * 8;

    this.el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.el.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
    this.el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.el.style.transition = 'transform 0.1s ease';
  }
}
