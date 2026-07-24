/**
 * Destructive-action gate for the TUI (DX-118 workstream 6): DELETE-backed
 * commands pass through this modal before the executor runs them (with the
 * one-shot confirmDestructive guard force-bypassed, since this modal IS the
 * confirmation). One-shot `--force` semantics are untouched.
 */
import { Box, Text, useInput } from "ink";
import { theme } from "./theme.js";
import { Button } from "./panel.js";

export const ConfirmModal = ({
  commandLine,
  onConfirm,
  onCancel,
}: {
  commandLine: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  useInput((input, key) => {
    if (input === "y" || input === "Y") {
      onConfirm();
      return;
    }
    // Anything decisive that isn't an explicit yes cancels — same
    // default-to-no stance as confirmDestructive.
    if (
      input === "n" ||
      input === "N" ||
      input === "q" ||
      key.escape ||
      key.return
    ) {
      onCancel();
    }
  });

  return (
    <Box flexGrow={1} alignItems="center" justifyContent="center">
      <Box
        borderStyle="bold"
        borderColor={theme.danger}
        flexDirection="column"
        paddingX={2}
        paddingY={1}
        width={56}
      >
        <Text color={theme.danger} bold>
          DESTRUCTIVE
        </Text>
        <Box paddingTop={1}>
          <Text wrap="wrap">{commandLine}</Text>
        </Box>
        <Text dimColor>This cannot be undone.</Text>
        <Box paddingTop={1} gap={2}>
          <Button label="n cancel" variant="primary" />
          <Button label="y delete" variant="danger" />
        </Box>
        <Box paddingTop={1}>
          <Text dimColor>scripts: --force skips this, as today</Text>
        </Box>
      </Box>
    </Box>
  );
};
