export const getCoverStyle = (name: string): { background: string } => {
  const base = (name.charCodeAt(0) + name.length * 17) % 360;

  return {
    background: `linear-gradient(135deg, hsl(${base} 85% 94%), hsl(${(base + 42) % 360} 80% 72%))`,
  };
};
