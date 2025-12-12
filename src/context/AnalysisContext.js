import { createContext, useContext, useState } from "react";

const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {
  const [analysis, setAnalysis] = useState(null);

  const run = async () => {
    const engine = StockfishEngine();
    const r = await engine.analyze(
      getFen(),
      16
    );
    setAnalysis(r);
  };

  return(
    <AnalysisContext.Provider value={{ analysis, run }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  return useContext(AnalysisContext);
}