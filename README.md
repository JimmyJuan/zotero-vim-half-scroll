# zotero-vim-half-scroll

Vim-style half-page scrolling shortcuts for the Zotero Reader.

## Shortcuts

- `Cmd-D`: scroll down by half a page
- `Cmd-U`: scroll up by half a page

The plugin works in Zotero Reader tabs and standalone Reader windows. It handles Zotero's internal primary/secondary Reader views, including split-view cases.

## Compatibility

- Zotero 8.0+
- macOS shortcut mapping is the main tested path

## Install

Download the `.xpi` file from the latest GitHub Release, then install it in Zotero:

1. Open Zotero.
2. Go to `Tools` -> `Add-ons`.
3. Click the gear icon.
4. Choose `Install Add-on From File...`.
5. Select the downloaded `.xpi`.
6. Restart Zotero.

## Build

```sh
make build
```

The generated package will be written to `dist/`.

## Notes

Zotero Reader uses nested iframes and separate primary/secondary views. The plugin registers Zotero window shortcuts and then scrolls the currently movable Reader view directly.
