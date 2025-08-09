import { expect } from "chai";
import { after, afterEach, before, beforeEach } from "mocha";
import * as vscode from "vscode";
import * as sinon from "sinon";

suite("Better Kill Ring", () => {
  let document: vscode.TextDocument;
  let editor: vscode.TextEditor;

  const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
In molestie ac mi eu rutrum.
Fusce pellentesque enim vel erat imperdiet ullamcorper.
Nulla facilisi.
Curabitur nec iaculis quam, id iaculis nunc.
Praesent sit amet auctor velit.
Integer ut tincidunt erat, tristique pharetra mi.
Cras malesuada magna et volutpat sagittis.`;

  async function waitForDocumentChange(action: () => Thenable<void>, waitTime: number = 1000): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let done = false;
      const disposable = vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document === document && !done) {
          done = true;
          disposable.dispose();
          resolve();
        }
      });
      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          disposable.dispose();
          reject(new Error("Timed out waiting for document change"));
        }
      }, waitTime);
      try {
        await action();
      } catch (err) {
        clearTimeout(timer);
        if (!done) {
          done = true;
          disposable.dispose();
          reject(err);
        }
      }
    });
  }

  async function kill(): Promise<void> {
    await waitForDocumentChange(() => vscode.commands.executeCommand("better-kill-ring.kill"));
  }

  async function yank(): Promise<void> {
    await waitForDocumentChange(() => vscode.commands.executeCommand("better-kill-ring.yank"));
  }

  async function openHistory(): Promise<void> {
    await vscode.commands.executeCommand("better-kill-ring.history");
  }

  async function clearHistory(): Promise<void> {
    await vscode.commands.executeCommand("better-kill-ring.clear");
  }

  before(async () => {
    document = await vscode.workspace.openTextDocument({ content: loremIpsum, language: "plaintext" });
    editor = await vscode.window.showTextDocument(document);
  });

  beforeEach(async () => {
    sinon.restore();
    await vscode.workspace.getConfiguration("betterKillRing").update("coalesceKills.enabled", true, true);
    await vscode.workspace.getConfiguration("betterKillRing").update("ringSize", 50, true);
    await clearHistory();

    await editor.edit((editBuilder) => {
      const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
      editBuilder.delete(fullRange);
      editBuilder.insert(new vscode.Position(0, 0), loremIpsum);
    });
    editor.selection = new vscode.Selection(0, 0, 0, 0);
  });

  afterEach(async () => {
    await vscode.commands.executeCommand("workbench.action.closeQuickOpen");
  });

  after(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("kills from middle of line to EOL and yanks at cursor", async () => {
    editor.selection = new vscode.Selection(0, 6, 0, 6); // after "Lorem "
    await kill();
    expect(editor.document.lineAt(0).text).to.equal("Lorem ");

    const line2Length = editor.document.lineAt(1).text.length;
    editor.selection = new vscode.Selection(1, line2Length, 1, line2Length);
    await yank();
    expect(editor.document.lineAt(1).text).to.equal(
      "In molestie ac mi eu rutrum.ipsum dolor sit amet, consectetur adipiscing elit."
    );
  });

  test("killing at BOL removes text; subsequent kill removes newline (coalesced)", async () => {
    editor.selection = new vscode.Selection(1, 0, 1, 0);
    await kill();
    expect(editor.document.lineAt(1).text).to.equal("");
    await kill();
    // After removing the empty line, the original line 2 should move up
    expect(editor.document.lineAt(1).text).to.equal("Fusce pellentesque enim vel erat imperdiet ullamcorper.");
  });

  test("yank is a no-op when nothing was yanked", async () => {
    const beforeText = document.getText();
    await yank().catch(() => {}); // ignore timeout error, but ensure that an errant edit will be in the document before we assert
    const afterText = document.getText();
    expect(afterText).to.equal(beforeText);
  });

  test("history lists most-recent-first and selection inserts chosen item", async () => {
    // Populate ring with two distinct, non-coalesced entries by moving the cursor
    editor.selection = new vscode.Selection(0, 0, 0, 0);
    await kill(); // kill line 0 text
    editor.selection = new vscode.Selection(1, 0, 1, 0);
    await kill(); // kill line 1 text

    // Spy on showQuickPick to inspect items; use workbench actions to navigate/accept
    const spy = sinon.spy(vscode.window, "showQuickPick");

    await openHistory();
    expect(spy.calledOnce).to.equal(true);
    const [items1, opts1] = spy.firstCall.args as unknown as [string[], vscode.QuickPickOptions];
    // Most recent first
    expect(items1).to.include.ordered.members([
      "In molestie ac mi eu rutrum.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    ]);
    expect(opts1.placeHolder).to.equal("Choose which kill to yank");

    // Select the second (older) entry, which should yank it and reorder the ring
    await vscode.commands.executeCommand("workbench.action.quickOpenSelectNext");
    await waitForDocumentChange(() =>
      vscode.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem")
    );

    // Chosen item should be inserted at cursor; detect which was inserted
    const line1 = editor.document.lineAt(1).text;
    const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
    expect(line1).to.equal(lorem);

    // Open history again to verify promotion
    await openHistory();
    expect(spy.callCount).to.equal(2);
    const [items2, opts2] = spy.secondCall.args as unknown as [string[], vscode.QuickPickOptions];
    // After selecting older item, it is promoted to most recent
    expect(items2).to.include.ordered.members([
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "In molestie ac mi eu rutrum.",
    ]);
    expect(opts2.placeHolder).to.equal("Choose which kill to yank");
  });

  test("coalesces consecutive kills at same position when enabled", async () => {
    await vscode.workspace.getConfiguration("betterKillRing").update("coalesceKills.enabled", true, true);
    editor.selection = new vscode.Selection(0, 0, 0, 0);
    await kill(); // kill line 0 text
    await kill(); // kill newline (appended)
    await kill(); // kill next line text (appended)

    const spy = sinon.spy(vscode.window, "showQuickPick");
    await openHistory();
    expect(spy.calledOnce).to.equal(true);
    const [items, opts] = spy.firstCall.args as unknown as [string[], vscode.QuickPickOptions];
    const expectedConcat = [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      document.eol === vscode.EndOfLine.LF ? "\n" : "\r\n",
      "In molestie ac mi eu rutrum.",
    ].join("");
    expect(items[0]).to.equal(expectedConcat);
    expect(opts.placeHolder).to.equal("Choose which kill to yank");
  });

  test("does not coalesce consecutive kills when coalesceKills.enabled is false", async () => {
    await vscode.workspace.getConfiguration("betterKillRing").update("coalesceKills.enabled", false, true);
    editor.selection = new vscode.Selection(0, 0, 0, 0);
    await kill(); // kill line 0 text
    await kill(); // kill newline
    await kill(); // kill line 1 text (now at position 0,0)

    const spy = sinon.spy(vscode.window, "showQuickPick");
    await openHistory();
    expect(spy.calledOnce).to.equal(true);
    const [items, opts] = spy.firstCall.args as unknown as [string[], vscode.QuickPickOptions];

    // When coalescing is disabled, each kill should be a separate entry
    // Most recent first
    expect(items).to.have.lengthOf(3);
    expect(items[0]).to.equal("In molestie ac mi eu rutrum."); // line 1 text (killed last)
    expect(items[1]).to.equal(document.eol === vscode.EndOfLine.LF ? "\n" : "\r\n"); // newline
    expect(items[2]).to.equal("Lorem ipsum dolor sit amet, consectetur adipiscing elit."); // line 0 text (killed first)
    expect(opts.placeHolder).to.equal("Choose which kill to yank");
  });

  test("respects ringSize and trims oldest entries on change", async () => {
    // Create three non-newline kills with cursor movement to avoid coalescing
    editor.selection = new vscode.Selection(0, 0, 0, 0);
    await kill(); // line 0 text
    editor.selection = new vscode.Selection(1, 0, 1, 0);
    await kill(); // line 1 text
    editor.selection = new vscode.Selection(2, 0, 2, 0);
    await kill(); // line 2 text

    // Shrink ring size to 1 and ensure config change trims the ring
    await vscode.workspace.getConfiguration("betterKillRing").update("ringSize", 1, true);

    const spy = sinon.spy(vscode.window, "showQuickPick");
    await openHistory();
    expect(spy.calledOnce).to.equal(true);
    const [items, opts] = spy.firstCall.args as unknown as [string[], vscode.QuickPickOptions];
    expect(items).to.deep.equal(["Fusce pellentesque enim vel erat imperdiet ullamcorper."]);
    expect(opts.placeHolder).to.equal("Choose which kill to yank");
  });

  test("clear empties ring and resets yank state", async () => {
    editor.selection = new vscode.Selection(0, 0, 0, 0);
    await kill();
    await clearHistory();

    // History should not open (ring empty)
    const spy = sinon.spy(vscode.window, "showQuickPick");
    await openHistory();
    expect(spy.notCalled).to.equal(true);

    // Yank should do nothing
    const beforeText = document.getText();
    await yank().catch(() => {}); // ignore timeout error, but ensure that an errant edit will be in the document before we assert
    const afterText = document.getText();
    expect(afterText).to.equal(beforeText);
  });
});
