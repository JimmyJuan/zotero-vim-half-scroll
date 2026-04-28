# zotero-vim-half-scroll

Vim-style half-page scrolling shortcuts for the Zotero Reader.

为 Zotero Reader 增加类似 Vim 的半屏滚动快捷键，适合在 Zotero 内置 PDF 阅读器里读论文时使用。

## Shortcuts

- `Cmd-D`: scroll down by half a page
- `Cmd-U`: scroll up by half a page

中文：

- `Cmd-D`：向下滚动半屏
- `Cmd-U`：向上滚动半屏

The plugin works in Zotero Reader tabs and standalone Reader windows. It handles Zotero's internal primary/secondary Reader views, including split-view cases.

这个插件支持 Zotero 主窗口里的 Reader 标签页，也支持独立打开的 Reader 窗口。它会处理 Zotero Reader 内部的 primary / secondary view，因此在分屏阅读时也能尽量滚动当前可移动的阅读视图。

## Compatibility

- Zotero 8.0+
- macOS shortcut mapping is the main tested path

兼容性：

- Zotero 8.0+
- 目前主要在 macOS 上测试，快捷键为 `Command-D` / `Command-U`

## Install

Download the packaged `.xpi` file:

https://github.com/JimmyJuan/zotero-vim-half-scroll/releases/latest/download/zotero-vim-half-scroll-0.1.9.xpi

Then install it in Zotero:

1. Open Zotero.
2. Go to `Tools` -> `Add-ons`.
3. Click the gear icon.
4. Choose `Install Add-on From File...`.
5. Select the downloaded `.xpi`.
6. Restart Zotero.

中文安装步骤：

1. 下载上面的 `.xpi` 文件。
2. 打开 Zotero。
3. 进入 `Tools` -> `Add-ons`。
4. 点击齿轮按钮，选择 `Install Add-on From File...`。
5. 选择下载好的 `.xpi` 文件。
6. 重启 Zotero。

## Build

```sh
make build
```

The generated package will be written to `dist/`.

## Notes

Zotero Reader uses nested iframes and separate primary/secondary views. The plugin registers Zotero window shortcuts and then scrolls the currently movable Reader view directly.

实现说明：

Zotero Reader 内部有多层 iframe，并且可能同时存在 primary / secondary 两个阅读视图。这个插件不会只假设一个固定滚动容器，而是注册 Zotero 窗口级快捷键，然后寻找当前方向上还能继续滚动的 Reader view，直接调整它的滚动位置。
