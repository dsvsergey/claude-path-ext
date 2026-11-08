# Claude @-path

[Українська](README.uk.md)

A small VS Code extension that sends files from the Explorer to the
[Claude Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) chat as `@`-mentions
(for example `@Tasks/4_testing/89618/task.md`), or copies the `@`-path to the clipboard.

Use it when drag-and-drop from the Explorer into the Claude Code panel doesn't work for you.

## Features

| Action | Explorer context menu | Shortcut (Explorer focused) |
|---|---|---|
| Send the file to the Claude Code chat as an `@`-mention | **Claude: відправити в Claude Code** | `Alt+K` |
| Copy the `@`-path to the clipboard | **Claude: скопіювати @-шлях** | `Alt+Shift+K` |

- Both actions also appear in the context menu of an editor tab.
- Multi-selection works: select several files with `Ctrl+click`, and they are all sent or copied together.
- Paths are relative to the workspace root and use forward slashes. A folder gets a trailing `/`, and a path with
  spaces is wrapped in quotes.
- Folders and files that can't be opened as text (images and so on) can't be inserted directly. The extension
  copies their `@`-paths to the clipboard and focuses the chat input, so you only need to press `Ctrl+V`.
- `Alt+K` in a text editor stays bound to Claude Code's own **Insert @-Mention Reference**. This extension binds
  `Alt+K` only while the Explorer has focus.

## How it works

Claude Code's built-in `claude-vscode.insertAtMention` command works only with the active editor. The extension
opens the selected file as a preview tab, with no selection so that no line range is added, and then calls that
command.

A shortcut doesn't pass the Explorer selection to a command. To get it, the extension runs VS Code's
`copyFilePath` command, reads the clipboard and then restores what was there before.

## Requirements

- VS Code 1.80 or newer.
- The Claude Code extension (`anthropic.claude-code`), needed for **Send**. **Copy** works without it.

## Installation on another computer

### Option 1: from a release (recommended)

1. Download `claude-path.vsix` from the [Releases](../../releases) page.
2. Install it in one of two ways:
   - from a terminal:
     ```
     code --install-extension claude-path.vsix
     ```
   - from VS Code: open the Extensions view (`Ctrl+Shift+X`), click **⋯** at the top, choose
     **Install from VSIX…** and select the file.
3. Reload the window: `Ctrl+Shift+P` → **Developer: Reload Window**.

### Option 2: build from source

Building needs only Python 3, with no packages and no Node.js.

```
git clone <repository-url>
cd claude-path-ext
python build_vsix.py
code --install-extension claude-path.vsix --force
```

Then reload the window.

If `code` isn't found in the terminal, open VS Code and run `Ctrl+Shift+P` →
**Shell Command: Install 'code' command in PATH**. On Windows it's usually already on `PATH` after installation.

## Updating

Install the new `.vsix` with `--force`, then reload the window. Bump `version` in `package.json` when you change
the code.

## Uninstalling

```
code --uninstall-extension local.claude-path
```

You can also uninstall it from the Extensions view.

## Files

| File | Purpose |
|---|---|
| `package.json` | Extension manifest: commands, menus, keybindings |
| `extension.js` | Command implementation |
| `build_vsix.py` | Packs `package.json` and `extension.js` into `claude-path.vsix` without `vsce` |

## Troubleshooting

- **No menu items or the shortcut does nothing:** reload the window and check that the extension is enabled in
  the Extensions view.
- **`Alt+K` doesn't work in the Explorer:** another extension may have taken the key. Open
  `Ctrl+K Ctrl+S`, search for `claudePath` and set your own shortcut.
- **Nothing is inserted into the chat:** make sure the Claude Code panel is open. In terminal mode
  (`claudeCode.useTerminal`), use **Copy** and paste the path by hand.
