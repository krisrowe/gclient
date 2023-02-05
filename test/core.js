const core = require('../core.js');
const crypto = require('crypto');
const assert = require('assert');


describe ('core', function() {
    it('parse ISO date', function() {
        const ISO_DATE_STRING = '2022-12-30';
        const date = core.parseIsoDate(ISO_DATE_STRING);
        assert.equal(date.getFullYear(), 2022);
        assert.equal(date.getMonth(), 11);
        assert.equal(date.getDate(), 30);
        assert.equal(date.getHours(), 0);
        assert.equal(date.getMinutes(), 0);
    });

    it ('convert date to ISO string without time', function() {
        const ISO_DATE_STRING = '2022-12-30';
        const date = core.parseIsoDate(ISO_DATE_STRING);
        const isoString = date.toISOStringWithoutTime();
        assert.equal(isoString, ISO_DATE_STRING);
    });

    it('sign', function() {
        var fingerprint = "1234" + "|" + '2021-12-01' + "|" + "-9.99" + "|" + 
            "1" + "|" + "VENMO PAYMENT";
        var sig = crypto.createHash('md5').update(fingerprint).digest('hex');
        assert.equal(sig, '8ec08968f744f515d18f628204c15083');
    });
});