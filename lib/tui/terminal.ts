/**
 * Terminal dimensions as live React state: re-renders on resize. Shared by
 * every TUI pane that sizes its list windows to the available height.
 */
import { useEffect, useState } from "react";
import { useStdout } from "ink";

export const useTerminalSize = (): { columns: number; rows: number } => {
  const { stdout } = useStdout();
  const [size, setSize] = useState({
    columns: stdout.columns || 80,
    rows: stdout.rows || 24,
  });
  useEffect(() => {
    const onResize = () =>
      setSize({ columns: stdout.columns || 80, rows: stdout.rows || 24 });
    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);
  return size;
};
