const core = require('../core.js');
const crypto = require('crypto');
const assert = require('assert');


describe ('core', function() {
    it('sign', function() {
        var fingerprint = "1234" + "|" + '2021-12-01' + "|" + "-9.99" + "|" + 
            "1" + "|" + "VENMO PAYMENT";
        var sig = crypto.createHash('md5').update(fingerprint).digest('hex');
        assert.equal(sig, '8ec08968f744f515d18f628204c15083');
    });
});