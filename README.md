# Shell Inline — Cursor / VS Code 插件

将多行 Shell 命令与单行互相转换。

## 功能

| 命令 | 说明 |
|------|------|
| **Shell: 多行合并为单行** | 去掉 `\` 续行符，拼成一行 |
| **Shell: 单行拆分为多行** | 每个 `--flag` 参数换行，末尾补 `\` |

## 使用方式

1. **选中**目标代码
2. **右键** → 从上下文菜单选择对应命令

或使用快捷键：

| 操作 | Windows/Linux | macOS |
|------|--------------|-------|
| 多行 → 单行 | `Ctrl+Shift+J` | `Cmd+Shift+J` |
| 单行 → 多行 | `Ctrl+Shift+K` | `Cmd+Shift+K` |

## 示例

**多行输入：**
```sh
aliyun alidns DescribeDomainRecords \
  --profile mymhotel \
  --DomainName mymhotel.com \
  --PageSize 500
```

**合并后输出：**
```sh
aliyun alidns DescribeDomainRecords --profile mymhotel --DomainName mymhotel.com --PageSize 500
```

## 安装

1. 下载 `shell-inline-1.0.0.vsix`
2. Cursor / VS Code：`Extensions` → `...` → `Install from VSIX`
