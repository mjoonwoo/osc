export class StockfishEngine {
  constructor() {
    this.worker = new Worker("/stockfish/stockfish-17.1-single-a496a04.js");
    this.ready = false;
    this.current = null;
    this.next = null;
    this.requestId = 0;

    this._handleMessage = this._handleMessage.bind(this);
    this._handleError = this._handleError.bind(this);

    this.worker.addEventListener("message", this._handleMessage);
    this.worker.addEventListener("error", this._handleError);
    this.worker.addEventListener("messageerror", this._handleError);

    this.worker.postMessage("uci");
  }

  analyze(fen, depth = 16) {
    return new Promise((resolve, reject) => {
      const req = {
        id: ++this.requestId,
        fen,
        depth,
        resolve,
        reject,
        evaluation: null,
        mate: null,
        state: "queued"
      };

      if (!this.current) {
        this.current = req;
        this._startCurrent();
      } else {
        // Keep only the most recent request to avoid overlapping searches.
        this.next = req;
        this.worker.postMessage("stop");
      }
    });
  }

  _startCurrent() {
    if (!this.current) return;
    this.current.state = "waiting_ready";
    this.worker.postMessage("isready");
  }

  _handleMessage(e) {
    const text = e.data;

    if (text === "uciok") {
      this.ready = true;
      return;
    }

    if (text === "readyok") {
      if (this.current && this.current.state === "waiting_ready") {
        this.current.state = "searching";
        this.worker.postMessage(`position fen ${this.current.fen}`);
        this.worker.postMessage(`go depth ${this.current.depth}`);
      }
      return;
    }

    if (!this.current) return;

    const cpMatch = text.match(/score cp (-?\d+)/);
    if (cpMatch) {
      const cp = parseInt(cpMatch[1], 10);
      this.current.evaluation = cp / 100;
      this.current.mate = null;
    }

    const mateMatch = text.match(/score mate (-?\d+)/);
    if (mateMatch) {
      this.current.mate = parseInt(mateMatch[1], 10);
      this.current.evaluation = null;
    }

    if (text.startsWith("bestmove")) {
      const bestmove = text.split(" ")[1];
      const done = this.current;
      this.current = null;

      done.resolve({
        bestmove,
        evaluation: done.evaluation,
        mate: done.mate,
      });

      if (this.next) {
        this.current = this.next;
        this.next = null;
        this._startCurrent();
      }
    }
  }

  _handleError(err) {
    if (this.current) {
      this.current.reject(err);
      this.current = null;
    }
    if (this.next) {
      this.next.reject(err);
      this.next = null;
    }

    try {
      this.worker.removeEventListener("message", this._handleMessage);
      this.worker.removeEventListener("error", this._handleError);
      this.worker.removeEventListener("messageerror", this._handleError);
      this.worker.terminate();
    } catch (e) {
      // ignore teardown errors
    }

    this.worker = new Worker("/stockfish/stockfish-17.1-single-a496a04.js");
    this.worker.addEventListener("message", this._handleMessage);
    this.worker.addEventListener("error", this._handleError);
    this.worker.addEventListener("messageerror", this._handleError);
    this.worker.postMessage("uci");
  }
}
