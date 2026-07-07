#!/usr/bin/env node
"use strict";

const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

const EXTENSION_ID = "local-dev.shell-inline";
const VSIX_PATH = path.join(__dirname, "..", "dist", "shell-inline.vsix");
const IS_WIN = process.platform === "win32";

// ── 工具函数 ──────────────────────────────────────────────
function tryRun(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: IS_WIN, // Windows 下 cursor/code 是 .cmd，需要 shell:true 才能被找到
    encoding: "utf8",
  });
  return result;
}

function commandExists(cmd) {
  const probe = tryRun(cmd, ["--version"]);
  return probe.status === 0;
}

// 依次尝试 cursor / code / code-insiders，返回第一个可用的编辑器 CLI 名
function detectEditor() {
  const candidates = ["cursor", "code", "code-insiders"];
  for (const cmd of candidates) {
    if (commandExists(cmd)) return cmd;
  }
  return null;
}

function printEditorNotFoundHelp() {
  console.error("❌ 没有在 PATH 中找到 cursor / code 命令行工具。\n");
  console.error("请先确认编辑器的命令行工具已启用：");
  console.error("  Cursor: 命令面板 (Cmd/Ctrl+Shift+P) → 'Shell Command: Install \"cursor\" command in PATH'");
  console.error("  VS Code: 命令面板 (Cmd/Ctrl+Shift+P) → 'Shell Command: Install \"code\" command in PATH'");
  console.error("\n也可以用 --editor 手动指定可执行文件名，例如：");
  console.error("  npx shell-inline install --editor=cursor");
}

function resolveEditor(argv) {
  const flag = argv.find((a) => a.startsWith("--editor="));
  if (flag) {
    const forced = flag.split("=")[1];
    if (!commandExists(forced)) {
      console.error(`❌ 指定的编辑器命令 "${forced}" 不可用，请检查是否已加入 PATH。`);
      process.exit(1);
    }
    return forced;
  }
  const editor = detectEditor();
  if (!editor) {
    printEditorNotFoundHelp();
    process.exit(1);
  }
  return editor;
}

// ── 子命令实现 ────────────────────────────────────────────
function cmdInstall(argv) {
  const editor = resolveEditor(argv);

  if (!fs.existsSync(VSIX_PATH)) {
    console.error(`❌ 找不到打包好的扩展文件：${VSIX_PATH}`);
    console.error("这个 npm 包可能没有正确构建，请到仓库提 issue。");
    process.exit(1);
  }

  console.log(`▶ 使用 "${editor}" 安装 Shell Inline 扩展...`);
  const result = tryRun(editor, ["--install-extension", VSIX_PATH, "--force"]);

  if (result.status !== 0) {
    console.error("❌ 安装失败：");
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  console.log(result.stdout.trim());
  console.log("\n✅ 安装完成！请重启一下编辑器窗口（Reload Window）让扩展生效。");
  console.log("   快捷键：Ctrl+Shift+J 合并多行 / Ctrl+Shift+K 拆分单行 / Ctrl+Shift+R 在终端运行选中命令");
}

function cmdUninstall(argv) {
  const editor = resolveEditor(argv);
  console.log(`▶ 使用 "${editor}" 卸载 Shell Inline 扩展...`);
  const result = tryRun(editor, ["--uninstall-extension", EXTENSION_ID]);

  if (result.status !== 0) {
    console.error("❌ 卸载失败：");
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  console.log(result.stdout.trim());
  console.log("✅ 已卸载。");
}

function cmdStatus(argv) {
  const editor = resolveEditor(argv);
  const result = tryRun(editor, ["--list-extensions", "--show-versions"]);

  if (result.status !== 0) {
    console.error("❌ 无法获取扩展列表：");
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  const line = result.stdout
    .split("\n")
    .find((l) => l.toLowerCase().startsWith(EXTENSION_ID));

  if (line) {
    console.log(`✅ 已安装：${line.trim()}`);
  } else {
    console.log("⚪ 尚未安装 Shell Inline 扩展。运行 `npx shell-inline install` 安装。");
  }
}

function printHelp() {
  console.log(`
shell-inline CLI

用法：
  npx shell-inline install    [--editor=<cmd>]   安装 / 更新扩展
  npx shell-inline uninstall  [--editor=<cmd>]   卸载扩展
  npx shell-inline status     [--editor=<cmd>]   查看安装状态

--editor 用于手动指定编辑器命令行工具名（默认自动探测 cursor → code → code-insiders）
`);
}

// ── 入口 ─────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);
  const subcommand = argv[0];

  switch (subcommand) {
    case "install":
      cmdInstall(argv);
      break;
    case "uninstall":
      cmdUninstall(argv);
      break;
    case "status":
      cmdStatus(argv);
      break;
    case "-h":
    case "--help":
    case "help":
    case undefined:
      printHelp();
      break;
    default:
      console.error(`未知命令："${subcommand}"\n`);
      printHelp();
      process.exit(1);
  }
}

main();