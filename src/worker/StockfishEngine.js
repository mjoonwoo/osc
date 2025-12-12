export class StockfishEngine {
  constructor() {
    this.worker = new Worker("/stockfish.js");
  }

  analyze(fen, depth = 16) {
    return new Promise((resolve) => {
      let bestmove = null;
      let cp = null;
      let evaluation = null;
      let mate = null;

      const handler = (e) => {
        const text = e.data;

        // 평가 cp
        const cpMatch = text.match(/score cp (-?\d+)/);
        if (cpMatch) {
          cp = parseInt(cpMatch[1], 10);
          evaluation = cp / 100; // 23cp -> 0.23
        }

        // mate
        const mateMatch = text.match(/score mate (-?\d+)/);
        if (mateMatch) {
          mate = parseInt(mateMatch[1], 10);
          evaluation = null;
        }

        // bestmove
        if (text.startsWith("bestmove")) {
          bestmove = text.split(" ")[1];

          this.worker.removeEventListener("message", handler);

          resolve({
            bestmove,
            evaluation,
            mate,
          });
        }
      };

      this.worker.addEventListener("message", handler);

      this.worker.postMessage("uci");
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${depth}`);
    });
  }
}