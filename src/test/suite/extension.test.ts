import {expect} from 'chai';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		expect([1, 2, 3]).to.not.include(5);
		expect([1, 2, 3]).to.not.include(0);
	});
});
