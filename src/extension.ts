import * as vscode from "vscode";

type Command = "kill" | "yank" | "history" | "clear" | null;

let coalesceKillsEnabled = vscode.workspace.getConfiguration('betterKillRing').get<boolean>('coalesceKills.enabled', true);

const ring: Array<string> = [];
let maxRingSize = vscode.workspace.getConfiguration('betterKillRing').get<number>('ringSize', 50);

let lastCmd: Command = null;
let lastPosition: vscode.Position | undefined = undefined;
let lastUri: string | undefined = undefined;
let lastYanked: string | null = null;

// Refresh the config when the user changes it
// or pass a resource if you want per-document behavior
function refreshConfig(resource?: vscode.Uri) {
    const cfg = vscode.workspace.getConfiguration('betterKillRing', resource);
    coalesceKillsEnabled = cfg.get<boolean>('coalesceKills.enabled', true);
    maxRingSize = cfg.get<number>('ringSize', 50);
    // Ensure the ring respects the new max size immediately
    if (ring.length > maxRingSize) {
        ring.splice(0, ring.length - maxRingSize);
    }
}

function insertText(text: string, editor: vscode.TextEditor) {
    const selection = editor.selection;
    editor.edit((editBuilder) => {
        editBuilder.insert(selection.active, text);
    });
}

function shouldCoalesce(position: vscode.Position, uri: string): boolean {
    return (
        lastCmd === "kill" &&
        lastPosition?.isEqual(position) === true &&
        lastUri === uri
    );
}

function pushToRing(text: string) {
    ring.push(text);
    trimKillRing();
}

function trimKillRing() {
    if (ring.length > maxRingSize) {
        ring.shift();
    }
}

async function showHistory(editor: vscode.TextEditor) {
    const result = await vscode.window.showQuickPick(
        // Do not mutate the ring when presenting history
        [...(ring.slice().reverse())],
        {
            placeHolder: "Choose which kill to yank",
        }
    );
    if (result) {
        // Promote the chosen entry to be the most recent in the ring
        const existingIndex = ring.lastIndexOf(result);
        if (existingIndex !== -1) {
            ring.splice(existingIndex, 1);
        }
        pushToRing(result);
        lastYanked = result;
        insertText(result, editor);
    }
}

export function activate(context: vscode.ExtensionContext) {

    const configDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('betterKillRing.coalesceKills.enabled') ||
        e.affectsConfiguration('betterKillRing.ringSize')) {
            refreshConfig();
        }
    });
    context.subscriptions.push(configDisposable);

    const clearDisposable = vscode.commands.registerCommand(
        "better-kill-ring.clear",
        () => {
            ring.length = 0;
            lastCmd = "clear";
            lastPosition = undefined;
            lastUri = undefined;
            lastYanked = null;
        }
    );

    const killDisposable = vscode.commands.registerTextEditorCommand(
        "better-kill-ring.kill",
        (editor) => {
            const position = editor.selection.active;
            const line = editor.document.lineAt(position.line);
            let range = new vscode.Range(position, line.range.end);
            lastYanked = editor.document.getText(range);
            if (line.isEmptyOrWhitespace) {
                const newline = editor.document.eol === vscode.EndOfLine.LF ? "\n" : "\r\n";
                lastYanked = newline; // should kill the document's newline sequence
                range = line.rangeIncludingLineBreak;
            }

            // Defensive check to ensure we have a yanked value
            if (lastYanked) {
                const currentUri = editor.document.uri.toString();
                if (coalesceKillsEnabled && shouldCoalesce(position, currentUri)) {
                    // append the yank to the last one
                    const previousKill = ring.pop();
                    if (previousKill !== undefined) {
                        lastYanked = previousKill + lastYanked;
                    }
                }
                pushToRing(lastYanked);

                // Update state before applying the edit so state reflects the location of this kill
                lastPosition = position;
                lastUri = editor.document.uri.toString();

                editor.edit((editBuilder) => {
                    editBuilder.delete(range);
                });
            }

            lastCmd = "kill";
        }
    );

    const yankDisposable = vscode.commands.registerTextEditorCommand(
        "better-kill-ring.yank",
        (editor) => {
            if (!lastYanked) {
                return;
            }
            insertText(lastYanked, editor);
            lastCmd = "yank";
        }
    );

    const historyDisposable = vscode.commands.registerTextEditorCommand(
        "better-kill-ring.history",
        (editor) => {
            if (ring.length === 0) {
                return;
            }
            showHistory(editor);
            lastCmd = "history";
        }
    );

    context.subscriptions.push(
        clearDisposable,
        killDisposable,
        yankDisposable,
        historyDisposable
    );

}

export function deactivate() {
    ring.length = 0;
    lastCmd = null;
    lastPosition = undefined;
    lastUri = undefined;
    lastYanked = null;
}
