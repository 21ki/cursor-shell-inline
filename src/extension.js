const vscode = require("vscode");

/**
 * 多行 Shell 命令 → 单行
 * 支持以下格式：
 *   command arg1 \
 *     --flag value \
 *     --another
 */
function joinShellLines(text) {
  // 1. 统一换行符
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. 去掉每行末尾的 \ 和紧跟的换行，将下一行头部空白也折叠为单个空格
  const joined = normalized
    .replace(/\\\s*\n\s*/g, " ")
    .trim();

  // 3. 将多余的连续空格压缩为一个空格（可选，保持整洁）
  return joined.replace(/ {2,}/g, " ");
}

/**
 * 单行 Shell 命令 → 多行（每个 -- 参数另起一行，末尾加 \）
 */
function splitShellLines(text, indent = "  ") {
  const trimmed = text.trim();

  // 按 --flag 或 -f 分割参数，但保留第一段（命令本身）
  // 支持：--flag value、--flag=value、-f value、-f=value
  const parts = [];
  // 使用正则按 空格-/-- 切分（前瞻）
  const segmentRe = /(?=\s+-{1,2}[^\s])/g;
  const segments = trimmed.split(segmentRe).map((s) => s.trim()).filter(Boolean);

  if (segments.length <= 1) {
    // 没有参数可拆，原样返回
    return trimmed;
  }

  return segments
    .map((seg, i) => {
      const isLast = i === segments.length - 1;
      const prefix = i === 0 ? "" : indent;
      return prefix + seg + (isLast ? "" : " \\");
    })
    .join("\n");
}

/**
 * 注册命令并操作编辑器选区
 */
function activate(context) {
  // ── 多行 → 单行 ──────────────────────────────────────────
  const joinCmd = vscode.commands.registerCommand(
    "shell-inline.joinLines",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const { selection } = editor;
      if (selection.isEmpty) {
        vscode.window.showWarningMessage("请先选中要处理的多行 Shell 命令");
        return;
      }

      const selectedText = editor.document.getText(selection);
      const result = joinShellLines(selectedText);

      editor.edit((editBuilder) => {
        editBuilder.replace(selection, result);
      });
    }
  );

  // ── 单行 → 多行 ──────────────────────────────────────────
  const splitCmd = vscode.commands.registerCommand(
    "shell-inline.splitLines",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const { selection } = editor;
      if (selection.isEmpty) {
        vscode.window.showWarningMessage("请先选中要处理的单行 Shell 命令");
        return;
      }

      const selectedText = editor.document.getText(selection);

      // 自动计算选区起始列，用于对齐缩进
      const startChar = selection.start.character;
      const indent = " ".repeat(startChar + 2);

      const result = splitShellLines(selectedText, indent);

      editor.edit((editBuilder) => {
        editBuilder.replace(selection, result);
      });
    }
  );

  context.subscriptions.push(joinCmd, splitCmd);
}

function deactivate() {}

module.exports = { activate, deactivate };
