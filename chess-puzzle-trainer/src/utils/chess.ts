export function parseUci(uci: string) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: (uci.slice(4, 5) || undefined) as 'q' | 'r' | 'b' | 'n' | undefined
  };
}
