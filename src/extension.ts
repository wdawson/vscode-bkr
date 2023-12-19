import * as vscode from "vscode";

let yanked: string | null = null;
const ring: Array<string> = [];
let lastPosition: vscode.Position | undefined = undefined;
let lastUri: string | undefined = undefined;

function insertText(text: string, editor: vscode.TextEditor) {
  const selection = editor.selection;
  editor.edit((editBuilder) => {
    editBuilder.insert(selection.active, text);
  });
}

function isSamePosition(pos: vscode.Position, uri: string) {
  return lastPosition?.isEqual(pos) && lastUri === uri;
}

function trimKillRing() {
  const maxSize =
    vscode.workspace
      .getConfiguration("betterKillRing")
      .get<number>("ringSize") || 20;
  if (ring.length > maxSize) {
    ring.shift();
  }
}

async function showHistory(editor: vscode.TextEditor) {
  const result = await vscode.window.showQuickPick(
    [...new Set(ring.reverse())],
    {
      placeHolder: "Choose which kill to yank",
    }
  );
  if (result) {
    insertText(result, editor);
  }
}

export function activate(context: vscode.ExtensionContext) {
  const killDisposable = vscode.commands.registerTextEditorCommand(
    "better-kill-ring.kill",
    (editor) => {
      const position = editor.selection.active;
      const line = editor.document.lineAt(position.line);
      let range = new vscode.Range(position, line.range.end);
      yanked = editor.document.getText(range);
      if (line.isEmptyOrWhitespace) {
        yanked = "\n"; // should kill the newline
        range = line.rangeIncludingLineBreak;
      }
      if (yanked) {
        const multiLineKill =
          vscode.workspace
            .getConfiguration("betterKillRing")
            .get<boolean>("multiLineKill.enabled") || true;
        if (
          multiLineKill &&
          isSamePosition(position, editor.document.uri.toString())
        ) {
          // append the yank to the last one
          const previousKill = ring.pop();
          if (previousKill) {
            yanked = previousKill + yanked;
          }
        }
        ring.push(yanked);
        lastPosition = position;
        lastUri = editor.document.uri.toString();

        // Keep the ring clean by removing oldest kill
        trimKillRing();

        // "deleteAllRight" command removes the selection if text is selected and we don't want that.
        //vscode.commands.executeCommand("deleteAllRight");
        editor.edit((editBuilder) => {
          editBuilder.delete(range);
        });
      }
    }
  );

  const yankDisposable = vscode.commands.registerTextEditorCommand(
    "better-kill-ring.yank",
    (editor) => {
      if (!yanked) {
        return;
      }
      insertText(yanked, editor);
    }
  );

  // Cannot use `registerTextEditorCommand` because it cannot be asynchronous
  const historyDisposable = vscode.commands.registerTextEditorCommand(
    "better-kill-ring.history",
    (editor) => {
      if (ring.length === 0) {
        return;
      }
      showHistory(editor);
    }
  );

  context.subscriptions.push(killDisposable, yankDisposable, historyDisposable);
}

export function deactivate() {}
