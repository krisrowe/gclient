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

    it ('parses a key-value map specified by a command-line flag', function() {
        process.argv.push("--test-map=\"key1=value1,key2=value2\"");
        const flag = command.getFlag("--test-map");
        assert.ok(flag.found);
        assert.ok(flag.isValueSpecified);
        assert.equal(flag.value, "key1=value1,key2=value2");
        assert.equal(flag.map.key1, "value1");
        assert.equal(flag.map.key2, "value2");
    });
});