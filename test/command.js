const command = require('../command.js');
const assert = require('assert');
const process = require('process');

var argvOriginal;

describe ('command', function() {
    before(function () {
        argvOriginal = process.argv;
        const TEST_ARGS = ['node', 'index.js', 
            'items', 'list', '--dry-run', '--overwrite=all',
            '--filter=startDate=2022-01-01,endDate=2022-12-31']
        process.argv = TEST_ARGS;
    });

    after(function () {
        process.argv = argvOriginal;
    });

    it('parses a value assigned to a command-line flag', function() {
        const flag = command.getFlag("--overwrite");
        assert.ok(flag.found);
        assert.ok(flag.isValueSpecified);
        assert.equal(flag.value, "all");
    });

    it('reports correct a command-line flag with no value', function() {
        const flag = command.getFlag("--dry-run");
        assert.ok(flag.found);
        assert.notEqual(flag.isValueSpecified, true);
    });

    it('parses a key-value map specified by a command-line flag', function() {
        const flag = command.getFlag("--filter");
        assert.ok(flag.found);
        assert.ok(flag.isValueSpecified);
        assert.equal(flag.value, "startDate=2022-01-01,endDate=2022-12-31");
        assert.equal(flag.map.startDate, "2022-01-01");
        assert.equal(flag.map.endDate, "2022-12-31");
    });

    it('identifies unused command-line flags', function() {
        command.resetFlagsRead();
        assert.ok(command.getFlag("--dry-run"));
        assert.ok(command.getFlag("--overwrite"));
        assert.throws(() => { command.assertAllFlagsRead(); });
    });

    it('is happy when all command-line flags are read', function() {
        command.resetFlagsRead();
        assert.ok(command.getFlag("--dry-run"));
        assert.ok(command.getFlag("--overwrite"));
        assert.ok(command.getFlag("--filter"));
        assert.doesNotThrow(() => { command.assertAllFlagsRead(); });
    });

    it('throws error when argument count is NOT as expected', function() {
        assert.throws(() => command.getNonFlagArguments(0, 1));
    });

    it('is happy when argument count is as expected', function() {
        assert.doesNotThrow(() => command.getNonFlagArguments(2, 2));
    });
});