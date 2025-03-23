declare module 'tsne-js' {
  interface TSNEOptions {
    dim: number;
    perplexity: number;
    earlyExaggeration: number;
    learningRate: number;
    nIter: number;
    metric: string;
  }

  export default class TSNE {
    constructor(options: Partial<TSNEOptions>);
    init(data: number[][]): void;
    run(): void;
    getOutput(): number[][];
    getOutputScaled(): number[][];
  }
} 