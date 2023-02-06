const command = require('../command.js');
const assert = require('assert');
const process = require('process');

describe ('command', function() {
    it('parses a value assigned to a command-line flag', function() {
        process.argv.push("--test-flag=\"special\"");
        const flag = command.getFlag("--test-flag");
        assert.ok(flag.found);
        assert.ok(flag.isValueSpecified);
        assert.equal(flag.value, "special");
        
    });

    it('parses a key-value map specified by a command-line flag', function() {
        process.argv.push("--test-map=\"key1=value1,key2=value2\"");
        const flag = command.getFlag("--test-map");
        assert.ok(flag.found);
        assert.ok(flag.isValueSpecified);
        assert.equal(flag.value, "key1=value1,key2=value2");
        assert.equal(flag.map.key1, "value1");
        assert.equal(flag.map.key2, "value2");
    });

    it('identifies unused command-line flags', function() {
        command.resetFlagsRead();
        const oldArgs = process.argv;
        process.argv = ['--important', '--filter=account=1234', '--fake'];
        assert.ok(command.getFlag("--important"));
        assert.ok(command.getFlag("--filter").value);
        assert.throws(() => { command.assertAllFlagsRead(); });
        process.argv = oldArgs;
    });

    it('is happy when all command-line flags are read', function() {
        command.resetFlagsRead();
        const oldArgs = process.argv;
        process.argv = ['--important', '--filter=account=1234'];
        assert.ok(command.getFlag("--important"));
        assert.ok(command.getFlag("--filter").value);
        assert.doesNotThrow(() => { command.assertAllFlagsRead(); });
        process.argv = oldArgs;
    });

    it('throws error when argument count is NOT as expected', function() {
        process.argv = ['items', 'list', '--important', '--filter=account=1234'];
        assert.throws(() => command.getNonFlagArguments(0, 1));
    });

    it('is happy when argument count is as expected', function() {
        process.argv = ['items', 'list', '--important', '--filter=account=1234'];
        assert.doesNotThrow(() => command.getNonFlagArguments(2, 2));
    });
});