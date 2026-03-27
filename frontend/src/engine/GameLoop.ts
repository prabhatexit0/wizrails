// Game loop with fixed timestep and requestAnimationFrame

export type UpdateFn = (dt: number) => void;
export type RenderFn = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;

export class GameLoop {
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private onUpdate: UpdateFn;
  private onRender: RenderFn;
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(
    canvas: HTMLCanvasElement,
    onUpdate: UpdateFn,
    onRender: RenderFn
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onUpdate = onUpdate;
    this.onRender = onRender;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private tick = (now: number) => {
    if (!this.running) return;

    const dt = Math.min((now - this.lastTime) / 1000, 0.1); // cap at 100ms
    this.lastTime = now;

    this.onUpdate(dt);

    // Clear and render
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.onRender(this.ctx, this.canvas);

    this.rafId = requestAnimationFrame(this.tick);
  };
}
