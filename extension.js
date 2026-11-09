const vscode = require('vscode');

// Вибрані в Explorer елементи (мультивибір) або один клікнутий.
// Виклик з клавіатури не передає вибране в Explorer — беремо його через copyFilePath
// (кілька файлів — по рядку), буфер обміну потім відновлюємо.
async function explorerSelection() {
  const saved = await vscode.env.clipboard.readText();
  await vscode.commands.executeCommand('copyFilePath');
  const text = await vscode.env.clipboard.readText();
  await vscode.env.clipboard.writeText(saved);
  if (!text || text === saved) return [];
  return text.split(/\r?\n/).filter(Boolean).map(p => vscode.Uri.file(p));
}

async function targets(uri, uris) {
  if (Array.isArray(uris) && uris.length) return uris;
  if (uri instanceof vscode.Uri) return [uri];
  const sel = await explorerSelection();
  if (sel.length) return sel;
  const ed = vscode.window.activeTextEditor;
  return ed ? [ed.document.uri] : [];
}

// '@Tasks/4_testing/89618/task.md' — шлях відносно кореня workspace, з прямими слешами.
async function atPath(uri) {
  let rel = vscode.workspace.asRelativePath(uri, false).replace(/\\/g, '/');
  try {
    const st = await vscode.workspace.fs.stat(uri);
    if (st.type & vscode.FileType.Directory) rel += '/';
  } catch (e) { /* ignore */ }
  return '@' + (rel.includes(' ') ? `"${rel}"` : rel);
}

async function copy(uri, uris) {
  const list = await targets(uri, uris);
  if (!list.length) return;
  const text = (await Promise.all(list.map(atPath))).join(' ');
  await vscode.env.clipboard.writeText(text);
  vscode.window.setStatusBarMessage(`Скопійовано: ${text}`, 3000);
}

// Claude Code будує згадку з document.fileName активного редактора, вміст файла йому не потрібен.
// Тому відкриваємо порожній віртуальний документ зі схемою SCHEME і тим самим шляхом
// (fileName = fsPath) — так вставляються і .docx/.png, і каталоги, а справжній файл не відкривається.
const SCHEME = 'claude-path';

async function closeTab(vuri) {
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === vuri.toString()) {
        await vscode.window.tabGroups.close(tab);
      }
    }
  }
}

async function send(uri, uris) {
  const list = await targets(uri, uris);
  if (!list.length) return;
  const rest = [];
  for (const u of list) {
    const vuri = u.with({ scheme: SCHEME });
    try {
      const doc = await vscode.workspace.openTextDocument(vuri);
      // без виділення — щоб у згадку не потрапив діапазон рядків
      await vscode.window.showTextDocument(doc, { preview: true, preserveFocus: false,
        selection: new vscode.Range(0, 0, 0, 0) });
      await vscode.commands.executeCommand('claude-vscode.insertAtMention');
    } catch (e) {
      rest.push(u);
    } finally {
      try { await closeTab(vuri); } catch (e) { /* ignore */ }
    }
  }
  if (rest.length) {
    const text = (await Promise.all(rest.map(atPath))).join(' ');
    await vscode.env.clipboard.writeText(text);
    await vscode.commands.executeCommand('claude-vscode.focus');
    vscode.window.showInformationMessage(`Не вдалося вставити напряму — у буфері: ${text} (Ctrl+V у чаті)`);
  }
}

function activate(context) {
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(SCHEME, { provideTextDocumentContent: () => '' }),
    vscode.commands.registerCommand('claudePath.copy', copy),
    vscode.commands.registerCommand('claudePath.send', send),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
