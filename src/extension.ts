import * as vscode from 'vscode';

const MAX_SIZE: number = 10;

let yanked: string | null = null;
const ring: Array<string> = [];


function insertText(text: string, editor: vscode.TextEditor) {
	const selection = editor.selection;
	editor.edit(editBuilder => {
		editBuilder.insert(selection.active, text);
	});
}

async function showHistory(editor: vscode.TextEditor) {
	const result = await vscode.window.showQuickPick([...new Set(ring.reverse())], {
		placeHolder: "Choose which kill to yank"
	});
	if (result) {
		insertText(result, editor);
	}
}

export function activate(context: vscode.ExtensionContext) {
	const killDisposable = vscode.commands.registerTextEditorCommand('better-kill-ring.kill', (editor) => {
		const position = editor.selection.active;
		const line = editor.document.lineAt(position.line);
		let range = new vscode.Range(position, line.range.end);
		yanked = editor.document.getText(range);
		if (line.isEmptyOrWhitespace) {
			yanked = "\n"; // should kill the newline
			range = line.rangeIncludingLineBreak;
		}
		if (yanked) {
			const size = ring.push(yanked);
			// Keep the ring clean by removing oldest kill
			if (size > MAX_SIZE) {
				ring.shift();
			}
			// "deleteAllRight" command removes the selection if text is selected and we don't want that.
			//vscode.commands.executeCommand("deleteAllRight");
			editor.edit(editBuilder => {
				editBuilder.delete(range);
			});
		}
	});

	const yankDisposable = vscode.commands.registerTextEditorCommand('better-kill-ring.yank', (editor) => {
		if (!yanked) {
			return;
		}
		insertText(yanked, editor);
	});

	// Cannot use `registerTextEditorCommand` because it cannot be asynchronous
	const historyDisposable = vscode.commands.registerTextEditorCommand('better-kill-ring.history', (editor) => {
		if (ring.length === 0) {
			return;
		}
		showHistory(editor);
	});


	context.subscriptions.push(killDisposable, yankDisposable, historyDisposable);
}

export function deactivate() {}
