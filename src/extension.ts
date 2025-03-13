import * as vscode from 'vscode';
import { startComparison } from './compare';

function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('visual-diff-locator.start', async () => {
        await startComparison(context);
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

export { activate, deactivate };
