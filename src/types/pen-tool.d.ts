declare module 'pen-tool' {
    interface PenCircle {
        radius?: number;
        stroke?: string | CanvasGradient | CanvasPattern;
        fill?: string | CanvasGradient | CanvasPattern;
    }

    interface PenLine {
        stroke?: string | CanvasGradient | CanvasPattern;
        fill?: string | CanvasGradient | CanvasPattern;
    }

    interface PenOptions {
        circle?: PenCircle;
        line?: PenLine;
        pathColor?: string;
        pathFillColor?: string;
        isFillPath?: boolean;
    }

    export default class PenTool {
        constructor(canvasId: string, options?: PenOptions);
        enablePen(): void;
        disablePen(): void;
    }
} 