# zotero-vim-half-scroll 中文说明

为 Zotero Reader 增加类似 Vim 的半屏滚动快捷键，适合在 Zotero 内置 PDF 阅读器里读论文时使用。

[English README](README.md)

## 快捷键

- `Cmd-D`：向下滚动半屏
- `Cmd-U`：向上滚动半屏

这个插件支持 Zotero 主窗口里的 Reader 标签页，也支持独立打开的 Reader 窗口。它会处理 Zotero Reader 内部的 primary / secondary view，因此在分屏阅读时也会尽量滚动当前可移动的阅读视图。

## 兼容性

- Zotero 8.0+
- 目前主要在 macOS 上测试，快捷键为 `Command-D` / `Command-U`

## 安装

下载打包好的 `.xpi` 文件：

https://github.com/JimmyJuan/zotero-vim-half-scroll/releases/latest/download/zotero-vim-half-scroll-0.1.9.xpi

然后在 Zotero 中安装：

1. 打开 Zotero。
2. 进入 `Tools` -> `Add-ons`。
3. 点击齿轮按钮。
4. 选择 `Install Add-on From File...`。
5. 选择下载好的 `.xpi` 文件。
6. 重启 Zotero。

## 构建

```sh
make build
```

生成的 `.xpi` 会放在 `dist/` 目录下。

## 实现说明

Zotero Reader 内部有多层 iframe，并且可能同时存在 primary / secondary 两个阅读视图。这个插件不会只假设一个固定滚动容器，而是注册 Zotero 窗口级快捷键，然后寻找当前方向上还能继续滚动的 Reader view，直接调整它的滚动位置。
