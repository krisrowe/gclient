const data = require('../data');
const assert = require('assert');

describe ('data', function() {
    it('auto parses dates', function() {
        const object = { id: 1, date: '1/10/2019', amount: -99, description: 'test' };
        const array = [object];
        const results = array.map(data.mapOnLoadStandard());
        assert.ok(results[0].date instanceof Date, "Not a Date instance.");
        assert.equal(results[0].date.getTime(), new Date('1/10/2019').getTime(), "Date is not correct.");
    });
});